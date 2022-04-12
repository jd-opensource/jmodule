# @jmodule-demo/child-app-react

## Project setup
```sh
# 入口文件 src/index.js

# 启动子应用本身(运行在 :3000)
pnpm run serve -- --open

# 启动宿主应用（运行在 :8080）
pnpm run serve --filter "@jmodule-demo/host-vue2"

# 独立使用
http://localhost:3000

# 在宿主应用中集成(运行在 :8090，当子应用、宿主应用都成功启动后，会自动打开浏览器)
http://localhost:8090/childAppReact
```
