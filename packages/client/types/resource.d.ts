import { ResourceStatus, ResourceLoadStrategy } from './config';
import { ModuleHook } from './hook';
import { ElementModifier } from './types';
export interface ResourceMetadata {
    js: string[];
    css: string[];
    asyncFiles: string[];
    jsAttributes?: Record<string, any>;
}
/**
 * 创建资源实例的选项接口。
 */
export interface ResourceOptions {
    /**
     * 资源类型。此属性是可选的。
     */
    type?: string;
    /**
     * 资源加载策略。此属性是可选的。
     */
    strategy?: ResourceLoadStrategy;
    /**
     * 初始化超时时间（单位：毫秒）。此属性是可选的。
     */
    initTimeout?: number;
}
/**
 * 资源实例, 负责模块资源的加载以及样式的启用/禁用
 * @class
 * @param {String} 资源地址
 */
export declare class Resource extends ModuleHook {
    private resolveScript;
    private rejectScript;
    private styleLoading?;
    private scriptLoading?;
    private appliedScript;
    private static asyncFilesMap;
    private resolvedUrlMap;
    /**
     * 初始化超时的静态默认值，单位毫秒。
     */
    static initTimeout: number;
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
    url: string;
    initScriptElement?: HTMLScriptElement;
    styleElements: (HTMLLinkElement | HTMLStyleElement)[];
    appendedAsyncStyleElements?: NodeListOf<Element>;
    scriptElements: HTMLScriptElement[];
    server: string;
    /**
     * 标记样式是否已经挂载。
     */
    styleMounted: boolean;
    /**
     * 资源状态，默认为初始化状态。
     */
    status: ResourceStatus;
    /**
     * 入口资源类型。
     */
    type: string;
    /**
     * URL 适配器函数，可以根据资源和源 URL 自定义最终的 URL 地址。
     */
    urlAdapter?: (sourceUrl: string, resource: Resource) => string;
    /**
     * 应用脚本后的 Promise。
     */
    afterApplyScript: Promise<HTMLScriptElement[]>;
    /**
     * 初始化后的 Promise。
     */
    afterInit?: Promise<void>;
    /**
     * 资源加载策略，默认使用标签方式加载。
     */
    strategy: ResourceLoadStrategy;
    /** @ignore */
    cachedUrlMap: {
        [key: string]: string;
    };
    /**
     * 初始化超时时间，单位毫秒。
     */
    initTimeout: number;
    /**
     * @constructor
     */
    constructor(url: string, options?: ResourceOptions);
    /**
     * @ignore
     * @deprecated
     */
    static enableAsyncChunk(): void;
    /**
     * @ignore
     * @deprecated
     */
    static getResource(sourceUrl?: string): Resource | void;
    /**
     * @ignore
     * @deprecated
     */
    static getTrueResourceUrl(url: string): {
        resource: Resource;
        filepath: string;
    } | void;
    /** 根据 resourceUrl 查找 resource 并设置资源清单 */
    static setResourceData(metadata: ResourceMetadata, resourceUrl: string): Resource;
    /** 扩展入口资源类型 */
    static defineType(type: string, typeHandler: (resource: Resource, defaultUrl: string) => Promise<string>): void;
    private prepareInit;
    /** 加载资源清单数据, 默认(forceInit = false)不重复执行 */
    init(forceInit?: boolean): Promise<void>;
    /**
     * 加载资源时转换资源地址
     * @return {string}
     */
    resolveUrl(url: string): string;
    /** 设置Resource实例的状态, 同时触发Resource实例关联的所有JModule实例的状态改变 */
    setStatus(status: ResourceStatus): void;
    /** 加载模块的脚本资源 */
    applyScript(elementModifier?: ElementModifier<HTMLScriptElement>): Promise<HTMLScriptElement[]>;
    /** 加载/启用模块的样式资源 */
    applyStyle(elementModifier?: ElementModifier<HTMLLinkElement>): Promise<(HTMLLinkElement | HTMLStyleElement)[]>;
    /** 判断制定 url 是否为 esm 模块 */
    isESM(url: string): boolean;
    /** 预加载资源 */
    preload(elementModifier?: ElementModifier<HTMLLinkElement>): void;
    /**
     * 移除样式
     */
    removeStyle(): void;
    /**
     * 禁用/启用样式
     */
    setStyleStatus(status: 'enabled' | 'disabled'): void;
    /**
     * 重置样式状态
     */
    resetStyleStatus(): void;
    /**
     * 销毁资源实例
     */
    destroy(): void;
}
