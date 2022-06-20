<template>
    <div class="root">
        <div class="list">
            <div class="dashboard-trigger" @click="() => currentModule = undefined">概览</div>
            <transition-group tag="div" class="module-list" name="list">
                <module-item
                    :class="{'module-trigger': true, 'module-trigger--active': currentModule === item}"
                    v-for="item in modules"
                    :key="item.key"
                    :module="item" 
                    @click="() => currentModule = item" />
            </transition-group>
        </div>
        <div class="data-module" v-if="currentModule">
            <div class="module-header">
                <h3 class="module-title">
                    {{ currentModule.name || currentModule.ket }}({{ currentModule.key }})
                </h3>
                <div class="tab-list">
                    <div
                        :class="{'tab-item': true, 'tab-item--active': currentTab === tab}"
                        v-for="tab in tabs"
                        :key="tab.name"
                        @click="() => currentTab = tab"
                    >{{ tab.alias }}</div>
                </div>
            </div>
            <div class="tab-content">
                <component
                    :is="currentComponent"
                    :module="currentModule"
                    :resource="currentResource"
                    :startTime="startTime"
                    :actions="currentActions" />
            </div>
        </div>
        <div class="data-global" v-else>
            <h3 class="global-title">全局配置</h3>
            <modules-dashboard
                class="global-content"
                :modules="modules"
                :actions="sessionData.actions" />
        </div>
    </div>
</template>

<script>
import browser from 'webextension-polyfill';
import ModuleItem from './components/module-item.vue';
import ModuleInfo from './components/info.vue';
import { connect } from './message';
import { tabs } from './components/config';
import TabEvent from './components/tab-event.vue';
import TabModule from './components/tab-module.vue';
import TabResource from './components/tab-resource.vue';
import ModulesDashboard from './components/dashboard.vue';

const pageEval = browser.devtools.inspectedWindow.eval;
const registeredModules = '(window.JModuleManager && window.JModuleManager.registeredModules) || (window.JModule && window.JModule.registeredModules) || []';

export default {
    components: {
        ModuleItem,
        ModuleInfo,
        ModulesDashboard,
    },
    data() {
        return {
            tabs,
            currentTab: tabs[0],
            modules: [],
            currentModule: null,
            sessionData: {
                startTime: 0,
                actions: {},
            },
            components: Object.freeze({
                Resource: TabResource,
                Module: TabModule,
                Event: TabEvent,
            }),
        };
    },
    computed: {
        currentComponent() {
            return this.components[this.currentTab.name];
        },
        currentActions() {
            if (!this.currentModule) {
                return [];
            }
            return this.sessionData.actions[this.currentModule.key] || [];
        },
        startTime() {
            return this.sessionData.startTime;
        },
        currentResource() {
            if (!this.currentModule) {
                return [];
            }
            return this.currentModule.resource;
        },
    },
    mounted() {
        this.getModules();
        connect(this.onMessage, this.onInit, this.onDestroy);
    },
    methods: {
        onDestroy() {
            this.sessionData = {};
            this.modules = [];
            this.currentModule = null;
        },
        onMessage(options = {}) {
            console.log(options.data);
            // 与上次的对比
            const changedKeys = Object.keys(options.data).filter(key => {
                return key && (this.sessionData.actions[key]?.length !== options.data[key].length);
            })
            this.refreshModules(changedKeys);
            this.sessionData.actions = options.data;
        },
        async refreshModules(moduleKeys) {
            const [modules = []] = await pageEval(`JSON.parse(JSON.stringify(${registeredModules}.filter(module => ${JSON.stringify(moduleKeys)}.includes(module.key))))`);            
            const originModulesMap = this.modules.reduce((res, module, i) => {
                return { ...res, [module.key]: i };
            }, {});
            modules.forEach(item => {
                if (originModulesMap[item.key] !== undefined) {
                    Object.assign(this.modules[originModulesMap[item.key]], item);
                } else {
                    this.modules.push(item);
                }
            });
            this.modules = (this.modules || []).sort((a, b) => a._status > b._status ? -1 : 1);
        },
        onInit({ data } = {}) {
            this.sessionData.startTime = data.startTime;
        },
        async getModules() {
            const [modules = []] = await pageEval(`JSON.parse(JSON.stringify(${registeredModules}))`);
            this.modules = modules.sort((a, b) => a._status > b._status ? -1 : 1);
        },
    },
};
</script>

<style>
    *{
        --primary-color: rgb(26 115 232);
        --border: 1px solid #e6e6e6;
        --top-height: 33px;
        --gutter: 8px;
        --gutter-half: 4px;
        --gutter-double: 16px;
        box-sizing: border-box;
    }
    body{
        padding: 0;
        margin: 0!important;
        box-sizing: border-box;
        height: 100vh;
        overflow: hidden;
    }
</style>
<style scoped>
.root {
    display: flex;
    flex-direction: row;
    height: 100vh;
}
.list{
    border-right: var(--border);
    height: 100vh;
    min-width: 200px;
}
.dashboard-trigger{
    height: var(--top-height);
    border-bottom: var(--border);
    padding: var(--gutter) var(--gutter-double);
    cursor: pointer;
    font-size: 16px;
    line-height: 1;
}
.data-module,
.data-global{
    height: 100vh;
    flex: 1;
}
.module-list{
    height: calc(100% - 34px);
    padding: var(--gutter);
    overflow: auto;
}
.module-trigger{
    height: 32px;
    line-height: 32px;
    cursor: pointer;
    padding: 0 var(--gutter);
    border-radius: 4px;
}
.module-trigger--active,
.module-trigger:hover{
    background-color: rgb(56 121 217 / 10%);
}

/** tab panel **/
.module-header{
    border-bottom: var(--border);
    width: 100%;
}
.module-header,
.tab-list{
    display: flex;
    align-items: center;
    height: var(--top-height);
}
.tab-item{
    border-left: var(--border);
    margin: var(--gutter-half) 0;
    padding: 0 var(--gutter);
    width: auto;
    font-size: 14px;
    cursor: pointer;
}
.tab-item:first-child{
    border: none;
}
.tab-item--active,
.tab-item:hover{
    color: var(--primary-color);
}
.tab-item--active{
    font-weight: 600;
}
.tab-content{
    padding: var(--gutter) var(--gutter-double) var(--gutter-double);
    overflow: auto;
    height: calc(100% - 34px);
}

/** global panel **/
.global-title,
.module-title{
    padding: var(--gutter) var(--gutter-double);
    margin: 0;
    line-height: 1;
    font-size: 16px;
    font-weight: normal;
}
.global-title{
    height: var(--top-height);
    border-bottom: var(--border);
}
.module-title{
    border-right: var(--border);
}

/** 动画 **/

.list-enter-active,
.list-leave-active,
.list-move {
  transition: 500ms cubic-bezier(0.59, 0.12, 0.34, 0.95);
  transition-property: opacity, transform;
}

.list-enter {
  opacity: 0;
  transform: translateX(50px) scaleY(0.5);
}

.list-enter-to {
  opacity: 1;
  transform: translateX(0) scaleY(1);
}

.list-leave-active {
  position: absolute;
}

.list-leave-to {
  opacity: 0;
  transform: scaleY(0);
  transform-origin: center top;
}
</style>
