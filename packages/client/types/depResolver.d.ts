declare type Resolver = (config: Record<string, any>) => Record<string, any>;
export declare class DepResolver {
    cacheBy?: string;
    result?: any;
    resolver: Resolver;
    constructor(resolver: Resolver, options?: {
        cacheBy?: string;
    });
    resolve(config?: Record<string, any>): any;
}
export {};
