# 阿里云 + 宝塔 + 域名部署教程

这份教程是按当前项目整理的：

- 前端对外端口：`3456`
- 后端对外端口：`4567`
- 推荐生产编排文件：`docker-compose.postgres.yml`
- 管理后台地址：`/admin`
- LinuxDO OAuth 回调地址：`https://你的域名/callback`

当前项目是前后端分离，但前端容器内已经自带 Nginx 代理 `/api` 到后端，所以正式上线时，宝塔只需要把域名反代到 `127.0.0.1:3456` 即可。

---

## 1. 先决定服务器买哪里

你有两个常见选择：

### 方案 A：阿里云中国香港节点

适合想尽快上线的人。

优点：

- 一般不需要 ICP 备案
- 域名解析后可以直接访问
- 上线速度最快

缺点：

- 中国大陆部分地区访问速度可能不如大陆节点

### 方案 B：阿里云中国内地节点

适合长期正规运营。

优点：

- 大陆访问速度通常更好
- 更适合长期网站运营

缺点：

- 域名在解析到中国内地服务器前，通常需要先完成 ICP 备案
- 备案后还要按要求做公安联网备案

如果你现在只是想先跑起来，建议先买中国香港节点。等业务稳定后，再换中国内地并备案。

---

## 2. 服务器配置建议

建议直接买 ECS。

入门推荐：

- `2核 4G` 内存
- 系统盘 `40G` 起
- 操作系统优先 `Debian 12`
- 开通公网 IP

如果后面用户多、邀请任务多、邮件和同步任务也比较频繁，可以升到 `4核 8G`。

---

## 3. 阿里云控制台先做的事

### 3.1 安全组放行端口

先登录阿里云 ECS 控制台，给实例安全组放行这些端口：

- `22`：SSH 登录服务器
- `80`：HTTP
- `443`：HTTPS
- 宝塔面板端口：安装后用 `bt default` 查看实际端口，再放行

不建议长期对公网开放：

- `3456`
- `4567`
- 数据库端口
- Redis 端口

原因是正式上线后，用户只需要通过 `80/443` 访问网站，`3456/4567` 只作为服务器内部服务端口使用更安全。

---

## 4. 连接服务器

在本地终端执行：

```bash
ssh root@你的服务器公网IP
```

如果你不是 `root` 用户，后面命令前面加 `sudo`。

---

## 5. 安装宝塔面板

宝塔官方当前推荐安装命令如下：

```bash
if [ -f /usr/bin/curl ];then curl -sSO https://download.bt.cn/install/install_panel.sh;else wget -O install_panel.sh https://download.bt.cn/install/install_panel.sh;fi;bash install_panel.sh ed8484bec
```

安装完成后执行：

```bash
bt default
```

你会看到：

- 面板访问地址
- 用户名
- 密码
- 面板端口

然后回到阿里云安全组，把这个面板端口放行。

浏览器打开：

```text
http://你的服务器IP:宝塔端口
```

首次登录后，建议先做这几件事：

- 修改面板默认账号密码
- 绑定你自己的宝塔账号
- 开启面板 HTTPS
- 在宝塔安全页里把面板入口和端口记下来

---

## 6. 在服务器安装 Docker 和 Git

这个项目最适合 Docker 部署，不建议你用宝塔直接跑 Python 进程和 Node 进程。

在服务器执行：

```bash
apt update
apt install -y docker.io docker-compose-plugin git
systemctl enable docker
systemctl start docker
docker --version
docker compose version
```

如果你的系统不是 Debian/Ubuntu，安装命令会略有区别，但思路一样。

---

## 7. 上传项目到服务器

推荐两种方式。

### 方式 1：推到你自己的 Git 仓库后再拉取

这是最推荐的方式，后期更新最方便。

服务器执行：

```bash
mkdir -p /www/wwwroot
cd /www/wwwroot
git clone 你的项目仓库地址 team-invite
cd team-invite
```

### 方式 2：本地直接上传

如果你现在代码只在本地，还没推到 GitHub/Gitee：

- 可以在宝塔文件里上传压缩包再解压
- 也可以用 `scp` 传到服务器

例如：

```bash
scp -r /你的本地项目目录 root@你的服务器IP:/www/wwwroot/team-invite
```

---

## 8. 生产环境推荐用 PostgreSQL

进入项目目录：

```bash
cd /www/wwwroot/team-invite
```

创建根目录 `.env`：

```bash
cat > .env <<'EOF'
SECRET_KEY=这里换成你自己的超长随机字符串
POSTGRES_USER=teamadmin
POSTGRES_PASSWORD=这里换成你自己的数据库密码
POSTGRES_DB=team_manager
EOF
```

你可以用下面的命令生成随机密钥：

```bash
openssl rand -hex 32
```

---

## 9. 启动项目

在项目根目录执行：

```bash
docker compose -f docker-compose.postgres.yml up -d --build
```

查看容器状态：

```bash
docker compose -f docker-compose.postgres.yml ps
```

查看日志：

```bash
docker compose -f docker-compose.postgres.yml logs -f
```

如果启动成功，理论上可以先用服务器 IP 测试：

```text
http://你的服务器IP:3456
http://你的服务器IP:3456/admin
```

如果你只是临时测试，可以先在安全组里临时开放 `3456`。正式切域名上线后，再关闭 `3456` 的公网访问。

---

## 10. 宝塔里怎么配置网站

这一步是很多人最容易乱的地方。对这个项目来说，宝塔的角色不是运行项目，而是：

- 绑定域名
- 申请 SSL
- 做反向代理

### 10.1 新建站点

登录宝塔面板后：

1. 进入 `网站`
2. 点击 `添加站点`
3. 域名填写你的主域名，例如：

```text
example.com
www.example.com
```

4. PHP 版本选 `纯静态`
5. 数据库不用创建

创建完成即可。

### 10.2 设置反向代理

在刚创建的网站右侧，点击：

```text
设置 -> 反向代理 -> 添加反向代理
```

目标地址填：

```text
http://127.0.0.1:3456
```

说明：

- 这个项目的前端容器已经会把 `/api` 转发给后端 `4567`
- 所以宝塔不需要再单独配一个 `/api` 反代
- 你只要把整个域名转发到 `3456` 就够了

保存后，访问域名时会进入前端页面，前端再通过内部代理访问后端 API。

---

## 11. 域名怎么配置

如果你的域名也在阿里云：

1. 打开阿里云域名控制台
2. 找到你的域名
3. 点击 `解析`
4. 添加下面两条记录

第一条：

- 记录类型：`A`
- 主机记录：`@`
- 记录值：你的服务器公网 IP

第二条：

- 记录类型：`A`
- 主机记录：`www`
- 记录值：你的服务器公网 IP

保存后等待生效。

一般新加记录会比较快，但全球 DNS 缓存完全刷新有时会更久。

---

## 12. 宝塔申请 SSL 证书

域名解析生效后，回到宝塔：

1. 进入 `网站`
2. 找到你的站点
3. 点击 `设置`
4. 打开 `SSL`
5. 选择 `Let's Encrypt`
6. 勾选你的域名
7. 点击申请

申请成功后：

- 打开 `强制 HTTPS`
- 如果你同时用了 `www` 和裸域，顺手把重定向也配好

---

## 13. 首次初始化系统

浏览器访问：

```text
https://你的域名
```

首次访问会进入初始化页面。

完成后你可以登录后台：

```text
https://你的域名/admin
```

---

## 14. LinuxDO OAuth 怎么填

进入后台后，按项目界面配置即可。

你最重要的是把 LinuxDO 应用里的回调地址填成：

```text
https://你的域名/callback
```

然后在系统里填：

- Client ID
- Client Secret
- Redirect URI：`https://你的域名/callback`

---

## 15. 这个项目和域名的关系

这个项目当前代码里：

- 前端 API 地址是相对路径 `/api/v1`
- 前端容器内 Nginx 已经把 `/api` 代理到后端容器

所以正式上线推荐结构是：

```text
用户 -> 你的域名 -> 宝塔 Nginx -> 127.0.0.1:3456 -> 前端容器 -> 后端容器
```

这也是为什么你不需要额外搞一个 `api.你的域名` 才能跑起来。

---

## 16. 更新项目怎么做

如果你是通过 Git 拉代码：

```bash
cd /www/wwwroot/team-invite
git pull
docker compose -f docker-compose.postgres.yml up -d --build
```

查看状态：

```bash
docker compose -f docker-compose.postgres.yml ps
```

查看日志：

```bash
docker compose -f docker-compose.postgres.yml logs -f backend
```

---

## 17. 备份建议

至少备份这几类内容：

- 项目根目录 `.env`
- PostgreSQL 数据卷
- 宝塔网站配置

如果你暂时不会做复杂备份，最低限度也要定期做数据库导出。

---

## 18. 常见问题排查

### 打不开域名

先按顺序检查：

1. 域名是否已经解析到服务器 IP
2. 阿里云安全组是否放行 `80` 和 `443`
3. 宝塔站点是否已经配置反向代理到 `127.0.0.1:3456`
4. Docker 容器是否启动成功

检查命令：

```bash
docker compose -f docker-compose.postgres.yml ps
docker compose -f docker-compose.postgres.yml logs -f
```

### IP 能打开，域名打不开

通常是下面几个原因：

- 域名解析没生效
- 宝塔站点没绑这个域名
- SSL 申请失败
- 中国内地服务器但域名还没备案

### 后台能打开，登录异常

优先检查：

- 域名是否全站统一使用 `https`
- OAuth 回调地址是否写成了 `https://你的域名/callback`

---

## 19. 最适合新手的实际操作顺序

如果你想最快上线，直接按这个顺序来：

1. 买阿里云 ECS，优先中国香港节点
2. 安装宝塔
3. 安装 Docker 和 Git
4. 上传项目到 `/www/wwwroot/team-invite`
5. 配置 `.env`
6. 执行 `docker compose -f docker-compose.postgres.yml up -d --build`
7. 用 `IP:3456` 先确认项目已经跑起来
8. 给域名加 `@` 和 `www` 两条 A 记录
9. 在宝塔里建站并把域名反代到 `127.0.0.1:3456`
10. 申请 SSL
11. 用 `https://你的域名` 正式访问
12. 到后台填 LinuxDO OAuth 回调地址

---

## 20. 当前项目里你最需要知道的文件

- `docker-compose.postgres.yml`
- `frontend/nginx.conf`
- `frontend/src/api/index.ts`
- `backend/app/main.py`
- `backend/.env.example`

如果你后面要继续改成更标准的生产部署，我建议下一步做这两件事：

1. 后端 `4567` 不再暴露到公网
2. 增加数据库自动备份
