用于将子应用集成到宿主应用进行开发调试

## 基本概念
子应用服务 + 宿主应用服务 = 集成服务

子应用服务: 通过 --module 参数进行配置, 参数为 url 格式, 附加参数通过 url query 进行配置

宿主应用服务: 通过 --host 参数进行配置, 参数为 url 格式

集成服务: 通过 --target 进行配置, 参数为 url 格式

## 工作原理
集成服务是在用户机器上启动的代理服务, 会代理到 host 参数指定的服务中. 在代理过程中, 在 host 的主页的 head 标签中注入了 module 参数的信息用于调试. 

它与构建工具没有关系.

## 快速开始
```bash
# 一个简单的例子:
#### 随机生成一个本地端口并代理到 https://jmodule.jd.com, 然后自动打开浏览器
npx -p @jmodule/cli-bridge jmodule-bridge start --host 'https://jmodule.jd.com' --open

# 一个常见的场景:
#### 我本地开发了一个应用, 它运行在服务 http://localhost:3000 上, 我希望将它接入宿主(平台)服务上, 宿主服务地址是 http://myhost
#### 然后我自己给这个子应用设定了一个身份标识, 叫 myApp
npx -p @jmodule/cli-bridge jmodule-bridge start \
    --host 'http://myhost' \
    --module "http://localhost:3000?key=myApp&resourceType=html" \
    --open

# 到这里应该能如期工作了
# 当然, 你会看到一个随机生成的调试端口
# 如果希望把这个调试用的端口固定下来, 那就加上 --target 参数
npx -p @jmodule/cli-bridge jmodule-bridge start \
    --host 'http://myhost' \
    --module "http://localhost:3000?key=myApp&resourceType=html" \
    --target "http://localhost:4000"
    --open

# 当然 target 里面的 localhost 也是可以改的, 它其实仅仅影响自动打开浏览器时的地址
```

## 与项目集成
如果经常需要这样的调试操作, 那么可以这么做

### 加入 package.json 的 scripts 中
```bash
npm i @jmodule/cli-bridge -D
# OR
pnpm add @jmodule/cli-bridge -D
```

在 package.json 中配置
```json
{
    "scripts": {
        "dev": "vite",
        "dev:host": "jmodule-bridge start --host \"http://myhost\" --module \"http://localhost:3000?key=myApp&resourceType=html\" --open"
    }
}
```

启动它
```bash
npm run dev:host

# OR, 与开发服务同时启动
npm run dev & npm run dev:host
```

### 也可以将参数配置固化到 package.json
```json
{
    "scripts": {
        "dev": "vite",
        "dev:host": "jmodule-bridge start"
    },
    "jmodule": {
        "host": "http://myhost",
        "target": "http://localhost:4000",
        "modulesConfig": {
            "myApp": {
                "url": "http://localhost:3000",
                "resourceType": "html"
            }
        }
    }
}
```
这样就可以去掉命令行的参数了.

## 高级用法
### 通过API调用
```js
const { startServer } = require('@jmodule/cli-bridge');

const options = await startServer({
    host: 'http://myhost',
    modulesConfig: {
        a: {
            url: 'http://mychild:3000',
            resourceType: 'html'
        },
    },
    target: 'http://localhost:9000', // 可选
});
```

### 复杂的命令
```bash
# 试着完成以下目标:
### 将子应用 moduleKey 为 a, 子应用入口地址为: 'http://mychild:3000/index.js' 
### && 将子应用 moduleKey 为 b、入口地址为: 'http://mychild:3001'、资源类型为 html、子应用类型为 app、使用 fetch 方式加载
### && 在服务地址为 http://myhost 的宿主应用中调试
### && 并且在本地 9000 端口, local.jd.com 域名下进行调试
### && 服务启动后自动打开浏览器
npx -p @jmodule/cli-bridge jmodule-bridge start \
    --module "http://mychild:3000/index.js?key=a" \
    --module "http://localhost:3001?key=b&resourceType=html&type=app&resourceLoadStrategy=0" \
    --host 'http://myhost' \
    --target "http://local.jd.com:9000"
    --open
```

## 获得帮助
```bash
npx -p @jmodule/cli-bridge jmodule-bridge --help
```
结果如下:

    Usage: jmodule-bridge [options] [command]

    JModule 集成调试工具

    Options:
      -V, --version                   output the version number
      -H, --host <host>               宿主应用服务
      -T, --target-port <targetPort>  集成调试服务端口, eg: 9000
      -P, --project-dir <projectDir>  项目目录, 自动从 package.json, .jmodule.conf.js 下读取配置 (default: "./")
      -M, --module <module>           子应用配置, eg: http://localhost:3000?key=mychild
      --open                          自动打开浏览器
      -h, --help                      display help for command

    Commands:
      config                          输出配置信息
      start                           启动集成调试服务
      help [command]                  display help for command

## 优先级问题
1. 从命令行参数读取, 优先级最高
2. 从当前项目 .jmodule.conf.js 文件读取, 优先级次之
3. 从当前项目 package.json 文件中读取 jmodule 配置, 内容相当于 --module 参数, 优先级最低

当读取到多个重名的 moduleKey 时, 按以上优先级执行

## package.json 配置示例

```json
{
    "name": "myPackage",
    "jmodule": {
        "modulesConfig": {
            "key": "b",
            "url": "http://localhost:3000",
            "type": "app",
            "resourceType": "html",
            "resourceLoadStrategy": 0
        },
        "host": "http://host:1234",
        "target": "http://target:4567"
    }
}
```
