const path = require('path');
const webpack = require('webpack');

const { PlatformResolverPlugin } = require('./dollarPlatform');
const dollarModule = require('./dollarModule');
const argvToRuntime = require('./argvToRuntime');
const outputAssets = require('./outputAssets');
const startPlatformProxy = require('./startPlatformProxy');
const { waitServer } = require('../utils/netTools');
const getOptions = require('../utils/getOptions');
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

        if (this.isModulesMode) {
            // compiler.options.output.filename = 'js/[name].[hash].js';
            if (this.features.includes('hackJsonpFunction')) {
                const jsonpFunction = `webpackJsonp_${this.pluginRandomId}_${projectName.replace(/\W/g, '')}`;
                compiler.options.output.jsonpFunction = jsonpFunction;
            }

            // output assets
            if (webpack.Compilation) {
                // v5
                if (this.features.includes('hackChunkNameFunction')) {
                    compiler.options.output.chunkFilename = 'js/[id].[contenthash].js';
                }
                compiler.hooks.compilation.tap("JModulePlugin", compilation => {
                    compilation.hooks.processAssets.tap(
                        {
                            name: "JModulePlugin",
                            stage: webpack.Compilation.PROCESS_ASSETS_STAGE_ANALYSE,
                        },
                        () => outputAssets(compilation, this.outputJSON, this.moduleEntryFile, false, this.assetsModifier),
                    );
                });
            } else {
                // v4
                if (this.features.includes('hackChunkNameFunction')) {
                    compiler.options.output.chunkFilename = 'js/[id].[chunkhash].js';
                }
                compiler.hooks.emit.tap(
                    'JModulePlugin',
                    (compilation) => outputAssets(compilation, this.outputJSON, this.moduleEntryFile, true, this.assetsModifier),
                );
            }
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
