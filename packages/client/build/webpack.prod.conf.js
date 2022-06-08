const path = require('path');
const ESLintPlugin = require('eslint-webpack-plugin');

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
        extensions: ['.js', '.ts', '.tsx'],
    },
    module: {
        rules: [{
            test: /\.ts$/,
            use: 'ts-loader',
            exclude: /node_modules/,
        }],
    },
    plugins: [
        new ESLintPlugin({
            fix: process.argv.includes('--fix'),
            failOnError: true,
            extensions: ['.ts'],
            threads: true,
        })
    ],
};

module.exports = configs;
