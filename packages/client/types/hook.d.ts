interface handle {
    (...args: any[]): any[];
}
export declare class ModuleHook {
    /**
     * 新增模块过程 hook
     *
     * @param  {String} hookName
     * @param  {Function} handle      需要新增的hook函数
     * @return {var}
     */
    static addHook(hookName: string, handle: handle): void;
    /**
     * 移除模块过程 hook
     *
     * @param  {String} hookName
     * @param  {Function} handle      需要移除的hook函数
     * @return {var}
     */
    static removeHook(hookName: string, handle: handle): void;
    /**
     * 清理所有 hook
     *
     * @param  {String} hookName
     * @return {var}
     */
    static clearHooks(hookName: string): void;
    /**
     * 异步执行指定 hook
     *
     * @param  {String} hookName
     * @return {var}
     */
    static runHook(hookName: string, ...inputArgs: any[]): Promise<any[]>;
    /**
     * 同步执行指定 hook
     *
     * @param  {String} hookName
     * @return {var}
     */
    static runHookSync(hookName: string, ...inputArgs: any[]): any[];
}
declare const _default: {};
export default _default;
