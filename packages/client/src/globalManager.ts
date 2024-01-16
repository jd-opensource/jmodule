// 全局环境仅保留一份 JModuleManager，用于多 JModule, Resource 管理

import { ModuleStatus } from './config';
import { ModuleHook } from './hook';
import { JModule } from './module';
import { Resource } from './resource';
import { createDocument } from './utils/fakeDocument';
import { patchCreateElement } from './utils/patchCreateElement';
import { defineModule } from './utils/defineModule';
import { enableDevtool } from './utils/enableDevtool'
import { eventToPromise } from './utils/eventToPromise';
import { Matcher } from './utils/matcher';
import { DepResolver } from './depResolver';

const originDocument = document;
const originCreateElement = originDocument.createElement.bind(originDocument);
const initialConfig = (((window as any).JModule || {}) as any).config || {};
const defaultExportsMatcher = new Matcher({});

export class JModuleManager extends ModuleHook {
    private static resourceCache: { [id: string]: Resource } = {};

    private static jmoduleCache: { [id: string]: JModule } = {};

    private static resourceUrlAndModuleKeyMap: Record<string, string[]> = {};

    /* AsyncFiles to JmoduleFrom */
    private static asyncFilesMap: Record<string, string> = {};

    private static moduleExportsCache: Record<string, any> = {};

    private static moduleExports: Record<string, any> = {};

    static nextJModuleId = 0;

    static defaultJModule?: typeof JModule;

    static createDocument(options: { sourceUrl: string, currentUrl: string }) {
        return createDocument(originDocument, originCreateElement, options);
    }

    /**
     * 读取全局初始化配置
     *
     * @return {Object|undefined}
     */
    static getInitialConfig() {
        return initialConfig;
    }

    /**
     * 从异步资源查找ResourceUrl
     *
     * @param  {String} url
     * @return {string|undefined}
     */
    static getResourceUrlByAsyncFile(url: string) {
        let resourceUrl: string|undefined = this.asyncFilesMap[url];
        // 无精确匹配时执行模糊匹配
        if (!resourceUrl) {
            const matchedKey = Object.keys(this.asyncFilesMap).find(item => item && url.includes(item));
            resourceUrl = matchedKey ? this.asyncFilesMap[matchedKey] : undefined;
        }
        return resourceUrl;
    }

    /**
     * 记录异步资源与ResourceUrl的关系
     *
     * @param  {String} url
     * @param  {String} resourceUrl
     * @return {String|undefined}
     */
    static setAsyncFilesMap(url: string, resourceUrl: string) {
        const oldTarget = this.asyncFilesMap[url];
        if (oldTarget && oldTarget !== resourceUrl) {
            const errorMessage = `建立异步资源索引 "${url}" 出现冲突，可能会导致异步组件加载异常`;
            console.error(errorMessage, resourceUrl);
        }
        return this.asyncFilesMap[url] = resourceUrl;
    }

    /**
     * 读取/设置 url(包括异步资源) 与 Resource 之间的关系
     * @param {String} url 
     * @param {Resource|null} resource 
     * @returns {Resource|undefined}
     */
    static resource(url: string, resource?: Resource|null): Resource|undefined {
        if (resource === null) {
            delete this.resourceCache[url];
            return;
        }
        if (resource) {
            this.resourceCache[url] = resource;
            return resource;
        }
        // 优先执行精确匹配, 否则当作异步资源先匹配resourceUrl再查找
        return this.resourceCache[url] || this.resourceCache[this.getResourceUrlByAsyncFile(url) || ''];
    }

    /**
     * 读取/设置 moduleKey 与 Module 之间的关系
     * @param {String} moduleKey 
     * @param {JModule|null} instance 
     * @returns {JModule|undefined}
     */
    static jmodule(moduleKey: string, instance?: JModule|null): JModule|undefined {
        if (instance === null) {
            delete this.jmoduleCache[moduleKey];
            return;
        }
        if (instance) {
            this.jmoduleCache[moduleKey] = instance;
            return instance;
        }
        return this.jmoduleCache[moduleKey];
    }

    /**
     * 获取已注册的应用列表
     * @readOnly
     */
    static get registeredModules(): JModule[] {
        return Object.keys(this.jmoduleCache)
            .map(key => this.jmodule(key))
            .filter(item => !!item) as JModule[];
    }

    /**
     * 登记资源地址 与 moduleKey 之间的映射关系
     * @param {String} resourceUrl 
     * @param {String} moduleKey 
     */
    static mapResourceUrlAndModuleKey(resourceUrl: string, moduleKey: string) {
        this.resourceUrlAndModuleKeyMap[resourceUrl] = [
            ...(this.resourceUrlAndModuleKeyMap[resourceUrl] || []),
            moduleKey,
        ];
    }

    /**
     * 基于 resourceUrl 查找关联的 Modules
     * @param resourceUrl
     * @returns { Array<JModule> }
     */
    static getModulesByResourceUrl(resourceUrl: string): JModule[] {
        return (this.resourceUrlAndModuleKeyMap[resourceUrl] || [])
            .map(key => this.jmodule(key))
            .filter(item => !!item) as JModule[];
    }

    /**
     * 读取 moduleKey 对应的 JModule 构造函数
     * @param moduleKey 
     * @returns { typeof JModule }
     */
    static getJModuleConstructor(moduleKey: string) {
        const module = this.jmodule(moduleKey);
        if (!module) {
            throw new Error(`Module ${moduleKey} not found`);
        }
        return module.constructor;
    }

    static registerJModule(JModuleConstructor: typeof JModule) {
        if (!this.defaultJModule) {
            // 首次注册的设为默认值，为兼容以前的 window.JModule
            this.defaultJModule = JModuleConstructor;
        }
        return this.nextJModuleId++;
    }

    /**
     * 存储模块暴露的组件
     *
     * @param  {String} moduleKey
     * @param  {any} data
     */
    static cacheModuleExport(moduleKey: string, data: any): void {
        Object.assign(this.moduleExports, { [moduleKey]: data });
    }

    /**
     * 等待模块加载完成
     *
     * @param  {String} moduleKey
     * @example
     * await JModuleManager.waitModuleComplete(moduleKey);
     * @return {Promise<Module>}
     */
    static async waitModuleComplete(moduleKey: string): Promise<JModule> {
        const targetModule = this.jmodule(moduleKey);
        return targetModule && targetModule.status === ModuleStatus.done
            ? Promise.resolve(targetModule)
            : eventToPromise<JModule>(`module.${moduleKey}.${ModuleStatus.done}`);
    }

    // JModule 兼容功能
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
    static async require(namespace: string): Promise<any> {
        const path = namespace.split('.');
        await this.waitModuleComplete(path[0]);
        if (!this.moduleExportsCache[namespace]) {
            const res = path.reduce((obj, key) => (obj || {})[key], this.moduleExports);
            this.moduleExportsCache[namespace] = res;
        }
        return this.moduleExportsCache[namespace];
    }

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
    static define = defineModule;

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
    static export(obj = {}, matcher = defaultExportsMatcher) {
        new Matcher(matcher).cache(obj);
    }

    /**
     * 引用平台暴露的对象
     *
     * @ignore
     * @param  {String} namespace
     * @param  {Object} config      通过编译工具注入的相关环境参数
     * @return {var}
     */
    static import<T>(namespace = '', config: Record<string, string | number> | Matcher = defaultExportsMatcher): T { // 用于导入平台接口
        const matchedExports = new Matcher(config).getCache();
        const res = namespace.split('.').reduce((res, key) => (res || {})[key], matchedExports);
        if (res && res instanceof DepResolver) {
            return res.resolve(config);
        }
        return res;
    }
}

if (!(window as any).JModuleManager) {
    (window as any).JModuleManager = JModuleManager;
    patchCreateElement(originCreateElement);
    enableDevtool();
}

export default (window as any).JModuleManager as typeof JModuleManager;
