import { ResourceType, ResourceStatus, ResourceLoadStrategy, ModuleStatus, statusFromResourceToModule } from './config';
import { resolveUrlByFetch } from './utils/fetchCode';
import JModuleManager from './globalManager';
import { ModuleHook } from './hook';
import { wrapperFetchedCodeHook } from './utils/wrapperFetchedCode';
import { resourceTypes } from './utils/resourceResolver';
import { JModule } from './module';
import { elementsToPromise } from './utils/elementsToPromise';
import { timeoutToPromise } from './utils/timeoutToPromise';
import { diffMetadata } from './utils/diffMetadata';
import { ElementModifier } from './types';

function loadScript(
    url: string,
    from: string,
    attributes: Record<string, string>,
    elementModifier?: ElementModifier<HTMLScriptElement>,
): Promise<HTMLScriptElement> {
    const script = document.createElement('script');
    script.setAttribute('src', url); // skip proxy
    script.async = false;
    script.dataset.jmoduleFrom = from;
    Object.keys(attributes || {}).forEach(attr => {
        if (['src', 'async'].includes(attr)) {
            return;
        }
        script.setAttribute(attr, attributes[attr]);
    });
    elementModifier && elementModifier(script);
    document.body.appendChild(script);
    return new Promise((resolve, reject) => {
        script.onerror = () => reject(new Error(`LoadScriptError: ${url}`));
        script.onload = () => resolve(script);
    });
}

function createLink(url: string, from: string, elementModifier?: ElementModifier<HTMLLinkElement>): HTMLLinkElement {
    const styleDom = document.createElement('link');
    styleDom.setAttribute('rel', 'preload');
    styleDom.setAttribute('as', 'style');
    styleDom.setAttribute('href', url);
    styleDom.dataset.jmoduleFrom = from;
    elementModifier && elementModifier(styleDom);
    return styleDom;
}

function patchInitUrl(url: string): string {
    return `${new URL(url, window.location.href)}${url.indexOf('?') > 0 ? '&' : '?'}__v__=${Date.now()}`;
}

const queryReg = /\?.+$/;
function cacheUrlMap(resource: Resource) {
    const { asyncFiles = [] } = resource.metadata || {};
    asyncFiles.forEach(file => {
        const key = file.replace(queryReg, '');
        const targetUrl = resource.resolveUrl(file);
        JModuleManager.setFileMapCache(key, [targetUrl, resource.url]);
        JModuleManager.appendFileList(key);
    });
}

export interface ResourceMetadata {
    js: string[],
    css: string[],
    asyncFiles: string[],
    jsAttributes?: Record<string, any>,
}

/**
 * 创建资源实例的选项接口。
 */
export interface ResourceOptions {
    /**
     * 资源类型。此属性是可选的。
     */
    type?: string,
    /**
     * 资源加载策略。此属性是可选的。
     */
    strategy?: ResourceLoadStrategy,
    /**
     * 初始化超时时间（单位：毫秒）。此属性是可选的。
     */
    initTimeout?: number,
}


const scriptCacheByUrl: { [url: string]: HTMLScriptElement } = {};

/**
 * 资源实例, 负责模块资源的加载以及样式的启用/禁用
 * @class
 * @param {String} 资源地址
 */
export class Resource extends ModuleHook {
    private resolveScript!: (elements: HTMLScriptElement[]) => void;
    private rejectScript!: (error: Error) => void;
    private styleLoading?: Promise<(HTMLLinkElement | HTMLStyleElement)[]>;
    private scriptLoading?: Promise<HTMLScriptElement[]>;
    private appliedScript = false;
    private static asyncFilesMap: { [key: string]: Resource | undefined } = {};
    private resolvedUrlMap: Record<string, string> = {};

    /**
     * 初始化超时的静态默认值，单位毫秒。
     */
    static initTimeout = 10000;
    /**
     * @ignore
     */
    resolveInit?: (metadata: ResourceMetadata) => void;
    /**
     * @ignore
     */
    rejectInit?: (error: Error) => void;
    /**
     * 资源元数据。
     */
    metadata?: ResourceMetadata;
    /**
     * 资源实例索引, 也是资源的元数据的 URL 地址。
     */
    url = '';
    initScriptElement?: HTMLScriptElement;
    styleElements: (HTMLLinkElement|HTMLStyleElement)[] = [];
    appendedAsyncStyleElements?: NodeListOf<Element>;
    scriptElements: HTMLScriptElement[] = [];
    server!: string;
    /**
     * 标记样式是否已经挂载。
     */
    styleMounted = false;
    /**
     * 资源状态，默认为初始化状态。
     */
    status: ResourceStatus = ResourceStatus.Init;
    /**
     * 入口资源类型。
     */
    type!: string;
    /**
     * URL 适配器函数，可以根据资源和源 URL 自定义最终的 URL 地址。
     */
    urlAdapter?: (sourceUrl: string, resource: Resource) => string;
    /**
     * 应用脚本后的 Promise。
     */
    afterApplyScript!: Promise<HTMLScriptElement[]>;
    /**
     * 初始化后的 Promise。
     */
    afterInit?: Promise<void>;
    /**
     * 资源加载策略，默认使用标签方式加载。
     */
    strategy!: ResourceLoadStrategy; // 默认，直接用标签方式加载
    /** @ignore */
    cachedUrlMap: {
        [key: string]: string
    } = {};
    /**
     * 初始化超时时间，单位毫秒。
     */
    initTimeout!: number;

    /**
     * @constructor
     */
    constructor(url: string, options?: ResourceOptions) {
        super();
        if (!url && typeof url !== 'string') {
            throw new Error('创建 Resource 实例异常, 缺少sourceUrl');
        }
        const { href: wholeUrl, origin: server } = new URL(url, window.location.href);
        if (JModuleManager.resource(wholeUrl)) {
            return <Resource>JModuleManager.resource(wholeUrl);
        }
        this.url = wholeUrl;
        this.server = server;
        const type = url.split('.').pop()?.replace(/\?.*$/, '') || '';
        this.type = options?.type || ['js', 'json'].includes(type) ? type : 'auto';
        this.afterApplyScript = new Promise((resolve, reject) => {
            this.resolveScript = resolve;
            this.rejectScript = reject;
        });
        this.strategy = options?.strategy ?? ResourceLoadStrategy.Element;
        this.initTimeout = options?.initTimeout || Resource.initTimeout;
        JModuleManager.resource(this.url, this);
    }

    /**
     * @ignore
     * @deprecated
     */
    static enableAsyncChunk() {
        console.warn('Resource.enableAsyncChunk() is deprecated, just remove it');
    }

    /**
     * @ignore
     * @deprecated
     */
    static getResource(sourceUrl?: string): Resource | void {
        console.warn('Resource.getResource() is deprecated, use JModuleManager.getInstance() instead');
        return sourceUrl ? JModuleManager.resource(sourceUrl) : undefined;
    }

    /**
     * @ignore
     * @deprecated
     */
    static getTrueResourceUrl(url: string): { resource: Resource, filepath: string } | void {
        let resource: Resource | undefined;
        let filepath: string | undefined;
        Object.keys(Resource.asyncFilesMap).some(file => {
            if (url.includes(file)) {
                resource = Resource.asyncFilesMap[file];
                filepath = file;
                return true;
            }
        });
        return resource && filepath ? { resource, filepath } : undefined;
    }

    /** 根据 resourceUrl 查找 resource 并设置资源清单 */
    static setResourceData(metadata: ResourceMetadata, resourceUrl: string): Resource {
        const resource: Resource | undefined = JModuleManager.resource(resourceUrl);
        if (!resource) {
            throw new Error(`未找到${resourceUrl}对应的 resource 实例`);
        }
        if (resource.metadata && diffMetadata(resource.metadata, metadata)) {
            Resource.runHookSync('resource:upgrade', resource);
            // reset style
            resource.resetStyleStatus();
        }
        resource.resolveInit?.(metadata);
        return resource;
    }

    /** 扩展入口资源类型 */
    static defineType(type: string, typeHandler: (resource: Resource, defaultUrl: string) => Promise<string>) {
        Resource.addHook('resource:resolveEntry', async (resource: Resource, defaultUrl: string) => {
            if (resource.type === type && typeof typeHandler === 'function') {
                return [resource, await typeHandler(resource, defaultUrl)]
            }
            return [resource, defaultUrl];
        });
    }

    private prepareInit() {
        if (this.status === ResourceStatus.Initializing && this.rejectInit) {
            this.rejectInit(new Error('ResourceInit:Aborted'));
        }
        this.setStatus(ResourceStatus.Initializing);
        this.afterInit = new Promise((resolve, reject) => {
            this.resolveInit = (metadata: ResourceMetadata) => {
                if (this.status !== ResourceStatus.Initializing) {
                    return;
                }
                this.metadata = metadata;
                this.setStatus(ResourceStatus.Initialized);
                resolve();
            };
            this.rejectInit = (error: Error) => {
                this.setStatus(ResourceStatus.InitializeFailed);
                console.error(`${this.url}加载失败: ${error.message}`);
                reject(error);
            };
        });
    }

    /** 加载资源清单数据, 默认(forceInit = false)不重复执行 */
    async init(forceInit = false) {
        if (this.status === ResourceStatus.Initializing) {
            return this.afterInit;
        }
        if (this.afterInit && !forceInit) {
            return this.afterInit;
        }
        this.prepareInit();
        try {
            const [, url] = await Resource.runHook('resource:resolveEntry', this, patchInitUrl(this.url));
            await loadScript(url, this.url, {}, (script) => {
                script.async = true;
                this.initScriptElement = script;
                scriptCacheByUrl[this.url] = script;
            });
            await Promise.race([
                timeoutToPromise(this.initTimeout, new Error('ResourceInit:Timeout')),
                this.afterInit,
            ]);
        } catch (e) {
            this.rejectInit?.(e as Error);
            throw e;
        }
    }

    /**
     * 加载资源时转换资源地址
     * @return {string}
     */
    resolveUrl(url: string) {
        let resolvedUrl = url;
        try {
            if (url.startsWith('X_WEBPACK_SERVER')) {
                console.warn('X_WEBPACK_SERVER 已废弃, 下个版本将弃用');
                if (this.metadata?.asyncFiles) {
                    // 新版：相对路径
                    url = url.replace(/^X_WEBPACK_SERVER\/?/, '');
                } else { // 旧版：绝对路径
                    url = url.replace(/^X_WEBPACK_SERVER/, '');
                }
            }
            if (this.urlAdapter) {
                resolvedUrl = this.urlAdapter(url, this);
            } else {
                resolvedUrl = new URL(url, this.url).href;
            }
        } catch (e) {
            // ignore error: 浏览器不支持或者 参数异常
        }
        this.resolvedUrlMap[resolvedUrl] = url;
        return resolvedUrl;
    }

    /**
     * 设置Resource实例的状态, 同时触发Resource实例关联的所有JModule实例的状态改变
     * @fires window#resource.[moduleKey].statusChange
     */
    setStatus(status: ResourceStatus) {
        if (this.status === status) {
            return;
        }
        this.status = status;
        const modules = JModuleManager.getModulesByResourceUrl(this.url);
        modules.forEach((module: JModule) => {
            // 映射状态到模块
            if (status in statusFromResourceToModule) {
                module.status = statusFromResourceToModule[status as keyof typeof statusFromResourceToModule] as ModuleStatus;
            }
            window.dispatchEvent(new CustomEvent(`resource.${module.key}.statusChange`, {
                detail: this,
            }));
        });
    }

    /** 加载模块的脚本资源 */
    async applyScript(elementModifier?: ElementModifier<HTMLScriptElement>): Promise<HTMLScriptElement[]> {
        if (!this.metadata) {
            return Promise.reject(new Error(`no resource metadata: ${this.url}`));
        }
        if (this.appliedScript) {
            return Promise.resolve(this.scriptElements);
        }
        if (this.scriptLoading) {
            return this.scriptLoading;
        }
        this.setStatus(ResourceStatus.ApplyScript);
        this.scriptElements = [];
        const jsAttributes = (this.metadata.js || []).map(url => this.metadata?.jsAttributes?.[url]);
        const jsUrls = (this.metadata.js || []).map(url => this.resolveUrl(url));
        const getEntryUrls = async () => this.strategy === ResourceLoadStrategy.Fetch
            ? await Promise.all(jsUrls.map(url => resolveUrlByFetch(
                url,
                this.url,
                ResourceType.Script,
            )))
            : (cacheUrlMap(this), jsUrls);
        this.scriptLoading = getEntryUrls().then((entryUrls) => Promise.all(entryUrls.map((url, index) => loadScript(
            url,
            this.url,
            jsAttributes[index],
            elementModifier,
        )))).then((scripts) => {
            this.setStatus(ResourceStatus.ScriptResolved);
            this.resolveScript(scripts);
            this.scriptElements = scripts;
            this.appliedScript = true;
            return this.scriptElements;
        }).catch((error) => {
            this.setStatus(ResourceStatus.ScriptError);
            this.scriptLoading = undefined;
            this.rejectScript(error);
            throw error;
        });
        return this.scriptLoading;
    }

    /** 加载/启用模块的样式资源 */
    async applyStyle(elementModifier?: ElementModifier<HTMLLinkElement>): Promise<(HTMLLinkElement | HTMLStyleElement)[]> {
        if (!this.metadata) {
            return Promise.reject(new Error('no resource metadata'));
        }
        const { css = [] } = this.metadata;
        const { length } = this.styleElements;
        if (!this.styleLoading) {
            this.setStatus(ResourceStatus.ApplyStyle);
            if (css.length !== length) {
                const cssUrls = (this.metadata.css || []).map(url => this.resolveUrl(url));
                const entryUrls = await (async () => this.strategy === ResourceLoadStrategy.Fetch
                    ? await Promise.all(cssUrls.map(url => resolveUrlByFetch(
                        url,
                        this.url,
                        ResourceType.Style,
                    )))
                    : cssUrls)();
                this.styleElements = entryUrls.map(url => createLink(url, this.url, elementModifier));
            }
            const styleDefer = elementsToPromise(
                this.styleElements,
                el => document.head.appendChild(el),
                el => el.setAttribute('rel', 'stylesheet'),
            );
            this.appendedAsyncStyleElements?.forEach(item => document.head.appendChild(item));
            this.styleMounted = true;
            this.styleLoading = styleDefer.then((res) => {
                this.setStatus(ResourceStatus.StyleResolved);
                if (res.errors.length) {
                    this.setStatus(ResourceStatus.StyleError);
                    console.error(res.errors);
                }
                return res.results;
            });
        }
        if (this.status === ResourceStatus.StyleDisabled) {
            this.setStyleStatus('enabled');
        }
        return this.styleLoading;
    }

    /** 判断制定 url 是否为 esm 模块 */
    isESM(url: string) {
        const originUrl = this.resolvedUrlMap[url] || url;
        const attrs = this.metadata?.jsAttributes?.[originUrl];
        if (attrs) {
            return attrs.type === 'module';
        }
        // 用于由 wrapperFetchedCodeHook 处理过的脚本动态创建的 esm script 判断
        return !!document.querySelector(`script[type="module"][data-src-raw="${url}"]`);
    } 

    /** 预加载资源 */
    preload(elementModifier?: ElementModifier<HTMLLinkElement>) {
        if (!this.metadata) {
            throw new Error('no resource metadata');
        }
        if (this.status === ResourceStatus.Preloading) {
            return;
        }
        this.setStatus(ResourceStatus.Preloading);
        const { css = [], js = [] } = this.metadata;
        const defers = [
            { type: 'script', urls: js },
            { type: 'style', urls: css },
        ].map(({ type, urls }) => {
            const defers = urls.map(url => {
                const targetUrl = this.resolveUrl(url);
                if (this.strategy === ResourceLoadStrategy.Fetch) {
                    const resourceType = type === 'script' ? ResourceType.Script : ResourceType.Style;
                    return resolveUrlByFetch(targetUrl, this.url, resourceType).then(resUrl => {
                        this.cachedUrlMap[targetUrl] = resUrl;
                    });
                } else {
                    return new Promise((resolve, reject) => {
                        const preloadLink = document.createElement("link");
                        preloadLink.setAttribute('href', targetUrl);
                        preloadLink.rel = "preload";
                        preloadLink.as = type;
                        preloadLink.onload = resolve;
                        preloadLink.onerror = reject;
                        document.head.appendChild((elementModifier?.(preloadLink), preloadLink));
                    });
                }
            });
            return Promise.all(defers);
        });
        Promise.all(defers).then(() => {
            this.setStatus(ResourceStatus.Preloaded);
        }).catch(() => {
            this.setStatus(ResourceStatus.PreloadFailed);
        });
        return;
    }

    /**
     * 移除样式
     */
    removeStyle() {
        // 幂等函数
        // 如果没有执行 applyStyle, 或已经执行过 removeStyle 则不执行.
        if (!this.styleLoading) {
            return;
        }
        this.setStatus(ResourceStatus.StyleRemoveBefore);
        // 同步的 link
        (this.styleElements || []).forEach(item => item.remove());
        // 异步组件创建的 link
        const asyncLinks = document.querySelectorAll(`link[data-jmodule-from="${this.url}"], style[data-jmodule-from="${this.url}"]`);
        asyncLinks.forEach(item => item.remove());
        this.appendedAsyncStyleElements = asyncLinks;
        this.styleMounted = false;
        this.styleLoading = undefined;
        this.setStatus(ResourceStatus.StyleRemoved);
    }

    /**
     * 禁用/启用样式
     */
    setStyleStatus(status: 'enabled'|'disabled') {
        const disabled = status === 'disabled';
        const allStyles = [
            ...(this.styleElements || []),
            ...(this.appendedAsyncStyleElements || [])
        ];
        [...document.styleSheets].forEach((styleSheet) => {
            if (allStyles.includes(styleSheet.ownerNode as Element)) {
                styleSheet.disabled = disabled;
            }
        });
        this.setStatus(disabled ? ResourceStatus.StyleDisabled : ResourceStatus.StyleEnabled);
    }

    /**
     * 重置样式状态
     */
    resetStyleStatus() {
        this.styleLoading = undefined;
        this.styleMounted = false;
        this.styleElements = [];
        this.appendedAsyncStyleElements = undefined;
    }

    /**
     * 销毁资源实例
     */
    destroy() {
        this.removeStyle(); // 移除样式
        this.initScriptElement = undefined;
        this.scriptElements = [];
        this.styleElements = []; // 解除对DOM的引用关系
        JModuleManager.resource(this.url, null);
    }
}

Resource.addHook('resource:transformFetchResult', wrapperFetchedCodeHook);
resourceTypes.forEach(([type, typeHandler]) => {
    Resource.defineType(type, typeHandler);
});

