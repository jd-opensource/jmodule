const path = require('path');

const joinUrl = (origin = '', path) => {
    const connectStr = origin.endsWith('/') ? '' : '/';
    return `${origin}${connectStr}${path}`;
};

const defaultOptions = {
    outputJSON: false,
    moduleEntryFile: 'index.js',
};

module.exports = function resolveJmoduleConf(context) {
    if (!context) {
        return {};
    }
    let originOptions;
    try {
        originOptions = require(path.resolve(context, '.jmodule.conf')) || {};
    } catch (e) {
        return {};
    }
    try {
        const { devConfig, ...others } = originOptions;
    
        // 处理基础编译配置
        const localOptions = Object.assign({}, defaultOptions, others);
    
        // 默认输出文件
        if (others.outputJSON && !others.moduleEntryFile) {
            localOptions.moduleEntryFile = `${defaultOptions.moduleEntryFile}on`;
        }
    
        // 填充 moduleConfig
        const { modulesConfig = {}, currentServer = '' } = devConfig || {};
        const defaultModulesUrl = joinUrl(currentServer, localOptions.moduleEntryFile);
        Object.values(modulesConfig).forEach((module) => {
            module.url = module.url || defaultModulesUrl;
        });
    
        // 复制开发环境配置
        return Object.assign(localOptions, devConfig);
    } catch (e) {
        console.error(e);
        return {};
    }
}
