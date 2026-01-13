# AI Multimodal Agent 使用指南

## 概述

这是一个支持文本、图片、语音的多模态 AI 智能助手，基于阿里云通义千问 API 构建。

## 功能特性

### 文本功能
- 🌤️ 天气查询
- 📈 股票查询

### 图片功能
- 🎨 文字生成图片
- 🖼️ 图片内容分析

### 语音功能
- 🔊 文字转语音

## 安装依赖

```bash
npm install
```

## 环境变量配置

创建 `.env` 文件：

```env
DASHSCOPE_API_KEY=your_dashscope_api_key_here
WEATHER_API_KEY=your_weather_api_key_here  # 可选
PORT=3000
```

## 启动服务

```bash
npm start
```

服务将在 `http://localhost:3000` 启动。

## API 端点

### 1. 健康检查
```bash
curl http://localhost:3000/health
```

### 2. 聊天接口（支持多模态工具）
```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "北京今天天气怎么样？"
  }'
```

### 3. 图片生成
```bash
curl -X POST http://localhost:3000/generate-image \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "北京晴天，蓝天白云，阳光明媚",
    "size": "512x512"
  }'
```

### 4. 文字转语音
```bash
curl -X POST http://localhost:3000/text-to-speech \
  -H "Content-Type: application/json" \
  -d '{
    "text": "北京今天天气晴朗，气温15-20摄氏度",
    "voice": "zh"
  }'
```

### 5. 图片分析
```bash
curl -X POST http://localhost:3000/analyze-image \
  -F "image=@/path/to/your/image.jpg" \
  -F "question=这张图片显示了什么天气？"
```

## 使用示例

### 示例 1: 查询天气
```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"上海今天天气怎么样？"}'
```

### 示例 2: 查询股票
```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"查询平安银行股票（000001）的实时价格"}'
```

### 示例 3: 生成天气图片
```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"帮我为北京晴天生成一张图片"}'
```

### 示例 4: 生成语音播报
```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"请用语音播报北京的天气情况：北京今天晴朗，气温15-20°C"}'
```

### 示例 5: 分析图片
```bash
curl -X POST http://localhost:3000/analyze-image \
  -F "image=@/path/to/weather_chart.png" \
  -F "question=这张股票图表显示了什么信息？"
```

## 工具列表

| 工具名称 | 描述 | 输入 | 输出 |
|---------|------|------|------|
| get_weather | 天气预报 | 城市名称、天数 | 天气数据 |
| get_stock | 股票查询 | 股票代码 | 股票数据 |
| generate_image | 图片生成 | 文本描述 | 图片URL |
| text_to_speech | 文字转语音 | 文本、语言 | 音频文件 |
| analyze_image | 图片分析 | 图片路径、问题 | 文字描述 |

## 文件结构

```
ai-multimodal-agent/
├── server.js              # 主服务器文件
├── package.json           # 依赖配置
├── .env                   # 环境变量
├── uploads/              # 上传文件目录
│   └── audio/           # 生成的音频文件
├── test.js              # 测试脚本
└── README.md            # 说明文档
```

## 注意事项

1. **API Key**: 必须配置 `DASHSCOPE_API_KEY` 才能使用 AI 功能
2. **图片生成**: 使用 Pollinations AI 免费服务（无需额外配置）
3. **语音合成**: 使用阿里云语音合成 API
4. **图片分析**: 使用通义千问 VL 多模态模型
5. **文件大小**: 上传图片限制为 10MB

## 高级功能

### 对话历史
```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "那明天呢？",
    "conversationHistory": [
      {"role": "user", "content": "北京今天天气怎么样？"},
      {"role": "assistant", "content": "北京今天晴朗，气温15-20°C"}
    ]
  }'
```

### 综合查询
```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "今天北京天气怎么样？另外招商银行的股票涨了吗？请帮我生成一张北京天气的图片，并用语音播报。"
  }'
```

## 故障排除

### 问题: 图片生成失败
- 检查 `DASHSCOPE_API_KEY` 是否正确
- 确认 API 是否有通义万相权限

### 问题: 语音合成失败
- 检查 API Key 权限
- 确认文本内容是否过长

### 问题: 图片分析失败
- 检查图片格式（支持 jpg, png, gif, webp）
- 检查图片大小（最大 10MB）

## 许可证

MIT
