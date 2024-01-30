/* eslint-disable no-console */
export interface ModuleHookHandle { (...args: any[]): any[] | Promise<any[]> }
const hooks: { [key: string]: ModuleHookHandle[] } = {};

async function runEach(inputArgs: any[], i: number, fns: ModuleHookHandle[] = []): Promise<any[]> {
    const fn = fns[i];
    if (!fn) {
        return inputArgs;
    }
    return runEach(await fn(...inputArgs), i + 1, fns);
}

function runEachSync(inputArgs: any[], i: number, fns: ModuleHookHandle[] = []): any[] {
    const fn = fns[i];
    if (!fn) {
        return inputArgs;
    }
    return runEachSync((fn(...inputArgs) as any[]), i + 1, fns);
}

export class ModuleHook {
    /**
     * 新增模块过程 hook
     *
     * @param  {String} hookName
     * @param  {Function} handle      需要新增的hook函数
     * @return {var}
     */
    static addHook(hookName: string, handle: ModuleHookHandle) {
        hooks[hookName] = hooks[hookName] || [];
        hooks[hookName].push(handle);
    }

    /**
     * 移除模块过程 hook
     *
     * @param  {String} hookName
     * @param  {Function} handle      需要移除的hook函数
     * @return {var}
     */
    static removeHook(hookName: string, handle: ModuleHookHandle) {
        const index = hooks[hookName].indexOf(handle);
        hooks[hookName] = hooks[hookName] || [];
        if (index > -1) {
            hooks[hookName].splice(index, 1);
        }
    }

    /**
     * 清理所有 hook
     *
     * @param  {String} hookName
     * @return {var}
     */
    static clearHooks(hookName: string) {
        hooks[hookName] = [];
    }

    /**
     * 异步执行指定 hook
     *
     * @param  {String} hookName
     * @return {var}
     */
    static runHook(hookName: string, ...inputArgs: any[]) {
        return runEach(inputArgs, 0, hooks[hookName]).catch((err) => {
            console.error(`执行 hook.${hookName} 时出现异常，后续过程将终止`);
            console.error(err);
            throw err;
        });
    }

    /**
     * 同步执行指定 hook
     *
     * @param  {String} hookName
     * @return {var}
     */
    static runHookSync(hookName: string, ...inputArgs: any[]) {
        try {
            return runEachSync(inputArgs, 0, hooks[hookName]);
        } catch (err) {
            console.error(`执行 hook.${hookName} 时出现异常，后续过程将终止`);
            console.error(err);
            throw err;
        }
    }
}
