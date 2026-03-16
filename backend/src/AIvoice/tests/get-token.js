const axios = require('axios');

// 测试配置
const BASE_URL = 'http://localhost:3000';
const LOGIN_DATA = {
  phoneNumber: '18176606006',
  password: '123456'
};

/**
 * 登录用户并获取token
 */
async function getToken() {
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
      const token = response.data.data.token;
      console.log('✅ 登录成功！');
      console.log(`🔑 Token: ${token}`);
      console.log(`👤 用户ID: ${response.data.data.user.id}`);
      console.log(`📱 手机号: ${response.data.data.user.phoneNumber}`);
      
      // 将token写入到测试文件中
      updateTestFile(token);
      
      return token;
    } else {
      console.error('❌ 登录失败:', response.data.message);
      return null;
    }
    
  } catch (error) {
    console.error('❌ 登录请求失败:', error.response?.data || error.message);
    return null;
  }
}

/**
 * 更新测试文件中的token
 */
function updateTestFile(token) {
  const fs = require('fs');
  const path = require('path');
  
  const testFilePath = path.join(__dirname, 'speech-recognition-test.js');
  
  try {
    let content = fs.readFileSync(testFilePath, 'utf8');
    
    // 替换旧的token
    const oldTokenRegex = /const TEST_TOKEN = '[^']*';/;
    const newTokenLine = `const TEST_TOKEN = '${token}';`;
    
    if (oldTokenRegex.test(content)) {
      content = content.replace(oldTokenRegex, newTokenLine);
      fs.writeFileSync(testFilePath, content, 'utf8');
      console.log('📝 已更新测试文件中的token');
    } else {
      console.log('⚠️  未找到TEST_TOKEN行，请手动更新');
    }
    
  } catch (error) {
    console.error('❌ 更新测试文件失败:', error.message);
  }
}

/**
 * 测试token是否有效
 */
async function testToken(token) {
  try {
    console.log('\n🧪 测试token有效性...');
    
    const response = await axios.get(`${BASE_URL}/api/users/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      timeout: 10000
    });

    if (response.data.success) {
      console.log('✅ Token验证成功！');
      console.log(`👤 用户信息: ${JSON.stringify(response.data.data, null, 2)}`);
      return true;
    } else {
      console.error('❌ Token验证失败:', response.data.message);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Token验证请求失败:', error.response?.data || error.message);
    return false;
  }
}

// 主函数
async function main() {
  console.log('🚀 开始获取用户token...\n');
  
  const token = await getToken();
  
  if (token) {
    console.log('\n🔍 验证token...');
    const isValid = await testToken(token);
    
    if (isValid) {
      console.log('\n🎉 所有步骤完成！现在可以运行语音识别测试了。');
      console.log('💡 运行命令: node speech-recognition-test.js');
    } else {
      console.log('\n❌ Token验证失败，请检查服务器状态。');
    }
  } else {
    console.log('\n❌ 无法获取token，请检查登录信息或服务器状态。');
  }
}

// 如果直接运行此文件，执行主函数
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  getToken,
  testToken
};
