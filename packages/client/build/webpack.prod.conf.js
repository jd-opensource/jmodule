const path = require('path');
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin');
const eslintFormatter = require('eslint-friendly-formatter');

const workDir = process.cwd();

const configs = {
    mode: 'production',
    entry: path.resolve('src/index.ts'),
    output: {
        libraryTarget: 'umd',
        filename: 'index.js',
        path: path.resolve(workDir, './dist'),
        publicPath: '/',
    },
    devtool: 'source-map',
    resolve: {
        extensions: ['.js', '.vue', '.json', '.ts', '.tsx'],
    },
    module: {
        rules: [{
            test: /\.(js)$/,
            loader: 'eslint-loader',
            enforce: 'pre',
            include: [path.resolve('src')],
            options: {
                formatter: eslintFormatter,
            },
        }, {
            test: /\.js$/,
            loader: 'babel-loader',
            include: [path.resolve('src')],
        }, {
            test: /\.tsx?$/,
            use: 'ts-loader',
            exclude: /node_modules/,
        }, {
            test: /\.worker\.(j|t)s$/,
            use: {
                loader: 'worker-loader',
                options: {
                    inline: true,
                    fallback: false,
                },
            },
        }],
    },
    plugins: [
        new FriendlyErrorsPlugin(),
    ],
};

module.exports = configs;
