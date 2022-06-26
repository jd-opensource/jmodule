# JModule devtool
JModule 框架调试工具
## 环境要求
1. nodejs: v16+
2. pnpm: v6.32.1

## 开发

```bash
# 安装 web-ext
npm install --global web-ext

# 安装依赖
pnpm install

# 开发模式
pnpm run watch

# 使用Chrome调试
web-ext run -t chromium

# 使用 firefox 调试
web-ext run -t firefox-desktop

```

## 说明及运行Demo
该开发工具用于对 JModule 框架构建的网站进行调试。

使用 demo 项目进行测试

### 启动所有子项目
pnpm run serve --filter "*child*"

### 启动宿主应用并自动加载以上子应用
pnpm run serve:modules --filter "*host*"

访问 http://localhost:8093, 打开开发者面板，切换到 JModule panel 即可。

## 预览
![Preview](./media/preview1%402x.png)
![Preview](./media/preview2%402x.png)
