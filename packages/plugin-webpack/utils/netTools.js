const net = require('net');

exports.resolveOrigin = (origin) => {
    try {
        const { protocol, hostname, port: originPort } = new URL(origin);
        const port = originPort || { 'https:': 443, 'http:': 80 }[protocol];
        return { hostname, port };
    } catch (e) {
        throw new Error('ARG_ERROR');
    }
};

exports.joinUrl = (origin = '', path) => {
    const connectStr = origin.endsWith('/') ? '' : '/';
    return `${origin}${connectStr}${path}`;
};

const timeout = 2000;
exports.testServer = (origin) => {
    let timer;
    try {
        const { hostname: host, port } = exports.resolveOrigin(origin);
        return new Promise((resolve, reject) => {
            const server = net.connect({ host, port }, (err) => {
                clearTimeout(timer);
                if (err) {
                    reject(err);
                }
                server.destroy();
                resolve();
            });
            server.on('error', () => {
                clearTimeout(timer);
                reject();
            });
            timer = setTimeout(() => {
                server.destroy();
                reject();
            }, timeout);
        });
    } catch (e) {
        return Promise.reject(new Error('ARG_ERROR'));
    }
};

exports.waitServer = (origin, checkInterval = 3000) => new Promise((resolve) => {
    function loopCheck() {
        exports.testServer(origin).then(() => {
            resolve();
        }).catch(() => {
            setTimeout(loopCheck, checkInterval);
        });
    }
    loopCheck();
});
