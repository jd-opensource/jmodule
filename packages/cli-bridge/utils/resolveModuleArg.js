const defaultConf = require('./defaultConf');
const querystring = require('node:querystring'); 
const url = require('node:url');

module.exports = function resolveModuleArg(value, preValue) {
    try {
        const conf = querystring.parse(url.parse(value || '').query);
        if (!value || !conf.key) { return preValue || {}; }
        const result = {
            ...preValue,
            [conf.key]: { ...defaultConf, ...conf, url: value },
        };
        // 修正 resourceLoadStrategy 的值
        if (conf.resourceLoadStrategy) {
            result[conf.key].resourceLoadStrategy = parseInt(conf.resourceLoadStrategy);
        }
        return result;
    } catch (e) {
        console.error(`解析 --module ${value} 参数时异常: ${e.message}, 该参数将被忽略`);
        return preValue;
    }
}