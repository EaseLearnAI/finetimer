'use strict';

// 加载环境变量
require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });

// 设置强制数据库连接标志
process.env.FORCE_DB = 'true';

// 导入数据库连接
const connectDB = require('../../config/database');
const mongoose = require('mongoose');
const IntelligentDispatchService = require('../services/intelligentDispatchService');
const logger = require('../utils/logger');

/**
 * 任务创建功能测试
 * 验证Action Router正确识别任务创建意图并成功创建任务
 */
class TaskCreationTest {
  constructor() {
    this.dispatchService = null; // 延迟初始化
    this.dbConnected = false;
    this.testCases = [
      {
        name: '情绪+任务混合输入',
        input: '我今天好累呀，但是我明天还要打个电话给我妈',
        expectedIntents: ['TASK_CREATION', 'CONVERSATION'],
        expectedTaskTitle: '打电话给我妈'
      },
      {
        name: '纯任务输入',
        input: '帮我记一下，明天下午四点和同事开会',
        expectedIntents: ['TASK_CREATION', 'SCHEDULE_PLANNING'],
        expectedTaskTitle: '和同事开会'
      },
      {
        name: '时间模糊的任务',
        input: '我等下去拿个快递，大概三点钟',
        expectedIntents: ['TASK_CREATION'],
        expectedTaskTitle: '拿快递'
      },
      {
        name: '压力+任务输入',
        input: '我压力好大，明天还有个重要的考试',
        expectedIntents: ['TASK_CREATION', 'CONVERSATION'],
        expectedTaskTitle: '重要的考试'
      },
      {
        name: '多任务输入',
        input: '我下午三点要开会，四点要拿快递，五点还要去健身',
        expectedIntents: ['TASK_CREATION', 'SCHEDULE_PLANNING'],
        expectedTaskTitle: '开会'
      }
    ];
  }

  /**
   * 初始化数据库连接
   */
  async initializeDatabase() {
    if (this.dbConnected) {
      return;
    }
    
    try {
      console.log('正在连接数据库...');
      await connectDB();
      
      this.dbConnected = true;
      this.dispatchService = new IntelligentDispatchService();
      console.log('✅ 数据库连接成功');
    } catch (error) {
      console.error('❌ 数据库连接失败:', error.message);
      throw error;
    }
  }

  /**
   * 关闭数据库连接
   */
  async closeDatabase() {
    if (this.dbConnected) {
      await mongoose.connection.close();
      this.dbConnected = false;
      console.log('数据库连接已关闭');
    }
  }

  /**
   * 运行所有测试用例
   */
  async runAllTests() {
    await this.initializeDatabase();
    console.log('\n=== 开始任务创建功能测试 ===\n');
    
    const testUserId = '68a21bf0cdab688c24714231'; // 测试用户ID
    const testSessionId = 'test_session_' + Date.now();
    
    let passedTests = 0;
    let totalTests = this.testCases.length;
    
    for (let i = 0; i < this.testCases.length; i++) {
      const testCase = this.testCases[i];
      console.log(`\n--- 测试用例 ${i + 1}: ${testCase.name} ---`);
      console.log(`输入: "${testCase.input}"`);
      
      try {
        const result = await this.runSingleTest(testCase, testUserId, testSessionId);
        if (result.success) {
          console.log('✅ 测试通过');
          passedTests++;
        } else {
          console.log('❌ 测试失败:', result.error);
        }
      } catch (error) {
        console.log('❌ 测试异常:', error.message);
      }
    }
    
    console.log(`\n=== 测试结果汇总 ===`);
    console.log(`通过: ${passedTests}/${totalTests}`);
    console.log(`成功率: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    if (passedTests === totalTests) {
      console.log('🎉 所有测试用例都通过了！');
    } else {
      console.log('⚠️  部分测试用例失败，需要进一步检查');
    }
    
    await this.closeDatabase();
  }

  /**
   * 运行单个测试用例
   */
  async runSingleTest(testCase, userId, sessionId) {
    try {
      // 调用智能调度服务
      const result = await this.dispatchService.processUserInput(
        testCase.input,
        userId,
        sessionId + '_' + Date.now(),
        { platform: 'test', version: '1.0.0' }
      );
      
      console.log('调度结果:', {
        success: result.response ? true : false,
        intents: result.intents,
        servicesExecuted: result.servicesExecuted,
        responseLength: result.response ? result.response.length : 0
      });
      
      // 验证意图识别
      const actualIntents = result.intents || [];
      const expectedIntents = testCase.expectedIntents;
      
      console.log('期望意图:', expectedIntents);
      console.log('实际意图:', actualIntents);
      
      // 检查是否包含TASK_CREATION意图
      if (!actualIntents.includes('TASK_CREATION')) {
        return {
          success: false,
          error: `未检测到TASK_CREATION意图。实际意图: ${actualIntents.join(', ')}`
        };
      }
      
      // 检查是否成功创建了任务
      const taskCreated = result.taskCreated;
      const servicesExecuted = result.servicesExecuted || [];
      
      if (!servicesExecuted.includes('taskCreation')) {
        return {
          success: false,
          error: '任务创建服务未执行'
        };
      }
      
      if (!taskCreated) {
        return {
          success: false,
          error: '任务创建失败或未成功创建任务'
        };
      }
      
      // 检查任务是否包含预期的标题关键词
      if (taskCreated && testCase.expectedTaskTitle) {
        const taskTitle = taskCreated.title || '';
        const expectedKeywords = testCase.expectedTaskTitle.split(/[，,\s]+/);
        const hasExpectedKeyword = expectedKeywords.some(keyword => 
          taskTitle.includes(keyword)
        );
        
        if (!hasExpectedKeyword) {
          console.log('⚠️  任务标题可能不准确:');
          console.log('  期望包含:', testCase.expectedTaskTitle);
          console.log('  实际标题:', taskTitle);
        }
      }
      
      console.log('任务创建详情:', {
        taskId: taskCreated?._id,
        title: taskCreated?.title,
        timeBlock: taskCreated?.timeBlock
      });
      
      return { success: true };
      
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 运行特定测试用例
   */
  async runSpecificTest(testIndex) {
    if (testIndex < 0 || testIndex >= this.testCases.length) {
      console.log('❌ 无效的测试用例索引');
      return;
    }
    
    await this.initializeDatabase();
    
    const testCase = this.testCases[testIndex];
    const testUserId = '68a21bf0cdab688c24714231';
    const testSessionId = 'specific_test_' + Date.now();
    
    console.log(`\n=== 运行特定测试: ${testCase.name} ===`);
    console.log(`输入: "${testCase.input}"`);
    
    const result = await this.runSingleTest(testCase, testUserId, testSessionId);
    
    if (result.success) {
      console.log('✅ 测试通过');
    } else {
      console.log('❌ 测试失败:', result.error);
    }
    
    await this.closeDatabase();
  }
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
  const test = new TaskCreationTest();
  
  // 检查命令行参数
  const args = process.argv.slice(2);
  if (args.length > 0 && !isNaN(args[0])) {
    // 运行特定测试用例
    const testIndex = parseInt(args[0]) - 1; // 用户输入1-based，转换为0-based
    test.runSpecificTest(testIndex);
  } else {
    // 运行所有测试用例
    test.runAllTests();
  }
}

module.exports = TaskCreationTest;