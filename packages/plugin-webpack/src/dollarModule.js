const webpack = require('webpack');
const path = require('path');

module.exports = new webpack.NormalModuleReplacementPlugin(
    /^\$module[/\\]/,
    (resource) => {
        const newDir = resource.context.replace(
            /(^.*[/\\]modules[/\\][^/\\]+)(.*$)/,
            (a, b) => b,
        );
        // 判断解析的模块目录是否在工作目录中
        if (path.relative(process.cwd(), newDir).indexOf('..') === 0) {
            // 不在当前工作目录
            return;
        }
        resource.request = resource.request.replace(/^\$module/, newDir);
    },
);
