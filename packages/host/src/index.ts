import { JModule, ModuleMetadata } from '@jmodule/client';

const areaCache: Record<string, HTMLDivElement> = {};
const mountTimes: Record<string, number> = {};
const bootstrapped: Record<string, boolean> = {};
let lastActivatedModuleKey: string|null = null;

async function initAndGetArea(module: JModule, areaEl: Element) {
    areaCache[module.key] = areaCache[module.key] || document.createElement('div');
    areaEl.appendChild(areaCache[module.key]);
    return areaCache[module.key];
}

async function bootstrapModule(module: JModule) {
    await module.load();
    await module.hooks.complete;
    if (!bootstrapped[module.key]) {
        await module.metadata?.bootstrap?.(module);
        bootstrapped[module.key] = true;
    }
}
async function mountModule(module: JModule, parentEl: Element) {
    // 执行子函数 mount, 附加传递挂载次数等信息
    module.resource.applyStyle();
    await module.metadata?.mount?.(
        module,
        await initAndGetArea(module, parentEl),
        { mountTimes: mountTimes[module.key] || 0 },
    );
    mountTimes[module.key] = (mountTimes[module.key] || 0) + 1;
}

JModule.defineType('app', (module: JModule, options: ModuleMetadata) => {
    Object.assign(module.metadata, options);
    return {
        async activate(parentEl: Element) {
            if (lastActivatedModuleKey === module.key) {
                return;
            }
            // 初始化新应用
            await bootstrapModule(module);
            // 挂载应用
            await mountModule(module, parentEl);
        },
        async deactivate() {
            const container = areaCache[module.key];
            await module.metadata?.unmount?.(module, container);
            container?.remove();
            module.resource.removeStyle();
            lastActivatedModuleKey = null;
        },
    };
});
