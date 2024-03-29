const express = require('express');
const HttpProxy = require('http-proxy');
const { createProxyMiddleware } = require('http-proxy-middleware');
const zlib = require('zlib');
const { waitServer } = require('./netTools');

const app = express();

function proxyErrorHandle(err, req, res) {
    console.error(err);
    try {
        res.status(500).end();
    } catch (e) {
        console.log('尝试关闭连接: ', e?.message || '');
    }
}

function defineModule(moduleKey, modulesConfig = {}) {
    return {
        key: moduleKey,
        name: moduleKey,
        ...modulesConfig[moduleKey] || {},
    };
}

function getModulesDefineString(modulesList) {
    const modulesJsonStr = JSON.stringify(modulesList);
    // dev 模式默认情况下不分离 style，appendStyle 将不会生效
    return `(window.JModuleManager && window.JModuleManager.defaultJModule || window.JModule).registerModules(${modulesJsonStr});`;
}

function getPreConfiguration(modulesList) {
    const moduleUrls = modulesList.map(({ key, url }) => `'${key}:${url}'`).join(',');
    const moduleKeysString = JSON.stringify(modulesList.map(item => item.key));
    return `<script type="text/javascript">
        window.JModule = window.JModule || {};
        try {
            let originConfig;
        } catch (e) {}
        originConfig = window.JModule.config || {};
        window.JModule.config = Object.assign(originConfig, {
            debug: true,
            filter(moduleConf) {
                const { key, url } = moduleConf;
                const validUrls = [${moduleUrls}];
                return !(${moduleKeysString}.includes(key) && !validUrls.includes(key+":"+url));
            },
        });
    </script>`;
}

function usePromise() {
    let resolve, reject;
    const defer = new Promise((resolveFn, rejectFn) => {
        resolve = resolveFn;
        reject = rejectFn;
    });
    return { resolve, reject, defer };
}

module.exports = function startPlatformProxy({
    modulesConfig,
    platformLocalPort,
    platformServer,
    platformProxyTable = {},
}) {
    const { reject, resolve, defer } = usePromise();
    if (!platformServer) {
        reject(new Error('startPlatformProxy 异常: platformServer 参数不能为空'));
        return defer;
    }
    const originProxy = new HttpProxy();
    const proxy = new HttpProxy();
    const proxyOptions = {
        target: platformServer,
        changeOrigin: true,
    };
    const modulesUrl = `/modules/${Math.random()}`;
    const modulesList = Object.keys(modulesConfig).map(
        (key) => defineModule(key, modulesConfig),
    );
    const preConfiguration = getPreConfiguration(modulesList);
    const modulesString = getModulesDefineString(modulesList);

    // 模块调试代码
    app.use(modulesUrl, (req, res) => {
        res.set('content-type', 'text/javascript');
        res.send(modulesString);
        res.end();
    });

    // 平台api请求代理
    Object.keys(platformProxyTable).forEach((rule) => {
        let options = platformProxyTable[rule];
        if (!options) { return; }
        if (typeof options === 'string') {
            options = {
                target: options,
                changeOrigin: true,
            };
        }
        app.use(rule, createProxyMiddleware(options));
    });

    // 调试代码注入
    app.use((req, res) => {
        const accept = req.get('Accept') || '';
        const isHtmlRequest = accept.indexOf('text/html') > -1;
        if (!isHtmlRequest) {
            originProxy.web(req, res, proxyOptions);
        } else {
            proxy.web(req, res, { selfHandleResponse: true, ...proxyOptions });
        }
    });

    const server = app.listen(platformLocalPort || 0, (err) => {
        if (err) {
            console.error(err);
            reject(err);
            return;
        }
        waitServer(platformServer).then(() => resolve(server.address().port));
    });
    proxy.on('proxyRes', (proxyRes, req, res) => {
        const { statusCode, headers } = proxyRes;
        if (statusCode !== 200) {
            res.status(statusCode);
            Object.keys(headers).forEach(header => res.setHeader(header, headers[header]));
            proxyRes.pipe(res);
            return;
        }
        
        let body = Buffer.from('');
        const contentEncoding = proxyRes.headers['content-encoding'];

        proxyRes.on('data', (data) => {
            body = Buffer.concat([body, data]);
        });
        proxyRes.on('end', () => {
            const defer = contentEncoding === 'gzip'
                ? new Promise((resolve, reject) => {
                    zlib.unzip(body, (err, buffer) => {
                        if (!err) {
                            resolve(buffer);
                        } else {
                            reject(err);
                        }
                    });
                })
                : Promise.resolve(body);
            defer.then((buffer) => {
                const content = buffer.toString('utf8');
                return content
                    .replace(/([\w'"\s\/]+>)([\s\n]*)(<\/head>){1}?/ig, (a, b, c, d) => `${b}${preConfiguration}${d}`)
                    .replace(/([\w'"\s\/]+>)([\s\n]*)(<\/html>[\s\n]*$)/ig, (a, b, c, d) => `${b}<script defer src="${modulesUrl}"></script>${d}`);
            }).then((str) => res.end(str)).catch((e) => {
                res.end(e);
            });
        });
    });
    proxy.on('error', proxyErrorHandle);
    originProxy.on('error', proxyErrorHandle);
    return defer;
};
