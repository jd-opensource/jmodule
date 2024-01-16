// 处理script加载时异步文件加载问题

// 处理 webpack 的async chunk
import * as ErrorStackParser from 'error-stack-parser';
import type { JModuleManager } from '../globalManager';

function getJModuleFromByFakeError(err: Error, manager: typeof JModuleManager) {
    let jmoduleFrom: string|null = null;
    (ErrorStackParser.parse(err) || []).find(
        ({ fileName }) => (jmoduleFrom = manager.getResourceUrlByAsyncFile(fileName), !!jmoduleFrom)
    );
    return jmoduleFrom;
}

export function patchCreateElement(originalCreateElement: typeof document.createElement) {
    const manager: typeof JModuleManager = window.JModuleManager;
    // eslint-disable-next-line no-underscore-dangle
    if ((document.createElement as any).__original__) {
        return;
    }

    (document.createElement as any).__original__ = originalCreateElement;
    document.createElement = new Proxy(document.createElement, {
        apply(target, context, args) {
            const originRes: HTMLElement = originalCreateElement(args[0], args[1]);
            if (!['script', 'link', 'style'].includes(args[0])) {
                return originRes;
            }

            // 查找执行 createElement 的脚本
            const jmoduleFrom = getJModuleFromByFakeError(new Error('[JModule]'), manager);
            originRes.dataset.jmoduleFrom = jmoduleFrom || '[host]';
            if (args[0] === 'style') {
                return originRes;
            }
            const prop = args[0] === 'script' ? 'src' : 'href';
            // 防御性代码
            const descriptor = Object.getOwnPropertyDescriptor(originRes, prop);
            if (descriptor && !descriptor.configurable) {
                return originRes;
            }
            Object.defineProperty(originRes, prop, {
                get() {
                    return originRes.getAttribute(prop);
                },
                set(targetUrl) {
                    const resource = manager.resource(jmoduleFrom || targetUrl);
                    const resolvedUrl = resource?.resolveUrl(targetUrl) || targetUrl;
                    originRes.setAttribute(prop, resolvedUrl);
                },
            });
            return originRes;
        },
    });
}
