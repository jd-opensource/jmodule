import router from '../router';
import store from '../store';
import { createModuleRouter } from './utils';

export function moduleAdapter(module, pkg) {
    const { route, store: storeConfig } = pkg;
    if (storeConfig) {
        Object.keys(storeConfig).forEach((storeModuleName) => {
            store.registerModule(storeModuleName, storeConfig[storeModuleName]);
        });
    }
    if (route) {
        // eslint-disable-next-line no-debugger
        router.addRoute(createModuleRouter(module, route));
        module.defaultRouteName = route.name;
    }
    return [module, pkg];
}
