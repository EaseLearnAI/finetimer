// 测试习惯养成功能的脚本
const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/ai';
const USER_ID = '68974d3a68e7adf1e74f68ab';

async function testHabitFormation() {
  console.log('🧪 开始测试习惯养成功能...');
  
  try {
    // 步骤1: 发送初始习惯养成请求
    console.log('\n📝 步骤1: 发送初始习惯养成请求');
    const step1Response = await axios.post(`${BASE_URL}/process-input`, {
      userInput: '我想养成每天健身的习惯',
      userId: USER_ID
    });
    
    console.log('✅ 步骤1响应:', JSON.stringify(step1Response.data, null, 2));
    
    if (step1Response.data.result && step1Response.data.result.questions) {
      const questions = step1Response.data.result.questions.questions;
      const habitType = step1Response.data.result.questions.habit_type;
      
      console.log(`\n📋 收到${questions.length}个问题，习惯类型: ${habitType}`);
      
      // 步骤2: 模拟回答所有问题
      const answers = [
        '每天吧',
        '下午的时候会好一点',
        '我担心坚持不下去'
      ];
      
      console.log('\n📝 步骤2: 直接调用生成习惯计划API');
      const step2Response = await axios.post(`${BASE_URL}/generate-habit-plan`, {
        userInput: '我想养成每天健身的习惯',
        habitType: habitType,
        questionAnswers: answers,
        userId: USER_ID
      });
      
      console.log('✅ 步骤2响应:', JSON.stringify(step2Response.data, null, 2));
      
      if (step2Response.data.success) {
        console.log('\n🎉 习惯养成功能测试成功！');
        console.log('📊 创建的任务数量:', step2Response.data.result.tasks?.length || 0);
        console.log('📁 任务集名称:', step2Response.data.result.collection?.name || 'N/A');
      } else {
        console.log('❌ 习惯计划生成失败:', step2Response.data.error);
      }
    } else {
      console.log('❌ 步骤1未返回预期的问题格式');
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
  }
}

// 运行测试
testHabitFormation();