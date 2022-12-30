import { ModuleDebug } from '../debug';
import { JModule } from '../module';
import { ModuleMetadata, ModuleStatus } from '../config';
import manager from '../globalManager';
import { eventToPromise } from './eventToPromise';

async function initModule(module: JModule, pkg: ModuleMetadata): Promise<JModule> {
    const { key } = module;
    const runHook = (module.constructor as any).runHook;
    ModuleDebug.print({ key, message: '开始执行初始化函数', instance: pkg });
    try {
        // module init
        if (typeof pkg.init === 'function') {
            ModuleDebug.printContinue('执行 init 函数');
            await pkg.init(module);
        }
        await runHook('afterInit', module, pkg);

        // imports
        (pkg.imports || []).forEach((moduleKey: string) => {
            ModuleDebug.printContinue('加载依赖模块');
            manager.waitModuleComplete(moduleKey).then((item: JModule) => item.load());
        });
        await runHook('afterImports', module, pkg);

        // exports
        manager.cacheModuleExport(key, pkg.exports);
        await runHook('afterExports', module, pkg);

        return module;
    } catch (e) {
        console.error(e);
        ModuleDebug.print({
            type: 'error',
            key,
            message: (e as Error).message || '未找到模块注册信息, 或模块参数错误',
            instance: e,
        });
        throw e;
    }
}

function define(moduleKey: string, metadata: ModuleMetadata & Record<string, any>): Promise<JModule>;
function define(metadata: ModuleMetadata & Record<string, any>): Promise<JModule>;
function define(moduleKey: any, metadata?: any): Promise<JModule> {
    let localKey: string;
    let localMetadata: ModuleMetadata;
    /* eslint-disable */
    if (!metadata) {
        localKey = moduleKey.key;
        localMetadata = moduleKey;
    } else {
        localKey = moduleKey;
        localMetadata = metadata;
    }
    const moduleDefer = manager.jmodule(localKey)
        ? Promise.resolve(manager.jmodule(localKey))
        : eventToPromise(`module.${moduleKey}.${ModuleStatus.init}`);
    // 在定义之前执行将出现异常
    return moduleDefer.then((module: JModule) => {
        module.bootstrap = () => {
            module.status = ModuleStatus.booting;
            const targetConstructor = module.constructor as any;
            let defer = targetConstructor.runHook('beforeDefine', module, localMetadata)
                .then(() => initModule(module, localMetadata))
                .then(() => {
                    targetConstructor.runHook('afterDefine', module, localMetadata)
                    module.status = ModuleStatus.done; // 初始化完成
                    return module;
                })
                .catch((err: Error) => {
                    module.status = ModuleStatus.bootFailure;
                    throw err;
                });
            module.bootstrap = () => defer; // 重写bootstrap, 避免重复执行
            return defer;
        }
        // 模块状态：已定义
        module.status = ModuleStatus.defined;
        if (module.autoBootstrap) {
            return module.bootstrap();
        }
        return module;
    });
}

export default define;
