require('dotenv').config();

const IntentRecognitionService = require('../services/intentRecognitionService');
const TaskRecognitionService = require('../services/taskRecognitionService');

async function testImprovedTaskExtraction() {
  const intentService = new IntentRecognitionService();
  const taskService = new TaskRecognitionService();

  const testCases = [
    {
      input: "我压力好大，明天还有个重要的考试。",
      expectedTitle: "考试",
      expectedTimeContains: "明天"
    },
    {
      input: "明天早上10:00有个会议",
      expectedTitle: "会议",
      expectedTime: "明天早上10:00",
      expectedStartTime: "10:00"
    },
    {
      input: "提醒我下午3点去取快递",
      expectedTitle: "取快递",
      expectedTime: "下午3点",
      expectedStartTime: "15:00"
    },
    {
      input: "明天下午有个面试",
      expectedTitle: "面试",
      expectedTime: "明天下午"
    }
  ];

  console.log('=== 改进后的任务提取测试 ===\n');

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`测试案例 ${i + 1}: "${testCase.input}"`);
    console.log('---');

    try {
      // 1. 意图识别
      const intentResult = await intentService.recognizeIntent(testCase.input);
      console.log('意图识别结果:', {
        intent: intentResult.intent,
        confidence: intentResult.confidence,
        entities: intentResult.extracted_info?.entities
      });

      // 2. 任务信息提取
      if (intentResult.intent === 'TASK_CREATION') {
        const taskInfo = await taskService.extractTaskInfo(intentResult, {});
        console.log('任务信息提取结果:', {
          title: taskInfo.title,
          timeBlock: taskInfo.timeBlock,
          scheduledDate: taskInfo.scheduledDate
        });

        // 验证结果
        console.log('\n验证结果:');
        console.log(`✓ 任务标题: ${taskInfo.title} ${taskInfo.title === testCase.expectedTitle ? '✅' : '❌ (期望: ' + testCase.expectedTitle + ')'}`);
        
        if (testCase.expectedStartTime && taskInfo.timeBlock) {
          console.log(`✓ 开始时间: ${taskInfo.timeBlock.startTime} ${taskInfo.timeBlock.startTime === testCase.expectedStartTime ? '✅' : '❌ (期望: ' + testCase.expectedStartTime + ')'}`);
        }
        
        if (testCase.expectedTimeContains) {
          const hasExpectedTime = intentResult.extracted_info?.entities?.time?.includes(testCase.expectedTimeContains);
          console.log(`✓ 时间包含"${testCase.expectedTimeContains}": ${hasExpectedTime ? '✅' : '❌'}`);
        }
      } else {
        console.log('❌ 意图识别错误，应该是 TASK_CREATION');
      }

    } catch (error) {
      console.error('测试失败:', error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');
  }
}

// 运行测试
testImprovedTaskExtraction().catch(console.error);