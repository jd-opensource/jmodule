const os = require('os');
const path = require('path');
const fs = require('fs');
const resolveJmoduleConf = require('../../utils/resolveJmoduleConf');


const dir = os.tmpdir();
const demoConfigString = `
module.exports = {
    devConfig: {
        modulesConfig: {
            a: {
                type: 'app',
                url: 'http://a.com',
                resourceType: 'html',
                resourceLoadStrategy: 0,
            },
            b: {
                type: 'module',
            }
        },
        currentServer: 'http://localhost:3000',
        platformServer: 'http://remote',
        platformProxyTable: {},
        platformLocalPort: 3001,
    },
}
`;

const targetOptions = {
    modulesConfig: {
        a: {
            type: 'app',
            url: 'http://a.com',
            resourceType: 'html',
            resourceLoadStrategy: 0,
        },
        b: {
            type: 'module',
            url: 'http://localhost:3000/index.js',
        }
    },
    currentServer: 'http://localhost:3000',
    platformServer: 'http://remote',
    platformProxyTable: {},
    platformLocalPort: 3001,
};

describe('解析 .jmodule.conf.js(on) 文件', () => {
    test('读取 jmodule 配置', () => {
        const file = path.join(dir, '.jmodule.conf.js');
        fs.writeFileSync(file, demoConfigString);
        expect(resolveJmoduleConf(dir)).toMatchObject(targetOptions);
        fs.unlinkSync(file);
    });
});
