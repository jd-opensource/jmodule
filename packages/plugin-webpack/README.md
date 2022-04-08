# @jmodule/plugin-webpack

代码编译插件，支持：

$module、 $platform、$node_modules、output json Assets、externalAlias

## How To Use
```bash
npm i @jmodule/plugin-webpack -D
```
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
