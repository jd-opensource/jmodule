import { createApp } from 'vue'
import App from './App.vue'
import Vue3AppDefine from '@jmodule/snippet/app/app.vue3';

if (window.__JMODULE_HOST__) {
    // 创建一个 app 类型的子应用
    Vue3AppDefine('childAppVue3', () => createApp(App));
} else {
    createApp(App).mount('#app')
}
