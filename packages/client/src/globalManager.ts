// 全局环境仅保留一份 JModuleManager，用于多 JModule, Resource 管理

import { ModuleStatus } from './config';
import { ModuleHook } from './hook';
import { JModule } from './module';
import { Resource } from './resource';
import { createDocument } from './utils/fakeDocument';
import { patchCreateElement } from './utils/patchCreateElement';
import defineModule from './utils/defineModule';
import { enableDevtool } from './utils/enableDevtool'


if (!(window as any).JModuleManager) {
    const originDocument = document;
    const originCreateElement = originDocument.createElement.bind(originDocument);
    const initialConfig = (((window as any).JModule || {}) as any).config || {};

    (window as any).JModuleManager = class JModuleManager extends ModuleHook {
        private static resourceCache: { [id: string]: Resource } = {};

        private static jmoduleCache: { [id: string]: JModule } = {};

        private static resourceUrlAndModuleKeyMap: Record<string, string[]> = {};

        private static fileMapCache: Record<string, [string, string|undefined]> = {};

        private static fileListCache: string[] = [];

        private static moduleExportsCache: Record<string, any> = {};

        private static moduleExports: Record<string, any> = {};

        static nextJModuleId = 0;

        static defaultJModule?: () => JModule;

        static createDocument(options: { sourceUrl: string, currentUrl: string }) {
            return createDocument(originDocument, originCreateElement, options);
        }

        static getInitialConfig() {
            return initialConfig;
        }

        static getFileMapCache(key: string) {
            return this.fileMapCache[key];
        }

        static setFileMapCache(key: string, val: [string, string]) {
            const oldTarget = this.fileMapCache[key]?.[0];
            if (oldTarget && oldTarget !== val[0]) {
                const errorMessage = `建立异步组件索引 "${key}" 出现冲突，可能会导致异步组件加载异常`;
                console.error(errorMessage, val);
            }
            return this.fileMapCache[key] = val;
        }

        static appendFileList(url: string) {
            this.fileListCache.push(url);
        }

        static getFileList() {
            return this.fileListCache;
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

        /**
         * 获取已注册的应用列表
         * @readOnly
         */
        static get registeredModules(): JModule[] {
            return Object.keys(this.jmoduleCache)
                .map(key => this.jmodule(key))
                .filter(item => !!item) as JModule[];
        }

        static mapResourceUrlAndModuleKey(resourceUrl: string, moduleKey: string) {
            this.resourceUrlAndModuleKeyMap[resourceUrl] = [
                ...(this.resourceUrlAndModuleKeyMap[resourceUrl] || []),
                moduleKey,
            ];
        }

        static getModulesByResourceUrl(resourceUrl: string): JModule[] {
            return (this.resourceUrlAndModuleKeyMap[resourceUrl] || [])
                .map(key => this.jmodule(key))
                .filter(item => !!item) as JModule[];
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

        /**
         * 存储模块暴露的组件
         *
         * @param  {String} moduleKey
         * @param  {any} data
         */
        static cacheModuleExport(moduleKey: string, data: any): void {
            Object.assign(this.moduleExports, { [moduleKey]: data });
        }

        /**
         * 等待模块加载完成
         *
         * @param  {String} moduleKey
         * @example
         * await JModuleManager.waitModuleComplete(moduleKey);
         * @return {Promise<Module>}
         */
        static async waitModuleComplete(moduleKey: string): Promise<JModule> {
            const targetModule = this.jmodule(moduleKey);
            return new Promise((resolve) => {
                if (targetModule && targetModule.status === ModuleStatus.done) {
                    resolve(targetModule);
                } else {
                    const key = `module.${moduleKey}.${ModuleStatus.done}`;
                    window.addEventListener(key, function resolveModule(e) {
                        window.removeEventListener(key, resolveModule);
                        resolve((e as any).detail as JModule);
                    });
                }
            });
        }

        // JModule 兼容功能
        /**
         * 引用其它模块暴露的功能
         *
         * @param  {String} namespace
         * @example
         * JModule.require('pipeline.models.PipelineApp')
         *     .then((PipelineApp) => {
         *         // do something
         *     });
         * @return {Promise<var>}
         */
        static async require(namespace: string): Promise<any> {
            const path = namespace.split('.');
            await this.waitModuleComplete(path[0]);
            if (!this.moduleExportsCache[namespace]) {
                const res = path.reduce((obj, key) => (obj || {})[key], this.moduleExports);
                this.moduleExportsCache[namespace] = res;
            }
            return this.moduleExportsCache[namespace];
        }

        /**
         * 定义模块
         * @param  {String} moduleKey 定义模块唯一标识
         * @param  {Object} metadata  定义模块
         * @param  {Function} [metadata.init<jModuleInstance>] 初始化函数，自动调用
         * @param  {Array<moduleKey>} [metadata.imports] 依赖的模块
         * @param  {Object} [metadata.exports] 对外暴露的功能
         * @example
         * JModule.define('pipeline', {
         *     init(module) {},
         *     routes,
         *     imports: [],
         *     exports: {},
         * });
         */
        static define = defineModule;
    };

    enableDevtool();
    patchCreateElement(originCreateElement);
}

export default (window as any).JModuleManager;
