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
module.exports = function outputAssets(compilation, outputJson = false, filename, V4) {
    const jsonString = JSON.stringify(getAssets(compilation), null, 4);
    const data = outputJson ? jsonString : `(JModuleManager && JModuleManager.defaultJModule || JModule).applyResource(${jsonString})`;
    if (V4) {
        compilation.assets[filename] = {
            source: () => data,
            size: () => data.length,
        };
        return;
    }
    const last = compilation.getAsset(filename);
    if (last) {
        if (!(last.info && last.info.createdByJModule)) {
            // 该资源文件已经存在，但是不是由 JModule 创建的，则抛出异常
            throw new Error(`${filename} 已存在. 请设置 moduleEntryFile 为其它值`);
        }
        compilation.updateAsset(filename, new webpack.sources.RawSource(data, false));
    } else {
        compilation.emitAsset(filename, new webpack.sources.RawSource(data, false), {
            createdByJModule: true,
            minimized: true,
        });
    }
};
