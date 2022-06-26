# JModule devtool

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