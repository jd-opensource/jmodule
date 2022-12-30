export interface DebugInfoOptions {
    key: string;
    message: string;
    instance: any;
    type?: 'success' | 'error' | 'log' | 'warning';
}
export declare function printDebugInfo({ key, message, instance, type }: DebugInfoOptions): void;
