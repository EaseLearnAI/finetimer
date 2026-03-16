# Timers App 部署指南

## 📋 项目概述

Timers App 是一个基于Vue.js的前端应用，需要配合Node.js后端服务运行。本指南将指导您使用Nginx反向代理来部署前后端应用。

## 🏗️ 系统架构

```
用户请求 → Nginx → 前端静态文件 (Vue.js)
         ↓
         → 后端API服务 (Node.js)
```

## 📦 部署前准备

### 1. 服务器要求
- **操作系统**：Ubuntu 20.04+ / CentOS 7+ / Windows Server
- **内存**：最少2GB RAM
- **存储**：最少10GB可用空间
- **网络**：开放80端口(HTTP)和443端口(HTTPS)

### 2. 软件依赖
- **Nginx**：1.18+
- **Node.js**：16.0+
- **PM2**：用于进程管理（推荐）

## 🚀 部署步骤

### 第一步：准备应用文件

#### 1.1 构建前端应用
```bash
# 克隆项目
git clone <your-repository-url>
cd timers

# 安装依赖
npm install

# 构建生产版本
npm run build

# 构建完成后，dist目录包含所有静态文件
```

#### 1.2 准备后端应用
```bash
# 进入后端目录
cd backend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑.env文件，配置数据库连接等信息
```

### 第二步：部署后端服务

#### 2.1 使用PM2启动后端服务
```bash
# 全局安装PM2
npm install -g pm2

# 启动后端服务
pm2 start app.js --name "timers-backend"

# 设置开机自启
pm2 startup
pm2 save

# 查看服务状态
pm2 status
pm2 logs timers-backend
```

#### 2.2 验证后端服务
```bash
# 测试后端是否正常运行
curl http://localhost:3000/health

# 应该返回健康状态信息
```

### 第三步：配置Nginx

#### 3.1 安装Nginx
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx

# CentOS/RHEL
sudo yum install epel-release
sudo yum install nginx

# 启动Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

#### 3.2 创建Nginx配置文件
```bash
# 创建站点配置文件
sudo nano /etc/nginx/sites-available/timers-app
```

将以下配置复制到文件中：

```nginx
server {
    listen 80;
    server_name your-domain.com;  # 替换为您的域名或IP地址
    
    # 前端静态文件
    location / {
        root /var/www/timers-app/dist;  # 前端文件路径
        try_files $uri $uri/ /index.html;
        
        # 缓存静态资源
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API请求反向代理到后端
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # 安全头设置
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
```

#### 3.3 启用站点配置
```bash
# 创建符号链接
sudo ln -s /etc/nginx/sites-available/timers-app /etc/nginx/sites-enabled/

# 删除默认配置（可选）
sudo rm /etc/nginx/sites-enabled/default

# 测试配置
sudo nginx -t

# 重新加载Nginx
sudo systemctl reload nginx
```

### 第四步：部署前端文件

#### 4.1 复制前端文件到服务器
```bash
# 创建目录
sudo mkdir -p /var/www/timers-app

# 复制构建后的文件
sudo cp -r dist/* /var/www/timers-app/

# 设置权限
sudo chown -R www-data:www-data /var/www/timers-app
sudo chmod -R 755 /var/www/timers-app
```

#### 4.2 验证文件部署
```bash
# 检查文件是否存在
ls -la /var/www/timers-app/

# 应该看到index.html等文件
```

## 🔧 配置说明

### 环境变量配置
创建 `.env.production` 文件：
```bash
NODE_ENV=production
PORT=3000
DB_CONNECTION_STRING=your_database_connection_string
JWT_SECRET=your_jwt_secret
```

### 端口配置
- **前端**：80 (HTTP) / 443 (HTTPS)
- **后端**：3000 (内部)
- **Nginx**：80 (HTTP) / 443 (HTTPS)

## 🧪 测试部署

### 1. 测试前端访问
```bash
# 在浏览器中访问
http://your-domain.com
# 或
http://your-server-ip
```

### 2. 测试API接口
```bash
# 测试健康检查
curl http://your-domain.com/api/health

# 测试任务API
curl http://your-domain.com/api/tasks
```

### 3. 检查日志
```bash
# Nginx日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# 后端日志
pm2 logs timers-backend
```

## 🔒 安全配置

### 1. 防火墙设置
```bash
# Ubuntu/Debian
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# CentOS/RHEL
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### 2. SSL证书配置（推荐）
```bash
# 安装Certbot
sudo apt install certbot python3-certbot-nginx

# 获取SSL证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo crontab -e
# 添加：0 12 * * * /usr/bin/certbot renew --quiet
```

## 🚨 故障排除

### 常见问题

#### 1. 502 Bad Gateway
```bash
# 检查后端服务状态
pm2 status
pm2 logs timers-backend

# 检查端口是否被占用
netstat -tlnp | grep :3000
```

#### 2. 404 Not Found
```bash
# 检查前端文件路径
ls -la /var/www/timers-app/

# 检查Nginx配置
sudo nginx -t
```

#### 3. CORS错误
确保后端配置了正确的CORS策略：
```javascript
app.use(cors({
  origin: ['http://your-domain.com', 'https://your-domain.com'],
  credentials: true
}));
```

### 调试命令
```bash
# 检查Nginx状态
sudo systemctl status nginx

# 检查后端状态
pm2 status
pm2 logs

# 检查端口占用
sudo netstat -tlnp

# 检查文件权限
ls -la /var/www/timers-app/
```

## 📊 性能优化

### 1. Nginx优化
```nginx
# 在http块中添加
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
```

### 2. 缓存策略
```nginx
# 静态资源缓存
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## 🔄 更新部署

### 1. 更新前端
```bash
# 拉取最新代码
git pull origin main

# 重新构建
npm run build

# 复制新文件
sudo cp -r dist/* /var/www/timers-app/
sudo chown -R www-data:www-data /var/www/timers-app
```

### 2. 更新后端
```bash
# 拉取最新代码
git pull origin main

# 安装依赖
npm install

# 重启服务
pm2 restart timers-backend
```

## 📞 技术支持

如果在部署过程中遇到问题，请：

1. 检查本文档的故障排除部分
2. 查看相关日志文件
3. 确认所有配置步骤已完成
4. 联系开发团队获取支持

## 📝 部署检查清单

- [ ] 前端应用构建完成
- [ ] 后端服务正常运行
- [ ] Nginx配置正确
- [ ] 前端文件部署完成
- [ ] 防火墙配置正确
- [ ] SSL证书配置（如需要）
- [ ] 所有API接口测试通过
- [ ] 性能优化配置完成

---

**注意**：请根据您的实际环境调整配置中的域名、路径和端口号。


