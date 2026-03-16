/**
 * 手动测试脚本
 * 快速测试意图识别功能
 */

const IntentRecognitionService = require('../services/intentRecognitionService');
const logger = require('../utils/logger');

// 设置环境变量
process.env.DASHSCOPE_API_KEY = 'sk-2904b4f09f5f4a29b2cdcc748e27da9e';

/**
 * 测试用例
 */
const testCases = [
  {
    input: '你好，今天天气真不错',
    expected: 'CONVERSATION',
    description: '正常对话 - 问候'
  },
  {
    input: '我感觉有点累',
    expected: 'CONVERSATION',
    description: '正常对话 - 情绪表达'
  },
  {
    input: '我要去取快递',
    expected: 'TASK_CREATION',
    description: '任务新增 - 短期任务'
  },
  {
    input: '提醒我明天开会',
    expected: 'TASK_CREATION',
    description: '任务新增 - 提醒任务'
  },
  {
    input: '我想养成早起的习惯',
    expected: 'TASK_CREATION',
    description: '任务新增 - 习惯养成'
  },
  {
    input: '帮我安排明天的日程',
    expected: 'SCHEDULE_PLANNING',
    description: '时间调度 - 日程安排'
  },
  {
    input: '重新规划一下今天的时间',
    expected: 'SCHEDULE_PLANNING',
    description: '时间调度 - 时间重新规划'
  },
  {
    input: '今天天气怎么样',
    expected: 'EXTERNAL_TOOL',
    description: '外部工具 - 天气查询'
  },
  {
    input: '从公司到家要多久',
    expected: 'EXTERNAL_TOOL',
    description: '外部工具 - 路线查询'
  },
  {
    input: '附近有什么好吃的餐厅',
    expected: 'EXTERNAL_TOOL',
    description: '外部工具 - 地点查询'
  }
];

/**
 * 运行测试
 */
async function runTests() {
  console.log('🚀 开始手动测试意图识别功能...\n');
  
  try {
    // 初始化服务
    const service = new IntentRecognitionService();
    console.log('✅ 意图识别服务初始化成功\n');

    // 执行健康检查
    console.log('🔍 执行健康检查...');
    const health = await service.healthCheck();
    console.log('📊 健康检查结果:', JSON.stringify(health, null, 2));
    console.log('');

    // 获取支持的意图类型
    console.log('📋 支持的意图类型:');
    const supportedIntents = service.getSupportedIntents();
    Object.entries(supportedIntents.descriptions).forEach(([type, description]) => {
      console.log(`  ${type}: ${description}`);
    });
    console.log('');

    // 测试统计
    let totalTests = testCases.length;
    let passedTests = 0;
    let failedTests = 0;

    // 逐个测试
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      
      console.log(`\n📝 测试 ${i + 1}/${totalTests}: ${testCase.description}`);
      console.log(`💬 输入: "${testCase.input}"`);
      console.log(`🎯 期望: ${testCase.expected}`);
      
      try {
        const startTime = Date.now();
        const result = await service.recognizeIntent(testCase.input);
        const duration = Date.now() - startTime;
        
        console.log(`🤖 识别结果: ${result.intent}`);
        console.log(`📊 置信度: ${result.confidence}`);
        console.log(`💭 推理过程: ${result.reasoning}`);
        console.log(`⏱️  处理时间: ${duration}ms`);
        
        // 检查结果
        if (result.intent === testCase.expected) {
          console.log('✅ 测试通过');
          passedTests++;
        } else {
          console.log(`❌ 测试失败 - 期望: ${testCase.expected}, 实际: ${result.intent}`);
          failedTests++;
        }
        
        // 显示提取的信息
        if (result.extracted_info) {
          console.log('🔍 提取信息:');
          if (result.extracted_info.keywords && result.extracted_info.keywords.length > 0) {
            console.log(`  关键词: ${result.extracted_info.keywords.join(', ')}`);
          }
          if (result.extracted_info.entities && Object.keys(result.extracted_info.entities).length > 0) {
            console.log(`  实体: ${JSON.stringify(result.extracted_info.entities)}`);
          }
        }
        
      } catch (error) {
        console.log(`❌ 测试失败 - 错误: ${error.message}`);
        failedTests++;
      }
      
      // 短暂延迟避免请求过快
      if (i < testCases.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // 输出测试总结
    console.log('\n' + '='.repeat(60));
    console.log('📊 测试总结');
    console.log('='.repeat(60));
    console.log(`✅ 通过: ${passedTests}/${totalTests}`);
    console.log(`❌ 失败: ${failedTests}/${totalTests}`);
    console.log(`📈 成功率: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    if (passedTests === totalTests) {
      console.log('\n🎉 所有测试都通过了！意图识别功能正常工作。');
    } else {
      console.log(`\n⚠️  有 ${failedTests} 个测试失败，请检查结果。`);
    }

    // 测试批量识别
    console.log('\n' + '='.repeat(60));
    console.log('🔄 测试批量识别功能');
    console.log('='.repeat(60));
    
    const batchInputs = testCases.slice(0, 3).map(tc => tc.input);
    console.log('📝 批量输入:', batchInputs);
    
    try {
      const batchResults = await service.recognizeIntentBatch(batchInputs);
      console.log('✅ 批量识别成功');
      
      batchResults.forEach((result, index) => {
        console.log(`  ${index + 1}. "${batchInputs[index]}" -> ${result.intent} (${result.confidence})`);
      });
    } catch (error) {
      console.log('❌ 批量识别失败:', error.message);
    }
    
  } catch (error) {
    console.error('❌ 测试执行失败:', error);
    process.exit(1);
  }
}

// 运行测试
if (require.main === module) {
  runTests()
    .then(() => {
      console.log('\n🏁 测试完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 测试异常:', error);
      process.exit(1);
    });
}

module.exports = { runTests, testCases };
