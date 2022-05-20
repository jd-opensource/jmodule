代码编译插件，用于输入资源元数据文件、集成开发调试，以及一些其它可选的特性。

## 安装
```bash
npm i @jmodule/plugin-webpack -D
```

## 配置
```javascript
// webpack.conf.js
const JModulePlugin = require('@jmodule/plugin-webpack');

module.exports = {
    ...others,
    plugins: [
        new WebpackJmodulePlugin({
            mode: 'modules',
        }),
    ],
}
```
使用参考：[快速开始](https://jmodule.jd.com/guide/快速开始.html)

配置项参考：[快速开始](https://jmodule.jd.com/resource/plugin-webpack/%E9%85%8D%E7%BD%AE%E9%A1%B9.html)

插件参数可以单独放在项目根目录中，通过 .jmodule.conf.js 文件进行配置，仅在插件参数为空时读取该文件。

