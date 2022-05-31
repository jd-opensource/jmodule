
export const AsyncFilesMapPrefix = 'jmodule:filesMap:';
export const AsyncFilesListKey = 'jmodule:filesList';

// 处理 webpack 的async chunk
export function overrideCreateElement() {
    // eslint-disable-next-line no-underscore-dangle
    if ((document.createElement as any).__original__) {
        return;
    }

    const patchElement = (val: string, element: HTMLElement) => {
        const files = (sessionStorage.getItem(AsyncFilesListKey) || '').split(',');
        const file = files.find(val.includes);
        const value = sessionStorage.getItem(`${AsyncFilesMapPrefix}${file}`);
        const [targetUrl, jmoduleFrom] = value ? JSON.parse(value) : [val, undefined];
        // eslint-disable-next-line no-param-reassign
        element.dataset.jmoduleFrom = jmoduleFrom;
        element.setAttribute('href', targetUrl);
    };

    const localCreateElement = document.createElement;
    document.createElement = new Proxy(document.createElement, {
        get(target, prop, receiver) {
            if (prop === '__original__') {
                return localCreateElement;
            }
            return Reflect.get(target, prop, receiver);
        },
        apply(target, context, args) {
            const originRes = Reflect.apply(target, context, args);
            if (args[0] === 'script') {
                Object.defineProperty(originRes, 'src', {
                    get() {
                        return originRes.getAttribute('src');
                    },
                    set(val) {
                        patchElement(val, originRes);
                    },
                });
            }
            if (args[0] === 'link') {
                Object.defineProperty(originRes, 'href', {
                    get() {
                        return originRes.getAttribute('href');
                    },
                    set(val) {
                        patchElement(val, originRes);
                    },
                });
            }
            return originRes;
        },
    });
}
