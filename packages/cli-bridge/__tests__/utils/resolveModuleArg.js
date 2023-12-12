const { Command } = require('commander');
const program = new Command();
const resolveModuleArg = require('../../utils/resolveModuleArg');

describe('测试 --module 参数解析', () => {
    test('多 module 参数解析', () => {
        const bUrl = 'http://localhost:3001?key=b&type=module&resourceLoadStrategy=1';
        const aUrl = 'http://localhost:3000?key=a';
        program.option('-M, --module <module>', '子应用配置', resolveModuleArg);

        program.parse(['node', 'testModule', '-M', aUrl, '--module', bUrl]);

        const opts = program.opts();
        expect(Object.keys(opts.module)).toEqual(['a', 'b']);
        expect(opts.module.a).toEqual({ type: 'app', url: aUrl, key: 'a' });
        expect(opts.module.b).toEqual({ type: 'module', url: bUrl, key: 'b', resourceLoadStrategy: 1 });
    });
});

