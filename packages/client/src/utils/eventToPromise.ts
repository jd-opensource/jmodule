export function eventToPromise<T>(eventName: string, timeout?: number): Promise<T> {
    return new Promise((resolve, reject) => {
        if (timeout) {
            setTimeout(() => reject(new Error(`事件${eventName}超时: ${timeout}ms`)), timeout);
        }
        window.addEventListener(eventName, function resolveModule(e) {
            window.removeEventListener(eventName, resolveModule);
            resolve((e as any).detail as T);
        });
    });
}
