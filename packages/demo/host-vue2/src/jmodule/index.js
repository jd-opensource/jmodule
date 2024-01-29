import Vue from 'vue';
import { JModule, Resource } from '@jmodule/client';
import AppTypeDefine from '@jmodule/helper/host/type.app';
import Vue2RoutesTypeDefine from '@jmodule/helper/host/type.routes.vue2';
import ResourceHtmlResolver from '@jmodule/helper/host/resource.html';
import ModuleRender from '../views/ModuleRender.vue';
import router from '../router';
import store from '../store';

export const JMODULE_TYPE_APP = 'app';
export const JMODULE_TYPE_MODULE = 'module';

// 增加对完整子应用（微应用）支持
JModule.defineType(JMODULE_TYPE_APP, AppTypeDefine);

// 增加对动态路由类型的子应用（微模块）适配
JModule.defineType(JMODULE_TYPE_MODULE, Vue2RoutesTypeDefine(router, store));

// 
Resource.defineType('html', ResourceHtmlResolver);

// 为子应用增加自己的路由
JModule.addHook('afterInit', (module) => {
    router.addRoute({
        path: module.type === 'app' ? `/${module.key}*` : `/${module.key}`,
        name: module.key,
        component: ModuleRender,
    });
});

JModule.addHook('afterRegisterModules', (modules) => {
    modules.forEach((module) => module.load());
});

// 可以给子应用共享一些组件
// 共享宿主应用的接口给子应用
JModule.export({
    $platform: {
        log(...args) {
            console.group('LogByHost');
            console.log(...args);
            console.groupEnd('LogByHost');
        },
    },
    $node_modules: {
        vue: Vue,
    },
});

// 注册子应用
/***
// 开发环境下插件会自动注入类似注册代码，不需要手动注册

JModule.registerModules([{
    "key": "childAppReact",
    "name": "childAppReact",
    "type": "app",
    "url": "http://localhost:3000/index.js"
}]).then((modules) => {
    modules.forEach(module => module.load());
});

***/
