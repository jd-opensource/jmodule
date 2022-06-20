import Vue from 'vue';
import VueRouter from 'vue-router';
interface CreateInstance {
    (router?: VueRouter): Vue;
}
interface CreateRouter {
    (base: string): VueRouter;
}
declare const _default: (appKey: string, createInstance: CreateInstance, createRouter?: CreateRouter | undefined, exports?: Record<string, any> | undefined, imports?: string[] | undefined) => any;
export default _default;
