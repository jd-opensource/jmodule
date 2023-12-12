const { Command } = require('commander');
const { version } = require('./package.json');
const program = new Command();
const path = require('node:path');
const resolveJmoduleConf = require('./utils/resolveJmoduleConf');
const resolveModuleArg = require('./utils/resolveModuleArg');
const resolvePackageJson = require('./utils/resolvePackageJson');
const startPlatformProxy = require('./utils/startPlatformProxy');

program
    .name('jmodule-bridge')
    .description('JModule 集成调试工具')
    .version(version);

program
    .option('-H, --host <host>', '宿主应用服务')
    .option('-T, --target-port <target>', '集成调试服务端口, eg: 9000')
    .option('-P, --project-dir <projectDir>', '项目目录, 自动从 package.json, .jmodule.conf.js 下读取配置', './')
    .option('-M, --module <module>', '子应用配置, eg: http://localhost:3000?key=mychild', resolveModuleArg);

    
    // 解析、合并配置
function resolveAllConfig() {
    const args = program.opts();
    const projectDir = args.projectDir ? path.resolve(process.cwd(), args.projectDir) : undefined;
    const jmoduleConfig = resolveJmoduleConf(projectDir);
    return {
        modulesConfig: {
            ...resolvePackageJson(projectDir),
            ...(jmoduleConfig?.modulesConfig),
            ...(args.module || {}),
        },
        platformServer: args.host || jmoduleConfig.platformServer,
        platformProxyTable: jmoduleConfig.platformProxyTable || {},
        platformLocalPort: args.targetPort || jmoduleConfig.platformLocalPort,
    };
}


function startServer() {
    const mergedConfig = resolveAllConfig();
    startPlatformProxy(mergedConfig)
        .then((targetPort) => {
            console.log('集成服务已启动: ', `${mergedConfig.platformServer} => http://localhost:${targetPort}`);
        })
        .catch((err) => console.error(err));
}

program
    .command('config')
    .description('输出配置信息')
    .action(() => { console.log(resolveAllConfig()); });
program
    .command('start')
    .description('启动集成调试服务')
    .action(startServer);

program.parse();
