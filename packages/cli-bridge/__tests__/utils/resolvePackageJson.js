const os = require('os');
const path = require('path');
const fs = require('fs');
const resolvePackageJson = require('../../utils/resolvePackageJson');


const dir = os.tmpdir();
const packageString = `
{
    "name": "a",
    "jmodule": {
        "modulesConfig": {
            "key": "b",
            "url": "http://localhost:3000",
            "resourceType": "html",
            "resourceLoadStrategy": 0
        },
        "host": "http://host",
        "target": "http://target"
    }
}
`;

const targetOptions = {
    "modulesConfig": {
        "key": "b",
        "url": "http://localhost:3000",
        "resourceType": "html",
        "resourceLoadStrategy": 0
    },
    "host": "http://host",
    "target": "http://target"
};

describe('解析 package.json 文件', () => {
    test('读取配置', () => {
        const file = path.join(dir, 'package.json');
        fs.writeFileSync(file, packageString);
        expect(resolvePackageJson(dir)).toMatchObject(targetOptions);
        fs.unlinkSync(file);
    });
});
