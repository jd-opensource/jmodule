import { JModule } from './module';
import { Resource } from './resource';
// import JModuleManager from './globalManager';

export enum ResourceType {
    Style = 'text/css',
    Script = 'application/javascript',
}

export enum ResourceStatus {
    Init = 'Init',
    InitScriptLoaded = 'InitScriptLoaded',
    InitScriptError = 'InitScriptError',
    ApplyScript = 'ApplyScript',
    ApplyStyle = 'ApplyStyle',
    ScriptResolved = 'ScriptResolved',
    StyleResolved = 'StyleResolved',
    StyleRemoved = 'StyleRemoved',
    ScriptError = 'ScriptError',
    Initializing = 'Initializing',
    Initialized = 'Initialized',
    Preloading = 'Preloading',
    Preloaded = 'Preloaded',
    InitializeFailed = 'InitializeFailed',
    PreloadFailed = 'PreloadFailed',
    StyleError = 'StyleError',
    StyleRemoveBefore = 'StyleRemoveBefore',
    StyleDisabled = 'StyleDisabled',
    StyleEnabled = 'StyleEnabled',
}

export enum ModuleStatus {
    bootFailure = 'bootFailure',
    loadFailure = 'loadFailure',
    init = 'init',
    initializing = 'initializing',
    initialized = 'initialized',
    initializeFailed = 'initializeFailed',
    loading = 'loading',
    loaded = 'loaded',
    defined = 'defined',
    booting = 'booting',
    done = 'done',
}

export const statusFromResourceToModule = {
    [ResourceStatus.Initializing]: ModuleStatus.initializing,
    [ResourceStatus.Initialized]: ModuleStatus.initialized,
    [ResourceStatus.InitializeFailed]: ModuleStatus.initializeFailed,
    [ResourceStatus.ScriptError]: ModuleStatus.loadFailure,
    [ResourceStatus.ScriptResolved]: ModuleStatus.loaded,
};

// 向下兼容
export const MODULE_STATUS = ModuleStatus;

export enum ResourceLoadStrategy {
    Fetch = 0,
    Element = 1,
}

declare global {
    interface Window {
        JModule?: any;
        JModuleManager?: any;
        __jmodule_devtool__: any;
    }
}

export interface ModuleOptions {
    type?: string,
    key: string,
    url: string,
    name?: string,
    server?: string,
    autoBootstrap?: boolean,
    resourceType?: string,
    resourceLoadStrategy: ResourceLoadStrategy,
    resourcePrefix?: string,
    resource?: Resource,
}

export interface ModuleMetadata {
    key?: string,
    init?: (module: JModule) => void,
    imports?: string[],
    exports?: { [key: string]: any },
}
