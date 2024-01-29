import { JModule } from '@jmodule/client';
import { App } from 'vue3';
import { Router } from 'vue-router4';

interface CreateInstance {
    (router?: Router): App;
}

interface CreateRouter {
    (base: string): Router;
}

export default (
    appKey: string,
    createInstance: CreateInstance,
    createRouter?: CreateRouter,
    exports?: Record<string, any>,
    imports?: string[],
) => JModule.define(appKey, {
    mount(module: JModule, el: HTMLDivElement) {
        // 因为可能会重复挂载和卸载，需要创建新的实例后直接挂载
        const instance = createInstance(createRouter?.(`/${module.key}`)); // 埋点
        instance.mount(el);
        // unmount
        return () => instance.unmount();
    },
    exports,
    imports,
});
