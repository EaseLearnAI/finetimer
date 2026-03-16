/**
 * 对话路由
 * 定义对话相关的API路由
 */

const express = require('express');
const ConversationController = require('../controllers/conversationController');
const logger = require('../utils/logger');

const router = express.Router();
const controller = new ConversationController();

/**
 * 请求日志中间件
 */
router.use((req, res, next) => {
  const startTime = Date.now();
  
  // 记录请求开始
  logger.info('Conversation API Request', {
    method: req.method,
    path: req.path,
    userId: req.user?.userId,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.method === 'POST' ? {
      ...req.body,
      message: req.body.message ? `${req.body.message.substring(0, 50)}...` : undefined
    } : undefined,
    query: req.query
  });

  // 响应结束时记录日志
  const originalSend = res.send;
  res.send = function(data) {
    logger.info('Conversation API Response', {
      method: req.method,
      path: req.path,
      userId: req.user?.userId,
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
 * @route POST /api/ai/conversation/send
 * @desc 发送对话消息
 * @access Private (需要认证)
 */
router.post('/send', errorHandler(controller.sendMessage));

/**
 * @route GET /api/ai/conversation/history
 * @desc 获取对话历史
 * @access Private (需要认证)
 */
router.get('/history', errorHandler(controller.getHistory));

/**
 * @route DELETE /api/ai/conversation/history
 * @desc 删除对话历史
 * @access Private (需要认证)
 */
router.delete('/history', errorHandler(controller.deleteHistory));

/**
 * @route GET /api/ai/conversation/sessions
 * @desc 获取会话列表
 * @access Private (需要认证)
 */
router.get('/sessions', errorHandler(controller.getSessions));

/**
 * @route GET /api/ai/conversation/stats
 * @desc 获取对话统计信息
 * @access Private (需要认证)
 */
router.get('/stats', errorHandler(controller.getStats));

/**
 * @route GET /api/ai/conversation/health
 * @desc 对话服务健康检查
 * @access Public
 */
router.get('/health', errorHandler(controller.healthCheck));

/**
 * 全局错误处理
 */
router.use((error, req, res, next) => {
  logger.error('Conversation API Error', {
    error: error.message,
    stack: error.stack,
    method: req.method,
    path: req.path,
    userId: req.user?.userId,
    body: req.body,
    query: req.query
  });

  res.status(500).json({
    success: false,
    error: '对话服务内部错误',
    code: 'CONVERSATION_INTERNAL_ERROR',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;

