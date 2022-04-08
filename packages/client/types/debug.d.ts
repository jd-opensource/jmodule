/**
 * @class
 */
declare type Type = 'success' | 'error' | 'log' | 'warning';
interface PrintOptions {
    key: string;
    message: string;
    instance: any;
    type?: Type;
}
export declare class ModuleDebug {
    static print({ key, message, instance, type, }: PrintOptions): void;
    static printContinue(message: string): void;
    static enable(): void;
    static disable(): void;
}
declare const _default: {};
export default _default;
