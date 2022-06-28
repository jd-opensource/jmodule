import { App } from 'vue3';
import { Router } from 'vue-router4';
interface CreateInstance {
    (router?: Router): App;
}
interface CreateRouter {
    (base: string): Router;
}
declare const _default: (appKey: string, createInstance: CreateInstance, createRouter?: CreateRouter, exports?: Record<string, any>, imports?: string[]) => any;
export default _default;
