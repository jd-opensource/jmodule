import { PageMessageType, ActionForRegister, ActionForStatusChange } from '../config.js';

const startTime = Date.now();
window.addEventListener('module.afterRegister', ({ detail }) => {
    const modules = detail || [];
    modules.forEach((module) => {
        if (!module.key) {
            return;
        }
        window.postMessage({
            type: PageMessageType,
            action: ActionForRegister,
            data: { key: module.key, status: module.status, time: Date.now() - startTime },
        });
        window.addEventListener(`module.${module.key}.statusChange`, ({ detail }) => {
            window.postMessage({
                type: PageMessageType,
                action: ActionForStatusChange,
                data: { key: detail.key, status: detail.status, time: Date.now() - startTime } });
        });
    });
});

