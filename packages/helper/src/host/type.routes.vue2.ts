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
        const parent = router?.getRoutes().find(item => item.name === parentRouteName);
        // 设置路由自动跳转
        parent && (parent.redirect = { name: module.metadata.defaultRouteName });
    }
    return {
        async activate() {
            module.resource.applyStyle();
        },
        async deactivate() {
            if (module.resource.setStyleStatus) {
                module.resource.setStyleStatus('disabled');
            } else {
                module.resource.removeStyle();
            }
        },
    };
}
