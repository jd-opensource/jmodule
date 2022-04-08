# @jmodule/client

该项目用于子模块/子应用加载、数据共享

### 方法

#### prototype.addRoutes

```
jRouter.addRoutes(newRoutes = [], parentRouterName)
```

## DepResolver
    为不同的 module 分发不同的对象，可以避免模块互相影响

#### Constructor
``` javascript
/**
 * 为不同的 module 分发不同的对象，可以避免模块互相影响
 *
 * @param  {String} sourceModuleKey 引用这个对象的模块
 * @param  {Boolean} cachable        缓存DepResolver的解析结果，默认为 true
 * @return {Object}
 */
new DepResolver(sourceModuleKey, cachable) => {
    return Object.create(axios);
});

JModule.export({
    $node_modules: {
        axios: new DepResolver((sourceModuleKey) => {
            console.log(sourceModuleKey);
            return Object.create(axios);
        }),
    },
});
```

## JModule

### 方法
#### Constructor
```
    new JModule({
        key,  //'模块的key, 全局唯一，与JModulePackage对应',
        url,  // 模块的url, .js|.json文件
        parentRouterName, // 父级路由
        entryPoint, // 挂载点
    });
```

#### require
    引用模块在exports中暴露的方法或属性，返回一个Promise

```
# in pipeline module
JMdoule.define({
    ...,
    exports: {
        models: PipelineApp,
    }
})

# in other module
const getPipelineApp = JModule.require('pipeline.models.PipelineApp');

getPipelineApp.then((PipelineApp) => {
    const pipelineAppIns = new PipelineApp({ appId: this.appId });
});

```

#### registerModules
    注册模块

```
JModule.registerModules([{
    type: 'page',
    key: 'pipeline',
    name: 'pipeline',
    parentRouterName: 'pipelineLayout',
    url: 'http://localhost:8080/modules/pipeline/index.json',
}]);

```

#### loadResource
    加载 js/css文件

#### export
    用于暴露全局的对象

```
# in platform
JModule.exports({
    $platform: {
        store,
        utils,
    },
    $node_modules: {
        vue: Vue,
        moment,
    },
});

# in module
import vue from '$node_modules.vue'

```

#### define
    定义模块

``` javascript
JModule.define('pipeline', {
    imports: [], // 定义模块依赖
    router, // 路由
    init(module) {}, // module 为JModule 实例
    exports: {}, // 对外API
    store: {}, // vuex 模块
})
```

#### getModule
    跟据 moduleKey 获取 module 实例

#### registeredModules
    获取已注册的模块列表

#### prototype.load
    加载模块的资源

```
JModule.registeredModules.forEach(item => item.load())
```

### 属性

#### prototype.key
    模块 key

#### prototype.url
    模块加载地址

#### prototype.parentRouterName
    挂载模块的父级路由名称

#### prototype.entryPoint[暂时无用]
    用于挂载模块的元素

#### prototype.status
    模块状态

#### prototype.server
    模块资源地址, 默认提取从 url 中提取 origin

#### prototype.isRemoteModule(Deprecated)
    是否为远程模块

#### prototype.domain(Deprecated)
    模块资源所在域


### 事件

#### 事件类型

##### window#module.[moduleKey].[moduleStatus]  => [模块状态改变]
        moduleStatus 为以下几种状态： {
            done: '模块编译成功', [ 此时路由已经注册 ]
            inited: '创建模块实例',
            loading: '正在加载模块',
            loaded: '模块加载完成',
            loadFailure: '模块加载或编译失败',
        }

##### window#module.[moduleKey].statusChange  => [模块状态改变]

##### window#module.afterRegister => [注册模块事件]

#### DEMO

``` javascript

#  事件参数在 event 对象的 detail 中，这是由[DOM规范](https://dom.spec.whatwg.org/#interface-customevent)定义的

# 监听特定模块特定状态的改变
window.addEventListener(module.pipeline.done, ({ detail: moduleInstance }) => {
    # 参数为模块实例
    console.log(moduleInstance);
});

# 监听特定模块所有状态变化
window.addEventListener(module.pipeline.statusChange, ({ detail: moduleInstance }) => {
    # 参数为模块实例
    console.log(moduleInstance.status);
});

// 监听注册模块事件
window.addEventListener(module.afterRegister, ({ detail: moduleList }) => {
    // moduleList 为模块实例列表
    console.table(moduleList);
});

```

### 预配置
```
window.JModule = window.JModule || {};
window.JModule.config = {
    debug: true, # 开启调试模式
    filter(moduleConf) { # 注册模块时过滤不合符条件的模块，开发时可用于过滤对应的生产环境模块
        return true;
    },
    resolveModule(moduleKey) { # 跟据 key 自动查找模块配置
        return Promise.resolve(moduleConf);
    },
};
```
const { filter, resolveModule, debug } = (window.JModule || {}).config || {};

### 调试
    JModule.debug = true;

