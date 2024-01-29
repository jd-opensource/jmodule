import { JModule } from '@jmodule/client';
import Vue from 'vue';
import VueRouter from 'vue-router';

let router: VueRouter|undefined;

interface CreateInstance {
    (router?: VueRouter): Vue;
}

interface CreateRouter {
    (base: string): VueRouter;
}

export default (
    appKey: string,
    createInstance: CreateInstance,
    createRouter?: CreateRouter,
    exports?: Record<string, any>,
    imports?: string[],
) => JModule.define(appKey, {
    bootstrap: (module: JModule) => {
        router = createRouter?.(`/${module.key}`);
    },
    mount(module: JModule, el: HTMLDivElement) {
        const instance = createInstance(router);
        instance.$mount(el);

        // unmount
        return () => {
            instance?.$destroy();
            instance?.$el?.remove();
        };
    },
    exports,
    imports,
});
