# 部署到阿里云 ECS 服务器指南

## 📋 部署前准备

### 1. 服务器要求
- 阿里云 ECS 实例（已购买）
- 操作系统：Ubuntu 20.04/22.04 或 CentOS 7/8
- 已配置安全组，开放 3000 端口
- Node.js 18+ 环境

### 2. 需要的信息
- ECS 公网 IP 地址
- ECS 登录用户名（通常是 root 或 ubuntu）
- SSH 密钥或密码

---

## 🚀 部署步骤

### 方式一：手动部署（推荐初次使用）

#### 步骤 1: 连接到服务器
```bash
# 使用密码登录
ssh root@你的ECS公网IP

# 或使用密钥登录
ssh -i /path/to/your-key.pem root@你的ECS公网IP
```

#### 步骤 2: 安装 Node.js
```bash
# 更新系统
yum update -y  # CentOS
# 或
apt update -y    # Ubuntu

# 安装 Node.js (使用 nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
```

#### 步骤 3: 克隆代码
```bash
cd /opt
git clone https://github.com/baoman007/ai-weather-agent.git
cd ai-weather-agent
```

#### 步骤 4: 安装依赖
```bash
npm install
```

#### 步骤 5: 配置环境变量
```bash
# 创建 .env 文件
nano .env
```

输入以下内容：
```env
DASHSCOPE_API_KEY=你的阿里云API密钥
WEATHER_API_KEY=你的天气API密钥
PORT=3000
```

按 `Ctrl+X`，然后 `Y`，再按 `Enter` 保存

#### 步骤 6: 启动服务
```bash
# 使用 npm 启动
npm start

# 或使用 PM2（推荐）
pm2 start server.js --name "ai-agent"
```

#### 步骤 7: 配置防火墙/安全组
确保阿里云 ECS 安全组开放 3000 端口：
- 登录阿里云控制台
- 找到你的 ECS 实例
- 点击"安全组" -> "配置规则"
- 添加规则：端口范围 3000/3000，授权对象 0.0.0.0/0

#### 步骤 8: 访问服务
在浏览器中访问：
```
http://你的ECS公网IP:3000
```

---

### 方式二：使用 PM2 自动化部署（推荐）

#### 安装 PM2
```bash
npm install -g pm2
```

#### 使用 PM2 启动
```bash
cd /opt/ai-weather-agent
pm2 start server.js --name "ai-agent"
pm2 save
pm2 startup
```

#### PM2 常用命令
```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs ai-agent

# 重启
pm2 restart ai-agent

# 停止
pm2 stop ai-agent

# 删除
pm2 delete ai-agent
```

---

### 方式三：使用 Docker 部署（最推荐）

#### 步骤 1: 创建 Dockerfile

在项目根目录创建 `Dockerfile`：
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

#### 步骤 2: 创建 .dockerignore
```
node_modules
npm-debug.log
.git
.env
uploads/*
!uploads/.gitkeep
```

#### 步骤 3: 构建镜像
```bash
docker build -t ai-weather-agent .
```

#### 步骤 4: 运行容器
```bash
docker run -d \
  --name ai-agent \
  -p 3000:3000 \
  --env-file .env \
  ai-weather-agent
```

#### 步骤 5: 使用 Docker Compose（更方便）

创建 `docker-compose.yml`：
```yaml
version: '3'

services:
  ai-agent:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DASHSCOPE_API_KEY=${DASHSCOPE_API_KEY}
      - WEATHER_API_KEY=${WEATHER_API_KEY}
      - PORT=3000
    volumes:
      - ./uploads:/app/uploads
    restart: unless-stopped
```

启动：
```bash
docker-compose up -d
```

---

## 🔧 配置 Nginx 反向代理（推荐生产环境）

### 安装 Nginx
```bash
yum install nginx -y  # CentOS
# 或
apt install nginx -y  # Ubuntu
```

### 配置 Nginx
```bash
nano /etc/nginx/conf.d/ai-agent.conf
```

输入以下内容：
```nginx
server {
    listen 80;
    server_name 你的域名或IP;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /uploads {
        alias /opt/ai-weather-agent/uploads;
    }
}
```

### 启动 Nginx
```bash
systemctl start nginx
systemctl enable nginx
```

### 配置 SSL（使用 Let's Encrypt）
```bash
# 安装 certbot
yum install certbot python2-certbot-nginx -y

# 获取证书
certbot --nginx -d 你的域名.com

# 自动续期
certbot renew --dry-run
```

---

## 📊 监控和日志

### 查看应用日志
```bash
# PM2 日志
pm2 logs ai-agent

# 或直接查看
tail -f /opt/ai-weather-agent/server.log
```

### 监控服务器资源
```bash
# CPU 和内存
top

# 磁盘使用
df -h

# 网络连接
netstat -tunlp
```

---

## 🔄 更新部署

当需要更新代码时：
```bash
cd /opt/ai-weather-agent

# 拉取最新代码
git pull origin main

# 安装新依赖（如果有）
npm install

# 重启服务
pm2 restart ai-agent

# 或 Docker
docker-compose down
docker-compose up -d --build
```

---

## 🛡️ 安全建议

1. **使用防火墙**
   ```bash
   # UFW (Ubuntu)
   ufw enable
   ufw allow 22   # SSH
   ufw allow 80   # HTTP
   ufw allow 443  # HTTPS
   ufw allow 3000 # 应用端口（可选，通过 Nginx 代理则不需要）

   # iptables (CentOS)
   systemctl start firewalld
   firewall-cmd --permanent --add-service=http
   firewall-cmd --permanent --add-service=https
   firewall-cmd --permanent --add-port=22/tcp
   firewall-cmd --reload
   ```

2. **修改 SSH 默认端口**
   ```bash
   nano /etc/ssh/sshd_config
   # 修改 Port 22 为其他端口
   systemctl restart sshd
   ```

3. **使用密钥登录，禁用密码登录**
   ```bash
   # 编辑 SSH 配置
   nano /etc/ssh/sshd_config
   # 修改 PasswordAuthentication no
   systemctl restart sshd
   ```

4. **定期更新系统**
   ```bash
   yum update -y  # CentOS
   # 或
   apt update && apt upgrade -y  # Ubuntu
   ```

---

## 🐛 常见问题

### 问题 1: 无法访问 3000 端口
- 检查防火墙规则
- 检查阿里云安全组配置
- 确认应用正在运行

### 问题 2: Node.js 版本过低
```bash
# 卸载旧版本
yum remove nodejs npm

# 使用 nvm 安装新版本
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
```

### 问题 3: 内存不足
- 升级 ECS 实例规格
- 或使用 Swap
  ```bash
  dd if=/dev/zero of=/swapfile bs=1M count=1024
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  ```

### 问题 4: 依赖安装失败
```bash
# 清除缓存重试
npm cache clean --force
npm install
```

---

## 📞 技术支持

如遇到问题，检查：
1. 服务器日志：`pm2 logs`
2. 应用日志：`tail -f server.log`
3. 网络连接：`ping 你的ECS公网IP`
4. 端口开放：`telnet 你的ECS公网IP 3000`

---

## ✅ 部署检查清单

- [ ] 已购买阿里云 ECS 实例
- [ ] 已配置安全组（开放 3000 端口）
- [ ] 已安装 Node.js 18+
- [ ] 已克隆项目代码
- [ ] 已安装项目依赖
- [ ] 已配置 .env 环境变量
- [ ] 已启动服务（PM2 或 Docker）
- [ ] 已配置防火墙规则
- [ ] 已测试访问服务
- [ ] 已配置 Nginx 反向代理（可选）
- [ ] 已配置 SSL 证书（可选）
- [ ] 已设置自动重启策略
