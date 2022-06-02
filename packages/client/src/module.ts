import { ModuleDebug } from './debug';
import { ResourceMetadata, Resource } from './resource';
import { DepResolver } from './depResolver';
import { ModuleHook } from './hook';
import { Matcher } from './utils/matcher';

/* eslint no-underscore-dangle: ["error", { "allowAfterThis": true }] */
/* eslint-disable no-eval */

/* 调试模式打印信息：路由变更信息，初始化模块实例、资源实例信息，模块状态变更信息 */

export interface ModuleOptions {
    type?: string,
    key: string,
    name: string,
    url: string,
    server?: string,
    autoBootstrap?: boolean,
    resourceType?: string,
    resourcePrefix?: string,
    resource?: Resource,
}

export interface ModuleMetadata {
    key?: string,
    init(module: JModule): void,
    imports?: string[],
    exports?: { [key: string]: any },
}

function define(moduleKey: string, metadata: ModuleMetadata): Promise<JModule>;
function define(metadata: ModuleMetadata): Promise<JModule>;
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
    return getAndCheckModule(localKey).then((module) => {
        module.bootstrap = () => {
            module.status = MODULE_STATUS.booting;
            let defer = Promise.resolve()
                .then(() => initModule(module, localMetadata))
                .then((res) => {
                    module.status = MODULE_STATUS.done; // 初始化完成
                    return res;
                })
                .catch((err) => {
                    module.status = MODULE_STATUS.bootFailure;
                    throw err;
                });
            module.bootstrap = () => defer; // 重写bootstrap, 避免重复执行
            return defer;
        }
        // 模块状态：已定义
        module.status = MODULE_STATUS.defined;
        if (module.autoBootstrap) {
            return module.bootstrap();
        }
        return module;
    });
}

type HashObject = { [key: string]: any };
const moduleMap: { [key: string]: JModule } = {};
const moduleExports: HashObject = {};
const defaultExportsMatcher = new Matcher({});
const moduleCache: { [namespace: string]: any } = {}; // 缓存require的模块

export enum MODULE_STATUS {
    bootFailure = -2,
    loadFailure = -1,
    inited = 0,
    loading = 1,
    loaded = 2,
    defined = 3,
    booting = 4,
    done = 5,
    resourceInited = 6,
};
const moduleLog = {
    [MODULE_STATUS.inited]: '已创建模块实例',
    [MODULE_STATUS.loading]: '正在加载模块资源',
    [MODULE_STATUS.loaded]: '模块加载完成', // 代码加载并define解析完成，但 define 过程未执行
    [MODULE_STATUS.loadFailure]: '模块加载或解析失败', // 加载失败或解析 define 失败
    [MODULE_STATUS.defined]: '解析模块定义', // 初始化了 bootstrap 方法但未执行
    [MODULE_STATUS.booting]: '正在挂载模块',
    [MODULE_STATUS.done]: '模块已挂载', // bootstrap/define 过程已完成
    [MODULE_STATUS.bootFailure]: '挂载模块过程异常', // bootstrap/define 过程中异常
    [MODULE_STATUS.resourceInited]: '资源初始化完成',
};

interface ResolveModule { (moduleKey: string): Promise<ModuleOptions> };
const filteredModules: { [moduleKey: string]: string } = {};
const {
    filter,
    resolveModule,
    debug,
    // @ts-ignore: JModule.config detect
} = (window.JModule || {}).config || {};
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

async function getAndCheckModule(key: string): Promise<JModule> {
    const module = moduleMap[key];
    if (module) {
        return Promise.resolve(module);
    }
    if (typeof resolveModule !== 'function') {
        return Promise.reject(new Error(`${key}:模块未注册`));
    }
    return (<ResolveModule>resolveModule)(key).then(async (moduleConf) => {
        /* eslint-disable no-use-before-define */
        const [tempModule] = await JModule.registerModules([moduleConf]);
        if (tempModule) {
            return Promise.resolve(<JModule>tempModule);
        } else {
            return Promise.reject(new Error(`${key}: 注册失败，原因：${filteredModules[key]}`));
        }
    });
}
async function initModule(module: JModule, pkg: ModuleMetadata): Promise<JModule> {
    const { key } = module;
    ModuleDebug.print({ key, message: '开始执行初始化函数', instance: pkg });
    try {
        // module init
        await ModuleHook.runHook('beforeInit', module, pkg);
        if (typeof pkg.init === 'function') {
            ModuleDebug.printContinue('执行 init 函数');
            await pkg.init(module);
        }
        await ModuleHook.runHook('afterInit', module, pkg);

        // imports
        await ModuleHook.runHook('beforeImports', module, pkg);
        (pkg.imports || []).forEach((moduleKey: string) => {
            ModuleDebug.printContinue('加载依赖模块');
            getAndCheckModule(moduleKey).then(item => item.load());
        });
        await ModuleHook.runHook('afterImports', module, pkg);

        // exports
        await ModuleHook.runHook('beforeExports', module, pkg);
        Object.assign(moduleExports, { [key]: pkg.exports });
        await ModuleHook.runHook('afterExports', module, pkg);

        return module;
    } catch(e) {
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

function watchModuleStatus(this: JModule, resource: Resource) {
    resource.afterInit.catch((e) => {
        this.status = MODULE_STATUS.loadFailure;
    });
    resource.afterApplyScript.catch((e) => {
        this.status = MODULE_STATUS.loadFailure;
    })
    resource.afterApplyScript.then(() => {
        // 对于 auto apply script 的情况，loaded 发生在脚本解析之后，loaded 不会被触发
        if (this.status === MODULE_STATUS.loading) {
            this.status = MODULE_STATUS.loaded;
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

type ModuleResolver = (value: JModule) => void;

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
    private completeResolver!: {
        resolve: ModuleResolver,
        reject: () => void,
    };

    type?: string;
    key: string;
    name: string;
    url: string;
    server?: string;
    autoBootstrap?: boolean;
    isRemoteModule?: boolean;
    domain: string;
    bootstrap?: { (): Promise<JModule> };
    resource: Resource;
    metadata?:{[key: string]: any};
    hooks: {
        complete: Promise<JModule>;
    };
    _status!: MODULE_STATUS;

    /**
     * @constructor
     */
    constructor({
        key, url, server, name, autoBootstrap = true,
        resourceType, resourcePrefix, resource, type,
        ...others
    }: ModuleOptions) {
        const domain = server || extractOrigin(url);
        const isRemoteModule = domain !== '/';
        super();

        const complete = new Promise((resolve: ModuleResolver, reject) => {
            this.completeResolver = {
                resolve,
                reject,
            };
        });
        /**
         * 代码加载完成后执行
         * @type {Promise<JModule>}
         */
        this.hooks = { complete };

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
        this.status = MODULE_STATUS.inited;
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

        watchModuleStatus.bind(this, this.resource);
    }

    set status(status) {
        this._status = status;
        const self = this;
        const eventData = { detail: self };
        /* eslint-disable no-nested-ternary */
        ModuleDebug.print({
            type: status !== MODULE_STATUS.loadFailure
                ? status !== MODULE_STATUS.loading ? 'success' : 'log' : 'error',
            key: self.key,
            message: moduleLog[status],
            instance: self,
        });
        window.dispatchEvent(new CustomEvent(`module.${self.key}.statusChange`, eventData));
        window.dispatchEvent(new CustomEvent(`module.${self.key}.${self.status}`, eventData));
        const { done, loadFailure, bootFailure } = MODULE_STATUS;
        if (status === done) {
            this.completeResolver.resolve(this);
        }
        if ([loadFailure, bootFailure].indexOf(status) > -1) {
            this.completeResolver.reject();
        }
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
        JModule._debug = status;
        if (status) {
            ModuleDebug.enable();
        } else {
            ModuleDebug.disable();
        }
    }

    static get debug(): boolean {
        return JModule._debug || false;
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
    static getModule(key: string): JModule {
        return moduleMap[key];
    }

    /**
     * 根据 moduleKey 异步获取模块实例
     * @static
     * @param  {String} key moduleKey
     * @return {Promise<jModuleInstance>}
     */
    static async getModuleAsync(key: string, timeout: number): Promise<JModule> {
        const module = JModule.getModule(key);
        return module ? Promise.resolve(module) : new Promise((resolve, reject) => {
            if (timeout) {
                const timer = setTimeout(() => {
                    clearTimeout(timer);
                    if (!JModule.getModule(key)) {
                        reject(new Error(`find moudle ${key} timeout`));
                    }
                }, timeout);
            }
            function resolverListener() {
                if (JModule.getModule(key)) {
                    window.removeEventListener('module.afterRegister', resolverListener);
                    resolve(JModule.getModule(key));
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
    static require(namespace: string): Promise<any> {
        if (moduleCache[namespace]) {
            return Promise.resolve(moduleCache[namespace]);
        }
        const path = namespace.split('.');
        return new Promise((resolve) => {
            const moduleName = path[0];
            const module = moduleMap[moduleName];
            if (module && module.status === MODULE_STATUS.done) {
                resolve(null);
            } else {
                window.addEventListener(`module.${moduleName}.${MODULE_STATUS.done}`, resolve);
            }
        }).then(() => {
            const res = path.reduce((obj, key) => (obj || {})[key], moduleExports);
            moduleCache[namespace] = res;
            return res;
        });
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
    static define = define;

    static applyResource(resourceMetadata: ResourceMetadata, resourceLoaderUrl?: string): Resource {
        const loaderUrl: string|undefined =
            resourceLoaderUrl || (document.currentScript as HTMLScriptElement)?.src;
        if (!loaderUrl) {
            throw new Error('浏览器不支持 document.currentScript');
        }
        return Resource.setResourceData(resourceMetadata, loaderUrl.replace(/(\?|&)__v__=\d+$/, ''));
    }

    /**
     * 引用平台暴露的对象
     *
     * @ignore
     * @param  {String} namespace
     * @param  {Object} config      通过编译工具注入的相关环境参数
     * @return {var}
     */
    static import(namespace = '', config: HashObject|Matcher = defaultExportsMatcher) { // 用于导入平台接口
        if (namespace === '$module.meta') {
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
        if (this.status < MODULE_STATUS.loading) {
            this.status = MODULE_STATUS.loading;
            resource.init();
        }
        await resource.afterInit;
        if (targetStatus === 'preload') {
            resource.preload(options.elementModifier);
        }
        if (targetStatus === 'load') {
            resource.applyScript(options.elementModifier);
            if (options.autoApplyStyle) {
                resource.applyStyle(options.elementModifier);
            }
        }
        return resource;
    }
}
JModule.debug = debug;
