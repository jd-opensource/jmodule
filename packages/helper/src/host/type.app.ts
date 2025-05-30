import { JModule, ModuleMetadata } from '@jmodule/client';

const areaCache: Record<string, HTMLDivElement> = {};
const mountTimes: Record<string, number> = {};
const bootstrapped: Record<string, boolean> = {};
let lastActivatedModuleKey: string | null = null;

async function initAndGetArea(module: JModule, areaEl: Element) {
    areaCache[module.key] = areaCache[module.key] || document.createElement('div');
    areaEl.appendChild(areaCache[module.key]);
    return areaCache[module.key];
}

async function bootstrapModule(module: JModule) {
    if (!bootstrapped[module.key]) {
        await module.metadata?.bootstrap?.(module);
        bootstrapped[module.key] = true;
    }
}
async function mountModule(module: JModule, parentEl: Element) {
    // 执行子函数 mount, 附加传递挂载次数等信息
    module.resource.applyStyle();
    const unmountFn = await module.metadata?.mount?.(
        module,
        await initAndGetArea(module, parentEl),
        { mountTimes: mountTimes[module.key] || 0 },
    );
    mountTimes[module.key] = (mountTimes[module.key] || 0) + 1;
    return unmountFn;
}

export type AppTypeMetadata = ModuleMetadata & {
    bootstrap?: (module: JModule) => Promise<void>;
    mount: (module: JModule, parentEl: Element, options: { mountTimes: number }) => Promise<void>;
    unmount?: (module: JModule, parentEl: Element) => Promise<void>;
}

export default function appTypeHandler<AppTypeMetadata>(module: JModule, options: AppTypeMetadata) {
    Object.assign(module.metadata, options);
    let unmountFn = () => void 0;
    return {
        async activate(parentEl: Element) {
            if (lastActivatedModuleKey === module.key) {
                return;
            }
            if (!parentEl) {
                throw new Error('parentEl is required');
            }
            // 初始化新应用
            await bootstrapModule(module);
            // 挂载应用
            unmountFn = await mountModule(module, parentEl);
        },
        async deactivate() {
            const container = areaCache[module.key];
            unmountFn?.();
            await module.metadata?.unmount?.(module, container);
            // vue2 的元素会被替换，需要子应用自己删除
            container?.remove();
            if (module.resource.setStyleStatus) {
                module.resource.setStyleStatus('disabled');
            } else {
                module.resource.removeStyle();
            }
            lastActivatedModuleKey = null;
        },
    };
}
