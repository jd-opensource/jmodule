# @jmodule-demo/child-app-angular

    项目源于 angular 官方文档指南

## 环境

主应用: @jmodule/client >= 4.4.5

子应用: @jmodule/plugin-webpack >= 0.4.7

## 接入步骤

### 编译过程
1. 安装 @angular-builders/custom-webpack, 用于支持自定义webpack插件

2. 修改 angular.json (以 @angular-builders/custom-webpack 的使用文档为准)
    
        1. projects.angular.io-example.architect.build.builder: @angular-builders/custom-webpack:browser

        2. projects.angular.io-example.architect.build.options.customWebpackConfig: { "path": "./jmodule-plugin.js" }
    
        3. projects.angular.io-example.architect.serve.builder: @angular-builders/custom-webpack:dev-server

3. 新增文件 jmodule-plugin.js
    
        如果复制到自己的项目, 请自行替换 childAppAngular 为自己期望的 moduleKey, 其它参数的含义及修改参考[@jmodule/plugin-webpack使用文档](https://jmodule.jd.com/resource/plugin-webpack/)

### 运行时代码
1. 修改 src/main.ts 以添加 JModule.define 声明
    
        1. 使用时请自行替换 childAppAngular 为自己期望的 moduleKey;

        2. 遵循主应用约定修改 if 判断条件;
        
        3. 推荐修改 app-root 为其它有明确含义的名字(需同时修改 root component 里的声明)

2. 修改 src/app/app.module.ts 以支持 baseURL

    ```javascript
    providers: [{
        provide: APP_BASE_HREF,
        useValue: '/childAppAngular/', // 按主应用约定修改
    }],
    ```
3. 修改 src/app/styles.css
    
    增加样式规则前缀, 避免全局污染


## 注意事项
    angular 引入的zone.js, 会修改全局的异步的函数, 比如 window.Promise, 且该 Promise 内部存在循环引用, 不能对其执行 JSON.stringify, 主应用当谨慎对待


规避子应用的全局hack 可能的解决方案(推荐级别: 建议, 实现方: 主应用):

这也是一种自定义沙箱的实现, 对 css 做 hack 也可以通过该 hook 实现
    
```javascript
import { ResourceLoadStrategy, Resource } from '@jmodule/client';

// 使用 fetch 方式加载子应用
new JModule({
    ...others,
    type: 'app',
    resourceLoadStrategy: ResourceLoadStrategy.Fetch,
})

// 隔离 window
const originWindow = window;
const createWindow = (sourceUrl) => {
    const windowCache = new Map();
    // 同一个子应用共享 window
    if (windowCache.get(sourceUrl)) {
        return windowCache.get(sourceUrl);
    }
    const localWindow = Object.assign({}, window);
    //
    //  这里需要完善 localWindow 细节
    //
    windowCache.set(sourceUrl, localWindow);
    return localWindow;
};

// 沙箱实现
Resource.addHook('resource:transformFetchResult', ({ resource, buffer, ...others }) => {
    if (!options.type.includes('javascript') || !(options.buffer instanceof Uint8Array)) {
        return [options];
    }
    const CodePrefix = '((context) => {const window = createWindow(context.sourceUrl); with(window){';
const CodeSuffix = (sourceUrl: string, currentUrl: string) => `\n}})({ sourceUrl: '${ sourceUrl }', currentUrl: '${ currentUrl }' })`;

    return [{
        ...others,
        resource,
        buffer: new Uint8Array([
            ...encoder.encode(CodePrefix),
            ...buffer,
            ...encoder.encode(`${CodeSuffix(options.sourceUrl, options.currentUrl)}`),
        ]),
    }];
});
```
