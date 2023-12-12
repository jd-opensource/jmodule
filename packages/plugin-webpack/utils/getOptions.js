const path = require('path');

const joinUrl = (origin = '', path) => {
    const connectStr = origin.endsWith('/') ? '' : '/';
    return `${origin}${connectStr}${path}`;
};

const defaultOptions = {
    supportedNamespaces: ['$platform', '$node_modules'],
    outputJSON: false,
    experimental: false,
    assetsModifier: (res) => res,
    externalAlias: {},
    features: ['magicModules', '$module', 'argvToRuntime', 'hackJsonpFunction', 'hackChunkName'],
    moduleEntryFile: 'index.js',
    mode: 'modules',
};

module.exports = function getOptions(options, context) {
    const originOptions = options || require(path.resolve(context, '.jmodule.conf')) || {};
    const { devConfig, ...others } = originOptions;

    // 处理基础编译配置
    const localOptions = Object.assign({}, defaultOptions, others);

    // 默认输出文件
    if (others.outputJSON && !others.moduleEntryFile) {
        localOptions.moduleEntryFile = `${defaultOptions.moduleEntryFile}on`;
    }
    localOptions.isModulesMode = localOptions.mode === 'modules';

    // 填充 moduleConfig
    const { modulesConfig = {}, currentServer = '' } = devConfig || {};
    const defaultModulesUrl = joinUrl(currentServer, localOptions.moduleEntryFile);
    Object.values(modulesConfig).forEach((module) => {
        module.url = module.url || defaultModulesUrl;
    });

    // 复制开发环境配置
    return Object.assign(localOptions, devConfig);
}
