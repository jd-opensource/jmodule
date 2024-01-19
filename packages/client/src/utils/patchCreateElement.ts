// 处理script加载时异步文件加载问题

// 处理 webpack 的async chunk
import * as ErrorStackParser from 'error-stack-parser';
import type { JModuleManager } from '../globalManager';

function getResourceUrlByFakeError(manager: typeof JModuleManager): string|undefined {
    const originLimit = Error.stackTraceLimit;
    Error.stackTraceLimit = 100;
    const err = new Error('[JModule]');
    Error.stackTraceLimit = originLimit;
    let resourceUrl: string | undefined = undefined;
    (ErrorStackParser.parse(err) || []).find(
        ({ fileName }) => (fileName && (resourceUrl = manager.getResourceUrlByUrl(fileName)), !!resourceUrl)
    );
    return resourceUrl;
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
            const resourceUrl = getResourceUrlByFakeError(manager);
            originRes.dataset.jmoduleFrom = resourceUrl;
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
                    const [resolvedUrl, jmoduleFrom] = manager.findResolvedUrlByUrl(targetUrl);
                    if (jmoduleFrom !== resourceUrl) {
                        // 这是一件很奇怪的事
                        console.warn(`[JModule]: 对资源${targetUrl}进行地址修正时遇到一些非确定因素, 请检查其加载情况`);
                    }
                    /* 比如实际存在 asyncFiles 但是不存在于 metadata 里, 比如针对 html 解析的结果 */
                    if (!jmoduleFrom && resourceUrl) {
                        const resource = manager.resource(resourceUrl);
                        originRes.setAttribute(prop, resource?.resolveUrl(targetUrl) || targetUrl);
                        return;
                    }
                    // 兼容之前的逻辑, 优先级大于基于 stackTrace 的判断
                    originRes.setAttribute(prop, resolvedUrl);
                },
            });
            return originRes;
        },
    });
}
