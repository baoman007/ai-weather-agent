const axios = require('axios');

const API_URL = 'http://localhost:3000';

/**
 * 测试函数
 */
async function test() {
  console.log('==========================================');
  console.log('🧪 测试 AI Assistant Agent');
  console.log('==========================================\n');

  // 测试1: 健康检查
  console.log('📋 测试1: 健康检查');
  try {
    const health = await axios.get(`${API_URL}/health`);
    console.log('✅ 服务状态:', health.data);
  } catch (error) {
    console.log('❌ 健康检查失败:', error.message);
    return;
  }

  console.log('\n');

  // 测试2: 简单天气查询
  console.log('📋 测试2: 查询北京天气');
  try {
    const response = await axios.post(`${API_URL}/chat`, {
      message: '北京今天天气怎么样？',
    });
    console.log('✅ AI回复:', response.data.response);
    if (response.data.toolCalls) {
      console.log('🔧 调用的工具:', JSON.stringify(response.data.toolCalls, null, 2));
    }
  } catch (error) {
    console.log('❌ 测试失败:', error.response?.data || error.message);
  }

  console.log('\n');

  // 测试3: 多天预报
  console.log('📋 测试3: 查询上海未来5天天气');
  try {
    const response = await axios.post(`${API_URL}/chat`, {
      message: '上海未来5天天气预报',
    });
    console.log('✅ AI回复:', response.data.response);
  } catch (error) {
    console.log('❌ 测试失败:', error.response?.data || error.message);
  }

  console.log('\n');

  // 测试4: 多城市对比
  console.log('📋 测试4: 对比北京和上海天气');
  try {
    const response = await axios.post(`${API_URL}/chat`, {
      message: '北京和上海哪个天气更好？',
    });
    console.log('✅ AI回复:', response.data.response);
  } catch (error) {
    console.log('❌ 测试失败:', error.response?.data || error.message);
  }

  console.log('\n');

  // 测试5: 对话历史
  console.log('📋 测试5: 带对话历史的查询');
  try {
    const conversationHistory = [
      { role: 'user', content: '北京今天天气怎么样？' },
      { role: 'assistant', content: '北京今天晴朗，气温15-20°C' },
    ];
    const response = await axios.post(`${API_URL}/chat`, {
      message: '那明天呢？',
      conversationHistory,
    });
    console.log('✅ AI回复:', response.data.response);
  } catch (error) {
    console.log('❌ 测试失败:', error.response?.data || error.message);
  }

  console.log('\n');

  // 测试6: 生活建议
  console.log('📋 测试6: 天气生活建议');
  try {
    const response = await axios.post(`${API_URL}/chat`, {
      message: '杭州今天下雨，我该穿什么？',
    });
    console.log('✅ AI回复:', response.data.response);
  } catch (error) {
    console.log('❌ 测试失败:', error.response?.data || error.message);
  }

  console.log('\n');

  // 测试7: 股票查询 - A股
  console.log('📋 测试7: 查询平安银行股票（000001）');
  try {
    const response = await axios.post(`${API_URL}/chat`, {
      message: '查询平安银行股票（000001）的实时价格',
    });
    console.log('✅ AI回复:', response.data.response);
    if (response.data.toolCalls) {
      console.log('🔧 调用的工具:', JSON.stringify(response.data.toolCalls, null, 2));
    }
  } catch (error) {
    console.log('❌ 测试失败:', error.response?.data || error.message);
  }

  console.log('\n');

  // 测试8: 股票查询 - 美股
  console.log('📋 测试8: 查询苹果公司股票（AAPL）');
  try {
    const response = await axios.post(`${API_URL}/chat`, {
      message: '苹果公司的股票现在多少钱？',
    });
    console.log('✅ AI回复:', response.data.response);
  } catch (error) {
    console.log('❌ 测试失败:', error.response?.data || error.message);
  }

  console.log('\n');

  // 测试9: 多股票对比
  console.log('📋 测试9: 对比阿里巴巴和苹果的股票');
  try {
    const response = await axios.post(`${API_URL}/chat`, {
      message: '阿里巴巴（BABA）和苹果（AAPL）哪个股票表现更好？',
    });
    console.log('✅ AI回复:', response.data.response);
  } catch (error) {
    console.log('❌ 测试失败:', error.response?.data || error.message);
  }

  console.log('\n');

  // 测试10: 综合查询
  console.log('📋 测试10: 天气和股票综合查询');
  try {
    const response = await axios.post(`${API_URL}/chat`, {
      message: '今天北京天气怎么样？另外招商银行的股票涨了吗？',
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
test().catch(console.error);
