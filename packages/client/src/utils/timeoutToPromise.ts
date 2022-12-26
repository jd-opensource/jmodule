export function timeoutToPromise<T>(timeout: number, result: Error|T): Promise<T> {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (result instanceof Error) {
                reject(result);
                return;
            }
            resolve(result);
        }, timeout);
    });
}
