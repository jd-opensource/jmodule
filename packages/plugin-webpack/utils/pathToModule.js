const path = require('path');

const workDir = process.cwd();

module.exports = function pathToModule(filePath) {
    const res = [];
    path.relative(workDir, filePath).split(/\/|\\/g).forEach(((dirName, i, arr) => {
        if (dirName === 'modules' && arr[i + 1]) {
            res.push(arr[i + 1]);
        }
    }));
    return res.join('_');
};
