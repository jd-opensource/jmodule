import Vue from 'vue'
import { JModule } from '@jmodule/client';
import App from './App.vue'
import { initRouter } from './router'
import Vue2AppDefine from '@jmodule/snippet/app/app.vue2';

Vue.config.productionTip = false

if (window.__JMODULE_HOST__) {
  // 创建一个 app 类型的子应用
  Vue2AppDefine(
    'childAppVue2',
    router => new Vue({ router, render: h => h(App) }),
    base => initRouter(base, true),
  );
  
  /* ***********
   *
   *  案例演示：
   *    1. 不同类型（app VS module）子应用的使用差异
   *    2. 在同一个文件同时声明两个应用
   * 
   *  该 Demo 与上面的案例彼此独立，无必然联系；
   *  且在日常开发中，这两种方式通常不在一个项目中同时使用。
   * 
   *  Warning:
   *  通常情况下，这种模式需要将对Vue、router等引用(也可能是React，与宿主应用提供的接口有关)
   * 指向宿主应用（配合 plugin-webpack 实现）而不是使用自己的。
   *  
   * ***********/
  // 创建一个 module 类型的子应用
  const ChildModuleKey = 'childModuleVue2';
  // eslint-disable-next-line no-undef
  JModule.define(ChildModuleKey, {
    route: {
      path: '',
      name: 'ChildModuleDefaultRoute',
      component: {
        render: h => h('h2', 'My Name is childModuleVue2'),
      },
    },
  });
} else {
  new Vue({
    router: initRouter('/'),
    render: h => h(App)
  }).$mount('#app')
}

