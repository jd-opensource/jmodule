import { ResourceMetadata, Resource } from './resource';
import { ModuleHook } from './hook';
import { Matcher } from './utils/matcher';
import { ModuleOptions, ModuleMetadata, ModuleStatus } from './config';
import { LoadOptions } from './types';
declare type HashObject = {
    [key: string]: any;
};
export declare type TypeHandler = (module: JModule, options: ModuleMetadata) => ({
    activate: (parentEl: Element) => Promise<void>;
    deactivate: () => Promise<void>;
});
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
    static id: number;
    type?: string;
    key: string;
    name?: string;
    url: string;
    server?: string;
    autoBootstrap?: boolean;
    isRemoteModule?: boolean;
    domain: string;
    bootstrap?: {
        (): Promise<JModule>;
    };
    activate?: {
        (parentEl: Element): Promise<void>;
    };
    deactivate?: {
        (): Promise<void>;
    };
    resource: Resource;
    metadata: {
        [key: string]: any;
    };
    hooks: {
        complete: undefined | Promise<JModule>;
    };
    _status: ModuleStatus;
    /**
     * @constructor
     */
    constructor({ key, url, server, name, autoBootstrap, resourceType, resource, type, resourceLoadStrategy, ...others }: ModuleOptions);
    set status(status: ModuleStatus);
    /**
     * 获取模块状态
     * @member
     * @enum {String}
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
     * @return {jModuleInstance}
     */
    static getModule(key: string): JModule | undefined;
    /**
     * 根据 moduleKey 异步获取模块实例
     * @static
     * @param  {String} key moduleKey
     * @return {Promise<jModuleInstance>}
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
    static export(obj?: {}, matcher?: Matcher): typeof JModule;
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
    static getMeta(): {
        url?: undefined;
        server?: undefined;
    } | {
        url: string;
        server: string;
    };
    /**
     * 引用平台暴露的对象
     * 如果查找失败, 最终将回退到 JModuleManager.import 进行查找
     *
     * @ignore
     * @param  {String} namespace
     * @param  {Object} config      通过编译工具注入的相关环境参数
     * @return {var}
     */
    static import<T>(namespace?: string, config?: HashObject | Matcher, force?: boolean): T | {
        url?: string;
        server?: string;
    };
    static _import(namespace?: string, config?: {}): unknown;
    private setCompleteHook;
    /**
     * 加载模块
     * @method
     * @param  {'init'|'preload'|'load'} targetStatus 期望目标，默认 load 向下兼容
     * @param  {Object} options
     * @param  {(element: HTMLElement) => void} options.elementModifier preload 元素修改器
     * @param  {Boolean} options.autoApplyStyle load的同时加载样式
     * @return {Promise}
     */
    load(targetStatus?: 'init' | 'preload' | 'load', options?: LoadOptions): Promise<Resource | void>;
}
export {};
