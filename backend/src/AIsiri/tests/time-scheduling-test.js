'use strict';

/**
 * 时间调度功能测试
 * 验证时间调度功能可以顺利执行
 */

const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config({ path: '../../../.env' });

// 测试配置
const BASE_URL = 'http://localhost:3000';

// 测试用户信息
const TEST_USER = {
  phoneNumber: '13800138000',
  password: 'testpassword123',
  nickname: '调度测试用户'
};

let authToken = null;
let userId = null;

/**
 * 连接数据库
 */
async function connectDatabase() {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aisiri';
    await mongoose.connect(mongoURI);
    console.log('📊 数据库连接成功:', mongoURI);
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    return false;
  }
}

/**
 * 用户注册
 */
async function registerUser() {
  try {
    console.log('\n📝 开始用户注册...');
    const response = await axios.post(`${BASE_URL}/api/users/register`, TEST_USER);
    
    if (response.status === 201 && response.data.success) {
      userId = response.data.data.user.id;
      console.log('✅ 用户注册成功');
      console.log(`👤 用户ID: ${userId}`);
      return true;
    } else {
      console.log('❌ 用户注册失败:', response.data.message);
      return false;
    }
  } catch (error) {
    if (error.response && error.response.status === 409) {
      console.log('ℹ️  用户已存在，直接进行登录');
      return true;
    }
    console.log('❌ 用户注册请求失败:', error.message);
    return false;
  }
}

/**
 * 用户登录
 */
async function loginUser() {
  try {
    console.log('\n🔐 开始用户登录...');
    const response = await axios.post(`${BASE_URL}/api/users/login`, {
      phoneNumber: TEST_USER.phoneNumber,
      password: TEST_USER.password
    });
    
    if (response.status === 200 && response.data.success) {
      authToken = response.data.data.token;
      userId = response.data.data.user.id;
      console.log('✅ 用户登录成功');
      console.log(`🔑 认证Token: ${authToken.substring(0, 20)}...`);
      console.log(`👤 用户ID: ${userId}`);
      return true;
    } else {
      console.log('❌ 用户登录失败:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ 用户登录请求失败:', error.message);
    if (error.response) {
      console.log('📄 错误响应:', error.response.data);
    }
    return false;
  }
}

/**
 * 检查服务器状态
 */
async function checkServerHealth() {
  try {
    console.log('\n🔍 检查调度服务健康状态...');
    const response = await axios.get(`${BASE_URL}/api/aisiri/schedule/health`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      timeout: 10000
    });
    
    if (response.status === 200 && response.data.success) {
      console.log('✅ 调度服务健康检查通过:', response.data.data.status);
      return true;
    } else {
      console.log('❌ 调度服务健康检查失败:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ 调度服务健康检查请求失败:', error.message);
    return false;
  }
}

/**
 * 测试基础时间调度
 */
async function testBasicScheduling() {
  try {
    console.log('\n🎯 测试基础时间调度...');
    
    const requestBody = {
      userInput: '我今天下午三点要去拿快递，但感觉很累',
      targetDate: new Date().toISOString().split('T')[0],
      userContext: {
        emotionalState: '疲惫',
        energyLevel: '低',
        workload: '中等'
      },
      options: { autoApply: false }
    };
    
    console.log(`📝 用户输入: "${requestBody.userInput}"`);
    console.log(`📅 目标日期: ${requestBody.targetDate}`);
    
    const startTime = Date.now();
    const response = await axios.post(`${BASE_URL}/api/aisiri/schedule/plan`, requestBody, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000
    });
    
    const processingTime = Date.now() - startTime;
    
    if (response.status === 200 && response.data.success) {
      const data = response.data.data;
      console.log('✅ 时间调度成功');
      console.log(`⏱️  处理时间: ${processingTime}ms`);
      
      // 输出关键信息
      if (data.analysis) {
        console.log('📊 分析结果:');
        console.log(`   优先级洞察: ${data.analysis.priorityInsights || '无'}`);
        console.log(`   工作量评估: ${data.analysis.workloadAssessment || '无'}`);
        console.log(`   用户状态考虑: ${data.analysis.userStateConsiderations || '无'}`);
      }
      
      if (data.recommendations) {
        const adjustments = data.recommendations.taskAdjustments || [];
        console.log(`🔧 任务调整建议: ${adjustments.length}个`);
        
        adjustments.forEach((adj, index) => {
          console.log(`   ${index + 1}. ${adj.action} - ${adj.changes?.title || adj.taskId}`);
          if (adj.changes?.timeBlock) {
            console.log(`      时间: ${adj.changes.timeBlock.startTime}-${adj.changes.timeBlock.endTime}`);
          }
        });
      }
      
      if (data.summary) {
        console.log(`📜 调度总结: ${data.summary}`);
      }
      
      return { success: true, data: data };
    } else {
      console.log('❌ 时间调度失败:', response.data.message);
      return { success: false, error: response.data };
    }
  } catch (error) {
    console.log('❌ 时间调度请求失败:', error.message);
    if (error.response) {
      console.log('📄 错误响应:', error.response.data);
    }
    return { success: false, error: error.message };
  }
}

/**
 * 测试时间冲突分析
 */
async function testConflictAnalysis() {
  try {
    console.log('\n🔍 测试时间冲突分析...');
    
    const response = await axios.post(`${BASE_URL}/api/aisiri/schedule/analyze-conflicts`, {
      targetDate: new Date().toISOString().split('T')[0]
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    if (response.status === 200 && response.data.success) {
      const data = response.data.data;
      console.log('✅ 时间冲突分析成功');
      console.log(`📊 任务总数: ${data.taskCount}`);
      console.log(`⚠️  冲突数量: ${data.conflictCount}`);
      
      return { success: true, data: data };
    } else {
      console.log('❌ 时间冲突分析失败:', response.data.message);
      return { success: false, error: response.data };
    }
  } catch (error) {
    console.log('❌ 时间冲突分析请求失败:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * 测试时间建议生成
 */
async function testTimeSuggestion() {
  try {
    console.log('\n💡 测试时间建议生成...');
    
    const response = await axios.post(`${BASE_URL}/api/aisiri/schedule/suggest-time`, {
      targetDate: new Date().toISOString().split('T')[0],
      estimatedTime: 60,
      preferredTimeBlock: 'afternoon'
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    if (response.status === 200 && response.data.success) {
      const data = response.data.data;
      console.log('✅ 时间建议生成成功');
      console.log(`📅 目标日期: ${data.targetDate}`);
      console.log(`⏰ 预计用时: ${data.estimatedTime}分钟`);
      
      if (data.suggestion && data.suggestion.startTime && data.suggestion.endTime) {
        console.log(`💭 建议时间: ${data.suggestion.startTime}-${data.suggestion.endTime} (${data.suggestion.timeBlockType})`);
      }
      
      return { success: true, data: data };
    } else {
      console.log('❌ 时间建议生成失败:', response.data.message);
      return { success: false, error: response.data };
    }
  } catch (error) {
    console.log('❌ 时间建议生成请求失败:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * 主测试函数
 */
async function runTimeSchedulingTest() {
  console.log('🚀 开始运行时间调度功能测试');
  console.log('=' * 60);
  
  try {
    // 1. 连接数据库
    const dbConnected = await connectDatabase();
    if (!dbConnected) {
      console.log('❌ 测试终止: 无法连接数据库');
      return;
    }
    
    // 2. 用户注册
    const registered = await registerUser();
    if (!registered) {
      console.log('❌ 测试终止: 用户注册失败');
      return;
    }
    
    // 3. 用户登录
    const loggedIn = await loginUser();
    if (!loggedIn || !authToken) {
      console.log('❌ 测试终止: 用户登录失败');
      return;
    }
    
    // 4. 检查服务器健康状态
    const serverHealthy = await checkServerHealth();
    if (!serverHealthy) {
      console.log('❌ 测试终止: 调度服务不可用');
      console.log('💡 提示: 请先启动服务器 (cd ../../../ && npm start)');
      return;
    }
    
    // 5. 测试基础时间调度
    console.log('\n🧪 开始测试时间调度功能...');
    const schedulingResult = await testBasicScheduling();
    
    // 等待1秒
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 6. 测试时间冲突分析
    const conflictResult = await testConflictAnalysis();
    
    // 等待1秒
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 7. 测试时间建议生成
    const suggestionResult = await testTimeSuggestion();
    
    // 8. 输出测试总结
    console.log('\n📋 测试结果总结');
    console.log('=' * 60);
    
    const tests = [
      { name: '基础时间调度', result: schedulingResult },
      { name: '时间冲突分析', result: conflictResult },
      { name: '时间建议生成', result: suggestionResult }
    ];
    
    let successCount = 0;
    tests.forEach(test => {
      const status = test.result.success ? '✅' : '❌';
      console.log(`${status} ${test.name}: ${test.result.success ? '通过' : '失败'}`);
      if (test.result.success) successCount++;
    });
    
    console.log(`\n📊 总体结果: ${successCount}/${tests.length} 个测试通过`);
    console.log(`📈 成功率: ${Math.round((successCount / tests.length) * 100)}%`);
    
    if (successCount === tests.length) {
      console.log('\n🎉 所有测试通过！时间调度功能工作正常');
    } else {
      console.log('\n⚠️  部分测试失败，请检查服务配置');
    }
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
  } finally {
    // 关闭数据库连接
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('\n📊 数据库连接已关闭');
    }
  }
}

// 当直接运行此文件时执行测试
if (require.main === module) {
  runTimeSchedulingTest().catch(console.error);
}

module.exports = {
  runTimeSchedulingTest
};