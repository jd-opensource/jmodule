import { ModuleHook } from './hook';
import { JModule } from './module';
import { Resource } from './resource';
import { Matcher } from './utils/matcher';
export declare class JModuleManager extends ModuleHook {
    private static resourceCache;
    private static jmoduleCache;
    private static resourceUrlAndModuleKeyMap;
    private static moduleExportsCache;
    private static moduleExports;
    static nextJModuleId: number;
    static defaultJModule?: typeof JModule;
    static createDocument(options: {
        sourceUrl: string;
        currentUrl: string;
    }): Document;
    static testApi(apiName: string): 1 | -1 | 0;
    /**
     * 读取全局初始化配置
     *
     * @return {Object|undefined}
     */
    static getInitialConfig(): any;
    /**
     * 读取/设置 url(包括异步资源) 与 Resource 之间的关系
     * @param {String} url
     * @param {Resource|null} resource
     * @returns {Resource|undefined}
     */
    static resource(url: string, resource?: Resource | null): Resource | undefined;
    /**
     * 读取/设置 moduleKey 与 Module 之间的关系
     * @param {String} moduleKey
     * @param {JModule|null} instance
     * @returns {JModule|undefined}
     */
    static jmodule(moduleKey: string, instance?: JModule | null): JModule | undefined;
    /**
     * 获取已注册的应用列表
     * @readOnly
     */
    static get registeredModules(): JModule[];
    /**
     * 登记资源地址 与 moduleKey 之间的映射关系
     * @param {String} resourceUrl
     * @param {String} moduleKey
     */
    static mapResourceUrlAndModuleKey(resourceUrl: string, moduleKey: string): void;
    /**
     * 基于 resourceUrl 查找关联的 Modules
     * @param resourceUrl
     * @returns { Array<JModule> }
     */
    static getModulesByResourceUrl(resourceUrl: string): JModule[];
    /**
     * 读取 moduleKey 对应的 JModule 构造函数
     * @param moduleKey
     * @returns { typeof JModule }
     */
    static getJModuleConstructor(moduleKey: string): Function;
    static registerJModule(JModuleConstructor: typeof JModule): number;
    /**
     * 存储模块暴露的组件
     *
     * @param  {String} moduleKey
     * @param  {any} data
     */
    static cacheModuleExport(moduleKey: string, data: any): void;
    /**
     * 等待模块加载完成
     *
     * @param  {String} moduleKey
     * @example
     * await JModuleManager.waitModuleComplete(moduleKey);
     * @return {Promise<Module>}
     */
    static waitModuleComplete(moduleKey: string): Promise<JModule>;
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
        (moduleKey: string, metadata: import("./config").ModuleMetadata & Record<string, any>): Promise<JModule>;
        (metadata: import("./config").ModuleMetadata & Record<string, any>): Promise<JModule>;
    };
    /**
     * 暴露平台功能给模块使用
     * 与 JModuleManager.defaultJModule 数据一致
     * @param  {object} obj 需要暴露的对象
     * @example
     * JModuleManager.export({
     *     $platform: {
     *         utils, event, router,
     *     },
     *     $node_modules: {
     *         vue: Vue,
     *     },
     * }, { scope: 'default' });
     */
    static export(obj?: {}, matcher?: Matcher): void;
    /**
     * 引用平台暴露的对象
     *
     * @ignore
     * @param  {String} namespace
     * @param  {Object} config      通过编译工具注入的相关环境参数
     * @return {var}
     */
    static import<T>(namespace?: string, config?: Record<string, string | number> | Matcher): T;
    /**
     * @ignore
     */
    static setFileMapCache(_key: string, _val: [string, string]): void;
    /**
     * @ignore
     */
    static appendFileList(url: string): void;
}
declare const _default: typeof JModuleManager;
export default _default;
