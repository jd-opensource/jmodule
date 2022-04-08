export declare class Matcher {
    hash: string;
    constructor(obj?: {
        [key: string]: any;
    });
    get matched(): string[];
    cache(obj: any): void;
    getCache(mergeValue?: boolean): any;
}
