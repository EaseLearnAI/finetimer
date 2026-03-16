/**
 * AI相关路由的统一入口
 * 这个文件作为AI功能路由的聚合器
 */

const express = require('express');
const router = express.Router();

// 导入具体的AI服务路由
const intentRecognitionRoutes = require('../AIsiri/routes/intentRecognition');

// 挂载意图识别路由
router.use('/intent', intentRecognitionRoutes);

// 健康检查
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'AI服务运行正常',
    timestamp: new Date().toISOString(),
    services: {
      intentRecognition: '✅ 可用',
      conversation: '✅ 可用'
    }
  });
});

module.exports = router;

