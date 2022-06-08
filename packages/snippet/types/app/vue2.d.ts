import { JModule } from '@jmodule/client';
import Vue from 'vue';
import VueRouter from 'vue-router';
interface CreateInstance {
    (router: VueRouter): Vue;
}
interface CreateRouter {
    (base: string): VueRouter;
}
declare const _default: (appKey: string, createInstance: CreateInstance, createRouter: CreateRouter) => Promise<JModule>;
export default _default;
