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
    getParentRouteName?: (module: JModule) => string,
) => function routesAdapter(module: JModule, options: Vue2RouteTypeMetadata) {
    const { route, storeModules } = options;
    const parentRouteName = getParentRouteName?.(module) || module.key;
    if (store && storeModules) {
        Object.keys(storeModules).forEach((storeModuleName) => {
            store.registerModule(storeModuleName, storeModules[storeModuleName]);
        });
    }
    if (router && route) {
        router.addRoute(parentRouteName, route);
        module.metadata.defaultRouteName = route.name;
    }
    return {
        async activate() {
            module.resource.applyStyle();
            const { currentRoute } = router || {};
            if (router && currentRoute && (currentRoute.name === parentRouteName)) {
                const parent = router?.getRoutes().find(item => item.name === parentRouteName);
                parent && (parent.redirect = { name: module.metadata.defaultRouteName });
            }
        },
        async deactivate() {
            module.resource.removeStyle();
        },
    };
}
