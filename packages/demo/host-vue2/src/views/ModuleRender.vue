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

export default {
    data() {
        return {
            currentModule: undefined,
        };
    },
    mounted() {
        this.updateModule();
    },
    methods: {
        async updateModule() {
            const moduleKey = this.$route.path.split('/')[1];
            if (moduleKey !== this.currentModule?.key) {
                // 卸载旧模块。在当前组件但切换了应用，需要卸载
                await this.currentModule?.deactivate();
                // 新模块，
                this.currentModule = JModule.getModule(moduleKey);
                // 加载
                this.currentModule.load();
                await this.currentModule.hooks.complete;
                // 激活
                this.$nextTick(() => {
                    this.currentModule.activate(this.$el.querySelector('[app-container]'));
                });
            }
        },
    },
    watch: {
        '$route.path': {
            handler() {
                this.updateModule();
            },
        },
    },
}
</script>
