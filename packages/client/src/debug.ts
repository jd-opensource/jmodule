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
let enableDebugStatus = false;

function getTimestamp() {
    return `[${new Date().toISOString().slice(11, -1)}]`;
}
function clone<T extends { __proto__: any }>(obj?: T): T | '' {
    if (!obj) {
        return '';
    }
    const cloned = JSON.parse(JSON.stringify(obj));
    cloned._ = obj;
    /* eslint-disable no-proto */
    cloned.__proto__ = obj.__proto__;
    return cloned;
}

/**
 * @class
 */
type Type = 'success' | 'error' | 'log' | 'warning';
interface PrintOptions {
   key: string, message: string, instance: any, type?: Type,
}
export class ModuleDebug {
    static print({
        key, message, instance, type = 'log',
    }: PrintOptions) {
        if (!enableDebugStatus) {
            return;
        }
        console.debug(`%c${getTimestamp()} %c${type}%c %c${key}%c ${message} %O`,
            style.timestamp,
            style.type[type],
            style.space,
            style.key,
            style.message,
            clone(instance));
    }

    static printContinue(message: string) {
        if (!enableDebugStatus) {
            return;
        }
        console.debug(`\t- %c${message}`, 'color: #555');
    }

    static enable() {
        enableDebugStatus = true;
    }

    static disable() {
        enableDebugStatus = false;
    }
}

export default {};
