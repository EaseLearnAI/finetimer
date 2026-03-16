'use strict';

const express = require('express');
const router = express.Router();
const IntelligentDispatchController = require('../controllers/intelligentDispatchController');
const { authenticateToken, optionalAuth } = require('../../middleware/auth');
const logger = require('../utils/logger');

// 创建控制器实例
const dispatchController = new IntelligentDispatchController();

/**
 * 智能调度路由定义
 */

// POST /api/aisiri/dispatch - 智能调度处理（需要认证）
router.post('/', authenticateToken, (req, res) => {
  logger.info('智能调度请求', {
    url: req.originalUrl,
    userId: req.user?.userId,
    ip: req.ip
  });
  dispatchController.processIntelligentDispatch(req, res);
});

// GET /api/aisiri/dispatch/status - 获取服务状态（无需认证）
router.get('/status', (req, res) => {
  logger.info('获取智能调度服务状态', {
    url: req.originalUrl,
    ip: req.ip
  });
  dispatchController.getDispatchStatus(req, res);
});

// POST /api/aisiri/dispatch/test - 测试智能调度功能（可选认证）
router.post('/test', optionalAuth, (req, res) => {
  logger.info('智能调度测试请求', {
    url: req.originalUrl,
    userId: req.user?.userId || 'anonymous',
    ip: req.ip
  });
  dispatchController.testDispatch(req, res);
});

module.exports = router;

