import { createApp } from 'vue'
import App from './App.vue'
import { JModule } from '@jmodule/client';

const app = createApp(App);
if (window.__JMODULE_HOST__) {
    // 创建一个 app 类型的子应用
    const ChildAppKey = 'childAppVue3';
    // eslint-disable-next-line no-undef
    // eslint-disable-next-line no-undef
    JModule.define(ChildAppKey, {
        mount(module, el, stats) {
            if (stats.mountTimes === 0) {
                app.mount(el);
            }
        },
    });
} else {
    app.mount('#app')
}
