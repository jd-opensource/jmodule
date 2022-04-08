const WebpackJmodulePlugin = require('@jmodule/plugin-webpack');

module.exports = {
    configureWebpack: {
        plugins: [
            new WebpackJmodulePlugin()
        ],
    },
    devServer: {
        disableHostCheck: true,
        port: 3001,
        open: false,
        headers: {
            'Access-Control-Allow-Origin': '*'
        },
    },
    publicPath: 'http://localhost:3001/',
}