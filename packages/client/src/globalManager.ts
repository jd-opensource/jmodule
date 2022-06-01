// 全局环境仅保留一份 JModuleManager，用于多 JModule, Resource 管理

import { resolveUrlByFetch } from './utils/fetchCode';
import { ModuleHook } from './hook';
import { ResourceType } from './config';


function fakeCreateElement(sourceUrl: string, currentUrl: string, originalCreateElement: typeof document.createElement) {
    return new Proxy(originalCreateElement, {
        apply(target, context, args) {
            const originRes = Reflect.apply(target, context, args);
            if (!['script', 'link', 'style'].includes(args[0])) {
                return originRes;
            }
            originRes.dataset.jmoduleFrom = sourceUrl;
            originRes.dataset.loadedBy = currentUrl;
            const prop = args[0] === 'script' ? 'src' : 'href';
            const resourceType = args[0] === 'script' ? ResourceType.Script : ResourceType.Style;
            if (args[0] === 'script' || args[0] === 'link') {
                Object.defineProperty(originRes, prop, {
                    get() {
                        return originRes.dataset.srcRaw;
                    },
                    set(val) {
                        const url = new URL(val, currentUrl).href;
                        originRes.dataset.srcRaw = url;
                        resolveUrlByFetch(url, sourceUrl, resourceType).then((targetUrl) => {
                            originRes.setAttribute(prop, targetUrl);
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

        private static instanceCache: { [id: string]: any } = {};

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

        static registerInstance<T>(type: string, id: string, instance: T) {
            // 根据 type, id 建立索引
            this.instanceCache[`${type}-${id}`] = instance;
        }

        static getInstance<T>(type: string, id: string): T {
            // 根据 type, id 建立索引
            return this.instanceCache[`${type}-${id}`];
        }

        static removeInstance<T>(type: string, id: string) {
            delete this.instanceCache[`${type}-${id}`];
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

export default window.JModuleManager;
