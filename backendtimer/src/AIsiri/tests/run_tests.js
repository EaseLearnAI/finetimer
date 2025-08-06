'use strict';

/**
 * AI服务测试运行器
 * 独立运行AI功能测试，不依赖完整应用启动
 */

console.log('🧪 === AI服务测试开始 ===\n');

// 模拟环境变量
process.env.NODE_ENV = 'test';

async function runAITests() {
  try {
    // 1. 测试LLM连接
    console.log('📡 1. 测试LLM连接...');
    await testLLMConnection();

    // 2. 测试输入分类
    console.log('\n🏷️  2. 测试输入分类...');
    await testInputClassification();

    // 3. 测试问题生成
    console.log('\n❓ 3. 测试问题生成...');
    await testQuestionGeneration();

    // 4. 测试计划生成
    console.log('\n📋 4. 测试计划生成...');
    await testPlanGeneration();

    // 5. 测试习惯处理
    console.log('\n🔄 5. 测试习惯处理...');
    await testHabitProcessing();

    console.log('\n✅ === 所有测试完成 ===');

  } catch (error) {
    console.error('\n❌ === 测试失败 ===');
    console.error('错误详情:', error.message);
    process.exit(1);
  }
}

async function testLLMConnection() {
  try {
    const LLMConfig = require('../config/llm_config');
    const llmConfig = new LLMConfig();
    
    const result = await llmConfig.testConnection();
    
    if (result) {
      console.log('✅ LLM连接测试通过');
    } else {
      console.log('❌ LLM连接测试失败');
    }
  } catch (error) {
    console.log('❌ LLM连接测试异常:', error.message);
  }
}

async function testInputClassification() {
  try {
    const InputClassifierChain = require('../chains/input_classifier_chain');
    const classifier = new InputClassifierChain();

    const testCases = [
      { input: '取个外卖', expected: 'simple_todo' },
      { input: '我想学Python编程', expected: 'goal_planning' },
      { input: '每天跑步30分钟', expected: 'habit_formation' }
    ];

    for (const testCase of testCases) {
      console.log(`  测试输入: "${testCase.input}"`);
      const result = await classifier.classify(testCase.input);
      
      const isCorrect = result.category === testCase.expected;
      console.log(`  结果: ${result.category} ${isCorrect ? '✅' : '⚠️'} (期望: ${testCase.expected})`);
      console.log(`  置信度: ${result.confidence}`);
      console.log(`  原因: ${result.reason}\n`);
    }

    console.log('✅ 输入分类测试完成');
  } catch (error) {
    console.log('❌ 输入分类测试失败:', error.message);
  }
}

async function testQuestionGeneration() {
  try {
    const QuestionGeneratorChain = require('../chains/question_generator_chain');
    const generator = new QuestionGeneratorChain();

    const testCases = [
      { goal: '考研英语', type: 'goal_planning' },
      { goal: '每天阅读', type: 'habit_formation' }
    ];

    for (const testCase of testCases) {
      console.log(`  测试目标: "${testCase.goal}" (${testCase.type})`);
      const result = await generator.generateQuestions(testCase.goal, testCase.type);
      
      console.log(`  问候语: ${result.greeting}`);
      console.log(`  问题数量: ${result.questions?.length || 0}`);
      
      if (result.questions && result.questions.length > 0) {
        result.questions.forEach((q, index) => {
          console.log(`    ${index + 1}. ${q}`);
        });
      }
      console.log('');
    }

    console.log('✅ 问题生成测试完成');
  } catch (error) {
    console.log('❌ 问题生成测试失败:', error.message);
  }
}

async function testPlanGeneration() {
  try {
    const PlanGeneratorChain = require('../chains/plan_generator_chain');
    const generator = new PlanGeneratorChain();

    const testCase = {
      goal: '学习JavaScript',
      type: 'goal_planning',
      answers: [
        '3个月内完成',
        '有一些HTML基础',
        '每天2小时',
        '主要是坚持和理解复杂概念'
      ]
    };

    console.log(`  测试目标: "${testCase.goal}"`);
    console.log(`  用户回答: ${testCase.answers.length}个`);
    
    const result = await generator.generatePlan(testCase.goal, testCase.type, testCase.answers);
    
    console.log(`  计划概述: ${result.plan_overview}`);
    console.log(`  任务集数量: ${result.collections?.length || 0}`);
    
    if (result.collections && result.collections.length > 0) {
      result.collections.forEach((collection, index) => {
        console.log(`    任务集${index + 1}: ${collection.name}`);
        console.log(`      描述: ${collection.description}`);
        console.log(`      任务数量: ${collection.tasks?.length || 0}`);
      });
    }

    console.log('✅ 计划生成测试完成');
  } catch (error) {
    console.log('❌ 计划生成测试失败:', error.message);
  }
}

async function testHabitProcessing() {
  try {
    const HabitProcessorChain = require('../chains/habit_processor_chain');
    const processor = new HabitProcessorChain();

    const testCase = {
      goal: '每天阅读30分钟',
      details: {
        '当前阅读习惯': '偶尔看书',
        '可用时间': '晚上',
        '期望频率': '每天'
      }
    };

    console.log(`  测试习惯: "${testCase.goal}"`);
    
    const result = await processor.processHabit(testCase.goal, testCase.details);
    
    console.log(`  核心行为: ${result.habit_analysis?.core_behavior}`);
    console.log(`  益处数量: ${result.habit_analysis?.benefits?.length || 0}`);
    console.log(`  挑战数量: ${result.habit_analysis?.challenges?.length || 0}`);
    console.log(`  最佳时间: ${result.schedule?.best_time}`);
    console.log(`  执行频率: ${result.schedule?.frequency}`);
    console.log(`  任务模板: ${result.task_template?.title}`);

    console.log('✅ 习惯处理测试完成');
  } catch (error) {
    console.log('❌ 习惯处理测试失败:', error.message);
  }
}

// 运行测试
runAITests();