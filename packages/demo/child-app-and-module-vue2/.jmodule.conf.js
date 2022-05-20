const opn = require('opn');
const chalk = require('chalk');
// const isModulesMode = process.argv.includes('--modules');
const platformServer = process.env.platformServer || 'http://localhost:8080';
const currentServer = process.env.currentServer || 'http://localhost:3001';
const platformLocalPort = process.env.platformLocalPort || 8091;

// 解析字符串 'key|url|name|type;key|url|name|type...'
// 一般用不着
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
            childAppVue2: {
                type: 'app',
                name: 'Vue2 的子应用',
            },
            childModuleVue2: {
                type: 'module',
                name: 'Vue2 的子模块',
            },
            ...othersModules
        },
        currentServer,
        platformServer,
        platformProxyTable: {},
        platformLocalPort,
        onAllServerReady: () => {
            console.log(
                chalk.green('\n\t已启动集成服务: '),
                chalk.cyanBright(`http://localhost:${platformLocalPort}/`),
                '\n',
            );
            if (process.argv.includes('--open')) {
                opn(`http://localhost:${platformLocalPort}/childAppVue2`);
            }
        },
    },
}
