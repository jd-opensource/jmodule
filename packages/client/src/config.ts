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

export enum ResourceLoadStrategy {
    Fetch = 0,
    Element = 1,
}

declare global {
    interface Window {
        JModuleManager: any;
        JModule: any;
    }
}
