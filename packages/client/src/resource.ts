import { ResourceType, ResourceStatus, ResourceLoadStrategy, ModuleStatus, statusFromResourceToModule } from './config';
import { resolveUrlByFetch } from './utils/fetchCode';
import JModuleManager from './globalManager';
import { ModuleHook } from './hook';
import { wrapperFetchedCodeHook } from './utils/wrapperFetchedCode';
import { resourceTypes } from './utils/resourceResolver';
import manager from './globalManager';
import { JModule } from './module';
import { elementsToPromise } from './utils/elementsToPromise';
import { timeoutToPromise } from './utils/timeoutToPromise';
import { diffMetadata } from './utils/diffMetadata';
import { ElementModifier } from './types';

function injectElementModifier(
    element: HTMLElement,
    elementModifier?: (element: HTMLElement) => void
): HTMLElement {
    if (elementModifier && typeof elementModifier === 'function') {
        elementModifier(element);
    }
    return element;
}
function loadScript(
    url: string,
    from: string,
    attributes: Record<string, string>,
    elementModifier?: (script: HTMLScriptElement) => void,
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

function createLink(url: string, from: string, elementModifier?: (element: HTMLElement) => void): HTMLLinkElement {
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

function cacheUrlMap(metadata: ResourceMetadata, sourceUrl: string, prefix?: string) {
    const { asyncFiles = [] } = metadata;
    asyncFiles.forEach(file => {
        const key = file.replace(queryReg, '');
        const targetUrl = resolveUrl(file, sourceUrl, metadata, prefix);
        manager.setFileMapCache(key, [targetUrl, sourceUrl]);
        manager.appendFileList(key);
    });
}

function resolveUrl(url: string, sourceUrl: string, metadata?: ResourceMetadata, prefix?: string): string {
    try {
        if (url.startsWith('X_WEBPACK_SERVER')) {
            console.warn('X_WEBPACK_SERVER 已废弃, 下个版本将弃用');
            if (metadata?.asyncFiles) {
                // 新版：相对路径
                url = url.replace(/^X_WEBPACK_SERVER\/?/, '');
            } else { // 旧版：绝对路径
                url = url.replace(/^X_WEBPACK_SERVER/, '');
            }
        }
        if (!prefix) {
            return new URL(url, sourceUrl).href;
        }
        return `${prefix}${url}`;
    } catch (e) {
        // ignore error: 浏览器不支持（IE）或者 参数异常
        return url;
    }
}

export interface ResourceMetadata {
    js: string[],
    css: string[],
    asyncFiles: string[],
    jsAttributes?: Record<string, any>,
}

export interface ResourceOptions {
    type?: string,
    prefix?: string,
    strategy?: ResourceLoadStrategy,
    initTimeout?: number,
}


const scriptCacheByUrl: { [url: string]: HTMLScriptElement } = {};

/**
 * 基于URL的资源管理，与模块无关
 * @class
 * @param {String<url>} 资源地址
 */
export class Resource extends ModuleHook {
    private resolveScript!: (elements: HTMLScriptElement[]) => void;
    private rejectScript!: (error: Error) => void;
    private styleLoading?: Promise<HTMLLinkElement[]>;
    private scriptLoading?: Promise<HTMLScriptElement[]>;
    private appliedScript = false;
    private static asyncFilesMap: { [key: string]: Resource | undefined } = {};
    private resolvedUrlMap: Record<string, string> = {};

    static initTimeout = 10000;
    resolveInit?: (metadata: ResourceMetadata) => void;
    rejectInit?: (error: Error) => void;
    metadata?: ResourceMetadata;
    url = '';
    initScriptElement?: HTMLScriptElement;
    styleElements: HTMLLinkElement[] = [];
    appendedAsyncStyleElements?: NodeListOf<Element>;
    scriptElements: HTMLScriptElement[] = [];
    server!: string;
    styleMounted = false;
    status: ResourceStatus = ResourceStatus.Init;
    type!: string; // 入口资源类型
    prefix?: string;
    afterApplyScript!: Promise<HTMLScriptElement[]>;
    afterInit?: Promise<void>;
    strategy!: ResourceLoadStrategy; // 默认，直接用标签方式加载
    cachedUrlMap: {
        [key: string]: string
    } = {};
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
        this.type = (options?.type || url.split('.').pop() || 'js').replace(/\?.*$/, '');
        this.prefix = options?.prefix?.replace('[resourceOrigin]', this.server);
        this.afterApplyScript = new Promise((resolve, reject) => {
            this.resolveScript = resolve;
            this.rejectScript = reject;
        });
        this.strategy = options?.strategy ?? ResourceLoadStrategy.Element;
        this.initTimeout = options?.initTimeout || Resource.initTimeout;
        JModuleManager.resource(this.url, this);
    }

    static enableAsyncChunk() {
        console.warn('Resource.enableAsyncChunk() is deprecated, just remove it');
    }

    static getResource(sourceUrl?: string): Resource | void {
        console.warn('Resource.getResource() is deprecated, use JModuleManager.getInstance() instead');
        return sourceUrl ? JModuleManager.resource(sourceUrl) : undefined;
    }

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

    static setResourceData(metadata: ResourceMetadata, sourceUrl: string): Resource {
        const resource: Resource|undefined = JModuleManager.resource(sourceUrl);
        if (!resource) {
            throw new Error(`未找到${sourceUrl}对应的 resource 实例`);
        }
        if (resource.metadata && diffMetadata(resource.metadata, metadata)) {
            Resource.runHookSync('resource:upgrade', resource);
            // reset style
            resource.resetStyleStatus();
        }
        resource.resolveInit?.(metadata);
        return resource;
    }

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

    // 加载资源元数据, 默认不重复执行
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

    resolveUrl(url: string) {
        const resolvedUrl = resolveUrl(url, this.url, this.metadata, this.prefix);
        this.resolvedUrlMap[resolvedUrl] = url;
        return resolvedUrl;
    }

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

    async applyScript(elementModifier?: ElementModifier): Promise<HTMLScriptElement[]> {
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
            : (cacheUrlMap(this.metadata as ResourceMetadata, this.url, this.prefix), jsUrls);
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

    async applyStyle(elementModifier?: ElementModifier): Promise<HTMLLinkElement[]> {
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

    isESM(url: string) {
        const originUrl = this.resolvedUrlMap[url] || url;
        const attrs = this.metadata?.jsAttributes?.[originUrl];
        if (attrs) {
            return attrs.type === 'module';
        }
        // 用于由 wrapperFetchedCodeHook 处理过的脚本动态创建的 esm script 判断
        return !!document.querySelector(`script[type="module"][data-src-raw="${url}"]`);
    } 

    preload(elementModifier?: ElementModifier) {
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
                        preloadLink.href = targetUrl;
                        preloadLink.rel = "preload";
                        preloadLink.as = type;
                        preloadLink.onload = resolve;
                        preloadLink.onerror = reject;
                        document.head.appendChild(injectElementModifier(preloadLink, elementModifier))
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

