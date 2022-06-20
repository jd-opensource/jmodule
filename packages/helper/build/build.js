const webpack = require('webpack');
const config = require('./webpack.prod.conf.js');

webpack(config, (err, stats) => {
    if (err) {
        throw err;
    }
    process.stdout.write(stats.toString({
        colors: true,
        modules: true,
        children: false,
        chunks: true,
        chunkModules: true,
    }));
    process.stdout.write('\n\n');
});
