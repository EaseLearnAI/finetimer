'use strict';

const express = require('express');
const AIController = require('../controllers/ai_controller');

const router = express.Router();
const aiController = new AIController();

// 日志中间件
router.use((req, res, next) => {
  console.log(`\n🔗 AI路由请求: ${req.method} ${req.path}`);
  console.log(`⏰ 时间: ${new Date().toISOString()}`);
  console.log(`📍 IP: ${req.ip}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`📦 请求体:`, JSON.stringify(req.body, null, 2));
  }
  next();
});

// === 主要功能路由 ===

/**
 * @route POST /ai/process-input
 * @desc 处理用户输入 - 主入口API
 * @body {string} userInput - 用户输入内容
 * @body {string} [userId] - 用户ID（可选）
 */
router.post('/process-input', async (req, res) => {
  await aiController.processUserInput(req, res);
});

/**
 * @route POST /ai/generate-plan
 * @desc 根据用户回答生成计划
 * @body {string} goal - 用户目标
 * @body {string} goalType - 目标类型 (goal_planning/habit_formation)
 * @body {array} userAnswers - 用户回答数组
 * @body {string} [userId] - 用户ID（可选）
 */
router.post('/generate-plan', async (req, res) => {
  await aiController.generatePlan(req, res);
});

/**
 * @route POST /ai/adjust-plan
 * @desc 调整现有计划
 * @body {string} planId - 计划ID
 * @body {string} userFeedback - 用户反馈
 * @body {string} [userId] - 用户ID（可选）
 */
router.post('/adjust-plan', async (req, res) => {
  await aiController.adjustPlan(req, res);
});

/**
 * @route POST /ai/schedule-unscheduled
 * @desc 手动调度所有未安排时间的任务
 * @body {string} [userId] - 用户ID（可选）
 */
router.post('/schedule-unscheduled', async (req, res) => {
  await aiController.scheduleUnscheduledTasks(req, res);
});

// === 辅助功能路由 ===

/**
 * @route POST /ai/classify-input
 * @desc 仅分类用户输入（测试用）
 * @body {string} userInput - 用户输入内容
 */
router.post('/classify-input', async (req, res) => {
  await aiController.classifyInput(req, res);
});

/**
 * @route POST /ai/generate-questions
 * @desc 生成问题（测试用）
 * @body {string} goal - 用户目标
 * @body {string} goalType - 目标类型
 */
router.post('/generate-questions', async (req, res) => {
  await aiController.generateQuestions(req, res);
});

/**
 * @route POST /ai/generate-habit-plan
 * @desc 根据习惯问题回答生成习惯计划
 * @body {string} userInput - 用户原始输入
 * @body {string} habitType - 习惯类型
 * @body {array} questionAnswers - 用户对问题的回答
 * @body {string} [userId] - 用户ID（可选）
 */
router.post('/generate-habit-plan', async (req, res) => {
  await aiController.generateHabitPlan(req, res);
});

/**
 * @route POST /ai/schedule-unscheduled
 * @desc 触发未安排任务的自动调度
 * @body {string} [userId] - 用户ID（可选）
 */
router.post('/schedule-unscheduled', async (req, res) => {
  try {
    const userId = req.body?.userId;
    const result = await aiController.schedulerManager.scheduleUnscheduledTasks(userId);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// === 系统状态路由 ===

/**
 * @route GET /ai/test-connection
 * @desc 测试AI连接
 */
router.get('/test-connection', async (req, res) => {
  await aiController.testConnection(req, res);
});

/**
 * @route GET /ai/status
 * @desc 获取AI系统状态
 */
router.get('/status', async (req, res) => {
  await aiController.getStatus(req, res);
});

/**
 * @route GET /ai/health
 * @desc 健康检查
 */
router.get('/health', (req, res) => {
  console.log('💓 AI健康检查');
  res.json({
    success: true,
    message: 'AI服务运行正常',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// === 错误处理中间件 ===
router.use((err, req, res, next) => {
  console.error('🚨 AI路由错误:', err);
  res.status(500).json({
    success: false,
    error: 'AI路由内部错误',
    details: err.message,
    timestamp: new Date().toISOString()
  });
});

// === 404处理会由主应用处理 ===

module.exports = router;