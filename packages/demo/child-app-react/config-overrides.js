const WebpackJmodulePlugin = require('@jmodule/plugin-webpack');
module.exports = function override(config) {
    config.plugins.push(new WebpackJmodulePlugin());
    return config;
}