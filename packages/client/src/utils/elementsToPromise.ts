type Result<T> = {
    results: T[],
    errors: Error[],
};

export async function elementsToPromise<T = HTMLLinkElement|HTMLScriptElement>(
    elements: T[],
    before?: (el: T) => void,
    after?: (el: T) => void,
): Promise<Result<T>> {
    const res = await Promise.allSettled(elements.map((item) => new Promise((resolve: (item: T) => void, reject) => {
        const url = (item as unknown as HTMLLinkElement).href || (item as unknown as HTMLScriptElement).src;
        (item as any).onload = () => resolve(item);
        (item as any).onerror = () => reject(new Error(`LoadError: ${url}`));
        before && before(item);
    })));
    return res.reduce((value, item) => {
        if (item.status === 'fulfilled') {
            value.results.push(item.value);
            after && after(item.value);
        }
        if (item.status === 'rejected') {
            value.errors.push(item.reason);
        }
        return value;
    }, { results: [], errors: [] } as Result<T>);
}
