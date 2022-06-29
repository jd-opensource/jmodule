const path = require('path');
const ESLintPlugin = require('eslint-webpack-plugin');

const workDir = process.cwd();

const configs = {
    mode: 'production',
    entry: {
        'host/type.app': path.resolve('src/host/type.app.ts'),
        'host/type.routes.vue2': path.resolve('src/host/type.routes.vue2.ts'),
        'host/resource.html': path.resolve('src/host/resource.html.ts'),
        'app/app.vue2': path.resolve('src/app/app.vue2.ts'),
        'app/app.vue3': path.resolve('src/app/app.vue3.ts'),
    },
    output: {
        libraryTarget: 'umd',
        path: path.resolve(workDir, './dist'),
        publicPath: '/',
    },
    devtool: 'source-map',
    resolve: {
        extensions: ['.js', '.ts', '.tsx'],
    },
    externals: {
        '@jmodule/client': '@jmodule/client',
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
