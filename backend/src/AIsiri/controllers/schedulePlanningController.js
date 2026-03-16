/**
 * 任务调度规划控制器
 * 处理任务调度相关的HTTP请求
 */

const schedulePlanningService = require('../services/schedulePlanningService');
const logger = require('../utils/logger');

class SchedulePlanningController {
  constructor() {
    this.service = schedulePlanningService;
  }

  /**
   * 执行任务调度规划
   * POST /api/aisiri/schedule/plan
   * @param {Object} req Express请求对象
   * @param {Object} res Express响应对象
   * @param {Function} next Express next中间件函数
   */
  async planSchedule(req, res, next) {
    const startTime = Date.now();
    const {
      userInput,
      targetDate,
      userContext = {},
      options = {}
    } = req.body;
    const userId = req.user.userId;

    logger.info('收到任务调度规划请求', {
      userId,
      userInput: userInput ? userInput.substring(0, 100) + (userInput.length > 100 ? '...' : '') : '',
      targetDate,
      userContext,
      options
    });

    try {
      // 输入验证
      if (!userInput || typeof userInput !== 'string' || userInput.trim().length === 0) {
        logger.warn('任务调度请求失败: 用户输入为空', { userId });
        return res.status(400).json({
          success: false,
          error: '调度请求内容不能为空',
          code: 'EMPTY_USER_INPUT',
          processingTime: Date.now() - startTime
        });
      }

      if (userInput.length > 2000) {
        logger.warn('任务调度请求失败: 用户输入过长', { userId, inputLength: userInput.length });
        return res.status(400).json({
          success: false,
          error: '调度请求内容不能超过2000字符',
          code: 'INPUT_TOO_LONG',
          processingTime: Date.now() - startTime
        });
      }

      // 如果没有提供目标日期，默认使用今天
      const effectiveTargetDate = targetDate || new Date().toISOString().split('T')[0];

      // 验证日期格式
      if (!/^\d{4}-\d{2}-\d{2}$/.test(effectiveTargetDate)) {
        logger.warn('任务调度请求失败: 日期格式错误', { userId, targetDate: effectiveTargetDate });
        return res.status(400).json({
          success: false,
          error: '日期格式必须为YYYY-MM-DD',
          code: 'INVALID_DATE_FORMAT',
          processingTime: Date.now() - startTime
        });
      }

      // 执行调度规划
      const result = await this.service.planSchedule({
        userId,
        userInput: userInput.trim(),
        targetDate: effectiveTargetDate,
        userContext,
        options
      });

      logger.info('任务调度规划完成', {
        userId,
        targetDate: effectiveTargetDate,
        adjustmentCount: result.data.recommendations?.taskAdjustments?.length || 0,
        breakCount: result.data.recommendations?.breakSuggestions?.length || 0,
        processingTime: result.data.metadata.processingTime
      });

      res.json({
        success: true,
        data: result.data,
        message: '任务调度规划完成',
        processingTime: Date.now() - startTime
      });

    } catch (error) {
      logger.error('任务调度规划失败', {
        userId,
        targetDate: targetDate || 'today',
        error: error.message,
        stack: error.stack,
        inputMessage: userInput
      });
      
      next({
        status: error.status || 500,
        message: error.message,
        code: error.code || 'SCHEDULE_PLANNING_FAILED',
        processingTime: Date.now() - startTime
      });
    }
  }

  /**
   * 应用调度建议
   * POST /api/aisiri/schedule/apply
   * @param {Object} req Express请求对象
   * @param {Object} res Express响应对象
   * @param {Function} next Express next中间件函数
   */
  async applyScheduleAdjustments(req, res, next) {
    const startTime = Date.now();
    const { adjustments, targetDate } = req.body;
    const userId = req.user.userId;

    logger.info('收到应用调度建议请求', {
      userId,
      adjustmentCount: adjustments ? adjustments.length : 0
    });

    try {
      // 输入验证
      if (!adjustments || !Array.isArray(adjustments) || adjustments.length === 0) {
        logger.warn('应用调度建议失败: 调整建议为空', { userId });
        return res.status(400).json({
          success: false,
          error: '调度调整建议不能为空',
          code: 'EMPTY_ADJUSTMENTS',
          processingTime: Date.now() - startTime
        });
      }

      if (adjustments.length > 20) {
        logger.warn('应用调度建议失败: 调整建议过多', { userId, count: adjustments.length });
        return res.status(400).json({
          success: false,
          error: '一次最多应用20个调度调整',
          code: 'TOO_MANY_ADJUSTMENTS',
          processingTime: Date.now() - startTime
        });
      }

      // 如果没有提供目标日期，默认使用今天
      const effectiveTargetDate = targetDate || new Date().toISOString().split('T')[0];
      
      // 应用调度建议
      const results = await this.service.applyScheduleAdjustments(userId, adjustments, effectiveTargetDate);

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.length - successCount;

      logger.info('应用调度建议完成', {
        userId,
        totalCount: results.length,
        successCount,
        failureCount,
        processingTime: Date.now() - startTime
      });

      res.json({
        success: true,
        data: {
          results,
          summary: {
            total: results.length,
            successful: successCount,
            failed: failureCount
          }
        },
        message: `成功应用${successCount}个调度调整，${failureCount}个失败`,
        processingTime: Date.now() - startTime
      });

    } catch (error) {
      logger.error('应用调度建议失败', {
        userId,
        error: error.message,
        stack: error.stack
      });
      
      next({
        status: error.status || 500,
        message: error.message,
        code: error.code || 'APPLY_SCHEDULE_FAILED',
        processingTime: Date.now() - startTime
      });
    }
  }

  /**
   * 分析时间冲突
   * POST /api/aisiri/schedule/analyze-conflicts
   * @param {Object} req Express请求对象
   * @param {Object} res Express响应对象
   * @param {Function} next Express next中间件函数
   */
  async analyzeTimeConflicts(req, res, next) {
    const startTime = Date.now();
    const { targetDate } = req.body;
    const userId = req.user.userId;

    logger.info('收到时间冲突分析请求', { userId, targetDate });

    try {
      // 如果没有提供目标日期，默认使用今天
      const effectiveTargetDate = targetDate || new Date().toISOString().split('T')[0];

      // 获取用户任务
      const tasks = await this.service.getUserTasks(userId, effectiveTargetDate);

      // 分析冲突
      const conflicts = this.service.analyzeTimeConflicts(tasks, effectiveTargetDate);

      logger.info('时间冲突分析完成', {
        userId,
        targetDate: effectiveTargetDate,
        taskCount: tasks.length,
        conflictCount: conflicts.length,
        processingTime: Date.now() - startTime
      });

      res.json({
        success: true,
        data: {
          targetDate: effectiveTargetDate,
          taskCount: tasks.length,
          conflicts,
          conflictCount: conflicts.length
        },
        message: `发现${conflicts.length}个时间冲突`,
        processingTime: Date.now() - startTime
      });

    } catch (error) {
      logger.error('时间冲突分析失败', {
        userId,
        targetDate: targetDate || 'today',
        error: error.message,
        stack: error.stack
      });
      
      next({
        status: error.status || 500,
        message: error.message,
        code: error.code || 'CONFLICT_ANALYSIS_FAILED',
        processingTime: Date.now() - startTime
      });
    }
  }

  /**
   * 生成时间建议
   * POST /api/aisiri/schedule/suggest-time
   * @param {Object} req Express请求对象
   * @param {Object} res Express响应对象
   * @param {Function} next Express next中间件函数
   */
  async suggestTimeSlot(req, res, next) {
    const startTime = Date.now();
    const {
      targetDate,
      estimatedTime = 30,
      preferredTimeBlock = 'afternoon'
    } = req.body;
    const userId = req.user.userId;

    logger.info('收到时间建议请求', {
      userId,
      targetDate,
      estimatedTime,
      preferredTimeBlock
    });

    try {
      // 如果没有提供目标日期，默认使用今天
      const effectiveTargetDate = targetDate || new Date().toISOString().split('T')[0];

      // 获取用户任务
      const existingTasks = await this.service.getUserTasks(userId, effectiveTargetDate);

      // 生成时间建议
      const timeSlot = this.service.suggestTimeSlot(
        effectiveTargetDate,
        estimatedTime,
        preferredTimeBlock,
        existingTasks
      );

      logger.info('时间建议生成完成', {
        userId,
        targetDate: effectiveTargetDate,
        estimatedTime,
        preferredTimeBlock,
        suggestion: timeSlot,
        processingTime: Date.now() - startTime
      });

      res.json({
        success: true,
        data: {
          targetDate: effectiveTargetDate,
          estimatedTime,
          preferredTimeBlock,
          suggestion: timeSlot,
          existingTaskCount: existingTasks.length
        },
        message: '时间建议生成完成',
        processingTime: Date.now() - startTime
      });

    } catch (error) {
      logger.error('时间建议生成失败', {
        userId,
        targetDate: targetDate || 'today',
        error: error.message,
        stack: error.stack
      });
      
      next({
        status: error.status || 500,
        message: error.message,
        code: error.code || 'TIME_SUGGESTION_FAILED',
        processingTime: Date.now() - startTime
      });
    }
  }

  /**
   * 获取调度服务健康状态
   * GET /api/aisiri/schedule/health
   * @param {Object} req Express请求对象
   * @param {Object} res Express响应对象
   */
  async getHealthStatus(req, res) {
    const startTime = Date.now();
    logger.info('调度服务健康检查请求');
    
    try {
      const health = await this.service.healthCheck();
      res.json({
        success: true,
        data: health,
        message: '调度服务健康检查完成',
        processingTime: Date.now() - startTime
      });
    } catch (error) {
      logger.error('调度服务健康检查失败', { error: error.message, stack: error.stack });
      res.status(500).json({
        success: false,
        error: error.message,
        code: 'HEALTH_CHECK_FAILED',
        processingTime: Date.now() - startTime
      });
    }
  }

  /**
   * 获取调度服务统计信息
   * GET /api/aisiri/schedule/stats
   * @param {Object} req Express请求对象
   * @param {Object} res Express响应对象
   */
  getServiceStats(req, res) {
    const startTime = Date.now();
    logger.info('调度服务统计信息请求');
    
    const stats = this.service.getServiceStats();
    res.json({
      success: true,
      data: stats,
      message: '调度服务统计信息获取成功',
      processingTime: Date.now() - startTime
    });
  }
}

module.exports = new SchedulePlanningController();

