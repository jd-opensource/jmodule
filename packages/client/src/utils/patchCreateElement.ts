// 处理script加载时异步文件加载问题

// 处理 webpack 的async chunk
export function patchCreateElement(originalCreateElement: typeof document.createElement) {
    const manager = window.JModuleManager;
    // eslint-disable-next-line no-underscore-dangle
    if ((document.createElement as any).__original__) {
        return;
    }

    const patchElement = (val: string, element: HTMLElement) => {
        const files: string[] = manager.getFileList();
        const file = files.find(item => item && val.includes(item));
        const value = manager.getFileMapCache(file);
        const [targetUrl, jmoduleFrom] = value || [val, undefined];
        element.dataset.jmoduleFrom = jmoduleFrom;
        return targetUrl;
    };

    (document.createElement as any).__original__ = originalCreateElement;
    document.createElement = new Proxy(document.createElement, {
        apply(target, context, args) {
            const originRes: HTMLElement = originalCreateElement(args[0], args[1]);
            if (!['script', 'link'].includes(args[0])) {
                return originRes;
            }
            const prop = args[0] === 'script' ? 'src' : 'href';
            const descriptor = Object.getOwnPropertyDescriptor(originRes, prop);
            if (descriptor && !descriptor.configurable) {
                return originRes;
            }
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
