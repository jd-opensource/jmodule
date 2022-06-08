const WebpackJmodulePlugin = require('@jmodule/plugin-webpack');

const plugins = process.argv.includes('--modules')
    ? [new WebpackJmodulePlugin()]
    : [];

module.exports = {
    configureWebpack: {
        plugins,
    },
    devServer: {
        port: 8080,
    },
}