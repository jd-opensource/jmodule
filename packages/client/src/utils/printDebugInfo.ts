/* eslint-disable no-console */

function tagStyle(color: string) {
    return `background: ${color};color:#fff;padding: 0 3px; border-radius: 2px;`;
}
const style = {
    timestamp: 'color: #999',
    key: tagStyle('rgb(42,154,243)'),
    message: '#333',
    type: {
        success: tagStyle('green'),
        error: tagStyle('red'),
        log: tagStyle('#999'),
        warning: tagStyle('#b39500'),
    },
    space: 'background: initial',
};


function getTimestamp() {
    return `[${new Date().toISOString().slice(11, -1)}]`;
}

export interface DebugInfoOptions {
    key: string, message: string, instance: any, type?: 'success' | 'error' | 'log' | 'warning',
}

export function printDebugInfo({ key, message, instance, type = 'log' }: DebugInfoOptions) {
    console.debug(`%c${getTimestamp()} %c${type}%c %c${key}%c ${message} %O`,
        style.timestamp,
        style.type[type],
        style.space,
        style.key,
        style.message,
        instance);
}
