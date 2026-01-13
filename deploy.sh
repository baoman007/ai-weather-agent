#!/bin/bash

# AI 天气助手自动部署脚本
# 用法: ./deploy.sh root@你的ECS公网IP

set -e

# 颜色输出
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查参数
if [ $# -lt 1 ]; then
    echo -e "${RED}用法: $0 <服务器地址> [端口号]${NC}"
    echo -e "示例: $0 root@123.45.67.89 22"
    exit 1
fi

SERVER=$1
SSH_PORT=${2:-22}

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}AI 天气助手自动部署${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# 检查 SSH 连接
echo -e "${YELLOW}1. 检查 SSH 连接...${NC}"
ssh -p $SSH_PORT $SERVER "echo 'SSH 连接成功'"

# 安装 Node.js
echo ""
echo -e "${YELLOW}2. 安装 Node.js...${NC}"
ssh -p $SSH_PORT $SERVER << 'EOF'
if ! command -v node &> /dev/null; then
    echo "安装 Node.js..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    nvm install 18
    nvm use 18
    echo "Node.js 安装完成: $(node -v)"
else
    echo "Node.js 已安装: $(node -v)"
fi
EOF

# 克隆项目
echo ""
echo -e "${YELLOW}3. 克隆项目代码...${NC}"
ssh -p $SSH_PORT $SERVER << 'EOF'
cd /opt || mkdir -p /opt
if [ -d "ai-weather-agent" ]; then
    echo "项目已存在，拉取最新代码..."
    cd ai-weather-agent
    git pull origin main
else
    echo "克隆项目..."
    git clone https://github.com/baoman007/ai-weather-agent.git
    cd ai-weather-agent
fi
EOF

# 安装依赖
echo ""
echo -e "${YELLOW}4. 安装项目依赖...${NC}"
ssh -p $SSH_PORT $SERVER << 'EOF'
cd /opt/ai-weather-agent
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
npm install
EOF

# 配置环境变量
echo ""
echo -e "${YELLOW}5. 配置环境变量...${NC}"
echo "请输入你的阿里云 API Key: "
read -s DASHSCOPE_API_KEY
echo ""
echo "请输入天气 API Key (可选，直接回车跳过): "
read -s WEATHER_API_KEY
echo ""

ssh -p $SSH_PORT $SERVER << EOF
cd /opt/ai-weather-agent
cat > .env << ENVEOF
DASHSCOPE_API_KEY=$DASHSCOPE_API_KEY
WEATHER_API_KEY=$WEATHER_API_KEY
PORT=3000
ENVEOF
echo "环境变量配置完成"
EOF

# 安装 PM2
echo ""
echo -e "${YELLOW}6. 安装 PM2...${NC}"
ssh -p $SSH_PORT $SERVER << 'EOF'
cd /opt/ai-weather-agent
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
npm install -g pm2
EOF

# 启动服务
echo ""
echo -e "${YELLOW}7. 启动服务...${NC}"
ssh -p $SSH_PORT $SERVER << 'EOF'
cd /opt/ai-weather-agent
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
pm2 delete ai-agent 2>/dev/null || true
pm2 start server.js --name "ai-agent"
pm2 save
pm2 startup | tail -n 1 > /tmp/pm2_startup.sh
bash /tmp/pm2_startup.sh 2>/dev/null || true
pm2 status
EOF

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ 部署完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "访问地址: ${GREEN}http://$(echo $SERVER | cut -d@ -f2):3000${NC}"
echo ""
echo -e "查看日志: ssh -p $SSH_PORT $SERVER 'pm2 logs ai-agent'"
echo -e "重启服务: ssh -p $SSH_PORT $SERVER 'pm2 restart ai-agent'"
echo -e "查看状态: ssh -p $SSH_PORT $SERVER 'pm2 status'"
echo ""
