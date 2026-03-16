/**
 * 任务调度规划服务
 * 负责智能分析和调整用户的任务时间安排
 */

const axios = require('axios');
const Task = require('../../models/Task');
const Collection = require('../../models/Collection');
const logger = require('../utils/logger');
const {
  buildSchedulePlanningPrompt,
  parseScheduleResponse,
  getTimeBlockRange,
  validateScheduleAdjustments,
  TIME_BLOCK_TYPES,
  PRIORITY_TYPES,
  QUADRANT_TYPES
} = require('../prompt/schedule_planning');

class SchedulePlanningService {
  constructor() {
    this.apiKey = process.env.DASHSCOPE_API_KEY;
    this.baseURL = 'https://dashscope.aliyuncs.com/compatible-mode/v1';
    this.model = 'qwen-plus';

    if (!this.apiKey) {
      throw new Error('DASHSCOPE_API_KEY 环境变量未设置');
    }

    logger.info('任务调度规划服务初始化成功', {
      model: this.model,
      baseURL: this.baseURL,
      hasApiKey: !!this.apiKey
    });
  }

  /**
   * 执行任务调度规划
   * @param {Object} params - 调度参数
   * @param {string} params.userId - 用户ID
   * @param {string} params.userInput - 用户输入的调度请求
   * @param {string} params.targetDate - 目标日期 (YYYY-MM-DD)
   * @param {Object} params.userContext - 用户上下文信息
   * @param {Object} params.options - 调度选项
   * @returns {Promise<Object>} 调度结果
   */
  async planSchedule({
    userId,
    userInput,
    targetDate,
    userContext = {},
    options = {}
  }) {
    const startTime = Date.now();
    
    try {
      logger.info('开始任务调度规划', {
        userId,
        userInput: userInput.substring(0, 100) + (userInput.length > 100 ? '...' : ''),
        targetDate,
        userContext
      });

      // 1. 获取当前时间
      const currentTime = new Date().toLocaleString('zh-CN', {
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      // 2. 查询用户的现有任务
      const existingTasks = await this.getUserTasks(userId, targetDate);
      logger.info('获取用户现有任务', { userId, taskCount: existingTasks.length, date: targetDate });

      // 3. 查询用户的任务集信息
      const collections = await this.getUserCollections(userId);
      logger.info('获取用户任务集信息', { userId, collectionCount: collections.length });

      // 4. 构建调度规划的 Prompt
      const { messages } = buildSchedulePlanningPrompt({
        userInput,
        currentTime,
        targetDate,
        existingTasks,
        userContext,
        collections
      });

      logger.info('构建调度规划Prompt完成', { messagesCount: messages.length });

      // 5. 调用通义千问API进行智能调度分析
      const scheduleResponse = await this.callQwenAPI(messages);
      logger.info('通义千问调度分析完成', { responseLength: scheduleResponse.content.length });

      // 6. 解析调度建议
      const parsedResponse = parseScheduleResponse(scheduleResponse.content);
      
      if (!parsedResponse.success) {
        logger.error('调度建议解析失败', { error: parsedResponse.error, rawResponse: parsedResponse.rawResponse });
        throw new Error(`调度建议解析失败: ${parsedResponse.error}`);
      }

      const scheduleData = parsedResponse.data;
      logger.info('调度建议解析成功', { 
        adjustmentCount: scheduleData.recommendations?.taskAdjustments?.length || 0,
        breakCount: scheduleData.recommendations?.breakSuggestions?.length || 0
      });

      // 7. 验证调度建议的合理性
      if (scheduleData.recommendations?.taskAdjustments) {
        const validationErrors = validateScheduleAdjustments(scheduleData.recommendations.taskAdjustments);
        if (validationErrors.length > 0) {
          logger.warn('调度建议验证发现问题', { errors: validationErrors });
          scheduleData.validationWarnings = validationErrors;
        }
      }

      // 8. 应用调度建议（如果启用自动应用）
      let appliedChanges = [];
      if (options.autoApply && scheduleData.recommendations?.taskAdjustments) {
        appliedChanges = await this.applyScheduleAdjustments(
          userId,
          scheduleData.recommendations.taskAdjustments,
          targetDate
        );
        logger.info('自动应用调度建议完成', { 
          appliedCount: appliedChanges.filter(c => c.success).length,
          failedCount: appliedChanges.filter(c => !c.success).length
        });
      }

      const processingTime = Date.now() - startTime;
      logger.info('任务调度规划完成', {
        userId,
        targetDate,
        processingTime: `${processingTime}ms`,
        success: true
      });

      return {
        success: true,
        data: {
          analysis: scheduleData.analysis,
          recommendations: scheduleData.recommendations,
          schedule: scheduleData.schedule,
          summary: scheduleData.summary,
          appliedChanges: appliedChanges,
          metadata: {
            currentTime,
            targetDate,
            existingTaskCount: existingTasks.length,
            collectionCount: collections.length,
            userContext,
            autoApplied: options.autoApply || false,
            processingTime
          }
        }
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      logger.error('任务调度规划失败', {
        userId,
        targetDate,
        error: error.message,
        stack: error.stack,
        processingTime: `${processingTime}ms`
      });
      throw error;
    }
  }

  /**
   * 获取用户任务
   * @param {string} userId - 用户ID
   * @param {string} targetDate - 目标日期
   * @returns {Promise<Array>} 任务列表
   */
  async getUserTasks(userId, targetDate) {
    try {
      // 获取目标日期的任务
      const query = {
        userId,
        completed: false, // 只获取未完成的任务
        $or: [
          { date: targetDate }, // 指定日期的任务
          { date: { $exists: false } }, // 未设定日期的任务
          { date: null },
          { date: '' }
        ]
      };

      const tasks = await Task.find(query)
        .populate('collectionId', 'name color')
        .sort({ 
          quadrant: 1, // 按象限排序，重要紧急优先
          priority: 1, // 按优先级排序
          'timeBlock.startTime': 1, // 按开始时间排序
          createdAt: 1 
        })
        .lean();

      return tasks;
    } catch (error) {
      logger.error('获取用户任务失败', { userId, targetDate, error: error.message });
      throw error;
    }
  }

  /**
   * 获取用户任务集
   * @param {string} userId - 用户ID
   * @returns {Promise<Array>} 任务集列表
   */
  async getUserCollections(userId) {
    try {
      const collections = await Collection.find({
        userId,
        archived: false
      })
      .populate({
        path: 'subtasks',
        match: { completed: false },
        select: 'title priority quadrant estimatedTime'
      })
      .lean();

      return collections;
    } catch (error) {
      logger.error('获取用户任务集失败', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * 调用通义千问API进行调度分析
   * @param {Array} messages - 消息数组
   * @returns {Promise<Object>} API响应
   */
  async callQwenAPI(messages) {
    try {
      const requestData = {
        model: this.model,
        messages: messages,
        temperature: 0.3, // 调度需要相对确定的结果
        max_tokens: 2000, // 调度建议可能比较长
        stream: false
      };

      logger.info('调用通义千问API进行调度分析', {
        url: `${this.baseURL}/chat/completions`,
        model: this.model,
        messagesCount: messages.length,
        temperature: requestData.temperature
      });

      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 45000 // 45秒超时，调度分析可能需要更长时间
        }
      );

      logger.info('通义千问API调用成功 (调度分析)', {
        status: response.status,
        usage: response.data.usage,
        model: response.data.model
      });

      if (!response.data.choices || response.data.choices.length === 0) {
        throw new Error('API响应中没有choices数据');
      }

      return {
        content: response.data.choices[0].message.content,
        metadata: {
          model: response.data.model,
          tokenUsage: response.data.usage
        }
      };

    } catch (error) {
      logger.error('通义千问API调用失败 (调度分析)', {
        error: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });

      if (error.response?.status === 401) {
        throw new Error('API密钥无效或已过期');
      } else if (error.response?.status === 429) {
        throw new Error('API调用频率超限，请稍后重试');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('API调用超时，请检查网络连接');
      } else {
        throw new Error(`API调用失败: ${error.message}`);
      }
    }
  }

  /**
   * 应用调度建议到数据库
   * @param {string} userId - 用户ID
   * @param {Array} adjustments - 调度调整建议
   * @param {string} targetDate - 目标日期，用于设置任务的默认日期
   * @returns {Promise<Array>} 应用结果
   */
  async applyScheduleAdjustments(userId, adjustments, targetDate) {
    const results = [];

    for (const adjustment of adjustments) {
      try {
        let result = { 
          adjustment, 
          success: false, 
          error: null,
          data: null
        };

        switch (adjustment.action) {
          case 'create':
            // 确保任务有日期字段，如果没有则使用targetDate
            if (!adjustment.changes.date && targetDate) {
              adjustment.changes.date = targetDate;
            }
            result.data = await this.createTask(userId, adjustment.changes, targetDate);
            result.success = true;
            logger.info('创建新任务成功', { userId, taskId: result.data._id });
            break;

          case 'update':
          case 'reschedule':
            // 确保任务有日期字段，如果没有则使用targetDate
            if (!adjustment.changes.date && targetDate) {
              adjustment.changes.date = targetDate;
            }
            result.data = await this.updateTask(userId, adjustment.taskId, adjustment.changes, targetDate);
            result.success = true;
            logger.info('更新任务成功', { userId, taskId: adjustment.taskId });
            break;

          case 'delete':
            await this.deleteTask(userId, adjustment.taskId);
            result.success = true;
            logger.info('删除任务成功', { userId, taskId: adjustment.taskId });
            break;

          default:
            result.error = `不支持的操作类型: ${adjustment.action}`;
            logger.warn('不支持的调度操作', { action: adjustment.action });
        }

        results.push(result);

      } catch (error) {
        logger.error('应用调度调整失败', {
          userId,
          adjustment,
          error: error.message
        });
        
        results.push({
          adjustment,
          success: false,
          error: error.message,
          data: null
        });
      }
    }

    return results;
  }

  /**
   * 创建新任务
   * @param {string} userId - 用户ID
   * @param {Object} taskData - 任务数据
   * @param {string} targetDate - 目标日期，用于设置任务的默认日期
   * @returns {Promise<Object>} 创建的任务
   */
  async createTask(userId, taskData, targetDate) {
    // 确保任务有日期字段，如果没有则使用targetDate或当前日期
    if (!taskData.date) {
      taskData.date = targetDate || new Date().toISOString().split('T')[0];
    }
    
    const task = new Task({
      ...taskData,
      userId,
      isScheduled: !!(taskData.timeBlock?.startTime)
    });
    
    return await task.save();
  }

  /**
   * 更新任务
   * @param {string} userId - 用户ID
   * @param {string} taskId - 任务ID
   * @param {Object} updateData - 更新数据
   * @param {string} targetDate - 目标日期，用于设置任务的默认日期
   * @returns {Promise<Object>} 更新后的任务
   */
  async updateTask(userId, taskId, updateData, targetDate) {
    // 设置isScheduled字段
    if (updateData.timeBlock?.startTime) {
      updateData.isScheduled = true;
    }
    
    // 确保任务有日期字段，如果没有则使用targetDate或当前日期
    if (!updateData.date) {
      updateData.date = targetDate || new Date().toISOString().split('T')[0];
    }

    const updatedTask = await Task.findOneAndUpdate(
      { _id: taskId, userId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedTask) {
      throw new Error(`任务不存在或无权限: ${taskId}`);
    }

    return updatedTask;
  }

  /**
   * 删除任务
   * @param {string} userId - 用户ID
   * @param {string} taskId - 任务ID
   * @returns {Promise<Object>} 删除结果
   */
  async deleteTask(userId, taskId) {
    const deletedTask = await Task.findOneAndDelete({
      _id: taskId,
      userId
    });

    if (!deletedTask) {
      throw new Error(`任务不存在或无权限: ${taskId}`);
    }

    return deletedTask;
  }

  /**
   * 分析任务冲突
   * @param {Array} tasks - 任务列表
   * @param {string} targetDate - 目标日期
   * @returns {Array} 冲突列表
   */
  analyzeTimeConflicts(tasks, targetDate) {
    const conflicts = [];
    const scheduledTasks = tasks.filter(task => 
      task.date === targetDate && 
      task.timeBlock?.startTime && 
      task.timeBlock?.endTime
    );

    // 按开始时间排序
    scheduledTasks.sort((a, b) => 
      a.timeBlock.startTime.localeCompare(b.timeBlock.startTime)
    );

    for (let i = 0; i < scheduledTasks.length - 1; i++) {
      const currentTask = scheduledTasks[i];
      const nextTask = scheduledTasks[i + 1];

      if (currentTask.timeBlock.endTime > nextTask.timeBlock.startTime) {
        conflicts.push({
          task1: currentTask,
          task2: nextTask,
          type: 'overlap',
          description: `任务"${currentTask.title}"与"${nextTask.title}"时间重叠`
        });
      }
    }

    return conflicts;
  }

  /**
   * 生成时间建议
   * @param {string} targetDate - 目标日期
   * @param {number} estimatedTime - 预计时间（分钟）
   * @param {string} preferredTimeBlock - 偏好时间块
   * @param {Array} existingTasks - 现有任务
   * @returns {Object} 时间建议
   */
  suggestTimeSlot(targetDate, estimatedTime, preferredTimeBlock, existingTasks) {
    const timeBlockRange = getTimeBlockRange(preferredTimeBlock);
    const occupiedSlots = this.getOccupiedTimeSlots(existingTasks, targetDate);
    
    // 在偏好时间块内寻找空闲时间
    const availableSlot = this.findAvailableSlot(
      timeBlockRange.start,
      timeBlockRange.end,
      estimatedTime,
      occupiedSlots
    );

    return availableSlot || {
      timeBlockType: 'unscheduled',
      startTime: null,
      endTime: null,
      reason: '指定时间块内无可用时间段'
    };
  }

  /**
   * 获取已占用的时间段
   * @param {Array} tasks - 任务列表
   * @param {string} targetDate - 目标日期
   * @returns {Array} 已占用时间段
   */
  getOccupiedTimeSlots(tasks, targetDate) {
    return tasks
      .filter(task => 
        task.date === targetDate && 
        task.timeBlock?.startTime && 
        task.timeBlock?.endTime
      )
      .map(task => ({
        startTime: task.timeBlock.startTime,
        endTime: task.timeBlock.endTime,
        taskId: task._id,
        title: task.title
      }))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  /**
   * 寻找可用时间段
   * @param {string} rangeStart - 范围开始时间
   * @param {string} rangeEnd - 范围结束时间
   * @param {number} duration - 所需时长（分钟）
   * @param {Array} occupiedSlots - 已占用时间段
   * @returns {Object|null} 可用时间段
   */
  findAvailableSlot(rangeStart, rangeEnd, duration, occupiedSlots) {
    const durationMs = duration * 60 * 1000;
    const startMs = this.timeToMs(rangeStart);
    const endMs = this.timeToMs(rangeEnd);

    if (occupiedSlots.length === 0) {
      // 没有已占用时间段，直接返回范围开始时间
      const slotEndMs = startMs + durationMs;
      if (slotEndMs <= endMs) {
        return {
          startTime: rangeStart,
          endTime: this.msToTime(slotEndMs),
          timeBlockType: this.getTimeBlockTypeByTime(rangeStart)
        };
      }
      return null;
    }

    // 检查第一个任务之前的时间
    const firstSlotStartMs = this.timeToMs(occupiedSlots[0].startTime);
    if (firstSlotStartMs - startMs >= durationMs) {
      return {
        startTime: rangeStart,
        endTime: this.msToTime(startMs + durationMs),
        timeBlockType: this.getTimeBlockTypeByTime(rangeStart)
      };
    }

    // 检查任务之间的间隙
    for (let i = 0; i < occupiedSlots.length - 1; i++) {
      const currentEndMs = this.timeToMs(occupiedSlots[i].endTime);
      const nextStartMs = this.timeToMs(occupiedSlots[i + 1].startTime);
      
      if (nextStartMs - currentEndMs >= durationMs) {
        const slotStartTime = this.msToTime(currentEndMs);
        const slotEndTime = this.msToTime(currentEndMs + durationMs);
        return {
          startTime: slotStartTime,
          endTime: slotEndTime,
          timeBlockType: this.getTimeBlockTypeByTime(slotStartTime)
        };
      }
    }

    // 检查最后一个任务之后的时间
    const lastSlotEndMs = this.timeToMs(occupiedSlots[occupiedSlots.length - 1].endTime);
    if (endMs - lastSlotEndMs >= durationMs) {
      const slotStartTime = this.msToTime(lastSlotEndMs);
      const slotEndTime = this.msToTime(lastSlotEndMs + durationMs);
      return {
        startTime: slotStartTime,
        endTime: slotEndTime,
        timeBlockType: this.getTimeBlockTypeByTime(slotStartTime)
      };
    }

    return null;
  }

  /**
   * 时间字符串转毫秒
   * @param {string} timeStr - 时间字符串 (HH:MM)
   * @returns {number} 毫秒数
   */
  timeToMs(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return (hours * 60 + minutes) * 60 * 1000;
  }

  /**
   * 毫秒转时间字符串
   * @param {number} ms - 毫秒数
   * @returns {string} 时间字符串 (HH:MM)
   */
  msToTime(ms) {
    const totalMinutes = Math.floor(ms / (60 * 1000));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  /**
   * 根据时间获取时间块类型
   * @param {string} timeStr - 时间字符串 (HH:MM)
   * @returns {string} 时间块类型
   */
  getTimeBlockTypeByTime(timeStr) {
    const hour = parseInt(timeStr.split(':')[0]);
    
    if (hour >= 6 && hour < 9) return TIME_BLOCK_TYPES.MORNING;
    if (hour >= 9 && hour < 12) return TIME_BLOCK_TYPES.FORENOON;
    if (hour >= 12 && hour < 18) return TIME_BLOCK_TYPES.AFTERNOON;
    if (hour >= 18 && hour < 22) return TIME_BLOCK_TYPES.EVENING;
    
    return TIME_BLOCK_TYPES.UNSCHEDULED;
  }

  /**
   * 获取服务统计信息
   * @returns {Object} 统计信息
   */
  getServiceStats() {
    const memoryUsage = process.memoryUsage();
    return {
      service: 'schedule-planning',
      version: '1.0.0',
      uptime: process.uptime(),
      memory: {
        rss: memoryUsage.rss,
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed,
        external: memoryUsage.external,
        arrayBuffers: memoryUsage.arrayBuffers
      },
      supportedTimeBlocks: Object.keys(TIME_BLOCK_TYPES).length,
      supportedPriorities: Object.keys(PRIORITY_TYPES).length,
      supportedQuadrants: Object.keys(QUADRANT_TYPES).length,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 执行健康检查
   * @returns {Promise<Object>} 健康检查结果
   */
  async healthCheck() {
    const testMessages = [
      {
        role: 'system',
        content: '你是一个任务调度助手，请回复"服务正常"'
      },
      {
        role: 'user',
        content: '检查服务状态'
      }
    ];

    const startTime = Date.now();
    try {
      const result = await this.callQwenAPI(testMessages);
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'healthy',
        model: this.model,
        responseTime: responseTime,
        timestamp: new Date().toISOString(),
        testResponse: result.content
      };
    } catch (error) {
      logger.error('任务调度服务健康检查失败', { error: error.message });
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = SchedulePlanningService;
