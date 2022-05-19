代码编译插件，用于输入资源元数据文件、集成开发调试，以及一些其它可选的特性。

## 安装
```bash
npm i @jmodule/plugin-webpack -D
```

## 配置
```javascript
// webpack.conf.js
const JModulePlugin = require(@jmodule/plugin-webpack);

module.exports = {
    ...others,
    plugins: [
        new WebpackJmodulePlugin({
            mode: isModulesMode ? 'modules' : undefined,
            externalAlias: {
                http: '$platform.http',
            },
        }),
    ],
}
```

插件参数可以单独放在项目根目录中，通过 .jmodule.conf.js 文件进行配置，仅在插件参数为空时读取该文件。
参考：
- [子应用进行集成调试](https://github.com/jdtdevops/jmodule/blob/main/packages/demo/child-app-vue3/.jmodule.conf.js)
- [宿主应用进行集成调试](https://github.com/jdtdevops/jmodule/blob/main/packages/demo/host-vue2/.jmodule.conf.js)

