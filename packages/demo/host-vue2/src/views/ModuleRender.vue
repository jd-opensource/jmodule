<template>
  <div :data-module-key="currentModule && currentModule.moduleKey">
      <template  v-if="currentModule">
        <router-view v-if="currentModule.type==='module'" :data-module-key="currentModule.moduleKey" />
        <div v-else app-container :data-module-key="currentModule.moduleKey"></div>
      </template>
  </div>
</template>

<script>
import { JModule } from '@jmodule/client';
import { JMODULE_TYPE_APP } from '../jmodule/type';

const areaCache = {};

async function initAndGetArea(module, areaEl) {
    if (module.type !== JMODULE_TYPE_APP) {
        return;
    }
    if (!areaCache[module.key]) {
        const div = document.createElement('div');
        areaEl.childNodes.forEach(item => item.remove());
        areaEl.appendChild(div);
        areaCache[module.key] = areaEl.firstElementChild;
    } else {
        areaEl.childNodes.forEach(item => item.remove());
        areaEl.appendChild(areaCache[module.key]);
    }
    return areaCache[module.key];
}

const mountTimes = {};
const bootstrapped = {};

export default {
    data() {
        return {
            currentModule: undefined,
        };
    },
    methods: {
        async unmountModule(module) {
            return module && module.metadata?.unmount?.(module, areaCache[module.key]);
        },
        async bootstrapModule(module) {
            await module.load();
            await module.hooks.complete;
            if (!bootstrapped[module.key]) {
                await module.metadata?.bootstrap?.(module);
                bootstrapped[module.key] = true;
            }
        },
        async mountModule(module) {
            // 执行子函数 mount, 附加传递挂载次数等信息
            await module.metadata?.mount?.(
                module,
                await initAndGetArea(module, this.$el.querySelector('[app-container]')),
                { mountTimes: mountTimes[module.key] || 0 },
            );
            mountTimes[module.key] = (mountTimes[module.key] || 0) + 1;
        },
    },
    watch: {
        '$route.path': {
            async handler(n) {
                /* eslint-disable */
                const moduleKey = n.split('/')[1];
                if (moduleKey !== this.currentModule?.key) {
                    // 卸载旧模块。在当前组件但切换了应用，需要卸载
                    await this.unmountModule(this.currentModule);
                    // 获取新模块
                    this.currentModule = await JModule.getModuleAsync(moduleKey);
                    if (!this.currentModule) {
                        throw new Error(`${moduleKey} 未注册`);
                    }

                    // 初始化新应用
                    await this.bootstrapModule(this.currentModule);
                    // 挂载应用
                    await this.mountModule(this.currentModule);
                }
            },
            immediate: true,
        },
    },
}
</script>
