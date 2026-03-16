'use strict';

require('dotenv').config({ path: '../../../.env' });
const IntelligentDispatchService = require('../services/intelligentDispatchService');
const logger = require('../utils/logger');

/**
 * 智能调度快速测试
 * 不依赖数据库，专注于测试核心调度逻辑
 */
async function quickTest() {
  console.log('\n🚀 智能调度快速测试开始...\n');
  
  const dispatchService = new IntelligentDispatchService();
  
  // 测试用例
  const testCases = [
    {
      name: '多重意图测试 - 情绪+任务',
      input: '我今天下午三点要去拿快递，但感觉很累。',
      mockUserId: 'test-user-1'
    },
    {
      name: '时间调度测试',
      input: '帮我重新安排今天的工作时间',
      mockUserId: 'test-user-2'
    },
    {
      name: '外部工具测试',
      input: '今天上海的天气怎么样？',
      mockUserId: 'test-user-3'
    },
    {
      name: '纯对话测试',
      input: '我感觉压力很大，需要支持',
      mockUserId: 'test-user-4'
    }
  ];

  const results = [];

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n--- 测试 ${i + 1}: ${testCase.name} ---`);
    console.log(`📝 输入: "${testCase.input}"`);
    
    const startTime = Date.now();
    
    try {
      // 模拟调度处理（跳过数据库操作）
      const result = await testDispatchLogic(dispatchService, testCase);
      
      const processingTime = Date.now() - startTime;
      
      console.log(`✅ 执行成功`);
      console.log(`🎯 主要意图: ${result.primaryIntent}`);
      console.log(`🔀 多重意图: [${result.multipleIntents.join(', ')}]`);
      console.log(`🛠  将调用服务: [${result.plannedServices.join(', ')}]`);
      console.log(`⏱  处理时间: ${processingTime}ms`);
      
      results.push({
        ...testCase,
        success: true,
        result,
        processingTime
      });
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      console.log(`❌ 执行失败: ${error.message}`);
      console.log(`⏱  处理时间: ${processingTime}ms`);
      
      results.push({
        ...testCase,
        success: false,
        error: error.message,
        processingTime
      });
    }
    
    // 避免API调用过快
    await sleep(2000);
  }

  // 生成报告
  generateQuickReport(results);
}

/**
 * 测试调度逻辑（模拟版本）
 */
async function testDispatchLogic(dispatchService, testCase) {
  // 1. 意图识别
  console.log('  📊 执行意图识别...');
  const intentResult = await dispatchService.intentService.recognizeIntent(testCase.input);
  
  // 2. 多重意图分析
  console.log('  🔍 分析多重意图...');
  const multipleIntents = dispatchService.analyzeMultipleIntents(testCase.input, intentResult);
  
  // 3. 确定将要调用的服务
  const plannedServices = [];
  multipleIntents.forEach(intentObj => {
    switch (intentObj.intent) {
      case 'CONVERSATION':
        plannedServices.push('conversation');
        break;
      case 'TASK_CREATION':
        plannedServices.push('taskCreation');
        break;
      case 'SCHEDULE_PLANNING':
        plannedServices.push('schedulePlanning');
        break;
      case 'EXTERNAL_TOOL':
        plannedServices.push('externalTool');
        break;
    }
  });

  return {
    primaryIntent: intentResult.intent,
    confidence: intentResult.confidence,
    reasoning: intentResult.reasoning,
    multipleIntents: multipleIntents.map(i => i.intent),
    plannedServices: [...new Set(plannedServices)], // 去重
    extractedInfo: intentResult.extracted_info
  };
}

/**
 * 生成快速测试报告
 */
function generateQuickReport(results) {
  console.log('\n📊 === 快速测试报告 ===\n');
  
  const total = results.length;
  const successful = results.filter(r => r.success).length;
  const avgTime = results.reduce((sum, r) => sum + r.processingTime, 0) / total;
  
  console.log(`📈 统计信息:`);
  console.log(`  🧪 总测试: ${total}`);
  console.log(`  ✅ 成功: ${successful} (${(successful/total*100).toFixed(1)}%)`);
  console.log(`  ⏱  平均时间: ${avgTime.toFixed(0)}ms`);
  
  console.log(`\n📋 意图识别结果:`);
  results.forEach((result, index) => {
    if (result.success) {
      console.log(`  ${index + 1}. ${result.name}:`);
      console.log(`     主要意图: ${result.result.primaryIntent} (${result.result.confidence})`);
      console.log(`     多重意图: [${result.result.multipleIntents.join(', ')}]`);
      console.log(`     计划服务: [${result.result.plannedServices.join(', ')}]`);
    } else {
      console.log(`  ${index + 1}. ${result.name}: ❌ ${result.error}`);
    }
  });

  // 检查各种意图类型是否被覆盖
  console.log(`\n🎯 意图类型覆盖:`);
  const allIntents = ['CONVERSATION', 'TASK_CREATION', 'SCHEDULE_PLANNING', 'EXTERNAL_TOOL'];
  const testedIntents = new Set();
  
  results.forEach(result => {
    if (result.success) {
      result.result.multipleIntents.forEach(intent => testedIntents.add(intent));
    }
  });

  allIntents.forEach(intent => {
    const tested = testedIntents.has(intent);
    console.log(`  ${tested ? '✅' : '❌'} ${intent}`);
  });

  const allCovered = allIntents.every(intent => testedIntents.has(intent));
  console.log(`\n🎉 测试结果: ${allCovered && successful === total ? '✅ 全部通过' : '⚠️  需要注意'}`);
  
  console.log('\n📝 快速测试完成！');
}

/**
 * 等待函数
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 运行测试
if (require.main === module) {
  quickTest().catch(error => {
    console.error('❌ 快速测试失败:', error.message);
    logger.error('智能调度快速测试失败', { 
      error: error.message, 
      stack: error.stack 
    });
  });
}

module.exports = { quickTest };

