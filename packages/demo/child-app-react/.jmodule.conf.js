const opn = require('opn');
const chalk = require('chalk');
const platformServer = process.env.platformServer || 'http://localhost:8080';
const currentServer = process.env.currentServer || 'http://localhost:3000';
const platformLocalPort = process.env.platformLocalPort || 8090;

// 解析字符串 'key|url|name|type;key|url|name|type...'
const othersModules = (process.env.otherModules || '')
    .split(';')
    .reduce((res, item) => {
        const [key, url, name, type] = item.split('|');
        return Object.assign(res, key ? { [key]: { url, name, type } } : {})
    }, {});

module.exports = {
    mode: 'modules',
    devConfig: {
        modulesConfig: {
            childAppReact: {
                type: 'app',
                name: 'React Demo',
            },
            ...othersModules
        },
        currentServer,
        platformServer,
        platformProxyTable: {},
        platformLocalPort,
        onAllServerReady: () => {
            setTimeout(() => {
                console.log(
                    chalk.green('\n\t已启动集成服务: '),
                    chalk.cyanBright(`http://localhost:${platformLocalPort}/`),
                    '\n',
                    );
            }, 3000);
            if (process.argv.includes('--open')) {
                opn(`http://localhost:${platformLocalPort}/childAppReact`);
            }
        },
    },
}
