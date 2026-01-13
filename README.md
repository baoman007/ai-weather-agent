# AI Weather Agent 🌤️

一个使用OpenAI GPT-4和工具调用功能的智能天气助手。

## ✨ 功能特点

- 🤖 **AI智能对话**：基于GPT-4的自然语言交互
- 🌤️ **天气查询**：支持查询全球城市天气
- 🔮 **天气预报**：提供1-7天的天气预报
- 🧠 **工具调用**：AI自主决定何时调用天气工具
- 💬 **对话历史**：支持多轮对话上下文
- 🎯 **生活建议**：根据天气提供穿衣、出行建议

## 🚀 快速开始

### 1. 安装依赖

```bash
cd ai-weather-agent
npm install
```

### 2. 配置环境变量

```bash
# 复制配置文件
cp .env.example .env

# 编辑 .env 文件
nano .env
```

添加你的API密钥：

```env
# 必需：OpenAI API Key
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxx

# 可选：天气API Key（使用OpenWeatherMap）
# 不配置将使用模拟数据
WEATHER_API_KEY=your_openweathermap_api_key
```

**获取API密钥：**
- OpenAI: https://platform.openai.com/api-keys
- OpenWeatherMap: https://openweathermap.org/api

### 3. 启动服务

```bash
npm start
```

服务将启动在：http://localhost:3000

### 4. 运行测试

```bash
npm test
```

## 📖 API使用

### 健康检查

```bash
curl http://localhost:3000/health
```

### AI对话

```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "北京今天天气怎么样？"
  }'
```

### 带对话历史的对话

```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "那明天呢？",
    "conversationHistory": [
      {
        "role": "user",
        "content": "北京今天天气怎么样？"
      },
      {
        "role": "assistant",
        "content": "北京今天晴朗，气温15-20°C"
      }
    ]
  }'
```

## 💡 使用示例

### 示例1：查询天气

**用户输入：**
```
上海今天天气怎么样？
```

**AI回复：**
```
根据天气预报，上海今天多云，气温16-21°C，湿度65%，风速3m/s。
天气比较舒适，建议外出时可以穿薄外套。
```

### 示例2：多天预报

**用户输入：**
```
帮我查一下广州未来3天天气预报
```

**AI回复：**
```
广州未来3天天气预报：

📅 今天：局部多云，21-26°C
📅 明天：晴，22-27°C  
📅 后天：多云，20-25°C

总体天气不错，适合户外活动！
```

### 示例3：生活建议

**用户输入：**
```
杭州今天下雨，我该穿什么？
```

**AI回复：**
```
杭州今天有雨，气温14-18°C。

👕 建议穿着：
- 外套：防水外套或雨衣
- 上衣：长袖T恤或薄毛衣
- 下装：长裤
- 鞋子：防滑鞋

🌂 记得带伞！出行注意安全。
```

### 示例4：城市对比

**用户输入：**
```
北京和上海哪个更适合旅游？
```

**AI回复：**
```
让我查询一下两地的天气情况：

北京：晴，气温15-20°C
上海：多云，气温16-21°C

📍 旅游建议：
- 北京：天气晴朗，适合游览古迹、长城等户外景点
- 上海：多云，温度稍高，适合逛外滩、迪士尼

两地天气都不错，可以根据你的行程安排选择！
```

## 🏗️ 项目结构

```
ai-weather-agent/
├── server.js           # 主服务器
├── test.js           # 测试脚本
├── package.json       # 项目配置
├── .env.example      # 环境变量模板
└── README.md         # 项目文档
```

## 🔧 技术栈

- **Node.js** - 运行时环境
- **Express** - Web框架
- **OpenAI API** - AI模型
- **OpenWeatherMap** - 天气数据API（可选）
- **Axios** - HTTP客户端

## 🎯 核心功能

### 1. 工具定义

AI Agent通过定义的工具与外部世界交互：

```javascript
const weatherTool = {
  type: 'function',
  function: {
    name: 'get_weather',
    description: '获取城市的天气和预报',
    parameters: {
      type: 'object',
      properties: {
        city: { type: 'string', description: '城市名称' },
        days: { type: 'integer', description: '预报天数' }
      }
    }
  }
};
```

### 2. AI决策流程

1. 用户发送消息
2. AI分析消息，判断是否需要工具
3. 如需工具，调用get_weather
4. 获取天气数据
5. AI基于数据生成自然语言回复

### 3. 天气数据源

**默认**：使用模拟数据（无需API Key）

**真实数据**：配置WEATHER_API_KEY使用OpenWeatherMap

## 🔐 安全建议

1. 不要将 `.env` 文件提交到Git
2. 定期更换API密钥
3. 在生产环境使用环境变量
4. 限制API访问频率

## 📊 监控和日志

查看实时日志：

```bash
# 启动时会显示详细日志
npm start

# 日志包括：
# - 用户消息
# - AI工具调用
# - 天气数据获取
# - AI回复
```

## 🐛 故障排除

### 问题1：API密钥错误

```
Error: Incorrect API key provided
```

**解决：** 检查 `.env` 文件中的 `OPENAI_API_KEY`

### 问题2：天气查询失败

```
获取天气信息失败: Network error
```

**解决：** 
- 检查网络连接
- 验证城市名称拼写
- 配置WEATHER_API_KEY使用真实天气数据

### 问题3：端口占用

```
Error: listen EADDRINUSE: address already in use
```

**解决：**
```bash
# 查找占用端口的进程
lsof -ti:3000 | xargs kill -9

# 或修改端口
PORT=3001 npm start
```

## 🚀 部署到生产环境

### 1. 使用PM2（推荐）

```bash
# 安装PM2
npm install -g pm2

# 启动服务
pm2 start server.js --name weather-agent

# 查看状态
pm2 status

# 查看日志
pm2 logs weather-agent

# 设置开机自启
pm2 startup
pm2 save
```

### 2. 使用Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

构建和运行：

```bash
docker build -t ai-weather-agent .
docker run -d -p 3000:3000 --name weather-agent ai-weather-agent
```

## 📝 API参考

### POST /chat

发送消息给AI Agent。

**请求体：**

```json
{
  "message": "用户消息（必需）",
  "conversationHistory": [
    {
      "role": "user",
      "content": "历史用户消息"
    },
    {
      "role": "assistant", 
      "content": "历史AI回复"
    }
  ]
}
```

**响应：**

```json
{
  "response": "AI的回复文本",
  "toolCalls": [
    {
      "name": "get_weather",
      "arguments": "{\"city\":\"北京\",\"days\":3}"
    }
  ]
}
```

### GET /health

检查服务健康状态。

**响应：**

```json
{
  "status": "OK",
  "service": "AI Weather Agent",
  "timestamp": "2025-01-06T...",
  "tools": ["get_weather"]
}
```

## 💡 扩展建议

可以添加更多工具来增强功能：

- 📍 地点查询：查询城市位置
- 🗓️ 日程管理：天气提醒
- 📸 景色推荐：根据天气推荐景点
- 🚗 出行建议：交通、航班信息
- 🏥 健康建议：天气与健康

## 📞 技术支持

遇到问题？

1. 检查API密钥配置
2. 查看服务日志
3. 运行测试脚本验证功能
4. 查看OpenAI API文档：https://platform.openai.com/docs

## 📄 许可证

MIT License

---

**Enjoy building with AI! 🤖✨**
