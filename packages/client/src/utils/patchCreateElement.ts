// 处理script加载时异步文件加载问题

// 处理 webpack 的async chunk
import * as ErrorStackParser from 'error-stack-parser';
import type { JModuleManager } from '../globalManager';
import type { Resource } from '../resource';

function getJModuleFromByFakeError(err: Error, manager: typeof JModuleManager): Resource|undefined {
    let resource: Resource | undefined = undefined;
    console.log(ErrorStackParser.parse(err));
    (ErrorStackParser.parse(err) || []).find(
        ({ fileName }) => (fileName && (resource = manager.resource(fileName)), !!resource)
    );
    return resource;
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
            const resource = getJModuleFromByFakeError(new Error('[JModule]'), manager);
            if (!resource) {
                return originRes;
            }
            originRes.dataset.jmoduleFrom = resource?.url;
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
                    originRes.setAttribute(prop, resource?.resolveUrl(targetUrl) || targetUrl);
                },
            });
            return originRes;
        },
    });
}
