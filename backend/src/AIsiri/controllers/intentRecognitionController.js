/**
 * 意图识别控制器
 * 处理意图识别相关的HTTP请求
 */

const IntentRecognitionService = require('../services/intentRecognitionService');
const logger = require('../utils/logger');

/**
 * 意图识别控制器类
 */
class IntentRecognitionController {
  constructor() {
    this.intentService = new IntentRecognitionService();
    
    // 绑定this上下文
    this.recognizeIntent = this.recognizeIntent.bind(this);
    this.recognizeIntentBatch = this.recognizeIntentBatch.bind(this);
    this.getSupportedIntents = this.getSupportedIntents.bind(this);
    this.healthCheck = this.healthCheck.bind(this);
  }

  /**
   * 单个意图识别
   * POST /api/intent/recognize
   */
  async recognizeIntent(req, res) {
    const startTime = Date.now();
    logger.apiRequest(req, '意图识别请求');

    try {
      const { input, options = {} } = req.body;

      // 参数验证
      if (!input) {
        return res.status(400).json({
          success: false,
          error: '缺少必要参数: input',
          code: 'MISSING_INPUT'
        });
      }

      if (typeof input !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'input必须是字符串类型',
          code: 'INVALID_INPUT_TYPE'
        });
      }

      if (input.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'input不能为空',
          code: 'EMPTY_INPUT'
        });
      }

      if (input.length > 1000) {
        return res.status(400).json({
          success: false,
          error: 'input长度不能超过1000字符',
          code: 'INPUT_TOO_LONG'
        });
      }

      logger.info('开始处理意图识别', {
        inputLength: input.length,
        hasOptions: Object.keys(options).length > 0
      });

      // 执行意图识别
      const result = await this.intentService.recognizeIntent(input, options);

      logger.apiResponse(req, res, startTime, '意图识别完成', {
        intent: result.intent,
        confidence: result.confidence
      });

      res.json({
        success: true,
        data: result,
        processingTime: Date.now() - startTime
      });

    } catch (error) {
      logger.error('意图识别失败', {
        error: error.message,
        stack: error.stack,
        input: req.body.input?.substring(0, 100) + '...'
      });

      logger.apiResponse(req, res, startTime, '意图识别失败', {
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: error.message,
        code: 'RECOGNITION_FAILED',
        processingTime: Date.now() - startTime
      });
    }
  }

  /**
   * 批量意图识别
   * POST /api/intent/recognize/batch
   */
  async recognizeIntentBatch(req, res) {
    const startTime = Date.now();
    logger.apiRequest(req, '批量意图识别请求');

    try {
      const { inputs } = req.body;

      // 参数验证
      if (!inputs) {
        return res.status(400).json({
          success: false,
          error: '缺少必要参数: inputs',
          code: 'MISSING_INPUTS'
        });
      }

      if (!Array.isArray(inputs)) {
        return res.status(400).json({
          success: false,
          error: 'inputs必须是数组类型',
          code: 'INVALID_INPUTS_TYPE'
        });
      }

      if (inputs.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'inputs不能为空数组',
          code: 'EMPTY_INPUTS'
        });
      }

      if (inputs.length > 10) {
        return res.status(400).json({
          success: false,
          error: '批量处理最多支持10个输入',
          code: 'TOO_MANY_INPUTS'
        });
      }

      // 验证每个输入
      for (let i = 0; i < inputs.length; i++) {
        const input = inputs[i];
        if (!input || typeof input !== 'string' || input.trim().length === 0) {
          return res.status(400).json({
            success: false,
            error: `第${i + 1}个输入无效`,
            code: 'INVALID_INPUT_ITEM'
          });
        }
      }

      logger.info('开始批量意图识别', {
        inputCount: inputs.length,
        totalLength: inputs.reduce((sum, input) => sum + input.length, 0)
      });

      // 执行批量意图识别
      const results = await this.intentService.recognizeIntentBatch(inputs);

      logger.apiResponse(req, res, startTime, '批量意图识别完成', {
        inputCount: inputs.length,
        successCount: results.filter(r => !r.fallback).length
      });

      res.json({
        success: true,
        data: {
          results,
          summary: {
            total: inputs.length,
            successful: results.filter(r => !r.fallback).length,
            failed: results.filter(r => r.fallback).length
          }
        },
        processingTime: Date.now() - startTime
      });

    } catch (error) {
      logger.error('批量意图识别失败', {
        error: error.message,
        stack: error.stack,
        inputCount: req.body.inputs?.length
      });

      logger.apiResponse(req, res, startTime, '批量意图识别失败', {
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: error.message,
        code: 'BATCH_RECOGNITION_FAILED',
        processingTime: Date.now() - startTime
      });
    }
  }

  /**
   * 获取支持的意图类型
   * GET /api/intent/types
   */
  async getSupportedIntents(req, res) {
    const startTime = Date.now();
    logger.apiRequest(req, '获取支持的意图类型');

    try {
      const supportedIntents = this.intentService.getSupportedIntents();

      logger.apiResponse(req, res, startTime, '获取意图类型成功', {
        intentCount: supportedIntents.count
      });

      res.json({
        success: true,
        data: supportedIntents,
        processingTime: Date.now() - startTime
      });

    } catch (error) {
      logger.error('获取意图类型失败', {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: error.message,
        code: 'GET_INTENTS_FAILED',
        processingTime: Date.now() - startTime
      });
    }
  }

  /**
   * 健康检查
   * GET /api/intent/health
   */
  async healthCheck(req, res) {
    const startTime = Date.now();
    logger.apiRequest(req, '意图识别服务健康检查');

    try {
      const health = await this.intentService.healthCheck();

      logger.apiResponse(req, res, startTime, '健康检查完成', {
        status: health.status,
        responseTime: health.responseTime
      });

      const statusCode = health.status === 'healthy' ? 200 : 503;
      res.status(statusCode).json({
        success: health.status === 'healthy',
        data: health,
        processingTime: Date.now() - startTime
      });

    } catch (error) {
      logger.error('健康检查失败', {
        error: error.message,
        stack: error.stack
      });

      res.status(503).json({
        success: false,
        error: error.message,
        code: 'HEALTH_CHECK_FAILED',
        processingTime: Date.now() - startTime
      });
    }
  }

  /**
   * 获取服务统计信息
   * GET /api/intent/stats
   */
  async getStats(req, res) {
    const startTime = Date.now();
    logger.apiRequest(req, '获取服务统计信息');

    try {
      // 这里可以添加统计信息的逻辑
      const stats = {
        service: 'intent-recognition',
        version: '1.0.0',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        supportedIntents: this.intentService.getSupportedIntents().count,
        timestamp: new Date().toISOString()
      };

      logger.apiResponse(req, res, startTime, '获取统计信息成功');

      res.json({
        success: true,
        data: stats,
        processingTime: Date.now() - startTime
      });

    } catch (error) {
      logger.error('获取统计信息失败', {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: error.message,
        code: 'GET_STATS_FAILED',
        processingTime: Date.now() - startTime
      });
    }
  }
}

module.exports = IntentRecognitionController;

