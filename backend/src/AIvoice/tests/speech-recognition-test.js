const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// 测试配置
const BASE_URL = 'http://localhost:3000';
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODljNGI3M2MwMTQyZTQyYWViOGU2ZmYiLCJwaG9uZU51bWJlciI6IjE4MTc2NjA2MDA2IiwiaWF0IjoxNzU1NjY4MjQwLCJleHAiOjE3NTYyNzMwNDB9.NooDVYcfWMkUN1ue2T-tECQf-y9aBOZWu0xLLQct0CE'; // 需要替换为实际的测试token
const TEST_AUDIO_PATH = path.join(__dirname, '../../../uploads/huangquan1.mp3'); // 使用现有的测试音频文件

/**
 * 测试语音识别功能
 */
async function testSpeechRecognition() {
  console.log('🚀 开始测试语音识别功能...\n');

  try {
    // 测试1: 完整的语音识别流程
    console.log('📝 测试1: 完整的语音识别流程');
    await testFullRecognition();
    
    // 测试2: 仅上传语音文件
    console.log('\n📝 测试2: 仅上传语音文件');
    await testUploadOnly();
    
    // 测试3: 从URL识别
    console.log('\n📝 测试3: 从URL识别');
    await testRecognizeFromUrl();
    
    console.log('\n✅ 所有测试完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

/**
 * 测试完整的语音识别流程
 */
async function testFullRecognition() {
  try {
    if (!fs.existsSync(TEST_AUDIO_PATH)) {
      console.log('⚠️  测试音频文件不存在，跳过此测试');
      return;
    }

    const formData = new FormData();
    formData.append('audio', fs.createReadStream(TEST_AUDIO_PATH));

    const response = await axios.post(`${BASE_URL}/api/speech-recognition/recognize`, formData, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        ...formData.getHeaders()
      },
      timeout: 60000 // 60秒超时
    });

    console.log('✅ 完整识别成功');
    console.log('   识别结果:', response.data.data.transcription);
    console.log('   音频URL:', response.data.data.audioUrl);
    console.log('   OSS Key:', response.data.data.ossKey);
    
  } catch (error) {
    console.error('❌ 完整识别失败:', error.response?.data || error.message);
  }
}

/**
 * 测试仅上传语音文件
 */
async function testUploadOnly() {
  try {
    if (!fs.existsSync(TEST_AUDIO_PATH)) {
      console.log('⚠️  测试音频文件不存在，跳过此测试');
      return;
    }

    const formData = new FormData();
    formData.append('audio', fs.createReadStream(TEST_AUDIO_PATH));

    const response = await axios.post(`${BASE_URL}/api/speech-recognition/upload`, formData, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        ...formData.getHeaders()
      },
      timeout: 30000
    });

    console.log('✅ 仅上传成功');
    console.log('   音频URL:', response.data.data.audioUrl);
    console.log('   OSS Key:', response.data.data.ossKey);
    
    // 保存URL用于后续测试
    global.testAudioUrl = response.data.data.audioUrl;
    
  } catch (error) {
    console.error('❌ 仅上传失败:', error.response?.data || error.message);
  }
}

/**
 * 测试从URL识别
 */
async function testRecognizeFromUrl() {
  try {
    if (!global.testAudioUrl) {
      console.log('⚠️  没有可用的测试音频URL，跳过此测试');
      return;
    }

    const response = await axios.post(`${BASE_URL}/api/speech-recognition/recognize-url`, {
      audioUrl: global.testAudioUrl
    }, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    console.log('✅ 从URL识别成功');
    console.log('   识别结果:', response.data.data.transcription);
    console.log('   音频URL:', response.data.data.audioUrl);
    
  } catch (error) {
    console.error('❌ 从URL识别失败:', error.response?.data || error.message);
  }
}

/**
 * 测试错误处理
 */
async function testErrorHandling() {
  console.log('\n📝 测试4: 错误处理');
  
  try {
    // 测试缺少认证
    const response = await axios.post(`${BASE_URL}/api/speech-recognition/recognize`, {}, {
      timeout: 10000
    });
    console.log('❌ 缺少认证测试失败，应该返回401');
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ 缺少认证测试通过');
    } else {
      console.error('❌ 缺少认证测试异常:', error.response?.status);
    }
  }
  
  try {
    // 测试缺少文件
    const formData = new FormData();
    const response = await axios.post(`${BASE_URL}/api/speech-recognition/recognize`, formData, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        ...formData.getHeaders()
      },
      timeout: 10000
    });
    console.log('❌ 缺少文件测试失败，应该返回400');
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ 缺少文件测试通过');
    } else {
      console.error('❌ 缺少文件测试异常:', error.response?.status);
    }
  }
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
  console.log('🔧 语音识别功能测试');
  console.log('📋 请确保：');
  console.log('   1. 服务器正在运行 (npm run dev)');
  console.log('   2. 已配置有效的测试token');
  console.log('   3. 已配置DASHSCOPE_API_KEY环境变量');
  console.log('   4. 已配置OSS相关环境变量\n');
  
  testSpeechRecognition();
}

module.exports = {
  testSpeechRecognition,
  testFullRecognition,
  testUploadOnly,
  testRecognizeFromUrl,
  testErrorHandling
};
