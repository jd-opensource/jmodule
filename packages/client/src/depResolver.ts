const cacheStore: Record<string, any> = {};

type Resolver = (config: Record<string, any>) => Record<string, any>;

export class DepResolver {
    cacheBy?: string;
    result?: any;
    resolver: Resolver;

    constructor(resolver: Resolver, options: { cacheBy?: string } = {}) {
        if (!resolver || typeof resolver !== 'function') {
            throw new Error('DepResolver 参数错误，必须为函数');
        }
        const { cacheBy } = options;
        this.resolver = resolver;
        this.cacheBy = cacheBy;
        this.result = undefined;
    }

    resolve(config: Record<string, any> = {}) {
        const { cacheBy } = this;
        const useCache = cacheBy && config[cacheBy];
        if (useCache && cacheStore[useCache]) {
            return cacheStore[useCache];
        }
        const result = this.resolver(config);
        if (useCache) { // 缓存结果
            cacheStore[useCache] = result;
        }
        return result;
    }
}
