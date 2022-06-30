module.exports = function hackChunkName(compiler, v4) {
    if (compiler.options.output.chunkFilename.indexOf('hash]') > -1) {
        return;
    }
    const hash = v4 ? 'chunkhash' : 'contenthash';
    compiler.options.output.chunkFilename = `js/[id].[${hash}].js`;
}
