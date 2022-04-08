import { createModuleRouter } from './utils';
import router from '../router';

export function appAdapter(module, pkg) {
    Object.assign(module.metadata, pkg);
    router.addRoute(createModuleRouter(module));
    return [module, pkg];
}
