import { JModule } from './module';
import { Resource } from './resource';
// import JModuleManager from './globalManager';

/**
 * @ignore
 */
export enum ResourceType {
    Style = 'text/css',
    Script = 'text/javascript',
}

export enum ResourceStatus {
    /** 资源实例初始化状态 */
    Init = 'Init',
    /** 已加载元数据信息 */
    InitScriptLoaded = 'InitScriptLoaded',
    /** 元数据信息加载失败 */
    InitScriptError = 'InitScriptError',
    /** 应用脚本中 */
    ApplyScript = 'ApplyScript',
    /** 应用样式中 */
    ApplyStyle = 'ApplyStyle',
    /** 脚本解析完成 */
    ScriptResolved = 'ScriptResolved',
    /** 样式解析完成 */
    StyleResolved = 'StyleResolved',
    /** 样式移除完成 */
    StyleRemoved = 'StyleRemoved',
    /** 脚本错误 */
    ScriptError = 'ScriptError',
    /** 正在初始化 */
    Initializing = 'Initializing',
    /** 初始化完成 */
    Initialized = 'Initialized',
    /** 正在预加载 */
    Preloading = 'Preloading',
    /** 预加载完成 */
    Preloaded = 'Preloaded',
    /** 初始化失败 */
    InitializeFailed = 'InitializeFailed',
    /** 预加载失败 */
    PreloadFailed = 'PreloadFailed',
    /** 样式加载异常 */
    StyleError = 'StyleError',
    /** 样式移除前 */
    StyleRemoveBefore = 'StyleRemoveBefore',
    /** 样式已禁用 */
    StyleDisabled = 'StyleDisabled',
    /** 样式已启用 */
    StyleEnabled = 'StyleEnabled',
}

export enum ModuleStatus {
    /** 启动失败 */
    bootFailure = 'bootFailure',
    /** 加载失败 */
    loadFailure = 'loadFailure',
    /** 初始化 */
    init = 'init',
    /** 正在初始化 */
    initializing = 'initializing',
    /** 初始化完成 */
    initialized = 'initialized',
    /** 初始化失败 */
    initializeFailed = 'initializeFailed',
    /** 正在加载 */
    loading = 'loading',
    /** 加载完成 */
    loaded = 'loaded',
    /** 已定义 */
    defined = 'defined',
    /** 正在启动 */
    booting = 'booting',
    /** 完成 */
    done = 'done',
}

/**
 * @ignore
 */
export const statusFromResourceToModule = {
    [ResourceStatus.Initializing]: ModuleStatus.initializing,
    [ResourceStatus.Initialized]: ModuleStatus.initialized,
    [ResourceStatus.InitializeFailed]: ModuleStatus.initializeFailed,
    [ResourceStatus.ScriptError]: ModuleStatus.loadFailure,
    [ResourceStatus.ScriptResolved]: ModuleStatus.loaded,
};

/**
 * Module的状态, 为兼容而保留
 * 
 * @ignore
 */
export const MODULE_STATUS = ModuleStatus;

export enum ResourceLoadStrategy {
    /** 以Fetch方式加载, 能提供对代码更多的控制 */
    Fetch = 0,
    /** [默认方式]通过原生的 script/link 标签加载应用代码 */
    Element = 1,
}

declare global {
    interface Window {
        JModule?: any;
        JModuleManager?: any;
        __jmodule_devtool__: any;
    }
}

/**
 * 模块选项接口
 * @interface
 * @property {string} key - 模块Key值，用于唯一标识一个模块
 * @property {string} url - 资源地址，指向模块的配置或代码
 * @property {string} [type] - [可选] 模块类型。具体取值由宿主应用通过 JModule.defineType 方法定义
 * @property {string} [name] - [可选] 模块名称
 * @property {string} [server] - [可选] 服务器地址，用于构建模块资源的完整URL
 * @property {boolean} [autoBootstrap] - [可选] 是否自动启动模块
 * @property {string} [resourceType] - [可选] 资源类型，默认支持 js/json 文件。具体取值由宿主应用通过 Resource.defineType 方法定义
 * @property {ResourceLoadStrategy} [resourceLoadStrategy] - 资源加载策略
 * @property {string} [resourcePrefix] - [可选] 资源前缀，用于构建资源的完整URL
 * @property {Resource} [resource] - [可选] Resource实例，默认情况下会自动通过 url/resourceType/resourceLoadStrategy 参数创建
 */
export interface ModuleOptions {
    key: string,
    url: string,
    type?: string,
    name?: string,
    server?: string,
    autoBootstrap?: boolean,
    resourceType?: string,
    resourceLoadStrategy?: ResourceLoadStrategy,
    resourcePrefix?: string,
    resource?: Resource,
}

export interface ModuleMetadata {
    key?: string,
    init?: (module: JModule) => void,
    imports?: string[],
    exports?: { [key: string]: any },
}
