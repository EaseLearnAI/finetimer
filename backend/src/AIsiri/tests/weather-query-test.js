'use strict';

const IntelligentDispatchService = require('../services/intelligentDispatchService');
const gaodeMcpClient = require('../services/gaodeMcpClient');
require('dotenv').config({ path: '../../../.env' });

/**
 * 天气查询功能测试
 * 测试智能调度服务中的天气查询和情绪检测功能
 */

class WeatherQueryTest {
  constructor() {
    this.dispatchService = new IntelligentDispatchService();
    this.testCases = [
      // 直接天气查询
      {
        input: '今天上海天气怎么样？',
        description: '直接天气查询',
        expectedIntent: 'EXTERNAL_TOOL'
      },
      {
        input: '明天天气如何？',
        description: '明天天气查询',
        expectedIntent: 'EXTERNAL_TOOL'
      },
      {
        input: '上海今天会下雨吗？',
        description: '天气状况询问',
        expectedIntent: 'EXTERNAL_TOOL'
      },
      // 情绪表达触发天气查询
      {
        input: '我今天心情不好',
        description: '负面情绪表达',
        expectedIntent: 'EXTERNAL_TOOL',
        shouldTriggerWeather: true
      },
      {
        input: '感觉很郁闷，不知道该做什么',
        description: '郁闷情绪',
        expectedIntent: 'EXTERNAL_TOOL',
        shouldTriggerWeather: true
      },
      {
        input: '今天工作压力好大，很烦躁',
        description: '压力和烦躁',
        expectedIntent: 'EXTERNAL_TOOL',
        shouldTriggerWeather: true
      },
      {
        input: '我很累，感觉很疲惫',
        description: '疲惫状态',
        expectedIntent: 'EXTERNAL_TOOL',
        shouldTriggerWeather: true
      },
      {
        input: '心情糟糕透了',
        description: '极度负面情绪',
        expectedIntent: 'EXTERNAL_TOOL',
        shouldTriggerWeather: true
      },
      // 混合意图测试
      {
        input: '我今天心情不好，帮我安排一个任务放松一下',
        description: '情绪表达+任务创建',
        expectedIntent: 'TASK_CREATION',
        shouldTriggerWeather: true
      },
      {
        input: '感觉很累，明天的会议能改个时间吗？',
        description: '情绪表达+时间调度',
        expectedIntent: 'SCHEDULE_PLANNING',
        shouldTriggerWeather: true
      }
    ];
  }

  /**
   * 测试MCP天气查询功能
   */
  async testMcpWeatherQuery() {
    console.log('\n=== 测试MCP天气查询功能 ===');
    
    try {
      const weatherResult = await gaodeMcpClient.queryWeather('上海');
      console.log('✅ MCP天气查询成功:', JSON.stringify(weatherResult, null, 2));
      return true;
    } catch (error) {
      console.error('❌ MCP天气查询失败:', error);
      return false;
    }
  }

  /**
   * 测试情绪检测功能
   */
  testEmotionDetection() {
    console.log('\n=== 测试情绪检测功能 ===');
    
    const emotionTestCases = [
      { input: '我很累', expected: 'tired' },
      { input: '心情不好', expected: 'sad' },
      { input: '感觉压力很大', expected: 'stressed' },
      { input: '很焦虑', expected: 'anxious' },
      { input: '我很开心', expected: 'happy' },
      { input: '今天天气不错', expected: 'neutral' }
    ];

    let passed = 0;
    emotionTestCases.forEach(testCase => {
      const result = this.dispatchService.detectEmotionalState(testCase.input);
      const success = result === testCase.expected;
      console.log(`${success ? '✅' : '❌'} "${testCase.input}" -> ${result} (期望: ${testCase.expected})`);
      if (success) passed++;
    });

    console.log(`情绪检测测试完成: ${passed}/${emotionTestCases.length} 通过`);
    return passed === emotionTestCases.length;
  }

  /**
   * 测试天气触发逻辑
   */
  testWeatherTriggerLogic() {
    console.log('\n=== 测试天气触发逻辑 ===');
    
    const triggerTestCases = [
      { input: '我很累', shouldTrigger: true },
      { input: '心情不好', shouldTrigger: true },
      { input: '感觉压力很大', shouldTrigger: true },
      { input: '我很开心', shouldTrigger: false },
      { input: '今天天气不错', shouldTrigger: false },
      { input: '今天上海天气怎么样？', shouldTrigger: false } // 直接天气查询不需要情绪触发
    ];

    let passed = 0;
    triggerTestCases.forEach(testCase => {
      const result = this.dispatchService.shouldTriggerWeatherForEmotion(testCase.input);
      const success = result === testCase.shouldTrigger;
      console.log(`${success ? '✅' : '❌'} "${testCase.input}" -> ${result} (期望: ${testCase.shouldTrigger})`);
      if (success) passed++;
    });

    console.log(`天气触发逻辑测试完成: ${passed}/${triggerTestCases.length} 通过`);
    return passed === triggerTestCases.length;
  }

  /**
   * 测试完整的智能调度流程
   */
  async testIntelligentDispatchFlow() {
    console.log('\n=== 测试智能调度完整流程 ===');
    
    const testUserId = 'test-user-' + Date.now();
    let passed = 0;

    for (const testCase of this.testCases) {
      console.log(`\n测试用例: ${testCase.description}`);
      console.log(`用户输入: "${testCase.input}"`);
      
      try {
        const result = await this.dispatchService.processUserInput(
          testCase.input,
          testUserId,
          null,
          { source: 'test' }
        );
        
        console.log('✅ 处理成功');
        console.log('响应:', result.response);
        
        // 检查是否包含预期的意图
        if (result.intents && result.intents.some(intent => intent.intent === testCase.expectedIntent)) {
          console.log(`✅ 检测到预期意图: ${testCase.expectedIntent}`);
        } else {
          console.log(`⚠️  未检测到预期意图: ${testCase.expectedIntent}`);
        }
        
        passed++;
      } catch (error) {
        console.error('❌ 处理失败:', error.message);
      }
    }

    console.log(`\n智能调度流程测试完成: ${passed}/${this.testCases.length} 通过`);
    return passed === this.testCases.length;
  }

  /**
   * 运行所有测试
   */
  async runAllTests() {
    console.log('🚀 开始天气查询功能测试...');
    console.log('测试时间:', new Date().toLocaleString());
    
    const results = {
      mcpWeather: await this.testMcpWeatherQuery(),
      emotionDetection: this.testEmotionDetection(),
      weatherTrigger: this.testWeatherTriggerLogic(),
      dispatchFlow: await this.testIntelligentDispatchFlow()
    };

    console.log('\n=== 测试结果汇总 ===');
    console.log(`MCP天气查询: ${results.mcpWeather ? '✅ 通过' : '❌ 失败'}`);
    console.log(`情绪检测: ${results.emotionDetection ? '✅ 通过' : '❌ 失败'}`);
    console.log(`天气触发逻辑: ${results.weatherTrigger ? '✅ 通过' : '❌ 失败'}`);
    console.log(`智能调度流程: ${results.dispatchFlow ? '✅ 通过' : '❌ 失败'}`);

    const allPassed = Object.values(results).every(result => result);
    console.log(`\n${allPassed ? '🎉 所有测试通过！' : '⚠️  部分测试失败'}`);
    
    return allPassed;
  }
}

// 如果直接运行此文件，则执行测试
if (require.main === module) {
  const test = new WeatherQueryTest();
  test.runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('测试执行出错:', error);
    process.exit(1);
  });
}

module.exports = WeatherQueryTest;