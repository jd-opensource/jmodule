import { ModuleDebug } from './debug';
import { ResourceMetadata, Resource } from './resource';
import { DepResolver } from './depResolver';
import { ModuleHook } from './hook';
import { Matcher } from './utils/matcher';
import { ModuleOptions, ModuleMetadata, ModuleStatus } from './config';
import manager from './globalManager';
import { LoadOptions } from './types';
import { eventToPromise } from './utils/eventToPromise';

/* 调试模式打印信息：路由变更信息，初始化模块实例、资源实例信息，模块状态变更信息 */

const currentScript = document.currentScript || {};

type HashObject = { [key: string]: any };
const moduleMap: { [key: string]: JModule } = {};
const defaultExportsMatcher = new Matcher({});

const moduleLog = {
    [ModuleStatus.init]: '已创建模块实例',
    [ModuleStatus.initializing]: '正在获取资源列表',
    [ModuleStatus.initialized]: '资源初始化完成',
    [ModuleStatus.initializeFailed]: '资源初始化失败',
    [ModuleStatus.loading]: '正在加载模块资源',
    [ModuleStatus.loaded]: '模块加载完成', // 代码加载并define解析完成，但 define 过程未执行
    [ModuleStatus.loadFailure]: '模块加载或解析失败', // 加载失败或解析 define 失败
    [ModuleStatus.defined]: '解析模块定义', // 初始化了 bootstrap 方法但未执行
    [ModuleStatus.booting]: '正在挂载模块',
    [ModuleStatus.done]: '模块已挂载', // bootstrap/define 过程已完成
    [ModuleStatus.bootFailure]: '挂载模块过程异常', // bootstrap/define 过程中异常
};

const filteredModules: { [moduleKey: string]: string } = {};
const {
    filter,
    debug,
} = manager.getInitialConfig();
const filterModule = (conf: ModuleOptions) => {
    const { key } = conf;
    let errorMsg;
    if (!key || moduleMap[key]) {
        errorMsg = '重复注册或moduleKey未定义';
    }
    if (filter && typeof filter === 'function' && !filter(conf)) {
        errorMsg = '主动过滤';
    }
    if (errorMsg) {
        ModuleDebug.print({ key, message: errorMsg, instance: conf });
        filteredModules[key] = errorMsg;
        return false;
    }
    return true;
};

function watchModuleStatus(this: JModule, resource: Resource) {
    resource.afterApplyScript.catch(() => {
        this.status = ModuleStatus.loadFailure;
    })
    resource.afterApplyScript.then(() => {
        // 对于 auto apply script 的情况，loaded 发生在脚本解析之后，loaded 不会被触发
        if (this.status === ModuleStatus.loading) {
            this.status = ModuleStatus.loaded;
            setTimeout(() => {
                if (this.status === ModuleStatus.loaded) {
                    ModuleDebug.print({
                        type: 'warning',
                        key: this.key,
                        message: 'JModule.define 可能无法正常执行, 请检查子应用资源响应是否正常、是否执行异常、是否能执行JModule.define',
                        instance: this,
                    });
                }
            }, 5000);
        }
    });
}

const urlOriginReg = /^((?:http|https):\/\/[^/]+)(\/.*)?$/g;
/**
 * 从url中解析origin
 * @param  {String} url 需要解析的地址
 * @return {String}     url的origin 信息，包含protocol, domain 和 post
 */
function extractOrigin(url = '') {
    return urlOriginReg.test(url)
        ? url.replace(urlOriginReg, (a, b) => b)
        : '';
}

export type TypeHandler = (module: JModule, options: ModuleMetadata) => ({
    activate: (parentEl: Element) => Promise <void>,
    deactivate: () => Promise <void>,
})

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
export class JModule extends ModuleHook {
    private static _debug?: boolean;
    static id: number;
    type?: string;
    key: string;
    name?: string;
    url: string;
    server?: string;
    autoBootstrap?: boolean;
    isRemoteModule?: boolean;
    domain: string;
    bootstrap?: { (): Promise<JModule> };
    activate?: { (parentEl: Element): Promise<void> };
    deactivate?: { (): Promise<void> };
    resource: Resource;
    metadata:{[key: string]: any};
    hooks: {
        complete: undefined|Promise<JModule>;
    };
    _status!: ModuleStatus;

    /**
     * @constructor
     */
    constructor({
        key, url, server, name, autoBootstrap = true,
        resourceType, resourcePrefix, resource, type,
        resourceLoadStrategy,
        ...others
    }: ModuleOptions) {
        const domain = server || extractOrigin(url);
        const isRemoteModule = domain !== '/';
        super();

        /**
         * 代码加载完成后执行
         * @type {Promise<JModule>}
         */
        this.hooks = { complete: undefined };

        /**
         * 模块类型
         * @type {String}
         */
        this.type = type;
        /**
         * 模块的key属性
         * @type {String}
         */
        this.key = key;
        /**
         * 模块的name属性, 模块名字
         * @type {String}
         */
        this.name = name;
        /**
         * 模块加载地址
         * @type {String<url>}
         */
        this.url = url;
        /**
         * 模块状态
         * @type {ModuleStatus}
         */
        this.status = ModuleStatus.init;
        /**
         * 远程资源服务器
         * @type {String}
         */
        this.server = domain;
        /**
         * 是否为远程模块, 根据url和当前origin计算
         * @deprecated since version 1.1.0
         * @type {Boolean}
         */
        this.isRemoteModule = isRemoteModule;
        /**
         * 远程模块所在域
         * @deprecated since version 1.1.0
         * @type {String}
         */
        this.domain = domain;
        /**
         * 模块资源实例
         * @type {Resource}
         */
        this.resource = resource && resource instanceof Resource
            ? resource
            : new Resource(url, {
                type: resourceType,
                prefix: resourcePrefix,
                strategy: resourceLoadStrategy,
            });
        /**
         * 加载模块后自动运行
         * @type {Boolean}
         */
        this.autoBootstrap = autoBootstrap;
        /**
         * 执行模块初始化函数，当状态变为 defined 之后初始化该值
         * @type {Function}
         */
        this.bootstrap = undefined;

        /**
         * 存放模块初始化时非必须参数
         * @type {any}
         */
        this.metadata = others;

        // 建立资源与 module 之间的状态更新
        watchModuleStatus.bind(this)(this.resource);

        // 登记资源地址 与 moduleKey 之间的映射关系
        manager.mapResourceUrlAndModuleKey(this.resource.url, this.key);

        manager.jmodule(this.key, this);
    }

    set status(status) {
        this._status = status;
        const eventData = { detail: this };
        /* eslint-disable no-nested-ternary */
        ModuleDebug.print({
            type: status !== ModuleStatus.loadFailure
                ? status !== ModuleStatus.loading ? 'success' : 'log' : 'error',
            key: this.key,
            message: moduleLog[status],
            instance: this,
        });
        window.dispatchEvent(new CustomEvent(`module.${this.key}.statusChange`, eventData));
        window.dispatchEvent(new CustomEvent(`module.${this.key}.${status}`, eventData));
    }

    /**
     * 获取模块状态
     * @member
     * @enum {String}
     */
    get status() {
        return this._status;
    }

    /**
     * 设置debug模式，开启后将打印模块注册、加载、解析的全过程信息
     * @example
     * JModule.debug = true;
     */
    static set debug(status: boolean) {
        // eslint-disable-next-line no-underscore-dangle
        JModule._debug = status;
        if (status) {
            ModuleDebug.enable();
        } else {
            ModuleDebug.disable();
        }
    }

    static get debug(): boolean {
        // eslint-disable-next-line no-underscore-dangle
        return JModule._debug || false;
    }

    /**
     * 定义子应用类型的处理逻辑
     * @param  {String} type 子应用类型
     * @param  {TypeHandler} typeHandler 类型处理函数
     */
    static defineType(type: string, typeHandler: TypeHandler) {
        JModule.addHook('afterDefine', (module: JModule, metadata: ModuleMetadata) => {
            if (module.type === type && typeof typeHandler === 'function') {
                const { activate, deactivate } = typeHandler(module, metadata) || {};
                module.activate = activate;
                module.deactivate = deactivate;
            }
            return [module, metadata];
        });
    }


    /**
     * 获取已注册的模块列表
     * @readOnly
     */
    static get registeredModules(): JModule[] {
        return Object.values(moduleMap);
    }

    /**
     * 根据 moduleKey 获取模块实例
     * @static
     * @param  {String} key moduleKey
     * @return {jModuleInstance}
     */
    static getModule(key: string): JModule|undefined {
        return manager.jmodule(key);
    }

    /**
     * 根据 moduleKey 异步获取模块实例
     * @static
     * @param  {String} key moduleKey
     * @return {Promise<jModuleInstance>}
     */
    static async getModuleAsync(key: string, timeout?: number): Promise<JModule> {
        const module = manager.jmodule(key);
        return module ? Promise.resolve(module) : new Promise((resolve, reject) => {
            if (timeout) {
                const timer = setTimeout(() => {
                    clearTimeout(timer);
                    if (!manager.jmodule(key)) {
                        reject(new Error(`find moudle ${key} timeout`));
                    }
                }, timeout);
            }
            function resolverListener() {
                if (manager.jmodule(key)) {
                    window.removeEventListener('module.afterRegister', resolverListener);
                    resolve(manager.jmodule(key));
                }
            }
            window.addEventListener('module.afterRegister', resolverListener);
        });
    }

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
        return manager.require(namespace);
    }

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
    static async registerModules(moduleOptions: ModuleOptions[] = []): Promise<JModule[]> {
        ModuleDebug.print({
            type: 'log',
            key: 'registerModules',
            message: '请求注册模块',
            instance: moduleOptions,
        });
        await ModuleHook.runHook('beforeFilterModules', moduleOptions);
        const results = moduleOptions.filter(filterModule);
        await ModuleHook.runHook('beforeRegisterModules', results);
        const modules = (<ModuleOptions[]>results).map(
            item => (item instanceof JModule ? item : new this(item)),
        );
        modules.forEach((item) => {
            if (!item.key) {
                return;
            }
            moduleMap[item.key] = item;
        });
        window.dispatchEvent(new CustomEvent('module.afterRegister', { detail: modules }));
        await ModuleHook.runHook('afterRegisterModules', modules);
        return modules;
    }

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
    static export(obj = {}, matcher = defaultExportsMatcher) {
        new Matcher(matcher).cache(obj);
        return JModule;
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
    static define = manager.define;

    static applyResource(resourceMetadata: ResourceMetadata, resourceLoaderUrl?: string): Resource {
        const loaderUrl: string|undefined =
            resourceLoaderUrl || (document.currentScript as HTMLScriptElement)?.src;
        if (!loaderUrl) {
            throw new Error('浏览器不支持 document.currentScript');
        }
        // 任意 Resource 执行该函数均等价
        return Resource.setResourceData(resourceMetadata, loaderUrl.replace(/(\?|&)__v__=\d+$/, ''));
    }

    static getMeta() {
        const { src: url, dataset } = <HTMLScriptElement>document.currentScript || {};
        if (!url) {
            return {};
        }
        return {
            url,
            server: new URL(url).origin,
            resourceUrl: dataset.jmoduleFrom,
        };
    }

    /**
     * 引用平台暴露的对象
     *
     * @ignore
     * @param  {String} namespace
     * @param  {Object} config      通过编译工具注入的相关环境参数
     * @return {var}
     */
    static import(namespace = '', config: HashObject|Matcher = defaultExportsMatcher, force = false) { // 用于导入平台接口
        if (namespace === '$module.meta') {
            return this.getMeta();
        }
        
        if (!force && this !== manager.defaultJModule && currentScript) {
            const { dataset } = <HTMLScriptElement>currentScript || {};
            const sourceUrl = dataset?.jmoduleFrom;
            // 从 sourceUrl 找到对应的 module
            const [targetModule] = manager.getModulesByResourceUrl(sourceUrl) || [];
            if (targetModule && targetModule.constructor !== JModule) {
                return targetModule.constructor.import(namespace, config, true);
            }
        }
        const matchedExports = new Matcher(config).getCache();
        const res = namespace.split('.').reduce((res, key) => (res || {})[key], matchedExports);
        if (res && res instanceof DepResolver) {
            return res.resolve(config);
        }
        return res;
    }

    // 向下兼容 cli
    static _import(namespace = '', config = {}) {
        console.warn('JModule._import is deprecated');
        return this.import(namespace, config);
    }

    private setCompleteHook() {
        this.hooks.complete = Promise.race([
            eventToPromise(`module.${this.key}.${ModuleStatus.done}`),
            eventToPromise(`module.${this.key}.${ModuleStatus.loadFailure}`),
            eventToPromise(`module.${this.key}.${ModuleStatus.bootFailure}`),
        ]).then(() => {
            if (this._status !== ModuleStatus.done) {
                throw new Error(moduleLog[this._status]);
            }
            return this;
        });
    }

    /**
     * 加载模块
     * @method
     * @param  {'init'|'preload'|'load'} targetStatus 期望目标，默认 load 向下兼容
     * @param  {Object} options
     * @param  {(element: HTMLElement) => void} options.elementModifier preload 元素修改器
     * @param  {Boolean} options.autoApplyStyle load的同时加载样式
     * @return {Promise}
     */
    async load(
        targetStatus: 'init'|'preload'|'load' = 'load',
        options: LoadOptions = { autoApplyStyle: true },
    ): Promise<Resource|void> {
        const { resource } = this;
        const {
            loading,
            defined,
            booting,
            done,
            loaded,
            initializeFailed,
            loadFailure,
            bootFailure,
        } = ModuleStatus;
        // 已经进入正式 load 状态且未失败, 则等待执行结果, 即已经 load 过了, 下次再执行
        if ([loading, defined, booting, done, loaded].includes(this.status)) {
            if (targetStatus === 'load' && options.autoApplyStyle) {
                resource.applyStyle();
            }
            await (targetStatus !== 'load' ? Promise.resolve() : this.hooks.complete);
            return resource;
        }
        // init: 从初始化到初始化有结果, 任何失败状态重新执行都强制 forceInit
        await resource.init([loadFailure, bootFailure, initializeFailed].includes(this.status));
        // preload: 只要 init 是成功的就可以
        if (targetStatus === 'preload') {
            if (window.requestIdleCallback) {
                window.requestIdleCallback(() => resource.preload(options.elementModifier));
            } else {
                window.setTimeout(() => resource.preload(options.elementModifier), 500);
            }
        }
        // load
        if (targetStatus === 'load') {
            this.status = ModuleStatus.loading;
            this.setCompleteHook();
            resource.applyScript(options.elementModifier);
            if (options.autoApplyStyle) {
                resource.applyStyle(options.elementModifier);
            }
            await this.hooks.complete;
        }
        return resource;
    }
}

JModule.id = manager.registerJModule(JModule);
JModule.debug = debug;
