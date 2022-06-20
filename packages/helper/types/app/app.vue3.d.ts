import { App } from 'vue3';
import { Router } from 'vue-router4';
interface CreateInstance {
    (router?: Router): App;
}
interface CreateRouter {
    (base: string): Router;
}
declare const _default: (appKey: string, createInstance: CreateInstance, createRouter?: CreateRouter | undefined, exports?: Record<string, any> | undefined, imports?: string[] | undefined) => any;
export default _default;
