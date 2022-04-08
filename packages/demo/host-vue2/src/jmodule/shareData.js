import Vue from 'vue';
import Vuex from 'vuex';
import { JModule } from '@jmodule/client';

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
        vuex: Vuex,
    },
});
