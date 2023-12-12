const opn = require('opn');
const chalk = require('chalk');
const platformServer = process.env.platformServer || 'http://localhost:8080';
const currentServer = process.env.currentServer || 'http://localhost:3000';
const platformLocalPort = process.env.platformLocalPort || 8093;

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
                name: 'childAppReact',
                url: 'http://localhost:3000/index.js',
            },
            childAppVue2: {
                type: 'app',
                name: 'Vue2 子应用',
                url: 'http://localhost:3001/index.js',
            },
            childModuleVue2: {
                type: 'module',
                name: 'Vue2 子模块',
                url: 'http://localhost:3001/index.js',
            },
            childAppAngular: {
                name: 'Angular 子应用',
                resourceLoadStrategy: 0, // fetch 的方式加载
                type: 'app',
                url: 'http://localhost:3002/index.js',
            },
            ...othersModules
        },
        currentServer,
        platformServer,
        platformProxyTable: {},
        platformLocalPort,
        onAllServerReady: () => {
            const targetService = `http://localhost:${platformLocalPort}/`;
            console.log(chalk.green('\n\t已启动集成服务: '), chalk.cyanBright(targetService), '\n');
            opn(`http://localhost:${platformLocalPort}`);
        },
    },
}
