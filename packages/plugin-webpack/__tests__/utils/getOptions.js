const os = require('os');
const path = require('path');
const fs = require('fs');
const getOptions = require('../../utils/getOptions.js');

const dir = os.tmpdir();
const mockCompiler = { options: { context: dir } };

const defaultOptions = {
    supportedNamespaces: ['$platform', '$node_modules'],
    outputJSON: false,
    experimental: false,
    externalAlias: {},
    features: ['magicModules', '$module', 'argvToRuntime', 'hackJsonpFunction', 'hackChunkNameFunction'],
    moduleEntryFile: 'index.js',
    isModulesMode: true
};

const fixedOptions = {
    outputJSON: true,
    features: ['$module'],
    mode: null,
    externalAlias: { 'vue': 'someScope:$platform.vue' },
};

const targetFixedOptions = {
    ...defaultOptions,
    outputJSON: true,
    moduleEntryFile: 'index.json',
    isModulesMode: false,
    features: ['$module'],
    externalAlias: { 'vue': 'someScope:$platform.vue' },
};

describe('getOptions', () => {
    test('default', () => {
        expect(getOptions({}, mockCompiler)).toMatchObject(defaultOptions);
    });
    test('inline argument', () => {
        expect(getOptions(fixedOptions, mockCompiler)).toMatchObject(targetFixedOptions);
    });
    test('file', () => {
        const file = path.join(dir, '.jmodule.conf.js');
        fs.writeFileSync(file, `module.exports = ${JSON.stringify(fixedOptions)}`);
        expect(getOptions(undefined, mockCompiler)).toMatchObject(targetFixedOptions);
        fs.unlinkSync(file);
    });
});
