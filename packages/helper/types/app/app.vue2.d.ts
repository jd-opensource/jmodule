import Vue from 'vue';
import VueRouter from 'vue-router';
interface CreateInstance {
    (router?: VueRouter): Vue;
}
interface CreateRouter {
    (base: string): VueRouter;
}
declare const _default: (appKey: string, createInstance: CreateInstance, createRouter?: CreateRouter, exports?: Record<string, any>, imports?: string[]) => any;
export default _default;
