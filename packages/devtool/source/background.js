// eslint-disable-next-line import/no-unassigned-import
// import './options-storage.js';
import browser from 'webextension-polyfill';
import {
    ModuleInitialed,
    DevtoolInit,
    DestroyMessageType,
    InitMessageType,
    ModuleAction,
} from './config';

const connections = {};
let sessionData = {};

// 监听 devtool 连接
chrome.runtime.onConnect.addListener(function (port) {
    const extensionListener = function (message) {
        if (message?.type === DevtoolInit) {
            connections[message.tabId] = port;
            if (sessionData[message.tabId]?.startTime) { // 先注册后连接
                sendInitData(message.tabId);
                sendActionData(message.tabId);
            }
            return;
        }
    }

    port.onMessage.addListener(extensionListener);

    port.onDisconnect.addListener(function (port) {
        port.onMessage.removeListener(extensionListener);
        const tabId = Object.keys(connections).find(tabId => connections[tabId] === port);
        tabId && delete connections[tabId];
    });
});

function createSessionData(startTime, hasGetActions) {
    return {
        timer: undefined,
        startTime,
        hasGetActions: hasGetActions,
        actions: {},
    };
}

function sendInitData(tabId) {
    const devtoolPort = connections[tabId] || undefined;
    devtoolPort && devtoolPort.postMessage({
        type: ModuleInitialed,
        data: { startTime: sessionData[tabId]?.startTime },
    });
}

// 全量数据，只用发最后一次
function sendActionData(tabId) {
    const devtoolPort = connections[tabId] || undefined;
    const tab = sessionData[tabId];
    if (!devtoolPort || !tab) {
        return;
    }
    if (sessionData[tabId]?.hasGetActions) {
        devtoolPort.postMessage({ type: 'jmodule:change' });
        return;
    }
    clearTimeout(tab.timer);
    tab.timer = setTimeout(async () => {
        devtoolPort.postMessage({
            type: ModuleAction,
            data: sessionData[tabId]?.actions,
        })
    }, 200);
}
const handleMessage = (message, sender) => {
    const tabId = sender.tab.id;
    const devtoolPort = connections[tabId] || undefined;
    switch(message.type) {
        case InitMessageType:
            sessionData[tabId] = createSessionData(
                message.data?.startTime,
                message.data?.hasGetActions,
            );
            sendInitData(tabId); // 先连接后注册
            break;
        case DestroyMessageType:
            sessionData[tabId] = undefined;
            devtoolPort && devtoolPort.postMessage({ type: DestroyMessageType });
            break;
        case 'jmodule:change':
            sendActionData(tabId);
            break;
        default:
            if (!sessionData[tabId] || !sessionData[tabId].startTime) {
                break;
            }
            const { key, status, time } = message.data;
            sessionData[tabId].actions[key] = sessionData[tabId].actions[key] || [];
            sessionData[tabId].actions[key].push([status, time, 'module']);
            sendActionData(tabId);
            break;
    }
    return;
}

// chrome.runtime.onMessage.addListener(handleMessage)
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    try {
        if (message instanceof Array) {
            message.forEach(item => handleMessage(item, sender));
        } else {
            handleMessage(message, sender);
        }
    } catch(e) {
        console.error(e);
    }
    sendResponse('received');
});
