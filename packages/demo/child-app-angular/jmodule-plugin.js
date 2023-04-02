const JModulePlugin = require('@jmodule/plugin-webpack');
const platformServer = process.env.platformServer || 'http://localhost:8080';
const currentServer = process.env.currentServer || 'http://localhost:3003';
const platformLocalPort = process.env.platformLocalPort || 8093;

module.exports = (config) => {
    config.plugins.push(new JModulePlugin({
        mode: 'modules',
        features: [],
        assetsModifier(json) { // 资源排序修正
            const js = new Set(json.js);
            js.delete('main.js');
            json.js = [...js, 'main.js'];
            return json;
        },
        devConfig: process.env.NODE_ENV === 'development' ? {
            modulesConfig: {
                'childAppAngular': {
                    name: 'Angular-hero-list',
                    resourceLoadStrategy: 0, // fetch 的方式加载
                    type: 'app'
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
    }));

    return config;
}