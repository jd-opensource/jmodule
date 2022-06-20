import { JModule, ModuleMetadata } from '@jmodule/client';
import { RouteConfig, default as VueRouter } from 'vue-router';
import { Store } from 'vuex';
export declare type Vue2RouteTypeMetadata = ModuleMetadata & {
    storeModules?: Record<string, any>;
    route: RouteConfig;
};
declare const _default: (router?: VueRouter | undefined, store?: Store<any> | undefined, routeAdapter?: (module: JModule, route: RouteConfig) => RouteConfig) => (module: JModule, options: Vue2RouteTypeMetadata) => {
    activate(): Promise<void>;
    deactivate(): Promise<void>;
};
export default _default;
