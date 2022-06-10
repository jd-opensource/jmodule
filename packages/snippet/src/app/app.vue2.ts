import { JModule } from '@jmodule/client';
import Vue from 'vue';
import VueRouter from 'vue-router';

let instance: Vue;
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
    createRouter?: CreateRouter
) => JModule.define(appKey, {
    bootstrap: (module: JModule) => {
        router = createRouter?.(`/${module.key}`);
    },
    mount(module: JModule, el: HTMLDivElement) {
        instance = createInstance(router);
        instance = instance.$mount(el);
    },
    unmount() {
        instance.$el.remove();
        instance.$destroy();
    },
});
