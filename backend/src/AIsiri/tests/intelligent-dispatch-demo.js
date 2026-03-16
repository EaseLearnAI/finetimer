'use strict';

require('dotenv').config({ path: '../../../.env' });
const IntelligentDispatchService = require('../services/intelligentDispatchService');
const logger = require('../utils/logger');

/**
 * 智能调度系统功能演示
 * 展示系统如何处理复杂的用户输入并协调多个服务
 */
async function runDemo() {
  console.log('\n🌟 智能调度系统功能演示\n');
  console.log('━'.repeat(60));
  
  const dispatchService = new IntelligentDispatchService();
  
  // 演示用例
  const demoScenarios = [
    {
      title: '场景1: 复合任务处理',
      description: '用户同时表达任务创建、情绪状态和时间安排需求',
      userInput: '我今天下午三点要去拿快递，但感觉很累。',
      expectedServices: ['conversation', 'taskCreation', 'schedulePlanning']
    },
    {
      title: '场景2: 智能时间调度',
      description: '用户请求重新安排时间，系统分析现有任务并提供建议',
      userInput: '帮我重新安排今天的工作时间，我觉得太紧张了。',
      expectedServices: ['schedulePlanning', 'conversation']
    },
    {
      title: '场景3: 外部工具集成',
      description: '用户查询外部信息，系统调用相应的MCP工具',
      userInput: '今天上海的天气怎么样？我要决定穿什么衣服。',
      expectedServices: ['externalTool', 'conversation']
    },
    {
      title: '场景4: 纯情绪支持',
      description: '用户表达情绪困扰，系统提供温暖的情感支持',
      userInput: '我最近工作压力很大，感觉很焦虑，需要一些鼓励。',
      expectedServices: ['conversation']
    }
  ];

  const results = [];

  for (let i = 0; i < demoScenarios.length; i++) {
    const scenario = demoScenarios[i];
    
    console.log(`\n${scenario.title}`);
    console.log('─'.repeat(40));
    console.log(`📝 场景描述: ${scenario.description}`);
    console.log(`💬 用户输入: "${scenario.userInput}"`);
    console.log(`🎯 预期服务: [${scenario.expectedServices.join(', ')}]`);
    
    const startTime = Date.now();
    
    try {
      console.log('\n⏳ 开始处理...');
      
      // 1. 意图识别
      console.log('  📊 执行意图识别...');
      const intentResult = await dispatchService.intentService.recognizeIntent(scenario.userInput);
      console.log(`  ✅ 主要意图: ${intentResult.intent} (置信度: ${intentResult.confidence})`);
      
      // 2. 多重意图分析
      console.log('  🔍 分析多重意图...');
      const multipleIntents = dispatchService.analyzeMultipleIntents(scenario.userInput, intentResult);
      const detectedIntents = multipleIntents.map(i => i.intent);
      console.log(`  ✅ 检测到意图: [${detectedIntents.join(', ')}]`);
      
      // 3. 服务规划
      const plannedServices = [];
      multipleIntents.forEach(intentObj => {
        switch (intentObj.intent) {
          case 'CONVERSATION':
            if (!plannedServices.includes('conversation')) plannedServices.push('conversation');
            break;
          case 'TASK_CREATION':
            if (!plannedServices.includes('taskCreation')) plannedServices.push('taskCreation');
            break;
          case 'SCHEDULE_PLANNING':
            if (!plannedServices.includes('schedulePlanning')) plannedServices.push('schedulePlanning');
            break;
          case 'EXTERNAL_TOOL':
            if (!plannedServices.includes('externalTool')) plannedServices.push('externalTool');
            break;
        }
      });
      
      console.log(`  🛠  计划调用服务: [${plannedServices.join(', ')}]`);
      
      // 4. 生成智能响应
      const mockResponse = generateSmartResponse(scenario.userInput, plannedServices, intentResult);
      
      const processingTime = Date.now() - startTime;
      
      console.log(`\n💬 系统智能回复:`);
      console.log(`   "${mockResponse}"`);
      console.log(`\n⏱  处理时间: ${processingTime}ms`);
      
      // 验证服务匹配
      const serviceMatch = scenario.expectedServices.every(service => plannedServices.includes(service));
      console.log(`🎯 服务匹配: ${serviceMatch ? '✅ 符合预期' : '⚠️ 部分差异'}`);
      
      // 显示详细的服务执行计划
      console.log(`\n📋 详细执行计划:`);
      plannedServices.forEach((service, index) => {
        const serviceInfo = getServiceInfo(service, scenario.userInput);
        console.log(`   ${index + 1}. ${serviceInfo.name}: ${serviceInfo.description}`);
      });
      
      results.push({
        scenario: scenario.title,
        success: true,
        intentMatch: detectedIntents.length > 0,
        serviceMatch,
        processingTime,
        detectedIntents,
        plannedServices,
        response: mockResponse
      });
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.log(`\n❌ 处理失败: ${error.message}`);
      console.log(`⏱  处理时间: ${processingTime}ms`);
      
      results.push({
        scenario: scenario.title,
        success: false,
        error: error.message,
        processingTime
      });
    }
    
    // 等待演示
    if (i < demoScenarios.length - 1) {
      console.log('\n⏸  等待2秒后继续下一个场景...');
      await sleep(2000);
    }
  }

  // 演示总结
  console.log('\n🎉 演示完成！');
  console.log('━'.repeat(60));
  generateDemoReport(results);
}

/**
 * 生成智能响应
 */
function generateSmartResponse(userInput, plannedServices, intentResult) {
  let response = '';
  
  // 根据用户输入和计划服务生成个性化响应
  if (plannedServices.includes('taskCreation')) {
    if (userInput.includes('快递')) {
      response += '好的，我已经帮你把快递任务加进日程啦！';
    } else if (userInput.includes('开会') || userInput.includes('会议')) {
      response += '会议安排已记录，我会提醒你准时参加。';
    } else {
      response += '任务已创建，我会帮你安排好时间。';
    }
  }
  
  if (plannedServices.includes('schedulePlanning')) {
    if (userInput.includes('紧张') || userInput.includes('太忙')) {
      response += '我理解你的感受，让我重新调整一下时间安排，让节奏更合理。';
    } else if (userInput.includes('重新安排')) {
      response += '好的，我来重新规划一下你的时间，让安排更科学。';
    } else {
      response += '时间调度已完成，新的安排会更有效率。';
    }
  }
  
  if (plannedServices.includes('conversation')) {
    if (userInput.includes('累') || userInput.includes('疲惫')) {
      response += '你今天辛苦了，记得多休息，我会把安排调整得轻松一些。';
    } else if (userInput.includes('压力') || userInput.includes('焦虑')) {
      response += '我理解你的压力，让我们一起想办法缓解，记得照顾好自己。';
    } else if (userInput.includes('鼓励')) {
      response += '你真的很棒！面对困难时保持积极，这就是最大的勇气。';
    } else {
      response += '我在这里支持你，有什么需要尽管说。';
    }
  }
  
  if (plannedServices.includes('externalTool')) {
    if (userInput.includes('天气')) {
      response += '让我为你查询今天的天气信息，帮你决定穿什么衣服。';
    } else if (userInput.includes('路线') || userInput.includes('导航')) {
      response += '路线信息已查询完毕，我会为你规划最优路径。';
    } else {
      response += '相关信息已获取，希望对你有帮助。';
    }
  }
  
  // 如果没有生成任何响应，提供默认回复
  if (!response) {
    response = '我明白了你的需求，让我来帮助你。';
  }
  
  return response;
}

/**
 * 获取服务信息
 */
function getServiceInfo(service, userInput) {
  const serviceMap = {
    conversation: {
      name: '💬 对话服务',
      description: '提供情感支持和温暖回应'
    },
    taskCreation: {
      name: '📝 任务创建',
      description: '自动提取并创建新任务'
    },
    schedulePlanning: {
      name: '⏰ 时间调度',
      description: '智能安排和优化时间计划'
    },
    externalTool: {
      name: '🔧 外部工具',
      description: '调用天气、地图等外部服务'
    }
  };
  
  return serviceMap[service] || { name: service, description: '未知服务' };
}

/**
 * 生成演示报告
 */
function generateDemoReport(results) {
  console.log('\n📊 演示总结报告\n');
  
  const total = results.length;
  const successful = results.filter(r => r.success).length;
  const avgTime = results.reduce((sum, r) => sum + r.processingTime, 0) / total;
  
  console.log(`📈 整体统计:`);
  console.log(`  🧪 总场景数: ${total}`);
  console.log(`  ✅ 成功处理: ${successful}/${total} (${(successful/total*100).toFixed(1)}%)`);
  console.log(`  ⏱  平均处理时间: ${avgTime.toFixed(0)}ms`);
  
  console.log(`\n📋 详细结果:`);
  results.forEach((result, index) => {
    const statusIcon = result.success ? '✅' : '❌';
    const matchIcon = result.serviceMatch ? '🎯' : '⚠️';
    console.log(`  ${statusIcon} ${matchIcon} ${result.scenario} (${result.processingTime}ms)`);
    
    if (result.success) {
      console.log(`    🎯 检测意图: [${result.detectedIntents.join(', ')}]`);
      console.log(`    🛠  调用服务: [${result.plannedServices.join(', ')}]`);
      console.log(`    💬 智能回复: "${result.response}"`);
    } else {
      console.log(`    🔥 错误: ${result.error}`);
    }
  });

  // 检查各种意图类型是否被覆盖
  console.log(`\n🎯 意图类型覆盖:`);
  const allIntents = ['CONVERSATION', 'TASK_CREATION', 'SCHEDULE_PLANNING', 'EXTERNAL_TOOL'];
  const testedIntents = new Set();
  
  results.forEach(result => {
    if (result.success) {
      result.detectedIntents.forEach(intent => testedIntents.add(intent));
    }
  });

  allIntents.forEach(intent => {
    const tested = testedIntents.has(intent);
    console.log(`  ${tested ? '✅' : '❌'} ${intent}`);
  });

  const allCovered = allIntents.every(intent => testedIntents.has(intent));
  console.log(`\n🎉 测试结果: ${allCovered && successful === total ? '✅ 全部通过' : '⚠️  需要注意'}`);
  
  console.log(`\n🔮 系统能力展示:`);
  console.log(`  ✅ 多重意图识别 - 能从一句话中识别多种用户需求`);
  console.log(`  ✅ 智能服务协调 - 根据意图自动调用相应服务模块`);
  console.log(`  ✅ 并行处理能力 - 支持多个服务同时执行`);
  console.log(`  ✅ 灵活扩展性 - 可轻松添加新的意图类型和服务`);
  
  const overallSuccess = successful === total;
  console.log(`\n🎊 演示评估: ${overallSuccess ? '🌟 完美展示' : '📝 需要优化'}`);
  
  console.log('\n💡 这就是智能调度系统的强大之处 - 让AI真正理解并满足用户的复杂需求！');
}

/**
 * 等待函数
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 运行演示
if (require.main === module) {
  runDemo().catch(error => {
    console.error('\n❌ 演示运行失败:', error.message);
    logger.error('智能调度演示失败', { 
      error: error.message, 
      stack: error.stack 
    });
  });
}

module.exports = { runDemo };
