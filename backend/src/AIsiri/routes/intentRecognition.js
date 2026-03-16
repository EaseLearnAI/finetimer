/**
 * 意图识别路由
 * 定义意图识别相关的API路由
 */

const express = require('express');
const IntentRecognitionController = require('../controllers/intentRecognitionController');
const logger = require('../utils/logger');

const router = express.Router();
const controller = new IntentRecognitionController();

/**
 * 请求日志中间件
 */
router.use((req, res, next) => {
  const startTime = Date.now();
  
  // 记录请求开始
  logger.info('Intent API Request', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.method === 'POST' ? {
      ...req.body,
      input: req.body.input ? `${req.body.input.substring(0, 50)}...` : undefined
    } : undefined
  });

  // 响应结束时记录日志
  const originalSend = res.send;
  res.send = function(data) {
    logger.info('Intent API Response', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      responseTime: Date.now() - startTime + 'ms'
    });
    return originalSend.call(this, data);
  };

  next();
});

/**
 * 错误处理中间件
 */
const errorHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// 路由定义

/**
 * @route POST /api/intent/recognize
 * @desc 单个意图识别
 * @access Public
 */
router.post('/recognize', errorHandler(controller.recognizeIntent));

/**
 * @route POST /api/intent/recognize/batch
 * @desc 批量意图识别
 * @access Public
 */
router.post('/recognize/batch', errorHandler(controller.recognizeIntentBatch));

/**
 * @route GET /api/intent/types
 * @desc 获取支持的意图类型
 * @access Public
 */
router.get('/types', errorHandler(controller.getSupportedIntents));

/**
 * @route GET /api/intent/health
 * @desc 健康检查
 * @access Public
 */
router.get('/health', errorHandler(controller.healthCheck));

/**
 * @route GET /api/intent/stats
 * @desc 获取服务统计信息
 * @access Public
 */
router.get('/stats', errorHandler(controller.getStats));

/**
 * 全局错误处理
 */
router.use((error, req, res, next) => {
  logger.error('Intent API Error', {
    error: error.message,
    stack: error.stack,
    method: req.method,
    path: req.path,
    body: req.body
  });

  res.status(500).json({
    success: false,
    error: '服务器内部错误',
    code: 'INTERNAL_SERVER_ERROR',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;

