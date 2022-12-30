export function eventToPromise<T>(eventName: string, timeout?: number): Promise<T> {
    return new Promise((resolve, reject) => {
        if (timeout) {
            setTimeout(() => reject(new Error(`事件${eventName}超时: ${timeout}ms`)), timeout);
        }
        window.addEventListener(eventName, function resolveModule(e: CustomEvent) {
            window.removeEventListener(eventName, resolveModule);
            if (e.detail instanceof Error) {
                reject(e.detail);
                return;
            }
            resolve((e as any).detail as T);
        });
    });
}
