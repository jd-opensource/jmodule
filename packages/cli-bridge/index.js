const startPlatformProxy = require('./utils/startPlatformProxy');
const { URL } = require('node:url');

function startServer(options) {
    if (!options?.host) {
        throw new Error('host 参数不能为空');
    }
    return startPlatformProxy({
        modulesConfig: options.modulesConfig,
        platformServer: options.host,
        platformLocalPort: options.target ? new URL(options.target, 'http://localhost').port : 0,
        platformProxyTable: options.hostProxyTable || {}
    }).then((targetPort) => Object.assign({}, options, {
        target: options.target || `http://localhost:${targetPort}`,
    }));
}

module.exports = {
    startServer,
};
