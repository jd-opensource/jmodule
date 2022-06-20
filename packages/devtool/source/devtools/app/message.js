import browser from 'webextension-polyfill';
import {
    ModuleInitialed,
    DestroyMessageType,
    DevtoolInit,
} from '../../config';

let backgroundPageConnection;

export function connect(onMessage, onInit, onDestroy) {
    backgroundPageConnection = browser.runtime.connect({
        name: "jmodule devtool panel"
    });

    // 建立初始连接
    backgroundPageConnection.onMessage.addListener((message) => {
        switch (message.type) {
            case DestroyMessageType:
                onDestroy && onDestroy();
                break;
            case ModuleInitialed:
                onInit && onInit(message);
                break;
            default:
                onMessage && onMessage(message);
                break;
        }
    });
    backgroundPageConnection.onDisconnect.addListener((p) => {
        if (p.error) {
            console.log(`Disconnected due to an error: ${p.error.message}`);
        }
    });

    backgroundPageConnection.postMessage({
        type: DevtoolInit,
        tabId: browser.devtools.inspectedWindow.tabId,
    });

    return (type, data) => {
        backgroundPageConnection.postMessage({
            type: type,
            tabId: browser.devtools.inspectedWindow.tabId,
            data,
        });
    };
}
