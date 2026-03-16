/**
 * 任务调度规划路由
 * 定义任务调度相关的API接口
 */

const express = require('express');
const router = express.Router();
const schedulePlanningController = require('../controllers/schedulePlanningController');
const logger = require('../utils/logger');

// 中间件：记录API请求详情
router.use((req, res, next) => {
  req._startTime = Date.now();
  logger.info('Schedule Planning API Request', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    userId: req.user?.userId,
    body: req.method === 'POST' ? {
      ...req.body,
      userInput: req.body.userInput ? 
        req.body.userInput.substring(0, 100) + (req.body.userInput.length > 100 ? '...' : '') : 
        undefined
    } : undefined
  });
  next();
});

/**
 * @swagger
 * /api/aisiri/schedule/plan:
 *   post:
 *     summary: 执行任务调度规划
 *     description: 根据用户输入和当前任务情况，智能生成任务调度建议
 *     tags:
 *       - Schedule Planning
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userInput
 *             properties:
 *               userInput:
 *                 type: string
 *                 description: 用户的调度请求
 *                 example: "我今天下午三点要去拿快递，但感觉很累"
 *               targetDate:
 *                 type: string
 *                 format: date
 *                 description: 目标调度日期，默认为今天
 *                 example: "2025-08-17"
 *               userContext:
 *                 type: object
 *                 description: 用户上下文信息
 *                 properties:
 *                   emotionalState:
 *                     type: string
 *                     description: 情绪状态
 *                     example: "疲惫"
 *                   energyLevel:
 *                     type: string
 *                     description: 精力水平
 *                     example: "低"
 *                   workload:
 *                     type: string
 *                     description: 工作负荷
 *                     example: "重"
 *                   preferences:
 *                     type: string
 *                     description: 偏好设置
 *                     example: "偏好轻松任务"
 *               options:
 *                 type: object
 *                 description: 调度选项
 *                 properties:
 *                   autoApply:
 *                     type: boolean
 *                     description: 是否自动应用调度建议
 *                     default: false
 *     responses:
 *       200:
 *         description: 调度规划成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     analysis:
 *                       type: object
 *                       description: 调度分析结果
 *                     recommendations:
 *                       type: object
 *                       description: 调度建议
 *                       properties:
 *                         taskAdjustments:
 *                           type: array
 *                           description: 任务调整建议
 *                         breakSuggestions:
 *                           type: array
 *                           description: 休息建议
 *                     schedule:
 *                       type: object
 *                       description: 优化后的时间表
 *                     summary:
 *                       type: string
 *                       description: 调度总结
 *                 message:
 *                   type: string
 *                   example: "任务调度规划完成"
 *                 processingTime:
 *                   type: number
 *                   example: 3500
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/plan', schedulePlanningController.planSchedule.bind(schedulePlanningController));

/**
 * @swagger
 * /api/aisiri/schedule/apply:
 *   post:
 *     summary: 应用调度建议
 *     description: 将调度建议应用到实际的任务数据库中
 *     tags:
 *       - Schedule Planning
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - adjustments
 *             properties:
 *               adjustments:
 *                 type: array
 *                 description: 要应用的调度调整
 *                 items:
 *                   type: object
 *                   properties:
 *                     taskId:
 *                       type: string
 *                       description: 任务ID（创建新任务时可省略）
 *                     action:
 *                       type: string
 *                       enum: [create, update, delete, reschedule]
 *                       description: 操作类型
 *                     changes:
 *                       type: object
 *                       description: 具体的变更内容
 *     responses:
 *       200:
 *         description: 应用调度建议成功
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/apply', schedulePlanningController.applyScheduleAdjustments.bind(schedulePlanningController));

/**
 * @swagger
 * /api/aisiri/schedule/analyze-conflicts:
 *   post:
 *     summary: 分析时间冲突
 *     description: 分析指定日期的任务时间冲突
 *     tags:
 *       - Schedule Planning
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               targetDate:
 *                 type: string
 *                 format: date
 *                 description: 要分析的日期，默认为今天
 *                 example: "2025-08-17"
 *     responses:
 *       200:
 *         description: 时间冲突分析完成
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     targetDate:
 *                       type: string
 *                       example: "2025-08-17"
 *                     taskCount:
 *                       type: number
 *                       example: 5
 *                     conflicts:
 *                       type: array
 *                       description: 发现的时间冲突
 *                     conflictCount:
 *                       type: number
 *                       example: 2
 *                 message:
 *                   type: string
 *                   example: "发现2个时间冲突"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/analyze-conflicts', schedulePlanningController.analyzeTimeConflicts.bind(schedulePlanningController));

/**
 * @swagger
 * /api/aisiri/schedule/suggest-time:
 *   post:
 *     summary: 生成时间建议
 *     description: 为新任务生成合适的时间安排建议
 *     tags:
 *       - Schedule Planning
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               targetDate:
 *                 type: string
 *                 format: date
 *                 description: 目标日期，默认为今天
 *                 example: "2025-08-17"
 *               estimatedTime:
 *                 type: number
 *                 description: 预计用时（分钟），默认30分钟
 *                 example: 60
 *               preferredTimeBlock:
 *                 type: string
 *                 enum: [morning, forenoon, afternoon, evening]
 *                 description: 偏好时间块，默认为下午
 *                 example: "afternoon"
 *     responses:
 *       200:
 *         description: 时间建议生成成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     targetDate:
 *                       type: string
 *                       example: "2025-08-17"
 *                     estimatedTime:
 *                       type: number
 *                       example: 60
 *                     preferredTimeBlock:
 *                       type: string
 *                       example: "afternoon"
 *                     suggestion:
 *                       type: object
 *                       description: 时间建议
 *                       properties:
 *                         startTime:
 *                           type: string
 *                           example: "15:00"
 *                         endTime:
 *                           type: string
 *                           example: "16:00"
 *                         timeBlockType:
 *                           type: string
 *                           example: "afternoon"
 *                 message:
 *                   type: string
 *                   example: "时间建议生成完成"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/suggest-time', schedulePlanningController.suggestTimeSlot.bind(schedulePlanningController));

/**
 * @swagger
 * /api/aisiri/schedule/health:
 *   get:
 *     summary: 调度服务健康检查
 *     description: 检查任务调度服务是否正常运行
 *     tags:
 *       - Health Check
 *     responses:
 *       200:
 *         description: 服务健康
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: "healthy"
 *                     model:
 *                       type: string
 *                       example: "qwen-plus"
 *                     responseTime:
 *                       type: number
 *                       example: 2000
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                 message:
 *                   type: string
 *                   example: "调度服务健康检查完成"
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/health', schedulePlanningController.getHealthStatus.bind(schedulePlanningController));

/**
 * @swagger
 * /api/aisiri/schedule/stats:
 *   get:
 *     summary: 获取调度服务统计信息
 *     description: 获取任务调度服务的运行时统计信息
 *     tags:
 *       - Monitoring
 *     responses:
 *       200:
 *         description: 统计信息获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     service:
 *                       type: string
 *                       example: "schedule-planning"
 *                     version:
 *                       type: string
 *                       example: "1.0.0"
 *                     uptime:
 *                       type: number
 *                       example: 3600.5
 *                     memory:
 *                       type: object
 *                     supportedTimeBlocks:
 *                       type: number
 *                       example: 5
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                 message:
 *                   type: string
 *                   example: "调度服务统计信息获取成功"
 */
router.get('/stats', schedulePlanningController.getServiceStats.bind(schedulePlanningController));

module.exports = router;

