/**
 * 智能调度控制器
 * 处理智能调度的HTTP请求
 */

const IntelligentDispatchService = require('../services/intelligentDispatchService');
const logger = require('../utils/logger');

/**
 * 智能调度控制器类
 */
class IntelligentDispatchController {
  constructor() {
    // 初始化智能调度服务
    this.dispatchService = new IntelligentDispatchService();
    
    // 绑定this上下文
    this.processIntelligentDispatch = this.processIntelligentDispatch.bind(this);
    this.getDispatchStatus = this.getDispatchStatus.bind(this);
    this.testDispatch = this.testDispatch.bind(this);
  }

  /**
   * 智能调度处理
   * POST /api/aisiri/dispatch
   */
  async processIntelligentDispatch(req, res) {
    const startTime = Date.now();
    const { userInput, sessionId, deviceInfo = {} } = req.body;
    const userId = req.user?.userId;

    logger.info('收到智能调度请求', {
      userId,
      userInput: userInput ? userInput.substring(0, 100) + (userInput.length > 100 ? '...' : '') : '',
      sessionId,
      deviceInfo
    });

    try {
      // 参数验证
      if (!userInput || typeof userInput !== 'string' || userInput.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: '用户输入不能为空',
          code: 'MISSING_USER_INPUT',
          processingTime: Date.now() - startTime
        });
      }

      if (userInput.length > 2000) {
        return res.status(400).json({
          success: false,
          error: '用户输入过长，不能超过2000字符',
          code: 'INPUT_TOO_LONG',
          processingTime: Date.now() - startTime
        });
      }

      // 调用真正的智能调度服务
      const result = await this.dispatchService.processUserInput(
        userInput, 
        userId, 
        sessionId, 
        deviceInfo
      );

      logger.info('智能调度处理完成', {
        userId,
        processingTime: Date.now() - startTime,
        responseLength: result.response.length,
        servicesExecuted: result.servicesExecuted
      });

      res.json({
        success: true,
        data: result,
        processingTime: Date.now() - startTime
      });

    } catch (error) {
      logger.error('智能调度处理失败', {
        error: error.message,
        stack: error.stack,
        userId,
        userInput: userInput?.substring(0, 100)
      });

      res.status(500).json({
        success: false,
        error: '智能调度处理失败，请稍后重试',
        code: 'DISPATCH_FAILED',
        processingTime: Date.now() - startTime
      });
    }
  }

  /**
   * 获取调度服务状态
   * GET /api/aisiri/dispatch/status
   */
  async getDispatchStatus(req, res) {
    const startTime = Date.now();
    
    try {
      logger.info('获取智能调度服务状态');

      // 调用服务的健康检查
      const healthStatus = await this.dispatchService.healthCheck();

      const status = {
        service: 'intelligent-dispatch',
        status: healthStatus.status,
        version: '1.0.0',
        supportedIntents: [
          'CONVERSATION',
          'TASK_CREATION',
          'SCHEDULE_PLANNING'
        ],
        availableServices: {
          router: true,
          taskCreation: true,
          schedulePlanning: true,
          emotionSupport: true,
          memory: true,
        },
        timestamp: new Date().toISOString()
      };

      logger.info('智能调度服务状态查询完成', {
        status: status.status,
        processingTime: Date.now() - startTime
      });

      res.json({
        success: true,
        data: status,
        processingTime: Date.now() - startTime
      });

    } catch (error) {
      logger.error('获取智能调度服务状态失败', {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: '获取服务状态失败',
        code: 'STATUS_QUERY_FAILED',
        processingTime: Date.now() - startTime
      });
    }
  }

  /**
   * 测试智能调度功能
   * POST /api/aisiri/dispatch/test
   */
  async testDispatch(req, res) {
    const startTime = Date.now();
    const userId = req.user?.userId || 'anonymous';

    try {
      logger.info('收到智能调度测试请求', { userId });

      // 运行测试用例
      const testResults = await this.runTestCases();

      logger.info('智能调度测试完成', {
        userId,
        totalTests: testResults.summary.totalTests,
        successRate: testResults.summary.successRate,
        processingTime: Date.now() - startTime
      });

      res.json({
        success: true,
        message: '智能调度测试完成',
        data: testResults,
        processingTime: Date.now() - startTime
      });

    } catch (error) {
      logger.error('智能调度测试失败', {
        error: error.message,
        stack: error.stack,
        userId
      });

      res.status(500).json({
        success: false,
        error: '测试执行失败',
        code: 'TEST_FAILED',
        processingTime: Date.now() - startTime
      });
    }
  }

  /**
   * 运行测试用例
   * @returns {Promise<Object>} 测试结果
   */
  async runTestCases() {
    const testCases = [
      {
        input: '我今天下午三点要去拿快递，但感觉很累。',
        expectedIntents: ['TASK_CREATION', 'SCHEDULE_PLANNING', 'CONVERSATION']
      },
      {
        input: '帮我安排明天的日程',
        expectedIntents: ['SCHEDULE_PLANNING']
      },
      {
        input: '我好累啊不想动了',
        expectedIntents: ['CONVERSATION']
      },
      {
        input: '我最近工作压力很大',
        expectedIntents: ['CONVERSATION']
      }
    ];

    const results = [];
    let successfulTests = 0;

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      
      try {
        // 使用真实的智能调度服务进行测试
        const result = await this.dispatchService.processUserInput(
          testCase.input,
          'test-user',
          'test-session'
        );

        const success = this.compareIntents(result.intents, testCase.expectedIntents);
        if (success) successfulTests++;

        results.push({
          index: i + 1,
          input: testCase.input,
          success,
          intents: result.intents,
          expectedIntents: testCase.expectedIntents,
          response: result.response,
          servicesExecuted: result.servicesExecuted,
          processingTime: result.processingTime
        });

      } catch (error) {
        results.push({
          index: i + 1,
          input: testCase.input,
          success: false,
          error: error.message,
          expectedIntents: testCase.expectedIntents
        });
      }
    }

    return {
      summary: {
        totalTests: testCases.length,
        successfulTests,
        failedTests: testCases.length - successfulTests,
        successRate: `${(successfulTests / testCases.length * 100).toFixed(1)}%`
      },
      results
    };
  }

  /**
   * 比较意图识别结果
   * @param {Array} actual 实际意图
   * @param {Array} expected 期望意图
   * @returns {boolean} 是否匹配
   */
  compareIntents(actual, expected) {
    if (!actual || !Array.isArray(actual)) return false;
    if (!expected || !Array.isArray(expected)) return false;
    
    // 检查是否包含所有期望的意图
    for (const intent of expected) {
      if (!actual.includes(intent)) return false;
    }
    
    return true;
  }
}

module.exports = IntelligentDispatchController;
