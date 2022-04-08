import ModuleRender from '../views/ModuleRender.vue'

let currentModule;

export function createModuleRouter(module, route) {
    return {
        path: module.type === 'app' ? `/${module.key}*` : `/${module.key}`,
        name: module.key,
        component: ModuleRender,
        children: route ? [route] : [],
        redirect: route,
        beforeEnter(to, from, next) {
            // eslint-disable-next-line no-debugger
            if (to.name === module.key) {
                next({ name: module.defaultRouteName });
                return;
            }
            if (currentModule && currentModule.resource && currentModule !== module) {
                currentModule.resource.removeStyle();
            }
            currentModule = module;
            module.load().then((moduleResource) => {
                if (currentModule === module) {
                    moduleResource && moduleResource.applyStyle();
                    next();
                }
            });
        },
    };
}
