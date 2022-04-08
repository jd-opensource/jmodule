const path = require('path');

module.exports = function getModulePath(_path) {
    return path.posix.join('modules', _path);
};
