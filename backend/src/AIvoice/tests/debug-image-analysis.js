const axios = require('axios');
require('../config/loadEnv');

// 测试配置
const TEST_IMAGE_URL = 'https://dashscope.oss-cn-beijing.aliyuncs.com/images/dog_and_girl.jpeg';
const TEST_PROMPT = '这张图片中有什么？请用中文描述';

/**
 * 检查环境变量
 */
function checkEnvironment() {
  console.log('🔍 检查环境配置...');
  
  const requiredVars = ['DASHSCOPE_API_KEY'];
  const missingVars = requiredVars.filter(varName => !process.env.DASHSCOPE_API_KEY);
  
  if (missingVars.length > 0) {
    console.log('❌ 缺少必需的环境变量:', missingVars.join(', '));
    return false;
  }
  
  console.log('✅ DASHSCOPE_API_KEY:', process.env.DASHSCOPE_API_KEY.substring(0, 10) + '...');
  return true;
}

/**
 * 测试通义千问API连接
 */
async function testQwenConnection() {
  console.log('\n🔗 测试通义千问API连接...');
  
  try {
    const apiKey = process.env.DASHSCOPE_API_KEY;
    const baseURL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
    
    console.log('   测试URL:', baseURL);
    console.log('   模型: qwen-vl-max');
    
    const requestBody = {
      model: 'qwen-vl-max',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: TEST_IMAGE_URL
              }
            },
            {
              type: 'text',
              text: TEST_PROMPT
            }
          ]
        }
      ],
      max_tokens: 2048,
      temperature: 0.7
    };

    console.log('   发送请求...');
    const response = await axios.post(baseURL, requestBody, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000 // 60秒超时
    });

    console.log('✅ API调用成功！');
    console.log('   状态码:', response.status);
    console.log('   响应数据:', JSON.stringify(response.data, null, 2));
    
    return true;
    
  } catch (error) {
    console.error('❌ API调用失败:');
    
    if (error.response) {
      console.error('   状态码:', error.response.status);
      console.error('   错误信息:', error.response.data);
      console.error('   响应头:', error.response.headers);
    } else if (error.request) {
      console.error('   网络请求错误:', error.message);
      console.error('   请求配置:', error.config);
    } else {
      console.error('   其他错误:', error.message);
    }
    
    return false;
  }
}

/**
 * 测试图片URL可访问性
 */
async function testImageUrl() {
  console.log('\n🖼️ 测试图片URL可访问性...');
  
  try {
    console.log('   测试URL:', TEST_IMAGE_URL);
    
    const response = await axios.head(TEST_IMAGE_URL, {
      timeout: 10000
    });
    
    console.log('✅ 图片URL可访问');
    console.log('   状态码:', response.status);
    console.log('   内容类型:', response.headers['content-type']);
    console.log('   内容长度:', response.headers['content-length']);
    
    return true;
    
  } catch (error) {
    console.error('❌ 图片URL不可访问:', error.message);
    return false;
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 图片分析服务调试工具');
  console.log('=' .repeat(50));
  
  // 检查环境配置
  if (!checkEnvironment()) {
    console.log('\n❌ 环境配置检查失败，请检查.env文件');
    process.exit(1);
  }
  
  // 测试图片URL可访问性
  await testImageUrl();
  
  // 测试通义千问API连接
  const apiSuccess = await testQwenConnection();
  
  if (apiSuccess) {
    console.log('\n🎉 所有测试通过！图片分析服务应该可以正常工作');
  } else {
    console.log('\n❌ 通义千问API测试失败，请检查：');
    console.log('   1. API Key是否正确');
    console.log('   2. 网络连接是否正常');
    console.log('   3. API地址是否正确');
    console.log('   4. 账户余额是否充足');
  }
}

// 如果直接运行此文件
if (require.main === module) {
  main().catch(console.error);
}
