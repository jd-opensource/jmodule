import { ModuleDebug } from './debug';
import { ResourceMetadata, Resource } from './resource';
import { DepResolver } from './depResolver';
import { ModuleHook } from './hook';
import { Matcher } from './utils/matcher';
import { ModuleOptions, ModuleMetadata, ModuleStatus } from './config';
import manager from './globalManager';
import { ElementModifier, LoadOptions } from './types';
import { eventToPromise } from './utils/eventToPromise';

/* 调试模式打印信息：路由变更信息，初始化模块实例、资源实例信息，模块状态变更信息 */

const getCurrentUrl = () => {
    // 指向执行时脚本
    return (document.currentScript as HTMLScriptElement)?.src || import.meta?.url || '';
}

// 指向解析时脚本
const currentScript = document.currentScript;
const moduleMap: { [key: string]: JModule } = {};

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

export type DeactivateHandler = () => void | Promise<void>;
export type ActivateHandler = (parentEl: Element) => void | Promise<void> | DeactivateHandler;
export type TypeHandler = (module: JModule, options: ModuleMetadata) => ({
    activate: ActivateHandler,
    deactivate: DeactivateHandler,
})

/**
 * JModule 实例
 * @class
 */
export class JModule extends ModuleHook {
    private static _debug?: boolean;
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
    bootstrap?: { (): Promise<JModule> };
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
    metadata:{[key: string]: any};
    /**
     * 模块内置的 hooks 信息, 仅支持 hooks.complete
     * @example
     * await module.hooks.complete
     */
    hooks: {
        complete: undefined|Promise<JModule>;
    };
    /**@ignore */
    _status!: ModuleStatus;

    /**
     * @constructor
     * @example
     * new JModule({
     *     key: 'pipeline',
     *     url: 'http://localhost:8080/modules/pipeline/index.json',
     * });
     */
    constructor({
        key, url, server, name, autoBootstrap = true,
        resourceType, resource, type,
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
        this.type = type;
        this.key = key;
        this.name = name;
        this.url = url;
        this.status = ModuleStatus.init;
        this.server = domain;
        this.isRemoteModule = isRemoteModule;
        this.domain = domain;
        this.resource = resource && resource instanceof Resource
            ? resource
            : new Resource(url, {
                type: resourceType,
                strategy: resourceLoadStrategy,
            });
        this.autoBootstrap = autoBootstrap;
        this.bootstrap = undefined;
        this.metadata = others;

        // 登记资源地址 与 moduleKey 之间的映射关系
        manager.mapResourceUrlAndModuleKey(this.resource.url, this.key);
        manager.jmodule(this.key, this);
    }

    /**
     * 设置模块状态, 更新后会自动触发 `module.${this.key}.statusChange`事件
     */
    set status(status: ModuleStatus) {
        if (status === ModuleStatus.loaded && this._status !== ModuleStatus.loading) {
            return; // 异常状态事件
        }
        this._status = status;
        if (status === ModuleStatus.loaded) {
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
     * @enum {ModuleStatus}
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
     * @return {JModule|undefined}
     */
    static getModule(key: string): JModule|undefined {
        return manager.jmodule(key);
    }

    /**
     * 根据 moduleKey 异步获取模块实例
     * @static
     * @param  {String} key moduleKey
     * @return {Promise<JModule>}
     */
    static async getModuleAsync(key: string, timeout?: number): Promise<JModule> {
        const module = manager.jmodule(key);
        return module ? Promise.resolve(module) : new Promise((resolve, reject) => {
            if (timeout) {
                const timer = setTimeout(() => {
                    clearTimeout(timer);
                    if (!manager.jmodule(key)) {
                        reject(new Error(`Timeout:getModuleAsync('${key}', ${timeout})`));
                    }
                }, timeout);
            }
            function resolverListener() {
                if (manager.jmodule(key)) {
                    window.removeEventListener('module.afterRegister', resolverListener);
                    resolve(manager.jmodule(key) as JModule);
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
    static export(obj = {}, matcher = {}) {
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
     *     init(module) {
     *         console.log(module); 
     *     },
     *     imports: [],
     *     exports: {},
     * });
     */
    static define = manager.define;

    /**
     * 根据 resourceLoaderUrl 设置资源
     * 当 resourceLoaderUrl 为空时, 该函数只能在 resource.url 文件对应的脚本中执行
     * 
     * @param { ResourceMetadata } resourceMetadata 资源元数据
     * @param { string|undefined } resourceLoaderUrl 加载资源的初始脚本地址, 默认为执行当前函数的脚本文件
     * @returns { Resource }
     */
    static applyResource(resourceMetadata: ResourceMetadata, resourceLoaderUrl?: string): Resource {
        const loaderUrl: string | undefined = resourceLoaderUrl || getCurrentUrl();
        if (!loaderUrl) {
            throw new Error('JModule.applyResource 执行异常: 无法找到脚本加载源并关联到对应的资源实例');
        }
        // 任意 Resource 执行该函数均等价
        return Resource.setResourceData(resourceMetadata, loaderUrl.replace(/(\?|&)__v__=\d+$/, ''));
    }

    /**
     * @ignore 
     * @deprecated
     */
    static getMeta() {
        const url = getCurrentUrl();
        if (!url) {
            return {};
        }
        return {
            url,
            server: new URL(url).origin,
        };
    }

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
    static import<T>(namespace = '', config: Record<string, string|number> = {}, force = false): T|{
        url?: string,
        server?: string,
    } { // 用于导入平台接口
        if (namespace === '$module.meta') {
            return this.getMeta();
        }
        if (!force && this !== manager.defaultJModule && currentScript) {
            const { dataset } = <HTMLScriptElement>currentScript;
            const sourceUrl = dataset?.jmoduleFrom || '';
            // 从 sourceUrl 找到对应的 module
            const [targetModule] = manager.getModulesByResourceUrl(sourceUrl) || [];
            if (targetModule && targetModule.constructor !== JModule) {
                return (targetModule.constructor as typeof JModule).import(namespace, config, true);
            }
            // 回退到默认JModule执行
            // esm 模块目前无法读取 scriptElement, 也会回退到这里
            return this.import(namespace, config, true);
        }
        const matchedExports = new Matcher(config).getCache();
        const res = namespace.split('.').reduce((res, key) => (res || {})[key], matchedExports);
        if (!res && this !== manager.defaultJModule) {
            // 如果无法正确找到共享数据, 回退到默认JModule执行
            return manager.import(namespace, config);
        }
        if (res && res instanceof DepResolver) {
            return res.resolve(config);
        }
        return res;
    }

    // 兼容以前的 cli 工具
    /**@ignore */
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
     * @async
     * @method
     * @param  {'init'|'preload'|'load'} [targetStatus='load'] - 期望达到的目标状态，默认为 'load'，向下兼容。
     * @param  {LoadOptions<HTMLScriptElement|HTMLLinkElement>} [options={ autoApplyStyle: true }] - 选项参数。
     * @return {Promise<Resource|void>} - 返回一个承诺，该承诺在模块加载完成时解决。
     */
    async load(
        targetStatus: 'init'|'preload'|'load' = 'load',
        options: LoadOptions<HTMLScriptElement|HTMLLinkElement> = { autoApplyStyle: true },
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
            resource.applyScript(options.elementModifier as ElementModifier<HTMLScriptElement>);
            if (options.autoApplyStyle) {
                resource.applyStyle(options.elementModifier);
            }
            try {
                await this.hooks.complete;
            } catch(e) {
                // js 执行失败时, 应用的样式也没有意义, 移除为后续加载做准备
                resource.removeStyle();
                resource.resetStyleStatus();
                throw e;
            }
        }
        return resource;
    }
}

JModule.id = manager.registerJModule(JModule);
JModule.debug = debug;
