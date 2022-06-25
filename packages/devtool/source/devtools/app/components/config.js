export const tabs = [{
    name: 'Module',
    alias: '模块信息',
    component: 'modules',
}, {
    name: 'Resource',
    alias: '资源信息',
    component: 'data',
}, {
    name: 'Event',
    alias: '事件',
    component: 'events',
}];

// 兼容旧版
const moduleActionMap = [
    'bootFailure',
    'loadFailure',
    'initialized',
    'loading',
    'loaded',
    'defined',
    'booting',
    'done',
    'resourceInitialized',
];
export function getStatus(status, type = 'module') {
    if (typeof status === 'string') {
        return type === 'module' ? status : `Resource:${status}`;
    }
    return moduleActionMap[status + 2];
}

// 兼容旧版
export function getResourceStatus(status) {
    return [
        'Init',
        'InitScriptLoaded',
        'InitScriptError',
        'ApplyScript',
        'ApplyStyle',
        'ScriptResolved',
        'StyleResolved',
        'StyleRemoved',
        'ScriptError',
    ][status];
}

// 兼容旧版
export function getResourceLoadStrategy(strategy) {
    return ['Fetch', 'Element'][strategy];
}
