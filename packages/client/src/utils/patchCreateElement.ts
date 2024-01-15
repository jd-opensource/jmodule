// 处理script加载时异步文件加载问题

// 处理 webpack 的async chunk
import * as ErrorStackParser from 'error-stack-parser';

console.log(ErrorStackParser);

export function patchCreateElement(originalCreateElement: typeof document.createElement) {
    const manager = window.JModuleManager;
    // eslint-disable-next-line no-underscore-dangle
    if ((document.createElement as any).__original__) {
        return;
    }

    const tryGetJmoduleFrom = (val: string) => {
        const files: string[] = manager.getFileList();
        const file = files.find(item => item && val.includes(item));
        return manager.getFileMapCache(file) || [1];
    };

    (document.createElement as any).__original__ = originalCreateElement;
    document.createElement = new Proxy(document.createElement, {
        apply(target, context, args) {
            const originRes: HTMLElement = originalCreateElement(args[0], args[1]);
            if (!['script', 'link', 'style'].includes(args[0])) {
                return originRes;
            }

            // 查找执行 createElement 的脚本
            const { fileName } = (ErrorStackParser.parse(new Error('JModule trace test')) || [])
                .find((stackFrame) => manager.getAsyncResourceAndSourceUrlMap(stackFrame.fileName))
                || {};
            const jmoduleFrom = manager.getAsyncResourceAndSourceUrlMap(fileName);
            originRes.dataset.jmoduleFrom = jmoduleFrom || '[host]';
            if (args[0] === 'style') {
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
                    const resource = manager.resource(jmoduleFrom || tryGetJmoduleFrom(val));
                    const resolvedUrl = resource?.resolveUrl(val) || val;
                    manager.setAsyncResourceAndSourceUrlMap(resolvedUrl, jmoduleFrom);
                    originRes.setAttribute(prop, resolvedUrl);
                },
            });
            return originRes;
        },
    });
}
