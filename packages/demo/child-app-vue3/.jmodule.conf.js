const open = require('open');
const chalk = require('chalk');
const platformServer = process.env.platformServer || 'http://localhost:8080';
const currentServer = process.env.currentServer || 'http://localhost:3002';
const platformLocalPort = process.env.platformLocalPort || 8092;

module.exports = {
    mode: 'modules',
    assetsModifier(json) {
        // 正常在JModule插件中能看到这个新增的字段
        return Object.assign(json, { testAssetsModifier: true });
    },
    devConfig: process.env.NODE_ENV === 'development' ? {
        modulesConfig: {
            childAppVue3: {
                type: 'app',
                name: 'Vue3 的子应用',
                url: '//localhost:3002', // 尝试 html 加载方案
                resourceType: 'html', // auto 也可以
            },
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
            open(`http://localhost:${platformLocalPort}/childAppVue3/`);
        },
    } : undefined,
}
