# JModule 
一个微前端框架，用于帮助前端项目进行融合与拆解，适用于大型应用的拆分、插件系统实现、多应用融合场景。

## 特性
### 支持项目集成开发
提供webpack插件，满足子应用在开发过程中与宿主应用集成调试的需求。

### 多种接入模式
可以扩展应用接入模式，比如可以用于插件系统实现、动态路由集成，或者是一个完整的前端应用。常用的接入模式支持已通过 @jmodule/helper 提供支持。

### 多级应用结构
支持子应用嵌套，子应用本身也可以是宿主应用，但仍以自应用的方式接入其它宿主应用。


## 安装

```bash
npm install @jmodule/client

# 开发插件安装
npm install @jmodule/plugin-webpack
```
### SCENE: 作为子应用接入宿主应用
```javascript
// 在 webpack 配置中增加
import WebpackJmodulePlugin from '@jmodule/plugin-webpack';

module.exports = {
  plugins: [
    new WebpackJmodulePlugin({
      mode: 'modules',
      devConfig: { // 开发联调时配置
        currentServer: 'http://localhost:8084', // 子应用 server
        platformServer: 'http://platformServer.com', // 主应用 server
        platformLocalPort: 8088, // 本地联调端口
        onAllServerReady: () => { // 所有服务就绪
            console.log('ALL SERVER READY!');
            opn('http://localhost:8088');
        },
      },
    }),
  ];
}

// 在入口文件中添加
JModule.define(moduleKey, { mount() {} })
```

### SCENE: 作为宿主应用加载子应用
```javascript
npm i @jmodule/client

import { JModule } from '@jmodule/client'

JModule.registerModules([
    key: 'childApp',
    url: 'http://localhost:8080',
]).then(modules => modules.forEach(module => module.load()));

// 通过 afterInit hook 注入子应用路由进行其它操作
JModule.registerHook('afterInit', (module, options) => {
  const { routes } = options || {};
  router.addRoutes(routes);
});

```

## Example
```bash
# 源码项目采用 pnpm 进行管理，需要先安装 pnpm
npm i -g pnpm

# Demo 代码位于 packages/demo

# 安装项目依赖
pnpm i

#### 完整示例
# 启动所有子项目
pnpm run serve --filter "*child*"

# 启动宿主应用并自动加载以上子应用
pnpm run serve:modules --filter "*host*"

#### 单应用调试
# 以纯净模式启动宿主应用（与前面含子应用的启动的示例相区别）
pnpm run serve --filter "@jmodule-demo/host-vue2"
# 启动指定的子应用，并在宿主应用中进行集成调试
pnpm run serve --filter "@jmodule-demo/child-app-react"
```

## 文档  
[文档](https://jmodule.jd.com)


## 浏览器插件

查看应用基本信息、资源信息，以及从注册到加载过程的事件触发时间信息。
### 预览
Dashboard
![Dashboard](./packages/devtool/media/preview1%402x.png)
资源信息
![资源信息](./packages/devtool/media/preview2%402x.png)
事件
![事件](./packages/devtool/media/preview3%402x.png)

### 安装地址
[chrome 应用商店](https://chrome.google.com/webstore/detail/jmodule-devtool/egoehonhiiogmmcdjaaakbpmnahcjgpd?hl=zh-CN)

[firefox 应用商店](https://addons.mozilla.org/zh-CN/firefox/addon/jmodule-devtool/?utm_source=addons.mozilla.org&utm_medium=referral&utm_content=search)

## License
[License](LICENSE)

## 微信交流群
![京东行云开源交流群](./assets/weixin-group.png)

