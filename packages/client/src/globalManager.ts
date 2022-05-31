// 全局环境仅保留一份 JModuleManager，用于多 JModule, Resource 管理

import { resolveUrlByFetch } from '../utils/fetchCode';
import { ModuleHook } from './hook';


function fakeCreateElement(sourceUrl, currentUrl, originalCreateElement) {
    return new Proxy(originalCreateElement, {
        apply(target, context, args) {
            const originRes = Reflect.apply(target, context, args);
            if (args[0] === 'script') {
                Object.defineProperty(originRes, 'src', {
                    get() {
                        return originRes.dataset.srcRaw;
                    },
                    set(val) {
                        originRes.dataset.jmoduleFrom = sourceUrl;
                        const url = new URL(val, currentUrl).href;
                        originRes.dataset.srcRaw = url;
                        // 创建一条加载任务，完事后设置 src
                        resolveUrlByFetch(url, sourceUrl, 'application/javascript').then((targetUrl) => {
                            originRes.setAttribute('src', targetUrl);
                        });
                        return true;
                    },
                });
            }
            return originRes;
        },
    });
}

if (!window.JModuleManager) {
    window.JModuleManager = class JModuleManager extends ModuleHook {
        static original = { // 保存一些原始的 window 属性
            createElement: document.createElement,
            pushState: window.history.pushState,
            replaceState: window.history.replaceState,
            addEventListener: window.addEventListener,
        };

        // 资源来源 url, 可以索引到 Resource 实例、JModule 实例
        static createWindow({ sourceUrl, currentUrl }: { sourceUrl: string, currentUrl: string }) {
            return new Proxy(window, {
                get(target, prop, receiver) {
                    const defaultValue = Reflect.get(target, prop, receiver);
                    const res = ModuleHook.runHookSync('window:get', {
                        prop, value: defaultValue, sourceUrl, currentUrl,
                    });
                    return res[0].value;
                },
                set(target, prop, value, receiver) {
                    const res = ModuleHook.runHookSync('window:set', {
                        prop, value, sourceUrl, currentUrl,
                    });
                    Reflect.set(target, prop, res[0].value, receiver);
                    return true;
                },
            });
        }
    };

    // fake document
    ModuleHook.addHook('window:get', (args) => {
        if (args.prop !== 'document') {
            return [args];
        }
        const newDoc = new Proxy(args.value, {
            get(target, prop, receiver) {
                if (prop === 'createElement') {
                    return fakeCreateElement(args.sourceUrl, args.currentUrl, args.value);
                }
                return Reflect.get(target, prop, receiver);
            },
            set(target, prop, value, receiver) {
                Reflect.set(target, prop, value, receiver);
                return true;
            },
        });
        return [{ ...args, value: newDoc }];
    });
}
