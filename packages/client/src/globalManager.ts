// 全局环境仅保留一份 JModuleManager，用于多 JModule, Resource 管理

import { ModuleHook } from './hook';
import { JModule } from './module';
import { Resource } from './resource';
import { createDocument } from './utils/fakeDocument';
import { patchCreateElement } from './utils/patchCreateElement';


if (!window.JModuleManager) {
    const originDocument = document;
    const originCreateElement = originDocument.createElement.bind(originDocument);
    const initialConfig = (window.JModule || {}).config || {};

    window.JModuleManager = class JModuleManager extends ModuleHook {
        private static resourceCache: { [id: string]: Resource } = {};

        private static jmoduleCache: { [id: string]: JModule } = {};

        private static resourceUrlAndModuleKeyMap: Record<string, string[]> = {};

        static nextJModuleId = 0;

        static defaultJModule?: () => JModule;

        static createDocument(options: { sourceUrl: string, currentUrl: string }) {
            return createDocument(originDocument, originCreateElement, options);
        }

        static getInitialConfig() {
            return initialConfig;
        }

        static resource(sourceUrl: string, instance?: Resource|null): Resource|undefined {
            if (instance === null) {
                delete this.resourceCache[sourceUrl];
                return;
            }
            if (instance) {
                this.resourceCache[sourceUrl] = instance;
                return instance;
            }
            return this.resourceCache[sourceUrl];
        }

        static jmodule(moduleKey: string, instance?: JModule|null): JModule|undefined {
            if (instance === null) {
                delete this.jmoduleCache[moduleKey];
                return;
            }
            if (instance) {
                this.jmoduleCache[moduleKey] = instance;
                return instance;
            }
            return this.jmoduleCache[moduleKey];
        }

        static mapResourceUrlAndModuleKey(resourceUrl: string, moduleKey: string) {
            this.resourceUrlAndModuleKeyMap[resourceUrl] = [
                ...(this.resourceUrlAndModuleKeyMap[resourceUrl] || []),
                moduleKey,
            ];
        }

        static getModulesByResourceUrl(resourceUrl: string): (JModule|undefined)[] {
            return (this.resourceUrlAndModuleKeyMap[resourceUrl] || []).map(key => this.jmodule(key));
        }

        static getJModuleConstructor(moduleKey: string) {
            const module = this.jmodule(moduleKey);
            if (!module) {
                throw new Error(`Module ${moduleKey} not found`);
            }
            return module.constructor;
        }

        static registerJModule(JModule: () => JModule) {
            if (!this.defaultJModule) {
                // 首次注册的设为默认值，为兼容以前的 window.JModule
                this.defaultJModule = JModule;
            }
            return this.nextJModuleId++;
        }
    };

    patchCreateElement(originCreateElement);
}

export default window.JModuleManager;
