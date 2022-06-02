import { ResourceStatus, ResourceLoadStrategy } from './config';
import { ModuleHook } from './hook';
export interface ResourceMetadata {
    js: string[];
    css: string[];
    asyncFiles: string[];
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
export declare class Resource extends ModuleHook {
    private resolveScript;
    private rejectScript;
    private appliedScript;
    private static asyncFilesMap;
    resolveInit: () => void;
    rejectInit: (error: Error) => void;
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
    strategy: ResourceLoadStrategy;
    styleLoading: boolean;
    scriptLoading: boolean;
    cachedUrlMap: {
        [key: string]: string;
    };
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
    static setResourceData(metadata: ResourceMetadata, sourceUrl: string): Resource;
    init(): Promise<void | HTMLScriptElement>;
    resolveUrl(url: string): string;
    setStatus(status: ResourceStatus): void;
    applyScript(elementModifier?: ElementModifier): Promise<HTMLScriptElement[]>;
    applyStyle(elementModifier?: ElementModifier): Promise<HTMLLinkElement[]>;
    preload(elementModifier?: ElementModifier): void;
    /**
     * 移除样式
     */
    removeStyle(): void;
    /**
     * 销毁资源实例
     */
    destroy(): void;
}
