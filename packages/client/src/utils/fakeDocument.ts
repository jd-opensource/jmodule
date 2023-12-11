import { resolveUrlByFetch } from './fetchCode';
import { ResourceType } from '../config';

function fakeCreateElement(sourceUrl: string, currentUrl: string, originalCreateElement: typeof document.createElement) {
    return new Proxy(originalCreateElement, {
        apply(target, context, args) {
            const originRes = originalCreateElement(args[0], args[1]);
            if (!['script', 'link', 'style'].includes(args[0])) {
                return originRes;
            }
            originRes.dataset.jmoduleFrom = sourceUrl;
            originRes.dataset.loadedBy = currentUrl;
            if (args[0] === 'style') {
                return originRes;
            }
            const prop = args[0] === 'script' ? 'src' : 'href';
            const resourceType = args[0] === 'script' ? ResourceType.Script : ResourceType.Style;
            Object.defineProperty(originRes, prop, {
                get() {
                    return originRes.dataset.srcRaw;
                },
                set(val) {
                    const url = new URL(val, currentUrl || sourceUrl).href;
                    originRes.dataset.srcRaw = url;
                    resolveUrlByFetch(url, sourceUrl, resourceType).then((targetUrl) => {
                        originRes.setAttribute(prop, targetUrl);
                    });
                    return true;
                },
            });
            return originRes;
        },
    });
}

function fakeCurrentScript(sourceUrl: string, currentUrl: string, originalCurrentScript: HTMLScriptElement) {
    return new Proxy(originalCurrentScript, {
        get(_, prop) {
            if (prop === 'src') {
                return currentUrl;
            }
            const val = Reflect.get(originalCurrentScript, prop);
            return val instanceof Function ? val.bind(originalCurrentScript) : val;
        },
    });
}

export function createDocument(
    originDocument: Document,
    originalCreateElement: typeof document.createElement,
    { sourceUrl, currentUrl }: { sourceUrl: string, currentUrl: string },
) {
    return new Proxy(originDocument, {
        get(target, prop) {
            if (prop === '__origin__') {
                return originDocument;
            }
            if (prop === 'createElement') {
                return fakeCreateElement(sourceUrl, currentUrl, originalCreateElement);
            }
            const val = Reflect.get(target, prop, originDocument);
            if (prop === 'currentScript') {
                return fakeCurrentScript(sourceUrl, currentUrl, val);
            }
            if (prop === 'createTreeWalker') {
                return (a: { [x: string]: any; }, ...args: any) => {
                    val.bind(originDocument)(a['__origin__'] || a, ...args);
                };
            }
            return val instanceof Function ? val.bind(target) : val;
        },
        set(target, prop, value) {
            Reflect.set(target, prop, value);
            return true;
        },
    });
}
