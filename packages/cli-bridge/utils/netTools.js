const net = require('net');
const { hostname } = require('os');

const resolveOrigin = (origin) => {
    try {
        const { protocol, hostname, port: originPort } = new URL(origin);
        const port = originPort || { 'https:': 443, 'http:': 80 }[protocol];
        return { hostname, port };
    } catch (e) {
        throw new Error('ARG_ERROR');
    }
};

const timeout = 2000;
function testServer(origin) {
    let timer;
    try {
        const { hostname: host, port } = resolveOrigin(origin);
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
                server.destroy();
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

function waitServer(origin, checkInterval = 3000){
    return new Promise((resolve) => {
        function loopCheck() {
            testServer(origin).then(() => {
                resolve();
            }).catch(() => {
                setTimeout(loopCheck, checkInterval);
            });
        }
        loopCheck();
    });
}

module.exports = { waitServer };
