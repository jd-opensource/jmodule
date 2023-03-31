const webpack = require("webpack");

function getAssets(compilation) {
    const { publicPath, chunks = [] } = compilation.getStats().toJson();
    const entryFiles = [];
    const asyncFiles = [];
    compilation.entrypoints.forEach((entry) => {
        entryFiles.push(...entry.getFiles());
    });
    chunks.forEach((chunk) => {
        if (!chunk.initial) {
            asyncFiles.push(...chunk.files);
        }
    }, []);
    return {
        js: entryFiles.filter((filename) => /.js($|\?)/.test(filename)),
        css: entryFiles.filter((filename) => /.css($|\?)/.test(filename)),
        asyncFiles,
        publicPath,
    };
}
module.exports = function outputAssets(compilation, outputJson = false, filename, V4, assetsModifier) {
    let assetsData = getAssets(compilation); 
    if (assetsModifier && typeof assetsModifier === 'function') {
        assetsData = assetsModifier(assetsData) || assetsData;
    }
    const jsonString = JSON.stringify(assetsData, null, 4);
    return outputJson ? jsonString : `(window.JModuleManager && window.JModuleManager.defaultJModule || window.JModule).applyResource(${jsonString})`;
};
