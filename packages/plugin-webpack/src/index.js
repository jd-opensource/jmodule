const path = require('path');
const webpack = require('webpack');

const { PlatformResolverPlugin } = require('./dollarPlatform');
const dollarModule = require('./dollarModule');
const argvToRuntime = require('./argvToRuntime');
const outputAssets = require('./outputAssets');
const startPlatformProxy = require('./startPlatformProxy');
const { waitServer } = require('../utils/netTools');
const getOptions = require('../utils/getOptions');
const hackChunkName = require('./hackChunkName');
const projectName = require(path.resolve(process.cwd(), './package')).name;

class JModulePlugin {
    constructor(options) {
        // just for dev mode
        this._init_options = options;
        this.pluginRandomId = Math.random().toString().replace('.', '').substr(0, 5);
    }

    startPlatform() {
        const {
            platformServer,
            currentServer,
            platformLocalPort,
            onAllServerReady,
            isModulesMode,
            modulesConfig,
            platformProxyTable = {},
        } = this;
        if (!isModulesMode || !platformServer || !currentServer || !platformLocalPort) {
            return;
        }
        if (typeof onAllServerReady === 'function') {
            const localServer = `http://localhost:${platformLocalPort}`;
            Promise.all([
                waitServer(this.currentServer),
                waitServer(this.platformServer),
                waitServer(localServer),
            ]).then(() => {
                onAllServerReady(localServer);
            });
        }
        startPlatformProxy({
            modulesConfig,
            platformLocalPort,
            platformServer,
            platformProxyTable,
        });
    }

    apply(compiler) {
        // 初始化配置
        Object.assign(this, getOptions(this._init_options, compiler));

        if (this.experimental) {
            // 仅当 experimental 确实产生影响时进行提示
            // console.warn(chalk.yellow('正在使用 experimental 模式，存在非兼容的不特定功能的更新'));
        }

        const v4 = webpack.Compilation ? false : true;

        if (this.isModulesMode) {
            // compiler.options.output.filename = 'js/[name].[hash].js';
            if (this.features.includes('hackJsonpFunction')) {
                const jsonpFunction = `webpackJsonp_${this.pluginRandomId}_${projectName.replace(/\W/g, '')}`;
                compiler.options.output.jsonpFunction = jsonpFunction;
            }

            if (this.features.includes('hackChunkName')) {
                hackChunkName(compiler, v4);
            }

            // output assets
            compiler.hooks.afterEmit.tap("JModulePlugin", compilation => {
                if (compilation.getAsset(this.moduleEntryFile)) {
                    throw new Error(`${this.moduleEntryFile} 已存在. 请设置 moduleEntryFile 为其它值`);
                }
                return compiler.outputFileSystem.writeFile(
                    path.join(compiler.options.output.path, this.moduleEntryFile),
                    outputAssets(compilation, this.outputJSON, this.assetsModifier),
                    (error) => {
                        if (error) {
                            console.error('@jmodule/plugin-webpack: 写入' + this.moduleEntryFile + '文件失败');
                            console.error(error.message);
                        }
                    },
                );
            });
        }

        // 启动调试服务
        this.startPlatform();

        // support $platform|$node_modules|$module.meta
        if (this.features.includes('magicModules')) {
            new PlatformResolverPlugin({
                externalAlias: this.externalAlias,
                importFunction: 'JModule.import',
                supportedNamespaces: this.supportedNamespaces,
            }).apply(compiler);
        }

        if (this.features.includes('$module')) {
            // support $module grammar
            dollarModule.apply(compiler);
        }

        if (this.features.includes('argvToRuntime')) {
            // support process.argv to runtime code
            argvToRuntime.apply(compiler);
        }
    }
}

module.exports = JModulePlugin;
