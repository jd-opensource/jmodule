import { AsyncFilesListKey, AsyncFilesMapPrefix, overrideCreateElement } from './globalPatch';

function injectElementModifier (
    element: HTMLElement, 
    elementModifier?: (element: HTMLElement) => void
) :HTMLElement{
    if (elementModifier && typeof elementModifier === 'function') {
        elementModifier(element);
    }
    return element;
}
function loadScript(url: string, from: string, elementModifier?: (script: HTMLScriptElement) => void): Promise<HTMLScriptElement> {
    const script = document.createElement('script');
    script.setAttribute('src', url); // skip proxy
    script.async = false;
    script.dataset.jmoduleFrom = from;
    elementModifier && elementModifier(script);
    document.body.appendChild(script);
    return new Promise((resolve, reject) => {
        script.onerror = () => reject(new Error(`LoadScriptError: ${url}`));
        script.onload = () => resolve(script);
    });
}

interface RequestModifier {
    (arg: { url: string, from: string }): RequestInit;
}

async function loadScriptByFetch(
    url: string,
    from: string,
    requestModifier?: RequestModifier,
    responseWrapper?: { prefix?: string, suffix?: string },
) {
    const res = await fetch(url, requestModifier ? requestModifier({ url, from }) : undefined);
    if (!res.ok) {
        throw new Error(`LoadScriptError: ${url}`);
    }
    const { prefix, suffix } = responseWrapper || {};
    const resBuffer = new Uint8Array(await res.arrayBuffer());
    const encoder = new TextEncoder();
    const script = document.createElement('script');
    script.src = URL.createObjectURL(
        new Blob(
            [encoder.encode(`${prefix || ''};`), resBuffer, encoder.encode(`;${suffix || ''}`)],
            { type: 'application/javascript' },
        ),
    );
    document.body.append(script);
}

function addStyle(url: string, elementModifier?: (element: HTMLElement) => void): HTMLLinkElement {
    const styleDom = document.createElement('link');
    styleDom.setAttribute('rel', 'stylesheet');
    styleDom.href = url;
    document.head.appendChild(injectElementModifier(styleDom, elementModifier));
    return styleDom;
}

function patchInitUrl(url: string): string {
    return `${url}${url.indexOf('?') > 0 ? '&' : '?' }__v__=${Date.now()}`;
}

export interface ResourceMetadata {
    js: string[],
    css: string[],
    asyncFiles: string[],
}

export enum ResourceStatus {
    Init = 0,
    InitScriptLoaded = 1,
    InitScriptError = 2,
    ApplyScript = 3,
    ScriptResolved = 4,
    StyleResolved = 5,
    StyleRemoved = 6,
    ScriptError = 7,
}

export interface ResourceOptions {
    type?: string,
    prefix?: string,
};


const scriptCacheByUrl: { [url: string]: HTMLScriptElement } = {};
/**
 * 基于URL的资源管理，与模块无关
 * @class
 * @param {String<url>} 资源地址
 */
export class Resource {
    private static resourceInsCache: { [key: string]: Resource | undefined } = {};
    private resolveInit!: () => void;
    private rejectInit!: (error: Error) => void;
    private resolveScript!: (elements: HTMLScriptElement[]) => void;
    private rejectScript!: (error: Error) => void;
    private appliedScript: boolean = false;
    private static asyncFilesMap: { [key: string]: Resource | undefined } = {};

    metadata?: ResourceMetadata;
    url: string = '';
    initScriptElement?: HTMLScriptElement;
    styleElements: HTMLLinkElement[] = [];
    appendedAsyncStyleElements?: NodeListOf<Element>;
    scriptElements: HTMLScriptElement[] = [];
    server!: string;
    styleMounted: boolean = false;
    status: ResourceStatus = ResourceStatus.Init;
    type!: string;
    prefix?: string;
    afterApplyScript!: Promise<HTMLScriptElement[]>;
    afterInit!: Promise<void>;
    preloaded = false;

    /**
     * @constructor
     */
    constructor(url: string, options?: ResourceOptions) {
        if (!url && typeof url !== 'string') {
            throw new Error('创建 Resource 实例异常, 缺少sourceUrl');
        }
        if (Resource.resourceInsCache[url]) {
            return <Resource>Resource.resourceInsCache[url];
        }
        this.url = url;
        this.server = new URL(url).origin;
        this.type = options?.type || url.split('.').pop() || 'js';
        this.prefix = options?.prefix?.replace('[resourceOrigin]', this.server);
        this.afterInit = new Promise((resolve, reject) => {
            this.resolveInit = resolve;
            this.rejectInit = reject;
        });
        this.afterApplyScript = new Promise((resolve, reject) => {
            this.resolveScript = resolve;
            this.rejectScript = reject;
        });
        Resource.resourceInsCache[url] = this;
    }

    static enableAsyncChunk() {
        console.warn('执行 enableAsyncChunk 会覆盖原生的 document.createElement 方法，有一定风险');
        overrideCreateElement();
    }

    static getResource(sourceUrl?: string): Resource | void {
        const key = sourceUrl || (document.currentScript as HTMLScriptElement)?.src;
        if (!key) {
            return;
        }
        // 移除缓存url patch
        const noPatchedUrl = key.replace(/(\?|&)__v__=\d+$/, '');
        return Resource.resourceInsCache[noPatchedUrl];
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
        const resource = Resource.getResource(sourceUrl);
        if (resource) {
            const { asyncFiles = [] } = metadata;
            asyncFiles.forEach(file => {
                const key = `${AsyncFilesMapPrefix}${file}`;
                const res = sessionStorage.getItem(key);
                const targetUrl = resource.resolveUrl(file);
                if (res && !res.includes(targetUrl)) {
                    const errorMessage = `建立异步组件索引 "${file}" 出现冲突，可能会导致异步组件加载异常`;
                    console.error(errorMessage, res, resource);
                }
                sessionStorage.setItem(key, JSON.stringify([targetUrl, resource.url]));
                sessionStorage.setItem(AsyncFilesListKey, `${sessionStorage.getItem(AsyncFilesListKey) || ''},${file}`);
            });
            resource.metadata = metadata;
            resource.resolveInit();
            return resource;
        } else {
            throw new Error('未找到对应的 resource 实例');
        }
    }

    init() {
        if (this.initScriptElement) {
            return Promise.resolve();
        }
        const urlDefer: Promise<string> = this.type === 'json' ? fetch(patchInitUrl(this.url))
            .then(res => res.json())
            .then((jsonRes) => {
                const jsString = `JModule.applyResource(${JSON.stringify(jsonRes)}, "${this.url}")`;
                const blob = new Blob([jsString], { type: 'text/javascript' });
                return URL.createObjectURL(blob);
            }) : Promise.resolve(patchInitUrl(this.url));
        return urlDefer.then((url) => loadScript(url, this.url, (script) => {
            script.async = true;
            this.initScriptElement = script;
            scriptCacheByUrl[this.url] = script;
        })).catch((e) => {
            this.rejectInit(e);
        });
    }

    resolveUrl(url: string) {
        try {
            if (url.startsWith('X_WEBPACK_SERVER')) {
                console.warn('X_WEBPACK_SERVER 已废弃, 下个版本将弃用');
                if (this.metadata && this.metadata.asyncFiles) {
                    // 新版：相对路径
                    url = url.replace(/^X_WEBPACK_SERVER\/?/, '');
                } else { // 旧版：绝对路径
                    url = url.replace(/^X_WEBPACK_SERVER/, '');
                }
            }
            if (!this.prefix) {
                return new URL(url, this.url).href;
            }
            return `${this.prefix}${url}`;
        } catch (e) {
            // ignore error: 浏览器不支持（IE）或者 参数异常
            return url;
        }
    }

    setStatus(status: ResourceStatus) {
        this.status = status;
    }

    applyScript(elementModifier?: (element: HTMLElement) => void): Promise<HTMLScriptElement[]> {
        if (!this.metadata) {
            return Promise.reject(new Error('no resource metadata'));
        }
        if (this.appliedScript) {
            return Promise.resolve(this.scriptElements);
        }
        this.appliedScript = true;
        const jsUrls = this.metadata.js || [];
        this.setStatus(ResourceStatus.ApplyScript);
        this.scriptElements = [];
        return Promise.all(jsUrls.map(url => loadScript(
            this.resolveUrl(url),
            this.url,
            script => {
                injectElementModifier(script, elementModifier);
                this.scriptElements.push(script);
            },
        ))).then(() => {
            this.setStatus(ResourceStatus.ScriptResolved);
            this.resolveScript(this.scriptElements);
            return this.scriptElements;
        }).catch((error) => {
            this.setStatus(ResourceStatus.ScriptError);
            this.rejectScript(error);
            throw error;
        });
    }

    applyStyle(elementModifier?: (element: HTMLElement) => void): Promise<HTMLLinkElement[]> {
        if (!this.metadata) {
            return Promise.reject(new Error('no resource metadata'));
        }
        const { css = [] } = this.metadata;
        const { length } = this.styleElements;
        if (css.length === length) {
            if (!this.styleMounted) {
                this.styleElements.forEach(item => document.head.appendChild(item));
                this.appendedAsyncStyleElements?.forEach(item => document.head.appendChild(item));
                this.styleMounted = true;
            }
            return Promise.resolve(this.styleElements);
        }
        this.styleElements = css.map(url => addStyle(this.resolveUrl(url), elementModifier));
        this.appendedAsyncStyleElements?.forEach(item => document.head.appendChild(item));
        this.styleMounted = true;
        return Promise.resolve(this.styleElements);
    }

    preload(elementModifier?: (element: HTMLElement) => void) {
        if (!this.metadata) {
            return Promise.reject(new Error('no resource metadata'));
        }
        if (this.preloaded) {
            return;
        }
        const { css = [], js = [] } = this.metadata;
        [
            { type: 'script', urls: js },
            { type: 'style', urls: css },
        ].forEach(({ type, urls }) => {
            urls.forEach(url => {
                const preloadLink = document.createElement("link");
                preloadLink.href = this.resolveUrl(url);
                preloadLink.rel = "preload";
                preloadLink.as = type;
                document.head.appendChild(injectElementModifier(preloadLink, elementModifier));
            });
        });
        this.preloaded = true;
    }

    /**
     * 移除样式
     */
    removeStyle() {
        // 同步的 link
        (this.styleElements || []).forEach(item => item.remove());
        // 异步组件创建的 link
        const asyncLinks = document.querySelectorAll(`link[data-jmodule-from="${this.url}"]`);
        asyncLinks.forEach(item => item.remove());
        this.appendedAsyncStyleElements = asyncLinks;
        this.styleMounted = false;
    }

    /**
     * 销毁资源实例
     */
    destroy() {
        this.removeStyle(); // 移除样式
        this.initScriptElement = undefined;
        this.scriptElements = [];
        this.styleElements = []; // 解除对DOM的引用关系
        Resource.resourceInsCache[this.url] = undefined; // 移除实例缓存
    }
}
