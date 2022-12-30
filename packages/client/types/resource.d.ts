import { ResourceStatus, ResourceLoadStrategy } from './config';
import { ModuleHook } from './hook';
import { ElementModifier } from './types';
export interface ResourceMetadata {
    js: string[];
    css: string[];
    asyncFiles: string[];
}
export interface ResourceOptions {
    type?: string;
    prefix?: string;
    strategy?: ResourceLoadStrategy;
    initTimeout?: number;
}
/**
 * 基于URL的资源管理，与模块无关
 * @class
 * @param {String<url>} 资源地址
 */
export declare class Resource extends ModuleHook {
    private resolveScript;
    private rejectScript;
    private styleLoading?;
    private scriptLoading?;
    private appliedScript;
    private static asyncFilesMap;
    static initTimeout: number;
    resolveInit?: (metadata: ResourceMetadata) => void;
    rejectInit?: (error: Error) => void;
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
    afterInit?: Promise<void>;
    strategy: ResourceLoadStrategy;
    cachedUrlMap: {
        [key: string]: string;
    };
    initTimeout: number;
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
    static defineType(type: string, typeHandler: (resource: Resource, defaultUrl: string) => Promise<string>): void;
    private prepareInit;
    init(forceInit?: boolean): Promise<void>;
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
     * 重置样式状态
     */
    resetStyleStatus(): void;
    /**
     * 销毁资源实例
     */
    destroy(): void;
}
