# @jmodule-demo/host-vue2
宿主应用

## Project setup
```sh
# 入口文件 src/main.js
# 纯净模式启动宿主应用（运行在 :8080）
pnpm run serve

# 含子应用启动宿主应用（运行在 :8080）
pnpm run serve:modules
# 还需要再启动一下子应用
pnpm run serve --filter "@jmodule-demo/child-*"


# 独立使用
http://localhost:8080
```
