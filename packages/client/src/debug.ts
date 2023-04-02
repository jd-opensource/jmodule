/* eslint-disable no-console */
import { printDebugInfo, DebugInfoOptions } from './utils/printDebugInfo';

let enableDebugStatus = false;

function clone<T extends { __proto__: any }>(obj?: T): T | '' {
    if (!obj) {
        return '';
    }
    let cloned;
    try {
        cloned = JSON.parse(JSON.stringify(obj));
        cloned._ = obj;
        /* eslint-disable no-proto */
        cloned.__proto__ = obj.__proto__;
    } catch (e) {
        cloned = {
            ...obj,
        }
    }
    return cloned;
}

/**
 * @class
 */
export class ModuleDebug {
    static print(options: DebugInfoOptions) {
        if (!enableDebugStatus || !options) {
            return;
        }
        const { instance, ...others } = options;
        printDebugInfo({ ...others, instance: clone(instance) });
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
