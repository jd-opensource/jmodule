const allHash: Set<string> = new Set();
const cache: { [key: string]: any } = {};

export class Matcher {
    hash!: string;

    constructor(obj: { [key: string]: any } = {}) {
        if (obj instanceof Matcher) {
            return obj;
        }
        const keys = Object.keys(obj).sort() || [];
        const hash = JSON.stringify(keys.map(key => [key, obj[key]]))
            .replace(/^\[|\]$/g, '');
        allHash.add(hash);
        this.hash = hash;
    }

    get matched() {
        return [...allHash].filter((hash: string) => this.hash.indexOf(hash) > -1)
            .sort((a, b) => { return a.length > b.length ? 1 : -1 });
    }

    cache(obj: any) {
        cache[this.hash] = { ...(cache[this.hash] || {}), ...obj };
    }

    getCache(mergeValue = true): any { // 匹配越精确，优先级越高
        if (!mergeValue) {
            return cache[this.hash];
        }
        return Object.assign({}, ...this.matched.map(hash => cache[hash]));
    }
}
