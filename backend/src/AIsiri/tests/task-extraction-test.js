/**
 * 任务提取测试
 * 测试任务识别服务的实体提取功能
 */

// 加载环境变量
require('dotenv').config();

const TaskRecognitionService = require('../services/taskRecognitionService');
const logger = require('../utils/logger');

/**
 * 测试任务提取功能
 */
async function testTaskExtraction() {
  console.log('=== 任务提取测试开始 ===');
  
  const taskService = new TaskRecognitionService();
  const testCases = [
    {
      input: "我压力好大，明天还有个重要的考试。",
      expected: {
        task: "考试",
        time: "明天"
      }
    },
    {
      input: "明天早上10:00有个会议",
      expected: {
        task: "会议",
        time: "明天早上10:00"
      }
    },
    {
      input: "提醒我下午3点去取快递",
      expected: {
        task: "取快递",
        time: "下午3点"
      }
    }
  ];
  
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n--- 测试案例 ${i + 1} ---`);
    console.log('输入:', testCase.input);
    console.log('期望结果:', testCase.expected);
    
    try {
      // 先进行意图识别
      const intentResult = await taskService.intentService.recognizeIntent(testCase.input);
      console.log('\n意图识别结果:');
      console.log('- 意图:', intentResult.intent);
      console.log('- 置信度:', intentResult.confidence);
      console.log('- 提取的实体:', JSON.stringify(intentResult.extracted_info.entities, null, 2));
      
      // 如果是任务创建意图，提取任务信息
      if (intentResult.intent === 'TASK_CREATION') {
        const taskInfo = taskService.extractTaskInfo(intentResult, 'test-user-id', {});
        console.log('\n提取的任务信息:');
        console.log('- 任务标题:', taskInfo.title);
        console.log('- 时间块:', taskInfo.timeBlock);
        console.log('- 目标日期:', taskInfo.targetDate);
        
        // 分析问题
        console.log('\n问题分析:');
        if (taskInfo.title === testCase.input) {
          console.log('❌ 问题: 任务标题使用了完整输入，而不是提取的任务名称');
        } else {
          console.log('✅ 任务标题提取正确');
        }
        
        if (taskInfo.timeBlock.timeBlockType === 'afternoon' && testCase.input.includes('明天')) {
          console.log('❌ 问题: 时间安排错误，应该根据用户输入的具体时间安排');
        }
      }
      
    } catch (error) {
      console.error('测试失败:', error.message);
    }
  }
  
  console.log('\n=== 任务提取测试结束 ===');
}

// 运行测试
testTaskExtraction().catch(console.error);