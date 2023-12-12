用于将子应用集成到宿主应用进行开发调试

## 基本概念
子应用服务 + 宿主应用服务 = 集成服务

子应用服务: 通过 --module 参数进行配置, 参数为 url 格式, 附加参数通过 url query 进行配置

宿主应用服务: 通过 --host 参数进行配置, 参数为 url 格式

集成服务: 通过 --target-port 进行配置, 参数为端口数字.

## 配置读取
1. 从命令行参数读取, 优先级最高
2. 从当前项目 .jmodule.conf.js 文件读取, 优先级次之
3. 从当前项目 package.json 文件中读取 jmodule 配置, 内容相当于 --module 参数, 优先级最低

当读取到多个重名的 moduleKey 时, 按以上优先级执行

    ```json
    # package.json
    {
        "name": "a",
        "jmodule": {
            "url": "http://localhost:3000",
            "key": "a",
            "type": "app",
            "resourceType": "html",
            "resourceLoadStrategy": 0
        }
    }
    ```

## 安装
```bash
npm i @jmodule/cli-bridge -D
```

## 使用
```bash
# 检查配置
npx jmodule-bridge start

# 启动集成环境服务 
npx jmodule-bridge start \
    --host 'http://jagile.jd.com' \
    --module "http://localhost:3000?key=a" \
    --module "http://localhost:3000?key=b&type=route&resourceLoadStrategy=1" \
    --target-port 4000
```
