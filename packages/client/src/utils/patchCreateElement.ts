// 处理script加载时异步文件加载问题


import { AsyncFilesMapPrefix, AsyncFilesListKey } from '../config';

// 处理 webpack 的async chunk
export function patchCreateElement(originalCreateElement: typeof document.createElement) {
    // eslint-disable-next-line no-underscore-dangle
    if ((document.createElement as any).__original__) {
        return;
    }

    const patchElement = (val: string, element: HTMLElement) => {
        const files = (sessionStorage.getItem(AsyncFilesListKey) || '').split(',');
        const file = files.find(item => item && val.includes(item));
        const value = sessionStorage.getItem(`${AsyncFilesMapPrefix}${file}`);
        const [targetUrl, jmoduleFrom] = value ? JSON.parse(value) : [val, undefined];
        // eslint-disable-next-line no-param-reassign
        element.dataset.jmoduleFrom = jmoduleFrom;
        return targetUrl;
    };

    (document.createElement as any).__original__ = originalCreateElement;
    document.createElement = new Proxy(document.createElement, {
        apply(target, context, args) {
            const originRes = originalCreateElement(args[0], args[1]);
            if (!['script', 'link'].includes(args[0])) {
                return originRes;
            }
            const prop = args[0] === 'script' ? 'src' : 'href';
            Object.defineProperty(originRes, prop, {
                get() {
                    return originRes.getAttribute(prop);
                },
                set(val) {
                    originRes.setAttribute(prop, patchElement(val, originRes));
                },
            });
            return originRes;
        },
    });
}
