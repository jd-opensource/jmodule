import { ResourceMetadata, Resource } from './resource';
import { ModuleHook } from './hook';
export interface ModuleOptions {
    type?: string;
    key: string;
    name: string;
    url: string;
    server?: string;
    autoBootstrap?: boolean;
    resourceType?: string;
    resourcePrefix?: string;
    resource?: Resource;
}
export interface ModuleMetadata {
    key?: string;
    init(module: JModule): void;
    imports?: string[];
    exports?: {
        [key: string]: any;
    };
}
declare function define(moduleKey: string, metadata: ModuleMetadata): Promise<JModule>;
declare function define(metadata: ModuleMetadata): Promise<JModule>;
export declare enum MODULE_STATUS {
    bootFailure = -2,
    loadFailure = -1,
    inited = 0,
    loading = 1,
    loaded = 2,
    defined = 3,
    booting = 4,
    done = 5,
    resourceInited = 6
}
export interface JModuleOptions {
    autoApplyScript: boolean;
    autoApplyStyle: boolean;
}
/**
 * @class
 * @constructor
 * @param  {Object} moduleConfig        模块配置
 * @param  {String} moduleConfig.server 模块资源服务器
 * @param  {String} moduleConfig.key    模块Key值
 * @param  {String} moduleConfig.name    模块名字
 * @param  {String} moduleConfig.url    远程模块地址
 * @property {Array<jModuleInstance>} registeredModules (只读)已注册的模块列表
 * @property {Boolean} debug (只写)debug模式开关
 * @example
 * new JModule({
 *     key: 'pipeline',
 *     server: 'http://localhost:8080/',
 *     url: 'http://localhost:8080/modules/pipeline/index.json',
 * });
 */
export declare class JModule extends ModuleHook {
    private static _debug?;
    private completeResolver;
    static options: JModuleOptions;
    type?: string;
    key: string;
    name: string;
    url: string;
    server?: string;
    autoBootstrap?: boolean;
    isRemoteModule?: boolean;
    domain: string;
    bootstrap?: {
        (): Promise<JModule>;
    };
    resource: Resource;
    metadata?: {
        [key: string]: any;
    };
    hooks: {
        complete: Promise<JModule>;
    };
    _status: MODULE_STATUS;
    /**
     * @constructor
     */
    constructor({ key, url, server, name, autoBootstrap, resourceType, resourcePrefix, resource, type, ...others }: ModuleOptions);
    set status(status: MODULE_STATUS);
    /**
     * 获取模块状态
     * @member
     * @enum {String}
     */
    get status(): MODULE_STATUS;
    /**
     * 设置debug模式，开启后将打印模块注册、加载、解析的全过程信息
     * @example
     * JModule.debug = true;
     */
    static set debug(status: boolean);
    static get debug(): boolean;
    /**
     * 获取已注册的模块列表
     * @readOnly
     */
    static get registeredModules(): JModule[];
    /**
     * 根据 moduleKey 获取模块实例
     * @static
     * @param  {String} key moduleKey
     * @return {jModuleInstance}
     */
    static getModule(key: string): JModule;
    /**
     * 根据 moduleKey 异步获取模块实例
     * @static
     * @param  {String} key moduleKey
     * @return {Promise<jModuleInstance>}
     */
    static getModuleAsync(key: string, timeout: number): Promise<JModule>;
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
     * @param  {array<moduleConfig>} arr 注册模块
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
     * @fires window#module.afterRegister
     * @return {array<jModuleInstance>} 新注册的模块实例
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
    static export(obj?: {}): typeof JModule;
    /**
     * 定义模块
     * @param  {String} moduleKey 定义模块唯一标识
     * @param  {Object} metadata  定义模块
     * @param  {Function} [metadata.init<jModuleInstance>] 初始化函数，自动调用
     * @param  {Array<moduleKey>} [metadata.imports] 依赖的模块
     * @param  {Object} [metadata.exports] 对外暴露的功能
     * @example
     * JModule.define('pipeline', {
     *     init(module) {},
     *     routes,
     *     imports: [],
     *     exports: {},
     * });
     */
    static define: typeof define;
    static applyResource(resourceMetadata: ResourceMetadata, resourceLoaderUrl?: string): void;
    /**
     * 引用平台暴露的对象
     *
     * @ignore
     * @param  {String} namespace
     * @param  {Object} config      通过编译工具注入的相关环境参数
     * @return {var}
     */
    static import(namespace?: string, config?: {}): any;
    static _import(namespace?: string, config?: {}): any;
    /**
     * 加载模块
     * @method
     * @param  {Object} options  配置项
     * @param  {Boolean} [options.appendStyle] 应用样式， 默认为 true
     * @return {Promise}
     */
    load(): Promise<Resource | void>;
}
export {};
