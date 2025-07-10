# 4.4.3-0 => 4.7.4

## BreakChange
1. ResourceStatus 值变更
2. Resource 移除对 prefix 属性的支持, 同时增加 urlAdapter 属性配置

## Feature
1. 增加对 htmlEntry 的支持
2. 增加对 ESM 脚本的支持(支持 vite 应用)
3. 补充 Angular 应用 Demo
4. @jmodule/bridge  构建框架无关的集成调试工具, 最新版本号 1.2.1
5. [API] JModuleManager 增加 import/export 方法
6. [API] Resource 增加 setStyleStatus()、isESM() 方法
7. 支持对非ESM应用的 style 元素进行打标(用于样式清理)

## Change
1. 调整 @jmodule/client 构建脚本, 打包工具由webpack 调整为 rollup, 同时增加 ESM 格式构建输出
2. 补充代码注释
3. Demo 更新

## Fix
1. 修正 debug 代码打印循环结构Object 的异常问题
2. 已知类型注解问题修正
3. JModule.import 增加对全局 JModule 的支持
