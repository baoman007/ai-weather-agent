const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:3000';

/**
 * 多模态测试函数
 */
async function testMultimodal() {
  console.log('==========================================');
  console.log('🧪 测试 AI Multimodal Agent');
  console.log('==========================================\n');

  // 测试1: 健康检查
  console.log('📋 测试1: 健康检查');
  try {
    const health = await axios.get(`${API_URL}/health`);
    console.log('✅ 服务状态:', health.data);
    console.log('🔧 可用工具:', health.data.tools.join(', '));
  } catch (error) {
    console.log('❌ 健康检查失败:', error.message);
    return;
  }

  console.log('\n');

  // 测试2: 天气查询
  console.log('📋 测试2: 查询北京天气');
  try {
    const response = await axios.post(`${API_URL}/chat`, {
      message: '北京今天天气怎么样？',
    });
    console.log('✅ AI回复:', response.data.response);
  } catch (error) {
    console.log('❌ 测试失败:', error.response?.data || error.message);
  }

  console.log('\n');

  // 测试3: 股票查询
  console.log('📋 测试3: 查询苹果公司股票');
  try {
    const response = await axios.post(`${API_URL}/chat`, {
      message: '查询苹果公司（AAPL）的股票价格',
    });
    console.log('✅ AI回复:', response.data.response);
  } catch (error) {
    console.log('❌ 测试失败:', error.response?.data || error.message);
  }

  console.log('\n');

  // 测试4: 生成图片
  console.log('📋 测试4: 生成天气图片');
  try {
    const response = await axios.post(`${API_URL}/chat`, {
      message: '帮我为北京晴天生成一张图片',
    });
    console.log('✅ AI回复:', response.data.response);
    if (response.data.toolCalls) {
      console.log('🔧 调用的工具:', JSON.stringify(response.data.toolCalls, null, 2));
    }
  } catch (error) {
    console.log('❌ 测试失败:', error.response?.data || error.message);
  }

  console.log('\n');

  // 测试5: 文字转语音
  console.log('📋 测试5: 文字转语音');
  try {
    const response = await axios.post(`${API_URL}/chat`, {
      message: '请用语音播报：北京今天天气晴朗，气温15-20摄氏度',
    });
    console.log('✅ AI回复:', response.data.response);
    if (response.data.toolCalls) {
      console.log('🔧 调用的工具:', JSON.stringify(response.data.toolCalls, null, 2));
    }
  } catch (error) {
    console.log('❌ 测试失败:', error.response?.data || error.message);
  }

  console.log('\n');

  // 测试6: 直接调用图片生成 API
  console.log('📋 测试6: 直接生成图片');
  try {
    const response = await axios.post(`${API_URL}/generate-image`, {
      prompt: '北京晴天，蓝天白云，阳光明媚',
      size: '512x512',
    });
    console.log('✅ 图片生成结果:', response.data);
  } catch (error) {
    console.log('❌ 测试失败:', error.response?.data || error.message);
  }

  console.log('\n');

  // 测试7: 直接调用文字转语音 API
  console.log('📋 测试7: 直接文字转语音');
  try {
    const response = await axios.post(`${API_URL}/text-to-speech`, {
      text: '北京今天天气晴朗，气温15-20摄氏度',
      voice: 'zh',
    });
    console.log('✅ 语音生成结果:', response.data);
  } catch (error) {
    console.log('❌ 测试失败:', error.response?.data || error.message);
  }

  console.log('\n');

  // 测试8: 图片分析（如果存在测试图片）
  console.log('📋 测试8: 图片分析');
  try {
    // 创建一个测试图片文件（如果不存在）
    const testImagePath = path.join(__dirname, 'test-image.jpg');
    if (!fs.existsSync(testImagePath)) {
      console.log('⚠️  测试图片不存在，跳过此测试');
      console.log('💡 提示：请将测试图片命名为 test-image.jpg 放在项目根目录');
    } else {
      const form = new FormData();
      form.append('image', fs.createReadStream(testImagePath));
      form.append('question', '这张图片显示了什么内容？');

      const response = await axios.post(`${API_URL}/analyze-image`, form, {
        headers: form.getHeaders(),
      });
      console.log('✅ 图片分析结果:', response.data);
    }
  } catch (error) {
    console.log('❌ 测试失败:', error.response?.data || error.message);
  }

  console.log('\n');

  // 测试9: 综合多模态查询
  console.log('📋 测试9: 综合多模态查询');
  try {
    const response = await axios.post(`${API_URL}/chat`, {
      message: '今天北京天气怎么样？招商银行的股票涨了吗？请帮我生成一张天气图片。',
    });
    console.log('✅ AI回复:', response.data.response);
  } catch (error) {
    console.log('❌ 测试失败:', error.response?.data || error.message);
  }

  console.log('\n==========================================');
  console.log('✅ 所有测试完成');
  console.log('==========================================');
}

// 运行测试
testMultimodal().catch(console.error);
