const webpack = require('webpack');
const argvMap = require('../utils/argvMap');

function formatArgKey(key) {
    return key.replace(/^--/, '').replace(/-/g, '_');
}

module.exports = new webpack.DefinePlugin((() => {
    const val = Object.keys(argvMap).reduce((res, key) => Object.assign(res, {
        [formatArgKey(key).toUpperCase()]: JSON.stringify(argvMap[key]),
    }), {});
    return {
        'process.argv': val,
    };
})());
