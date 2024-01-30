import { JModule } from '../module';
import { Resource } from '../resource';
import { ModuleStatus, ResourceLoadStrategy, ResourceStatus } from '../config';

// 时间、模块、动作、结果/状态
type Action = [number, string, string, any];

const actions: Action[] = [];

const addAction = (() => {
    let timer: NodeJS.Timeout;
    let firstTime = true;
    return (action: Action) => {
        if (firstTime) {
            firstTime = false;
            window.postMessage({ type: 'jmodule:page', action: 'jmodule:ready' });
        }
        actions.push(action);
        clearTimeout(timer);
        timer = setTimeout(async () => {
            window.postMessage({ type: 'jmodule:page', action: 'jmodule:change' });
        }, 300);
    }
})();

function startRecord() {
    actions.push([Date.now(), '__global__', 'startRecord', '']);
    window.addEventListener('module.afterRegister', ({ detail }: CustomEvent<JModule[]>) => {
        const modules = detail || [];
        modules.forEach(({ key, status } = {} as any) => {
            if (!key) { return; }
            addAction([Date.now(), key, 'module', ModuleStatus[status]]);
            window.addEventListener(`module.${key}.statusChange`, ({ detail }: CustomEvent<JModule>) => {
                addAction([Date.now(), key, 'module', ModuleStatus[detail.status]]);
            });
            window.addEventListener(`resource.${key}.statusChange`, ({ detail }: CustomEvent<Resource>) => {
                addAction([Date.now(), key, 'resource', ResourceStatus[detail.status]]);
            });
        });
    });
}

export function enableDevtool() {
    startRecord();
    if (!window.__jmodule_devtool__) {
        window.__jmodule_devtool__ = {
            getActionsFromIndex(i = 0) {
                return actions.slice(i);
            },
            getDefinition() {
                return { ModuleStatus, ResourceStatus, ResourceLoadStrategy };
            },
        };
    }
}
