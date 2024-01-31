import { ResourceMetadata, Resource } from './resource';
import { ModuleHook } from './hook';
import { ModuleOptions, ModuleMetadata, ModuleStatus } from './config';
import { LoadOptions } from './types';
export declare type DeactivateHandler = () => void | Promise<void>;
export declare type ActivateHandler = (parentEl: Element) => void | Promise<void> | DeactivateHandler;
export declare type TypeHandler = (module: JModule, options: ModuleMetadata) => ({
    activate: ActivateHandler;
    deactivate: DeactivateHandler;
});
/**
 * JModule 实例
 * @class
 */
export declare class JModule extends ModuleHook {
    private static _debug?;
    static id: number;
    /**
     * 模块类型
     */
    type?: string;
    /**
     * 模块的key, 全局唯一
     */
    key: string;
    /**
     * 模块别名
     */
    name?: string;
    /**
     * 模块资源地址
     */
    url: string;
    /**
     * 远程资源服务器
     * @ignore
     */
    server?: string;
    /**
     * 是否为远程模块, 根据url和当前origin计算
     * @ignore
     * @deprecated since version 1.1.0
     * @type {Boolean}
     */
    isRemoteModule?: boolean;
    /**
     * 远程模块所在域
     * @ignore
     * @deprecated since version 1.1.0
     * @type {String}
     */
    domain: string;
    /**
     * [不可配置] JModule.define 执行时自动生成的模块启动函数
     * 全局仅执行一次, 内部依次处理: 执行init函数、加载 imports 声明的依赖模块、记录 exports 信息
     */
    bootstrap?: {
        (): Promise<JModule>;
    };
    /**
     * 模块加载后自动执行 bootstrap 函数, 默认为: true
     */
    autoBootstrap?: boolean;
    /** 约定的模块激活函数, 通常由 JModule.defineType 进行实现 */
    activate?: ActivateHandler;
    /** 约定的模块卸载函数, 通常由 JModule.defineType 进行实现 */
    deactivate?: DeactivateHandler;
    /** 模块对应的资源实例 */
    resource: Resource;
    /** 模块扩展信息 */
    metadata: {
        [key: string]: any;
    };
    /**
     * 模块内置的 hooks 信息, 仅支持 hooks.complete
     * @example
     * await module.hooks.complete
     */
    hooks: {
        complete: undefined | Promise<JModule>;
    };
    /**@ignore */
    _status: ModuleStatus;
    /**
     * @constructor
     * @example
     * new JModule({
     *     key: 'pipeline',
     *     url: 'http://localhost:8080/modules/pipeline/index.json',
     * });
     */
    constructor({ key, url, server, name, autoBootstrap, resourceType, resource, type, resourceLoadStrategy, ...others }: ModuleOptions);
    /**
     * 设置模块状态, 更新后会自动触发 `module.${this.key}.statusChange`事件
     * @fires window#module.[moduleKey].statusChange
     * @fires window#module.[moduleKey].[status]
     */
    set status(status: ModuleStatus);
    /**
     * 获取模块状态
     * @enum {ModuleStatus}
     */
    get status(): ModuleStatus;
    /**
     * 设置debug模式，开启后将打印模块注册、加载、解析的全过程信息
     * @example
     * JModule.debug = true;
     */
    static set debug(status: boolean);
    static get debug(): boolean;
    /**
     * 定义子应用类型的处理逻辑
     * @param  {String} type 子应用类型
     * @param  {TypeHandler} typeHandler 类型处理函数
     */
    static defineType(type: string, typeHandler: TypeHandler): void;
    /**
     * 获取已注册的模块列表
     * @readOnly
     */
    static get registeredModules(): JModule[];
    /**
     * 根据 moduleKey 获取模块实例
     * @static
     * @param  {String} key moduleKey
     * @return {JModule|undefined}
     */
    static getModule(key: string): JModule | undefined;
    /**
     * 根据 moduleKey 异步获取模块实例
     * @static
     * @param  {String} key moduleKey
     * @return {Promise<JModule>}
     */
    static getModuleAsync(key: string, timeout?: number): Promise<JModule>;
    /**
     * 引用其它模块暴露的功能
     *
     * @param  {String} namespace
     * @example
     * JModule.require('pipeline.models.PipelineApp')
     *     .then((PipelineApp) => {
     *         // do something
     *     });
     * @return {Promise<var>}
     */
    static require(namespace: string): Promise<any>;
    /**
     * 注册模块
     * @fires window#module.afterRegister
     * @example
     * JModule.registerModules([{
     *     type: 'page',
     *     key: 'pipeline',
     *     name: 'pipeline',
     *     url: 'http://localhost:8080/modules/pipeline/index.json',
     * }]);
     * window.addEventListener('module.afterRegister', ({ detail:modules }) => {
     *     // do sth;
     * })
     */
    static registerModules(moduleOptions?: ModuleOptions[]): Promise<JModule[]>;
    /**
     * 暴露平台功能给模块使用
     * @param  {object} obj 需要暴露的对象
     * @example
     * JModule.export({
     *     $platform: {
     *         utils, event, router,
     *     },
     *     $node_modules: {
     *         vue: Vue,
     *     },
     * });
     * import Vue from '$node_modules.vue';
     * @return {JModule}
     */
    static export(obj?: {}, matcher?: {}): typeof JModule;
    /**
     * 定义模块
     * @param  {String} moduleKey 定义模块唯一标识
     * @param  {Object} metadata  定义模块
     * @param  {Function} [metadata.init<jModuleInstance>] 初始化函数，自动调用
     * @param  {Array<moduleKey>} [metadata.imports] 依赖的模块
     * @param  {Object} [metadata.exports] 对外暴露的功能
     * @example
     * JModule.define('pipeline', {
     *     init(module) {
     *         console.log(module);
     *     },
     *     imports: [],
     *     exports: {},
     * });
     */
    static define: {
        (moduleKey: string, metadata: ModuleMetadata & Record<string, any>): Promise<JModule>;
        (metadata: ModuleMetadata & Record<string, any>): Promise<JModule>;
    };
    /**
     * 根据 resourceLoaderUrl 设置资源
     * 当 resourceLoaderUrl 为空时, 该函数只能在 resource.url 文件对应的脚本中执行
     *
     * @param { ResourceMetadata } resourceMetadata 资源元数据
     * @param { string|undefined } resourceLoaderUrl 加载资源的初始脚本地址, 默认为执行当前函数的脚本文件
     * @returns { Resource }
     */
    static applyResource(resourceMetadata: ResourceMetadata, resourceLoaderUrl?: string): Resource;
    /**
     * @ignore
     * @deprecated
     */
    static getMeta(): {
        url?: undefined;
        server?: undefined;
    } | {
        url: string;
        server: string;
    };
    /**
     * 引用平台暴露的对象
     * 优先从初始化自身Module实例的 JModule.exports 对象中查找
     * 如果查找失败, 最终将回退到 JModuleManager.import 进行查找
     *
     * @ignore
     * @param  {String} namespace
     * @param  {Object} config      通过编译工具注入的相关环境参数
     * @return {var}
     */
    static import<T>(namespace?: string, config?: Record<string, string | number>, force?: boolean): T | {
        url?: string;
        server?: string;
    };
    /**@ignore */
    static _import(namespace?: string, config?: {}): unknown;
    private setCompleteHook;
    /**
     * 加载模块
     * @async
     * @method
     * @param  {'init'|'preload'|'load'} [targetStatus='load'] - 期望达到的目标状态，默认为 'load'，向下兼容。
     * @param  {LoadOptions<HTMLScriptElement|HTMLLinkElement>} [options={ autoApplyStyle: true }] - 选项参数。
     * @return {Promise<Resource|void>} - 返回一个承诺，该承诺在模块加载完成时解决。
     */
    load(targetStatus?: 'init' | 'preload' | 'load', options?: LoadOptions<HTMLScriptElement | HTMLLinkElement>): Promise<Resource | void>;
}
