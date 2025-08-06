'use strict';

const AITaskService = require('../services/ai_task_service');

class AIController {
  constructor() {
    this.aiTaskService = new AITaskService();
    console.log('🎮 AI控制器初始化完成');
  }

  /**
   * 处理用户输入 - 主入口API
   * POST /ai/process-input
   */
  async processUserInput(req, res) {
    console.log('\n🌐 === API调用: 处理用户输入 ===');
    
    try {
      const { userInput, userId } = req.body;

      // 参数验证
      if (!userInput || typeof userInput !== 'string') {
        console.log('❌ 参数验证失败: userInput');
        return res.status(400).json({
          success: false,
          error: 'userInput是必需的字符串参数'
        });
      }

      console.log(`📥 接收到请求:`);
      console.log(`  - 用户输入: ${userInput}`);
      console.log(`  - 用户ID: ${userId || '未提供'}`);

      // 调用AI服务处理
      const result = await this.aiTaskService.processUserInput(userInput, userId);

      console.log(`📤 处理结果: ${result.success ? '成功' : '失败'}`);
      
      // 返回结果
      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        request: { userInput, userId },
        ...result
      });

    } catch (error) {
      console.error('❌ API错误:', error.message);
      console.error('📋 错误堆栈:', error.stack);

      res.status(500).json({
        success: false,
        error: '服务器内部错误',
        details: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      console.log('🌐 === API调用结束 ===\n');
    }
  }

  /**
   * 根据用户回答生成计划
   * POST /ai/generate-plan
   */
  async generatePlan(req, res) {
    console.log('\n🌐 === API调用: 生成计划 ===');
    
    try {
      const { goal, goalType, userAnswers, userId } = req.body;

      // 参数验证
      if (!goal || !goalType || !userAnswers) {
        console.log('❌ 参数验证失败');
        return res.status(400).json({
          success: false,
          error: '缺少必需参数: goal, goalType, userAnswers'
        });
      }

      console.log(`📥 接收到计划生成请求:`);
      console.log(`  - 目标: ${goal}`);
      console.log(`  - 类型: ${goalType}`);
      console.log(`  - 回答数量: ${Array.isArray(userAnswers) ? userAnswers.length : 'N/A'}`);
      console.log(`  - 用户ID: ${userId || '未提供'}`);

      // 调用AI服务生成计划
      const result = await this.aiTaskService.generatePlanFromAnswers(goal, goalType, userAnswers, userId);

      console.log(`📤 计划生成结果: ${result.success ? '成功' : '失败'}`);
      
      // 返回结果
      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        request: { goal, goalType, userId },
        ...result
      });

    } catch (error) {
      console.error('❌ 计划生成API错误:', error.message);

      res.status(500).json({
        success: false,
        error: '计划生成失败',
        details: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      console.log('🌐 === 计划生成API调用结束 ===\n');
    }
  }

  /**
   * 调整现有计划
   * POST /ai/adjust-plan
   */
  async adjustPlan(req, res) {
    console.log('\n🌐 === API调用: 调整计划 ===');
    
    try {
      const { planId, userFeedback, userId } = req.body;

      // 参数验证
      if (!planId || !userFeedback) {
        console.log('❌ 参数验证失败');
        return res.status(400).json({
          success: false,
          error: '缺少必需参数: planId, userFeedback'
        });
      }

      console.log(`📥 接收到计划调整请求:`);
      console.log(`  - 计划ID: ${planId}`);
      console.log(`  - 用户反馈: ${userFeedback}`);
      console.log(`  - 用户ID: ${userId || '未提供'}`);

      // 调用AI服务调整计划
      const result = await this.aiTaskService.adjustPlan(planId, userFeedback, userId);

      console.log(`📤 计划调整结果: ${result.success ? '成功' : '失败'}`);
      
      // 返回结果
      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        request: { planId, userFeedback, userId },
        ...result
      });

    } catch (error) {
      console.error('❌ 计划调整API错误:', error.message);

      res.status(500).json({
        success: false,
        error: '计划调整失败',
        details: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      console.log('🌐 === 计划调整API调用结束 ===\n');
    }
  }

  /**
   * 仅分类用户输入（测试用）
   * POST /ai/classify-input
   */
  async classifyInput(req, res) {
    console.log('\n🌐 === API调用: 分类输入 ===');
    
    try {
      const { userInput } = req.body;

      if (!userInput) {
        return res.status(400).json({
          success: false,
          error: 'userInput是必需参数'
        });
      }

      console.log(`📥 接收到分类请求: ${userInput}`);

      // 仅进行分类
      const classification = await this.aiTaskService.inputClassifier.classify(userInput);

      console.log(`📤 分类结果: ${classification.category}`);
      
      res.json({
        success: true,
        userInput: userInput,
        classification: classification,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ 分类API错误:', error.message);

      res.status(500).json({
        success: false,
        error: '分类失败',
        details: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      console.log('🌐 === 分类API调用结束 ===\n');
    }
  }

  /**
   * 生成问题（测试用）
   * POST /ai/generate-questions
   */
  async generateQuestions(req, res) {
    console.log('\n🌐 === API调用: 生成问题 ===');
    
    try {
      const { goal, goalType } = req.body;

      if (!goal || !goalType) {
        return res.status(400).json({
          success: false,
          error: '缺少必需参数: goal, goalType'
        });
      }

      console.log(`📥 接收到问题生成请求: ${goal} (${goalType})`);

      // 生成问题
      const questions = await this.aiTaskService.questionGenerator.generateQuestions(goal, goalType);

      console.log(`📤 生成了${questions.questions?.length || 0}个问题`);
      
      res.json({
        success: true,
        goal: goal,
        goalType: goalType,
        questions: questions,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ 问题生成API错误:', error.message);

      res.status(500).json({
        success: false,
        error: '问题生成失败',
        details: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      console.log('🌐 === 问题生成API调用结束 ===\n');
    }
  }

  /**
   * 测试AI连接
   * GET /ai/test-connection
   */
  async testConnection(req, res) {
    console.log('\n🌐 === API调用: 测试AI连接 ===');
    
    try {
      console.log('🔗 开始测试AI服务连接...');
      
      // 测试LLM连接
      const llmConfig = this.aiTaskService.inputClassifier.llmConfig;
      const testResult = await llmConfig.testConnection();

      if (testResult) {
        console.log('✅ AI连接测试成功');
        res.json({
          success: true,
          message: 'AI服务连接正常',
          model: llmConfig.getModel(),
          timestamp: new Date().toISOString()
        });
      } else {
        console.log('❌ AI连接测试失败');
        res.status(503).json({
          success: false,
          error: 'AI服务连接失败',
          timestamp: new Date().toISOString()
        });
      }

    } catch (error) {
      console.error('❌ AI连接测试错误:', error.message);

      res.status(500).json({
        success: false,
        error: 'AI连接测试异常',
        details: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      console.log('🌐 === AI连接测试结束 ===\n');
    }
  }

  /**
   * 获取系统状态
   * GET /ai/status
   */
  async getStatus(req, res) {
    console.log('\n🌐 === API调用: 获取AI系统状态 ===');
    
    try {
      const status = {
        ai_service: 'running',
        available_chains: [
          'input_classifier',
          'question_generator', 
          'plan_generator',
          'plan_adjuster',
          'habit_processor'
        ],
        prompt_templates: this.aiTaskService.inputClassifier.promptLoader.listPrompts(),
        model_info: {
          model: this.aiTaskService.inputClassifier.llmConfig.getModel(),
          provider: 'Qwen/阿里云'
        },
        timestamp: new Date().toISOString()
      };

      console.log('📊 系统状态:', status);
      
      res.json({
        success: true,
        status: status
      });

    } catch (error) {
      console.error('❌ 状态查询错误:', error.message);

      res.status(500).json({
        success: false,
        error: '状态查询失败',
        details: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      console.log('🌐 === AI状态查询结束 ===\n');
    }
  }
}

module.exports = AIController;