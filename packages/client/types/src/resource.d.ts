export interface ResourceMetadata {
    js: string[];
    css: string[];
    asyncFiles: string[];
}
export declare enum ResourceStatus {
    Init = 0,
    InitScriptLoaded = 1,
    InitScriptError = 2,
    ApplyScript = 3,
    ScriptResolved = 4,
    StyleResolved = 5,
    StyleRemoved = 6,
    ScriptError = 7
}
export interface ResourceOptions {
    type?: string;
    prefix?: string;
}
/**
 * 基于URL的资源管理，与模块无关
 * @class
 * @param {String<url>} 资源地址
 */
export declare class Resource {
    private static resourceInsCache;
    private resolveInit;
    private rejectInit;
    private resolveScript;
    private rejectScript;
    private appliedScript;
    private static asyncFilesMap;
    metadata?: ResourceMetadata;
    url: string;
    initScriptElement?: HTMLScriptElement;
    styleElements: HTMLLinkElement[];
    appendedAsyncStyleElements?: NodeListOf<Element>;
    scriptElements: HTMLScriptElement[];
    server: string;
    styleMounted: boolean;
    status: ResourceStatus;
    type: string;
    prefix?: string;
    afterApplyScript: Promise<HTMLScriptElement[]>;
    afterInit: Promise<void>;
    preloaded: boolean;
    /**
     * @constructor
     */
    constructor(url: string, options?: ResourceOptions);
    static enableAsyncChunk(): void;
    static getResource(sourceUrl?: string): Resource | void;
    static getTrueResourceUrl(url: string): {
        resource: Resource;
        filepath: string;
    } | void;
    static setResourceData(metadata: ResourceMetadata, sourceUrl?: string): Resource;
    init(): Promise<void | HTMLScriptElement>;
    resolveUrl(url: string): string;
    setStatus(status: ResourceStatus): void;
    applyScript(elementModifier?: (element: HTMLElement) => void): Promise<HTMLScriptElement[]>;
    applyStyle(elementModifier?: (element: HTMLElement) => void): Promise<HTMLLinkElement[]>;
    preload(elementModifier?: (element: HTMLElement) => void): Promise<never> | undefined;
    /**
     * 移除样式
     */
    removeStyle(): void;
    /**
     * 销毁资源实例
     */
    destroy(): void;
}
