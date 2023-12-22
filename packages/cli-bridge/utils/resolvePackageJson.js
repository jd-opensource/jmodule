const path = require('path');

module.exports = function resolvePackageJson(projectDir) {
    if (!projectDir) {
        return {};
    }
    try {
        const { jmodule } = require(path.resolve(projectDir, 'package.json')) || {};
        if (!jmodule) {
            return {};
        }
        return jmodule;
    } catch (e) {
        return {};
    }
}
