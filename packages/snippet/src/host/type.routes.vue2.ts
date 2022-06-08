import { JModule, ModuleMetadata } from '@jmodule/client';
import { RouteConfig, default as VueRouter } from 'vue-router';
import { Store } from 'vuex';

export type Vue2RouteTypeMetadata = ModuleMetadata & {
    storeModules?: Record<string, any>;
    route: RouteConfig;
}

export default (
    router?: VueRouter,
    store?: Store<any>,
    routeAdapter: (module: JModule, route: RouteConfig) => RouteConfig = (module, route) => route,
) => function routesAdapter(module: JModule, options: Vue2RouteTypeMetadata) {
    const { route, storeModules } = options;
    if (store && storeModules) {
        Object.keys(storeModules).forEach((storeModuleName) => {
            store.registerModule(storeModuleName, storeModules[storeModuleName]);
        });
    }
    if (router && route) {
        router.addRoute(routeAdapter(module, route));
        module.metadata.defaultRouteName = route.name;
    }
    return {
        async activate() {
            module.resource.applyStyle();
        },
        async deactivate() {
            module.resource.removeStyle();
        },
    };
}
