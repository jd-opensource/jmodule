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

const moduleActionMap = [
    'bootFailure',
    'loadFailure',
    'registered', // inited
    'loading',
    'loaded',
    'defined',
    'booting',
    'done',
    'resourceInited',
];
export function getStatus(status) {
    return moduleActionMap[status + 2];
}

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

export function getResourceLoadStrategy(strategy) {
    return ['Fetch', 'Element'][strategy];
}
