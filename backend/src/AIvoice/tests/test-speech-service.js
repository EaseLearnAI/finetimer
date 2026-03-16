const speechRecognitionService = require('../services/speechRecognitionService');
require('../config/loadEnv');

/**
 * 测试语音识别服务
 */
async function testSpeechService() {
  console.log('🧪 测试语音识别服务...\n');
  
  // 检查环境变量
  console.log('📋 环境变量检查:');
  console.log(`   DASHSCOPE_API_KEY: ${process.env.DASHSCOPE_API_KEY ? '已配置' : '未配置'}`);
  
  if (!process.env.DASHSCOPE_API_KEY) {
    console.log('\n❌ DASHSCOPE_API_KEY 未配置！');
    console.log('💡 请创建 .env 文件并添加:');
    console.log('   DASHSCOPE_API_KEY=your_api_key_here');
    return;
  }
  
  console.log('\n✅ 环境变量配置正确');
  
  // 测试音频URL（使用之前上传成功的音频）
  const testAudioUrl = 'http://vitebucket.oss-cn-hangzhou.aliyuncs.com/speech-recognition/689c4b73c0142e42aeb8e6ff/1755668252530_huangquan1.mp3';
  
  console.log(`\n🎵 测试音频URL: ${testAudioUrl}`);
  
  try {
    console.log('\n🚀 开始测试通义千问ASR...');
    const result = await speechRecognitionService.recognizeSpeech(testAudioUrl);
    console.log('✅ 通义千问ASR识别成功:');
    console.log(`   识别结果: ${result}`);
    
  } catch (error) {
    console.error('❌ 通义千问ASR识别失败:', error.message);
    
    // 尝试备用方案
    try {
      console.log('\n🔄 尝试使用Paraformer备用方案...');
      const fallbackResult = await speechRecognitionService.recognizeSpeechWithParaformer(testAudioUrl);
      console.log('✅ Paraformer识别成功:');
      console.log(`   识别结果: ${fallbackResult}`);
      
    } catch (fallbackError) {
      console.error('❌ Paraformer也失败了:', fallbackError.message);
    }
  }
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
  testSpeechService().catch(console.error);
}

module.exports = {
  testSpeechService
};
