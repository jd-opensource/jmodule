const path = require('path');
const defaultConf = require('./defaultConf');

module.exports = function resolvePackageJson(projectDir) {
    if (!projectDir) {
        return {};
    }
    try {
        const { jmodule, name } = require(path.resolve(projectDir, 'package.json')) || {};
        if (!jmodule) {
            return {};
        }
        return { [jmodule?.key || name]: { ...defaultConf, ...(jmodule || {}) } };
    } catch (e) {
        return {};
    }
}
