// 全局环境仅保留一份 JModuleManager，用于多 JModule, Resource 管理

import { ModuleHook } from './hook';
import { createDocument } from './utils/fakeDocument';
import { patchCreateElement } from './utils/patchCreateElement';


if (!window.JModuleManager) {
    const originDocument = document;
    const originCreateElement = originDocument.createElement.bind(originDocument);

    window.JModuleManager = class JModuleManager extends ModuleHook {
        private static instanceCache: { [id: string]: any } = {};

        static createDocument(options: { sourceUrl: string, currentUrl: string }) {
            return createDocument(originDocument, originCreateElement, options);
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

    patchCreateElement(originCreateElement);
}

export default window.JModuleManager;
