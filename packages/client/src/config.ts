import { JModule } from './module';
import { Resource } from './resource';
// import JModuleManager from './globalManager';

export enum ResourceType {
    Style = 'text/css',
    Script = 'application/javascript',
}

export enum ResourceStatus {
    Init = 0,
    InitScriptLoaded = 1,
    InitScriptError = 2,
    ApplyScript = 3,
    ApplyStyle = 8,
    ScriptResolved = 4,
    StyleResolved = 5,
    StyleRemoved = 6,
    ScriptError = 7,
}

export enum MODULE_STATUS {
    bootFailure = -2,
    loadFailure = -1,
    inited = 0,
    loading = 1,
    loaded = 2,
    defined = 3,
    booting = 4,
    done = 5,
    resourceInited = 6,
}

export enum ResourceLoadStrategy {
    Fetch = 0,
    Element = 1,
}

declare global {
    interface Window {
        JModule?: any;
        JModuleManager?: any;
    }
}

export interface ModuleOptions {
    type?: string,
    key: string,
    name: string,
    url: string,
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
