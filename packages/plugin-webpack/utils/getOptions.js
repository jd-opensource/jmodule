const { joinUrl } = require('../utils/netTools');
const path = require('path');

const defaultOptions = {
    supportedNamespaces: ['$platform', '$node_modules'],
    outputJSON: false,
    experimental: false,
    externalAlias: {},
    features: ['magic-modules', '$module', 'argvToRuntime'],
    moduleEntryFile: 'index.js',
    mode: 'modules',
};

module.exports = function getOptions(options, compiler) {
    const context = compiler.options.context || process.cwd();
    const originOptions = options || require(path.resolve(context, '.jmodule.conf')) || {};
    const { mode, devConfig, ...others } = originOptions;

    // 处理基础编译配置
    const localOptions = Object.assign(defaultOptions, others);
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
