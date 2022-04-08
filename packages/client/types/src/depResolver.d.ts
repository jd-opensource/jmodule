interface DefaultObject {
    [key: string]: any;
}
export declare class DepResolver {
    cacheBy?: string;
    result?: any;
    resolver: (config: DefaultObject) => {};
    constructor(resolver: (config: DefaultObject) => {}, options?: {
        cacheBy?: string;
    });
    resolve(config?: DefaultObject): any;
}
export {};
