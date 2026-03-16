'use strict';

require('dotenv').config({ path: '../../../.env' });
const IntelligentDispatchService = require('../services/intelligentDispatchService');
const mongoose = require('mongoose');
const User = require('../../models/User');
const Task = require('../../models/Task');
const Collection = require('../../models/Collection');
const logger = require('../utils/logger');

/**
 * 智能调度服务完整测试
 */
class IntelligentDispatchTest {
  constructor() {
    this.dispatchService = new IntelligentDispatchService();
    this.testUserId = null;
    this.testResults = [];
  }

  /**
   * 运行所有测试
   */
  async runAllTests() {
    console.log('\n🚀 开始智能调度服务完整测试...\n');
    
    try {
      // 连接数据库
      await this.connectDatabase();
      
      // 设置测试数据
      await this.setupTestData();
      
      // 运行测试用例
      await this.runTestCases();
      
      // 生成测试报告
      this.generateReport();
      
    } catch (error) {
      console.error('❌ 测试执行失败:', error.message);
      logger.error('智能调度测试失败', { error: error.message, stack: error.stack });
    } finally {
      // 清理测试数据
      await this.cleanup();
      
      // 关闭数据库连接
      await this.disconnectDatabase();
    }
  }

  /**
   * 连接数据库
   */
  async connectDatabase() {
    console.log('📡 连接数据库...');
    
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aisiri', {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      console.log('✅ 数据库连接成功');
    } else {
      console.log('✅ 数据库已连接');
    }
  }

  /**
   * 断开数据库连接
   */
  async disconnectDatabase() {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('🔌 数据库连接已断开');
    }
  }

  /**
   * 设置测试数据
   */
  async setupTestData() {
    console.log('🛠  设置测试数据...');
    
    // 创建测试用户
    const testUser = new User({
      phoneNumber: '13800000001',
      password: 'test123456',
      nickname: '测试用户',
      isActive: true
    });
    
    const savedUser = await testUser.save();
    this.testUserId = savedUser._id.toString();
    console.log(`✅ 创建测试用户: ${this.testUserId}`);

    // 创建测试任务集
    const testCollection = new Collection({
      name: '工作任务',
      description: '日常工作相关任务',
      userId: this.testUserId,
      color: '#FF6B6B'
    });
    
    const savedCollection = await testCollection.save();
    console.log(`✅ 创建测试任务集: ${savedCollection._id}`);

    // 创建一些现有任务
    const today = new Date().toISOString().split('T')[0];
    const existingTasks = [
      {
        title: '早会',
        userId: this.testUserId,
        date: today,
        timeBlock: {
          startTime: '09:00',
          endTime: '09:30',
          timeBlockType: 'forenoon'
        },
        priority: 'high',
        quadrant: 1,
        estimatedTime: 30,
        completed: false
      },
      {
        title: '写报告',
        userId: this.testUserId,
        date: today,
        timeBlock: {
          startTime: '10:00',
          endTime: '11:00',
          timeBlockType: 'forenoon'
        },
        priority: 'medium',
        quadrant: 2,
        estimatedTime: 60,
        completed: false
      }
    ];

    for (const taskData of existingTasks) {
      const task = new Task(taskData);
      await task.save();
      console.log(`✅ 创建测试任务: ${task.title}`);
    }

    console.log('✅ 测试数据设置完成\n');
  }

  /**
   * 运行测试用例
   */
  async runTestCases() {
    console.log('📋 开始执行测试用例...\n');

    const testCases = [
      {
        name: '多重意图识别测试 - 任务创建+情绪安慰',
        input: '我今天下午三点要去拿快递，但感觉很累。',
        expectedIntents: ['TASK_CREATION', 'CONVERSATION'],
        description: '测试同时包含任务创建和情绪表达的用户输入'
      },
      {
        name: '任务创建+时间调度测试',
        input: '我需要在今天上午添加一个开会任务，请帮我安排好时间。',
        expectedIntents: ['TASK_CREATION', 'SCHEDULE_PLANNING'],
        description: '测试任务创建和时间调度的组合'
      },
      {
        name: '纯情绪安慰测试',
        input: '我今天工作压力好大，感觉很焦虑。',
        expectedIntents: ['CONVERSATION'],
        description: '测试纯情绪表达的处理'
      },
      {
        name: '外部工具调用测试',
        input: '今天天气怎么样？我想知道出门需要带伞吗？',
        expectedIntents: ['EXTERNAL_TOOL'],
        description: '测试天气查询等外部工具调用'
      },
      {
        name: '时间调度规划测试',
        input: '帮我重新安排今天的任务，我觉得时间太紧了。',
        expectedIntents: ['SCHEDULE_PLANNING'],
        description: '测试时间调度和任务重新安排'
      },
      {
        name: '复合意图测试 - 路线查询+任务创建',
        input: '我下午要去虹桥机场接人，帮我查一下路线并加到日程里。',
        expectedIntents: ['EXTERNAL_TOOL', 'TASK_CREATION'],
        description: '测试路线查询和任务创建的组合'
      }
    ];

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      console.log(`\n--- 测试用例 ${i + 1}: ${testCase.name} ---`);
      console.log(`📝 输入: "${testCase.input}"`);
      console.log(`🎯 期望意图: [${testCase.expectedIntents.join(', ')}]`);
      console.log(`📖 描述: ${testCase.description}`);
      
      const result = await this.runSingleTest(testCase, i + 1);
      this.testResults.push(result);
      
      // 等待1秒，避免API调用过快
      await this.sleep(1000);
    }
  }

  /**
   * 运行单个测试用例
   */
  async runSingleTest(testCase, index) {
    const startTime = Date.now();
    
    try {
      console.log(`\n⏳ 执行测试用例 ${index}...`);
      
      // 执行智能调度
      const result = await this.dispatchService.processUserInput({
        userId: this.testUserId,
        userInput: testCase.input,
        sessionId: `test-session-${index}`,
        deviceInfo: { source: 'test' }
      });

      const processingTime = Date.now() - startTime;

      // 分析结果
      const analysis = this.analyzeResult(result, testCase);
      
      console.log(`\n📊 测试结果分析:`);
      console.log(`✅ 执行成功: ${result.success}`);
      console.log(`🎯 主要意图: ${result.data?.intentResult?.intent}`);
      console.log(`🔀 识别到的意图: [${result.data?.multipleIntents?.map(i => i.intent).join(', ')}]`);
      console.log(`🛠  执行的服务: [${result.data?.metadata?.servicesUsed?.join(', ')}]`);
      console.log(`💬 生成的回复: "${result.data?.response?.substring(0, 100)}..."`);
      console.log(`⏱  处理时间: ${processingTime}ms`);
      console.log(`🎯 意图匹配度: ${analysis.intentMatch ? '✅ 匹配' : '❌ 不匹配'}`);

      if (analysis.serviceResults) {
        console.log(`📋 服务执行结果:`);
        Object.keys(analysis.serviceResults).forEach(service => {
          const serviceResult = analysis.serviceResults[service];
          console.log(`  - ${service}: ${serviceResult.success ? '✅ 成功' : '❌ 失败'}`);
        });
      }

      return {
        index,
        testCase,
        success: result.success,
        result: result.data,
        analysis,
        processingTime,
        error: null
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      console.log(`\n❌ 测试用例 ${index} 执行失败:`);
      console.log(`🔥 错误信息: ${error.message}`);
      console.log(`⏱  处理时间: ${processingTime}ms`);

      return {
        index,
        testCase,
        success: false,
        result: null,
        analysis: { intentMatch: false, error: error.message },
        processingTime,
        error: error.message
      };
    }
  }

  /**
   * 分析测试结果
   */
  analyzeResult(result, testCase) {
    const analysis = {
      intentMatch: false,
      serviceResults: null,
      responseQuality: 'unknown'
    };

    if (!result.success || !result.data) {
      return analysis;
    }

    // 检查意图匹配
    const detectedIntents = result.data.multipleIntents?.map(i => i.intent) || [];
    const expectedIntents = testCase.expectedIntents;
    
    // 计算意图匹配度
    const matchedIntents = expectedIntents.filter(intent => detectedIntents.includes(intent));
    analysis.intentMatch = matchedIntents.length === expectedIntents.length;
    
    // 分析服务执行结果
    if (result.data.executionResults) {
      analysis.serviceResults = {};
      Object.keys(result.data.executionResults).forEach(service => {
        analysis.serviceResults[service] = result.data.executionResults[service];
      });
    }

    // 评估回复质量
    const response = result.data.response || '';
    if (response.length > 10 && response.length < 300) {
      analysis.responseQuality = 'good';
    } else if (response.length > 0) {
      analysis.responseQuality = 'acceptable';
    } else {
      analysis.responseQuality = 'poor';
    }

    return analysis;
  }

  /**
   * 生成测试报告
   */
  generateReport() {
    console.log('\n📊 === 智能调度服务测试报告 ===\n');
    
    const totalTests = this.testResults.length;
    const successfulTests = this.testResults.filter(r => r.success).length;
    const intentMatchTests = this.testResults.filter(r => r.analysis.intentMatch).length;
    const avgProcessingTime = this.testResults.reduce((sum, r) => sum + r.processingTime, 0) / totalTests;

    console.log(`📈 总体统计:`);
    console.log(`  🧪 总测试数: ${totalTests}`);
    console.log(`  ✅ 成功测试: ${successfulTests} (${(successfulTests/totalTests*100).toFixed(1)}%)`);
    console.log(`  🎯 意图匹配: ${intentMatchTests} (${(intentMatchTests/totalTests*100).toFixed(1)}%)`);
    console.log(`  ⏱  平均处理时间: ${avgProcessingTime.toFixed(0)}ms`);

    console.log(`\n📋 详细结果:`);
    this.testResults.forEach(result => {
      const statusIcon = result.success ? '✅' : '❌';
      const intentIcon = result.analysis.intentMatch ? '🎯' : '❌';
      console.log(`  ${statusIcon} ${intentIcon} 测试${result.index}: ${result.testCase.name} (${result.processingTime}ms)`);
      
      if (result.error) {
        console.log(`    🔥 错误: ${result.error}`);
      }
      
      if (result.result?.metadata?.servicesUsed) {
        console.log(`    🛠  服务: [${result.result.metadata.servicesUsed.join(', ')}]`);
      }
    });

    console.log(`\n🔍 功能覆盖度检查:`);
    const allServices = ['conversation', 'taskCreation', 'schedulePlanning', 'externalTool'];
    const testedServices = new Set();
    
    this.testResults.forEach(result => {
      if (result.result?.metadata?.servicesUsed) {
        result.result.metadata.servicesUsed.forEach(service => testedServices.add(service));
      }
    });

    allServices.forEach(service => {
      const tested = testedServices.has(service);
      console.log(`  ${tested ? '✅' : '❌'} ${service}服务`);
    });

    const overallSuccess = successfulTests === totalTests && intentMatchTests >= totalTests * 0.8;
    console.log(`\n🎉 整体评估: ${overallSuccess ? '✅ 通过' : '❌ 需要改进'}`);
    
    if (!overallSuccess) {
      console.log('\n💡 改进建议:');
      if (successfulTests < totalTests) {
        console.log('  - 检查服务稳定性和错误处理');
      }
      if (intentMatchTests < totalTests * 0.8) {
        console.log('  - 优化意图识别准确性');
      }
      if (avgProcessingTime > 5000) {
        console.log('  - 优化处理性能');
      }
    }

    console.log('\n📝 测试完成！');
  }

  /**
   * 清理测试数据
   */
  async cleanup() {
    if (this.testUserId) {
      console.log('\n🧹 清理测试数据...');
      
      try {
        // 删除测试任务
        await Task.deleteMany({ userId: this.testUserId });
        console.log('✅ 清理测试任务');

        // 删除测试任务集
        await Collection.deleteMany({ userId: this.testUserId });
        console.log('✅ 清理测试任务集');

        // 删除测试用户
        await User.findByIdAndDelete(this.testUserId);
        console.log('✅ 清理测试用户');
        
        console.log('✅ 测试数据清理完成');
      } catch (error) {
        console.error('❌ 清理测试数据失败:', error.message);
      }
    }
  }

  /**
   * 等待指定时间
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * 运行测试
 */
async function runTest() {
  const test = new IntelligentDispatchTest();
  await test.runAllTests();
}

// 如果直接运行此文件，则执行测试
if (require.main === module) {
  runTest().catch(console.error);
}

module.exports = IntelligentDispatchTest;

