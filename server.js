const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const axios = require('axios');

// 阿里云通义千问 API
const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;
const DASHSCOPE_API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1';

const app = express();
const PORT = process.env.PORT || 3000;

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB 限制
  },
  fileFilter: (req, file, cb) => {
    // 允许图片和音频文件
    const allowedTypes = /jpeg|jpg|png|gif|webp|mp3|wav|m4a|ogg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('只支持图片和音频文件格式'));
  }
});

// 中间件
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ==================== 工具定义 ====================

/**
 * 天气预报工具
 * 根据城市名称获取天气信息
 */
const weatherTool = {
  type: 'function',
  function: {
    name: 'get_weather',
    description: '获取指定城市的当前天气和未来几天预报，包括温度、湿度、风速、天气状况等信息',
    parameters: {
      type: 'object',
      properties: {
        city: {
          type: 'string',
          description: '城市名称，例如：北京、上海、New York、London',
        },
        days: {
          type: 'integer',
          description: '预报天数（1-7天），默认为3天',
          minimum: 1,
          maximum: 7,
          default: 3,
        },
      },
      required: ['city'],
    },
  },
};

/**
 * 股票查询工具
 * 根据股票代码获取股票信息
 */
const stockTool = {
  type: 'function',
  function: {
    name: 'get_stock',
    description: '获取指定股票的实时价格、涨跌幅、成交量等信息。支持A股（如000001、600036）、港股、美股等',
    parameters: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: '股票代码，例如：000001（平安银行）、600036（招商银行）、BABA（阿里巴巴）、AAPL（苹果公司）',
        },
      },
      required: ['symbol'],
    },
  },
};

/**
 * 图像生成工具
 * 根据文本描述生成图片
 */
const imageGenTool = {
  type: 'function',
  function: {
    name: 'generate_image',
    description: '根据文本描述生成图片。用于创建天气插图、股票图表或其他可视化内容',
    parameters: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description: '图片描述，例如："北京晴天，蓝天白云，阳光明媚"',
        },
        size: {
          type: 'string',
          enum: ['256x256', '512x512', '1024x1024'],
          description: '图片尺寸，默认512x512',
        },
      },
      required: ['prompt'],
    },
  },
};

/**
 * 文本转语音工具
 * 将文本转换为语音
 */
const textToSpeechTool = {
  type: 'function',
  function: {
    name: 'text_to_speech',
    description: '将文本转换为语音音频。适用于朗读天气信息、股票报告等',
    parameters: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: '要转换的文本内容',
        },
        voice: {
          type: 'string',
          enum: ['zh', 'en', 'ja'],
          description: '语音语言：zh-中文, en-英文, ja-日文，默认中文',
        },
      },
      required: ['text'],
    },
  },
};

/**
 * 图像识别工具
 * 分析图片内容，识别物体、场景、文字等
 */
const imageAnalysisTool = {
  type: 'function',
  function: {
    name: 'analyze_image',
    description: '分析图片内容，识别物体、场景、文字等信息。支持天气截图、股票图表等图片分析',
    parameters: {
      type: 'object',
      properties: {
        image_path: {
          type: 'string',
          description: '图片文件路径',
        },
        question: {
          type: 'string',
          description: '关于图片的问题，例如："这张图片显示了什么天气？"',
        },
      },
      required: ['image_path'],
    },
  },
};

// ==================== 天气API实现 ====================

/**
 * 模拟天气数据（不需要API Key）
 */
async function getMockWeather(city, days = 3) {
  // 模拟不同城市的基础天气数据
  const cityData = {
    '北京': { baseTemp: 15, condition: '晴朗' },
    '上海': { baseTemp: 20, condition: '多云' },
    '广州': { baseTemp: 25, condition: '局部多云' },
    '深圳': { baseTemp: 24, condition: '晴' },
    '杭州': { baseTemp: 18, condition: '阴' },
    '成都': { baseTemp: 19, condition: '多云' },
    '重庆': { baseTemp: 21, condition: '雾' },
    '西安': { baseTemp: 16, condition: '晴' },
    '南京': { baseTemp: 17, condition: '多云' },
    'Wuhan': { baseTemp: 18, condition: '阴' },
  };

  const data = cityData[city] || { baseTemp: 20, condition: '晴朗' };
  
  const forecast = [];
  const today = new Date();

  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    
    // 模拟温度变化
    const tempVariation = Math.floor(Math.random() * 6) - 3;
    const temp = data.baseTemp + tempVariation;
    const highTemp = temp + 5;
    const lowTemp = temp - 4;
    const humidity = 50 + Math.floor(Math.random() * 30);
    const windSpeed = 2 + Math.floor(Math.random() * 5);
    
    const conditions = ['晴', '多云', '阴', '小雨', '晴朗'];
    const condition = i === 0 ? data.condition : conditions[Math.floor(Math.random() * conditions.length)];

    forecast.push({
      date: date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' }),
      temperature: temp,
      high: highTemp,
      low: lowTemp,
      humidity: humidity,
      windSpeed: windSpeed,
      condition: condition,
      description: `${condition}，气温${lowTemp}°C-${highTemp}°C，湿度${humidity}%，风速${windSpeed}m/s`,
    });
  }

  return {
    city: city,
    forecast: forecast,
    current: forecast[0],
  };
}

/**
 * 真实天气API（使用OpenWeatherMap）
 * 需要API Key: https://openweathermap.org/api
 */
async function getRealWeather(city, days = 3) {
  if (!process.env.WEATHER_API_KEY || process.env.WEATHER_API_KEY === 'your_weather_api_key_here') {
    console.log('使用模拟天气数据（未配置WEATHER_API_KEY）');
    return getMockWeather(city, days);
  }

  try {
    // 获取当前天气
    const currentResponse = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${process.env.WEATHER_API_KEY}&units=metric&lang=zh_cn`
    );

    // 获取预报
    const forecastResponse = await axios.get(
      `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${process.env.WEATHER_API_KEY}&units=metric&lang=zh_cn&cnt=${days * 8}`
    );

    const current = currentResponse.data;
    const forecastList = forecastResponse.data.list;

    // 处理预报数据（每天取一个数据点）
    const dailyForecast = [];
    const processedDates = new Set();

    for (const item of forecastList) {
      const date = new Date(item.dt * 1000);
      const dateStr = date.toDateString();

      if (!processedDates.has(dateStr) && dailyForecast.length < days) {
        processedDates.add(dateStr);

        dailyForecast.push({
          date: date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' }),
          temperature: Math.round(item.main.temp),
          high: Math.round(item.main.temp_max),
          low: Math.round(item.main.temp_min),
          humidity: item.main.humidity,
          windSpeed: item.wind.speed,
          condition: item.weather[0].description,
          description: `${item.weather[0].description}，气温${Math.round(item.main.temp_min)}°C-${Math.round(item.main.temp_max)}°C`,
        });
      }
    }

    return {
      city: current.name,
      country: current.sys.country,
      forecast: dailyForecast,
      current: {
        date: new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' }),
        temperature: Math.round(current.main.temp),
        high: Math.round(current.main.temp_max),
        low: Math.round(current.main.temp_min),
        humidity: current.main.humidity,
        windSpeed: current.wind.speed,
        condition: current.weather[0].description,
        description: `${current.weather[0].description}，气温${Math.round(current.main.temp_min)}°C-${Math.round(current.main.temp_max)}°C`,
      },
    };
  } catch (error) {
    console.error('获取真实天气失败，使用模拟数据:', error.message);
    return getMockWeather(city, days);
  }
}

/**
 * 天气工具执行函数
 */
async function executeGetWeather(params) {
  const { city, days = 3 } = params;
  console.log(`🌤️ 获取天气: ${city}, ${days}天`);

  try {
    const weatherData = await getRealWeather(city, days);
    return JSON.stringify(weatherData, null, 2);
  } catch (error) {
    console.error('天气工具执行失败:', error);
    throw new Error(`获取天气信息失败: ${error.message}`);
  }
}

// ==================== 股票API实现 ====================

/**
 * 模拟股票数据（不需要API Key）
 */
async function getMockStock(symbol) {
  // 模拟不同股票的基础数据
  const stockData = {
    '000001': { name: '平安银行', basePrice: 12.50 },
    '000002': { name: '万科A', basePrice: 18.30 },
    '600036': { name: '招商银行', basePrice: 32.50 },
    '600519': { name: '贵州茅台', basePrice: 1680.00 },
    '600887': { name: '伊利股份', basePrice: 28.90 },
    'BABA': { name: '阿里巴巴', basePrice: 85.20 },
    'AAPL': { name: '苹果公司', basePrice: 178.50 },
    'TSLA': { name: '特斯拉', basePrice: 245.80 },
    'MSFT': { name: '微软', basePrice: 378.90 },
    'GOOGL': { name: '谷歌', basePrice: 141.50 },
  };

  const data = stockData[symbol.toUpperCase()] || { name: symbol.toUpperCase(), basePrice: 100 + Math.random() * 50 };
  
  const change = (Math.random() * 10 - 5).toFixed(2);
  const changePercent = (change / data.basePrice * 100).toFixed(2);
  const volume = Math.floor(Math.random() * 100000000 + 10000000);
  const high = (data.basePrice + Math.random() * 5).toFixed(2);
  const low = (data.basePrice - Math.random() * 5).toFixed(2);
  const open = (data.basePrice + Math.random() * 2 - 1).toFixed(2);

  return {
    symbol: symbol.toUpperCase(),
    name: data.name,
    price: data.basePrice.toFixed(2),
    change: change,
    changePercent: changePercent,
    volume: volume.toLocaleString(),
    high: high,
    low: low,
    open: open,
    marketCap: (volume * data.basePrice / 100000000).toFixed(2) + '亿',
    updateTime: new Date().toLocaleString('zh-CN'),
    trend: change >= 0 ? '上涨' : '下跌',
  };
}

/**
 * 股票工具执行函数
 */
async function executeGetStock(params) {
  const { symbol } = params;
  console.log(`📈 获取股票: ${symbol}`);

  try {
    const stockData = await getMockStock(symbol);
    return JSON.stringify(stockData, null, 2);
  } catch (error) {
    console.error('股票工具执行失败:', error);
    throw new Error(`获取股票信息失败: ${error.message}`);
  }
}

// ==================== 图像生成API实现 ====================

/**
 * 生成图片（使用 Pollinations AI 免费API）
 */
async function generateImage(prompt, size = '512x512') {
  try {
    console.log('🎨 使用 Pollinations AI 生成图片...');

    // Pollinations AI 是免费的，不需要 API Key
    const [width, height] = size.split('x');
    const encodedPrompt = encodeURIComponent(prompt);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&nologo=true&seed=${Math.floor(Math.random() * 1000)}`;

    console.log('🎨 图片 URL:', imageUrl);

    // 返回图片 URL
    return {
      success: true,
      imageUrl: imageUrl,
      prompt: prompt,
      provider: 'Pollinations AI (Free)',
    };
  } catch (error) {
    console.error('图片生成失败:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * 图片生成工具执行函数
 */
async function executeGenerateImage(params) {
  const { prompt, size = '512x512' } = params;
  console.log(`🎨 生成图片: ${prompt}`);

  try {
    const imageData = await generateImage(prompt, size);
    return JSON.stringify(imageData, null, 2);
  } catch (error) {
    console.error('图片生成工具执行失败:', error);
    throw new Error(`生成图片失败: ${error.message}`);
  }
}

// ==================== 语音合成API实现 ====================

/**
 * 文本转语音（使用阿里云语音合成）
 */
async function textToSpeech(text, voice = 'zh') {
  try {
    // 使用阿里云语音合成 API
    const voiceMap = {
      'zh': 'zhixiaoboyun',
      'en': 'anna',
      'ja': 'xiaoyun',
    };

    const response = await axios.post(
      'https://dashscope.aliyuncs.com/api/v1/services/audio/tts/generation',
      {
        model: 'cosyvoice-v1',
        input: {
          text: text,
        },
        parameters: {
          text_type: 'PlainText',
          voice: voiceMap[voice] || 'zhixiaoboyun',
        },
      },
      {
        headers: {
          'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        responseType: 'arraybuffer',
      }
    );

    // 保存音频文件
    const audioDir = path.join(__dirname, 'uploads', 'audio');
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }

    const filename = `tts-${Date.now()}.mp3`;
    const filepath = path.join(audioDir, filename);
    fs.writeFileSync(filepath, response.data);

    return {
      success: true,
      audioUrl: `/audio/${filename}`,
      text: text,
      duration: Math.ceil(text.length / 4), // 估算时长
    };
  } catch (error) {
    console.error('语音合成失败:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * 文本转语音工具执行函数
 */
async function executeTextToSpeech(params) {
  const { text, voice = 'zh' } = params;
  console.log(`🔊 生成语音: ${text.substring(0, 50)}...`);

  try {
    const audioData = await textToSpeech(text, voice);
    return JSON.stringify(audioData, null, 2);
  } catch (error) {
    console.error('语音合成工具执行失败:', error);
    throw new Error(`语音合成失败: ${error.message}`);
  }
}

// ==================== 图像识别API实现 ====================

/**
 * 分析图片（使用通义千问VL多模态模型）
 */
async function analyzeImage(imagePath, question = '描述这张图片的内容') {
  try {
    // 将图片转换为 base64
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');

    // 使用通义千问 VL 模型分析图片
    const response = await axios.post(
      `${DASHSCOPE_API_URL}/chat/completions`,
      {
        model: 'qwen-vl-max',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                },
              },
              {
                type: 'text',
                text: question,
              },
            ],
          },
        ],
      },
      {
        headers: {
          'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      success: true,
      analysis: response.data.choices[0].message.content,
      imagePath: imagePath,
      question: question,
    };
  } catch (error) {
    console.error('图片分析失败:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * 图片分析工具执行函数
 */
async function executeAnalyzeImage(params) {
  const { image_path, question = '描述这张图片的内容' } = params;
  console.log(`🖼️ 分析图片: ${image_path}`);

  try {
    const analysisResult = await analyzeImage(image_path, question);
    return JSON.stringify(analysisResult, null, 2);
  } catch (error) {
    console.error('图片分析工具执行失败:', error);
    throw new Error(`分析图片失败: ${error.message}`);
  }
}

// ==================== AI Agent ====================

/**
 * AI Agent聊天接口
 */
app.post('/chat', async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: '缺少message参数' });
    }

    console.log('📥 用户消息:', message);

    // 构建对话历史
    const messages = [
      {
        role: 'system',
        content: `你是一个智能多模态助手，可以帮用户查询天气、股票信息，生成图片、语音，分析图片等。
当用户询问天气时，请使用 get_weather 工具获取实时天气数据。
当用户询问股票时，请使用 get_stock 工具获取股票实时数据。
当用户要求生成图片时，请使用 generate_image 工具。
当用户要求语音播报时，请使用 text_to_speech 工具。
当用户上传图片并询问图片内容时，请使用 analyze_image 工具分析图片。
获取到数据后，用自然语言友好地回复用户。
不要编造数据，必须使用工具获取真实信息。`,
      },
      ...conversationHistory,
      {
        role: 'user',
        content: message,
      },
    ];

    // 调用阿里云通义千问 API
    const response = await axios.post(
      `${DASHSCOPE_API_URL}/chat/completions`,
      {
        model: 'qwen-plus',
        messages: messages,
        tools: [weatherTool, stockTool, imageGenTool, textToSpeechTool, imageAnalysisTool],
        tool_choice: 'auto',
        temperature: 0.7,
      },
      {
        headers: {
          'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const assistantMessage = response.data.choices[0].message;

    // 处理工具调用
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      console.log('🔧 AI决定调用工具:', assistantMessage.tool_calls);

      const toolMessages = [];

      for (const toolCall of assistantMessage.tool_calls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);

        // 执行工具
        let toolResult;
        if (functionName === 'get_weather') {
          toolResult = await executeGetWeather(functionArgs);
        } else if (functionName === 'get_stock') {
          toolResult = await executeGetStock(functionArgs);
        } else if (functionName === 'generate_image') {
          toolResult = await executeGenerateImage(functionArgs);
        } else if (functionName === 'text_to_speech') {
          toolResult = await executeTextToSpeech(functionArgs);
        } else if (functionName === 'analyze_image') {
          toolResult = await executeAnalyzeImage(functionArgs);
        }

        // 添加工具调用结果到消息历史
        toolMessages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          name: functionName,
          content: toolResult,
        });
      }

      // 再次调用AI，传入工具结果
      const secondResponse = await axios.post(
        `${DASHSCOPE_API_URL}/chat/completions`,
        {
          model: 'qwen-plus',
          messages: [...messages, assistantMessage, ...toolMessages],
          temperature: 0.7,
        },
        {
          headers: {
            'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const finalMessage = secondResponse.data.choices[0].message;
      console.log('📤 AI回复:', finalMessage.content);

      return res.json({
        response: finalMessage.content,
        toolCalls: assistantMessage.tool_calls.map(tc => ({
          name: tc.function.name,
          arguments: tc.function.arguments,
        })),
      });
    }

    // 没有工具调用，直接返回AI回复
    console.log('📤 AI回复:', assistantMessage.content);
    return res.json({ response: assistantMessage.content });
  } catch (error) {
    console.error('AI处理失败:', error);
    return res.status(500).json({
      error: 'AI处理失败',
      message: error.message,
    });
  }
});

// ==================== 静态文件服务 ====================

// 提供上传的文件访问
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/audio', express.static(path.join(__dirname, 'uploads/audio')));

// ==================== 多模态API端点 ====================

/**
 * 上传图片并分析
 */
app.post('/analyze-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请上传图片' });
    }

    const { question = '描述这张图片的内容' } = req.body;
    console.log('🖼️ 接收到图片分析请求:', req.file.path);

    const analysisResult = await analyzeImage(req.file.path, question);

    res.json({
      success: true,
      analysis: analysisResult,
      imagePath: `/uploads/${req.file.filename}`,
    });
  } catch (error) {
    console.error('图片分析失败:', error);
    res.status(500).json({
      error: '图片分析失败',
      message: error.message,
    });
  }
});

/**
 * 文字生成图片
 */
app.post('/generate-image', async (req, res) => {
  try {
    const { prompt, size = '512x512' } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: '缺少prompt参数' });
    }

    console.log('🎨 生成图片:', prompt);
    const imageData = await generateImage(prompt, size);

    res.json(imageData);
  } catch (error) {
    console.error('图片生成失败:', error);
    res.status(500).json({
      error: '图片生成失败',
      message: error.message,
    });
  }
});

/**
 * 文字转语音
 */
app.post('/text-to-speech', async (req, res) => {
  try {
    const { text, voice = 'zh' } = req.body;

    if (!text) {
      return res.status(400).json({ error: '缺少text参数' });
    }

    console.log('🔊 文字转语音:', text.substring(0, 50));
    const audioData = await textToSpeech(text, voice);

    res.json(audioData);
  } catch (error) {
    console.error('语音合成失败:', error);
    res.status(500).json({
      error: '语音合成失败',
      message: error.message,
    });
  }
});

/**
 * 健康检查
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'AI Multimodal Agent',
    timestamp: new Date().toISOString(),
    tools: ['get_weather', 'get_stock', 'generate_image', 'text_to_speech', 'analyze_image'],
  });
});

/**
 * 首页
 */
app.get('/', (req, res) => {
  res.json({
    name: 'AI Multimodal Agent',
    version: '3.0.0',
    description: '一个支持文本、图片、语音的多模态AI智能助手',
    endpoints: {
      chat: 'POST /chat',
      health: 'GET /health',
      analyzeImage: 'POST /analyze-image',
      generateImage: 'POST /generate-image',
      textToSpeech: 'POST /text-to-speech',
    },
    capabilities: {
      text: ['天气查询', '股票查询'],
      image: ['图片分析', '图片生成'],
      audio: ['文字转语音'],
    },
    usage: {
      chat: {
        method: 'POST',
        url: '/chat',
        body: {
          message: '用户消息',
          conversationHistory: '可选的对话历史',
        },
      },
    },
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log('==========================================');
  console.log('🤖 AI Multimodal Agent 已启动');
  console.log('📍 地址: http://localhost:' + PORT);
  console.log('📝 工具:');
  console.log('   🌤️  天气预报 (get_weather)');
  console.log('   📈  股票查询 (get_stock)');
  console.log('   🎨  图片生成 (generate_image)');
  console.log('   🔊  文字转语音 (text_to_speech)');
  console.log('   🖼️  图片分析 (analyze_image)');
  console.log('📝 API文档: http://localhost:' + PORT);
  console.log('🤖 AI模型: 阿里云通义千问 (qwen-plus, qwen-vl-max)');
  console.log('==========================================');
  console.log('');
  console.log('💡 提示:');
  console.log('   - 已配置 DASHSCOPE_API_KEY');
  console.log('   - 可选配置 WEATHER_API_KEY 使用真实天气数据');
  console.log('   - 访问 http://localhost:' + PORT + '/health 检查状态');
  console.log('');
});

module.exports = app;
