declare type Result<T> = {
    results: T[];
    errors: Error[];
};
export declare function elementsToPromise<T = HTMLLinkElement | HTMLScriptElement>(elements: T[], before?: (el: T) => void, after?: (el: T) => void): Promise<Result<T>>;
export {};
