import { PageMessageType, ActionForRegister, ActionForStatusChange } from '../config.js';

const registerFn = ({ detail }) => {
    if (window.__jmodule_devtool__) {
        window.removeEventListener('module.afterRegister', registerFn);
        return;
    }
    // 旧版本兼容, 不能处理即时script立即注册的module
    const modules = detail || [];
    modules.forEach((module) => {
        if (!module.key) {
            return;
        }
        window.postMessage({
            type: PageMessageType,
            action: ActionForRegister,
            data: { key: module.key, status: module.status, time: Date.now() },
        });
        window.addEventListener(`module.${module.key}.statusChange`, ({ detail }) => {
            window.postMessage({
                type: PageMessageType,
                action: ActionForStatusChange,
                data: { key: detail.key, status: detail.status, time: Date.now() }
            });
        });
    });
};

window.addEventListener('module.afterRegister', registerFn);

