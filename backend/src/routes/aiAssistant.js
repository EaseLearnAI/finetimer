'use strict';

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getOrCreateAssistant,
  updateAssistantName,
  increaseHeartValue,
  getAssistantInfo
} = require('../controllers/aiAssistantController');

// AI助手路由

// GET /api/ai-assistant - 获取或创建AI助手
router.get('/', authenticateToken, getOrCreateAssistant);

// GET /api/ai-assistant/info - 获取AI助手信息
router.get('/info', authenticateToken, getAssistantInfo);

// PUT /api/ai-assistant/name - 更新AI助手名称
router.put('/name', authenticateToken, updateAssistantName);

// POST /api/ai-assistant/heart - 增加心动值（每次对话调用）
router.post('/heart', authenticateToken, increaseHeartValue);

module.exports = router;
