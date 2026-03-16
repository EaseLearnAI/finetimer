const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// 加载环境变量配置
require('../config/loadEnv');

// 测试配置
const BASE_URL = 'http://localhost:3000';
const LOGIN_DATA = {
  phoneNumber: '18176606006',
  password: '123456'
};

// 测试图片路径（使用uploads文件夹中的图片）
const TEST_IMAGE_PATH = path.join(__dirname, '../../../uploads/屏幕截图 2025-03-28 001418.png');

let authToken = null;

/**
 * 登录用户并获取token
 */
async function loginUser() {
  try {
    console.log('🔐 正在登录用户...');
    console.log(`📱 手机号: ${LOGIN_DATA.phoneNumber}`);
    
    const response = await axios.post(`${BASE_URL}/api/users/login`, LOGIN_DATA, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    if (response.data.success) {
      authToken = response.data.data.token;
      console.log('✅ 登录成功！');
      console.log(`🔑 Token: ${authToken.substring(0, 20)}...`);
      console.log(`👤 用户ID: ${response.data.data.user.id}`);
      return true;
    } else {
      console.error('❌ 登录失败:', response.data.message);
      return false;
    }
    
  } catch (error) {
    console.error('❌ 登录请求失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 测试图片分析功能
 */
async function testImageAnalysis() {
  console.log('🚀 开始测试图片分析功能...\n');

  try {
    // 测试1: 上传图片并分析
    console.log('📸 测试1: 上传图片并分析');
    if (fs.existsSync(TEST_IMAGE_PATH)) {
      const formData = new FormData();
      formData.append('image', fs.createReadStream(TEST_IMAGE_PATH));
      formData.append('prompt', '请详细描述这张图片的内容，包括主要元素、颜色、场景等');

      const response1 = await axios.post(`${BASE_URL}/api/image-analysis/upload-analyze`, formData, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          ...formData.getHeaders()
        },
        timeout: 60000 // 60秒超时，图片分析可能需要更长时间
      });

      console.log('✅ 上传图片分析成功:');
      console.log('   图片URL:', response1.data.imageUrl);
      console.log('   分析结果:', response1.data.analysis.content);
      if (response1.data.analysis.usage) {
        console.log('   使用情况:', response1.data.analysis.usage);
      }
      console.log('');
    } else {
      console.log('⚠️  跳过测试1: 测试图片不存在，请检查路径:', TEST_IMAGE_PATH);
    }

    // 测试2: 根据URL分析图片
    console.log('🔗 测试2: 根据URL分析图片');
    const testImageUrl = 'https://dashscope.oss-cn-beijing.aliyuncs.com/images/dog_and_girl.jpeg';
    
    const response2 = await axios.post(`${BASE_URL}/api/image-analysis/analyze-url`, {
      imageUrl: testImageUrl,
      prompt: '这张图片中有什么？请用中文描述'
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000
    });

    console.log('✅ URL分析成功:');
    console.log('   图片URL:', response2.data.imageUrl);
    console.log('   分析结果:', response2.data.analysis.content);
    if (response2.data.analysis.usage) {
      console.log('   使用情况:', response2.data.analysis.usage);
    }
    console.log('');

    console.log('🎉 所有测试通过！');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    
    if (error.response) {
      console.error('   状态码:', error.response.status);
      console.error('   错误信息:', error.response.data);
    }
  }
}

/**
 * 测试错误处理
 */
async function testErrorHandling() {
  console.log('\n📝 测试3: 错误处理');
  
  try {
    // 测试缺少认证
    console.log('   测试缺少认证...');
    const response = await axios.post(`${BASE_URL}/api/image-analysis/upload-analyze`, {}, {
      timeout: 10000
    });
    console.log('   ❌ 缺少认证测试失败，应该返回401');
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('   ✅ 缺少认证测试通过');
    } else {
      console.error('   ❌ 缺少认证测试异常:', error.response?.status);
    }
  }
  
  try {
    // 测试缺少文件
    console.log('   测试缺少文件...');
    const formData = new FormData();
    const response = await axios.post(`${BASE_URL}/api/image-analysis/upload-analyze`, formData, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        ...formData.getHeaders()
      },
      timeout: 10000
    });
    console.log('   ❌ 缺少文件测试失败，应该返回400');
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('   ✅ 缺少文件测试通过');
    } else {
      console.error('   ❌ 缺少文件测试异常:', error.response?.status);
    }
  }

  try {
    // 测试缺少URL参数
    console.log('   测试缺少URL参数...');
    const response = await axios.post(`${BASE_URL}/api/image-analysis/analyze-url`, {
      prompt: '测试提示词'
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    console.log('   ❌ 缺少URL参数测试失败，应该返回400');
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('   ✅ 缺少URL参数测试通过');
    } else {
      console.error('   ❌ 缺少URL参数测试异常:', error.response?.status);
    }
  }
}

/**
 * 测试环境变量配置
 */
function checkEnvironment() {
  console.log('🔍 检查环境配置...');
  
  // 必需的环境变量（没有默认值）
  const requiredEnvVars = [
    'DASHSCOPE_API_KEY',
    'OSS_ACCESS_KEY_ID',
    'OSS_ACCESS_KEY_SECRET'
  ];

  // 可选的环境变量（有默认值）
  const optionalEnvVars = [
    'OSS_BUCKET',
    'OSS_REGION'
  ];

  const missingRequiredVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingRequiredVars.length > 0) {
    console.log('❌ 缺少必需的环境变量:', missingRequiredVars.join(', '));
    console.log('请确保在.env文件中配置了这些变量');
    return false;
  }

  // 检查可选变量，如果不存在则显示默认值
  optionalEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      const defaultValue = varName === 'OSS_REGION' ? 'oss-cn-hangzhou' : 'vitebucket';
      console.log(`⚠️  ${varName} 未设置，将使用默认值: ${defaultValue}`);
    }
  });

  console.log('✅ 环境配置检查通过');
  return true;
}

/**
 * 检查测试图片
 */
function checkTestImage() {
  console.log('🖼️ 检查测试图片...');
  
  if (fs.existsSync(TEST_IMAGE_PATH)) {
    const stats = fs.statSync(TEST_IMAGE_PATH);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`✅ 找到测试图片: ${path.basename(TEST_IMAGE_PATH)}`);
    console.log(`   文件大小: ${fileSizeInMB} MB`);
    console.log(`   文件路径: ${TEST_IMAGE_PATH}`);
    return true;
  } else {
    console.log('❌ 测试图片不存在:', TEST_IMAGE_PATH);
    console.log('请确保uploads文件夹中有可用的图片文件');
    return false;
  }
}

// 主函数
async function main() {
  console.log('🚀 图片分析功能测试');
  console.log('📋 请确保：');
  console.log('   1. 服务器正在运行 (npm run dev)');
  console.log('   2. 已配置环境变量 (.env文件)');
  console.log('   3. uploads文件夹中有测试图片\n');
  
  // 检查环境配置
  if (!checkEnvironment()) {
    process.exit(1);
  }

  // 检查测试图片
  if (!checkTestImage()) {
    process.exit(1);
  }

  // 登录获取token
  const loginSuccess = await loginUser();
  if (!loginSuccess) {
    console.log('❌ 登录失败，无法继续测试');
    process.exit(1);
  }

  // 执行测试
  await testImageAnalysis();
  
  // 测试错误处理
  await testErrorHandling();
  
  console.log('\n🎉 所有测试完成！');
}

// 如果直接运行此文件
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { 
  testImageAnalysis, 
  checkEnvironment,
  checkTestImage,
  loginUser
};
