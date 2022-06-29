import { JModule } from './module';
import { Resource } from './resource';
export declare enum ResourceType {
    Style = "text/css",
    Script = "application/javascript"
}
export declare enum ResourceStatus {
    Init = 0,
    InitScriptLoaded = 1,
    InitScriptError = 2,
    ApplyScript = 3,
    ApplyStyle = 8,
    ScriptResolved = 4,
    StyleResolved = 5,
    StyleRemoved = 6,
    ScriptError = 7,
    Initializing = 9,
    Initialized = 10,
    Preloading = 11,
    Preloaded = 12,
    InitializeFailed = 13,
    PreloadFailed = 14,
    StyleError = 15
}
export declare enum ModuleStatus {
    bootFailure = -2,
    loadFailure = -1,
    initialized = 0,
    loading = 1,
    loaded = 2,
    defined = 3,
    booting = 4,
    done = 5
}
export declare const MODULE_STATUS: typeof ModuleStatus;
export declare enum ResourceLoadStrategy {
    Fetch = 0,
    Element = 1
}
declare global {
    interface Window {
        JModule?: any;
        JModuleManager?: any;
        __jmodule_devtool__: any;
    }
}
export interface ModuleOptions {
    type?: string;
    key: string;
    url: string;
    name?: string;
    server?: string;
    autoBootstrap?: boolean;
    resourceType?: string;
    resourceLoadStrategy: ResourceLoadStrategy;
    resourcePrefix?: string;
    resource?: Resource;
}
export interface ModuleMetadata {
    key?: string;
    init?: (module: JModule) => void;
    imports?: string[];
    exports?: {
        [key: string]: any;
    };
}
