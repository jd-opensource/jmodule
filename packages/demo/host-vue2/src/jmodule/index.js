import { JModule, Resource } from '@jmodule/client';
import { JMODULE_TYPE_APP, JMODULE_TYPE_MODULE } from './type';
import { appAdapter } from './appAdapter';
import { moduleAdapter } from './moduleAdapter';
import './shareData';

Resource.enableAsyncChunk();

window.JModule = JModule;
window.__JMODULE_HOST__ = 'host2-vue2';

JModule.addHook('afterInit', (module, pkg) => {
    if (module.type === JMODULE_TYPE_APP) {
        // eslint-disable-next-line no-debugger
        return appAdapter(module, pkg);
    }
    if (module.type === JMODULE_TYPE_MODULE) {
        return moduleAdapter(module, pkg);
    }
    return [module, pkg];
});


// allModules
const modules = []

window.addEventListener('module.afterRegister', ({ detail }) => {
    modules.push(...detail);
});

export { modules };
