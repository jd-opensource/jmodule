import { DebugInfoOptions } from './utils/printDebugInfo';
/**
 * @class
 * @ignore
 */
export declare class ModuleDebug {
    static print(options: DebugInfoOptions): void;
    static printContinue(message: string): void;
    static enable(): void;
    static disable(): void;
}
