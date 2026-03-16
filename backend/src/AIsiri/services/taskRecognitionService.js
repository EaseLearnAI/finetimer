'use strict';

const IntentRecognitionService = require('./intentRecognitionService');
const Task = require('../../models/Task');
const Collection = require('../../models/Collection');
const logger = require('../utils/logger');

/**
 * 任务识别服务
 * 基于意图识别服务，专门处理任务创建意图
 */
class TaskRecognitionService {
  constructor() {
    this.intentService = new IntentRecognitionService();
  }

  /**
   * 识别并存储任务
   * @param {string} userInput 用户输入
   * @param {string} userId 用户ID
   * @param {Object} timeInfo 时间信息（可选）
   * @returns {Promise<Object>} 任务存储结果
   */
  async recognizeAndStoreTask(userInput, userId, timeInfo = {}) {
    const startTime = Date.now();
    logger.info('开始任务识别和存储', { 
      userInput, 
      userId,
      timestamp: new Date().toISOString()
    });

    try {
      // 1. 进行意图识别
      const intentResult = await this.intentService.recognizeIntent(userInput);
      
      logger.info('意图识别完成', {
        intent: intentResult.intent,
        confidence: intentResult.confidence
      });

      // 2. 检查是否为任务创建意图
      if (intentResult.intent !== 'TASK_CREATION') {
        logger.info('非任务创建意图，跳过任务存储', { 
          intent: intentResult.intent 
        });
        
        return {
          success: true,
          message: '输入不是任务创建意图，无需存储',
          intentResult
        };
      }

      // 3. 提取任务信息
      const taskInfo = this.extractTaskInfo(intentResult, userId, timeInfo);
      
      logger.info('提取任务信息完成', { taskInfo });

      // 4. 存储任务
      const task = await this.storeTask(taskInfo);
      
      const processingTime = Date.now() - startTime;
      logger.info('任务存储成功', {
        taskId: task._id,
        title: task.title,
        processingTime: processingTime + 'ms'
      });

      return {
        success: true,
        message: '任务创建成功',
        task,
        intentResult,
        processingTime
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      logger.error('任务识别和存储失败', {
        error: error.message,
        userInput,
        processingTime: processingTime + 'ms'
      });
      
      throw error;
    }
  }

  /**
   * 直接创建任务（已确定为任务创建意图）
   * @param {string} userInput 用户输入
   * @param {string} userId 用户ID
   * @param {Object} timeInfo 时间信息（可选）
   * @returns {Promise<Object>} 任务存储结果
   */
  async createTaskDirectly(userInput, userId, timeInfo = {}) {
    const startTime = Date.now();
    logger.info('开始直接创建任务', { 
      userInput, 
      userId,
      timeInfo,
      timestamp: new Date().toISOString()
    });

    try {
      // 1. 进行意图识别以提取任务信息
      const intentResult = await this.intentService.recognizeIntent(userInput);
      
      logger.info('意图识别完成（用于信息提取）', {
        intent: intentResult.intent,
        confidence: intentResult.confidence
      });

      // 2. 强制将意图设置为TASK_CREATION（因为Action Router已经确定了）
      intentResult.intent = 'TASK_CREATION';
      intentResult.confidence = Math.max(intentResult.confidence, 0.8); // 确保置信度足够高
      
      logger.info('强制设置为任务创建意图', {
        intent: intentResult.intent,
        confidence: intentResult.confidence
      });

      // 3. 提取任务信息
      const taskInfo = this.extractTaskInfo(intentResult, userId, timeInfo);
      
      logger.info('提取任务信息完成', { taskInfo });

      // 4. 存储任务
      const task = await this.storeTask(taskInfo);
      
      const processingTime = Date.now() - startTime;
      logger.info('任务直接创建成功', {
        taskId: task._id,
        title: task.title,
        processingTime: processingTime + 'ms'
      });

      return {
        success: true,
        message: '任务创建成功',
        task,
        intentResult,
        processingTime
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      logger.error('任务直接创建失败', {
        error: error.message,
        userInput,
        processingTime: processingTime + 'ms'
      });
      
      throw error;
    }
  }

  /**
   * 从意图识别结果中提取任务信息
   * @param {Object} intentResult 意图识别结果
   * @param {string} userId 用户ID
   * @param {Object} timeInfo 时间信息（可选）
   * @returns {Object} 任务信息
   */
  extractTaskInfo(intentResult, userId, timeInfo = {}) {
    const { extracted_info } = intentResult;
    
    // 根据timeInfo设置默认时间块
    let defaultTimeBlock = {
      startTime: '14:00',
      endTime: '18:00',
      timeBlockType: 'afternoon'
    };
    
    // 如果传入了时间信息，使用传入的时间信息
    if (timeInfo.timeOfDay) {
      switch (timeInfo.timeOfDay) {
        case 'morning':
        case '早上':
        case '上午':
          defaultTimeBlock = {
            startTime: '08:00',
            endTime: '12:00',
            timeBlockType: 'morning'
          };
          break;
        case 'afternoon':
        case '下午':
          defaultTimeBlock = {
            startTime: '14:00',
            endTime: '18:00',
            timeBlockType: 'afternoon'
          };
          break;
        case 'evening':
        case '晚上':
          defaultTimeBlock = {
            startTime: '18:00',
            endTime: '22:00',
            timeBlockType: 'evening'
          };
          break;
        case 'night':
        case '深夜':
          defaultTimeBlock = {
            startTime: '22:00',
            endTime: '02:00',
            timeBlockType: 'night'
          };
          break;
      }
    }
    
    const taskInfo = {
      title: this.extractTaskTitleFromInput(intentResult.original_input),
      userId: userId,
      timeBlock: defaultTimeBlock
    };
    
    // 如果timeInfo中有具体的时间，优先使用
    if (timeInfo.startTime && timeInfo.endTime) {
      taskInfo.timeBlock.startTime = timeInfo.startTime;
      taskInfo.timeBlock.endTime = timeInfo.endTime;
    }
    
    // 如果timeInfo中有日期信息，添加到任务中
    if (timeInfo.date) {
      taskInfo.date = timeInfo.date; // 直接设置为date字段，而不是targetDate
    }

    // 如果有提取到任务内容，则使用提取的内容作为标题
    if (extracted_info.entities && extracted_info.entities.task) {
      let extractedTask;
      // 确保任务标题是字符串，如果是数组则取第一个元素
      if (Array.isArray(extracted_info.entities.task)) {
        extractedTask = extracted_info.entities.task[0] || taskInfo.title;
      } else {
        extractedTask = extracted_info.entities.task;
      }
      // 进一步清理提取的任务标题
      taskInfo.title = this.extractTaskTitleFromInput(extractedTask);
    }

    // 如果有提取到时间实体，则更新时间块（保持向后兼容）
    if (extracted_info.entities && extracted_info.entities.time && !timeInfo.timeOfDay) {
      const timeEntity = extracted_info.entities.time;
      
      // 解析具体时间（如"上午10点"、"下午3点半"、"10:00"等）
      let specificTimeMatch = timeEntity.match(/(\d{1,2})[点时:：](\d{0,2})?/);
      let minute = 0;
      
      // 处理"半"的情况（如"3点半"）
      if (timeEntity.includes('半')) {
        minute = 30;
        specificTimeMatch = timeEntity.match(/(\d{1,2})[点时]/);
      }
      
      if (specificTimeMatch) {
        let hour = parseInt(specificTimeMatch[1]);
        
        // 如果没有处理"半"，则从正则匹配中获取分钟
        if (!timeEntity.includes('半')) {
          minute = specificTimeMatch[2] ? parseInt(specificTimeMatch[2]) : 0;
        }
        
        // 处理12小时制转24小时制
        if (timeEntity.includes('下午') || timeEntity.includes('晚上')) {
          if (hour < 12) hour += 12;
        } else if (timeEntity.includes('上午') || timeEntity.includes('早上')) {
          if (hour === 12) hour = 0;
        }
        
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const endHour = hour + 1; // 默认1小时时长
        const endTimeStr = `${endHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        
        taskInfo.timeBlock = {
          startTime: timeStr,
          endTime: endTimeStr,
          timeBlockType: this.getTimeBlockType(hour)
        };
        
        logger.info('解析到具体时间', {
          originalTime: timeEntity,
          parsedTime: timeStr,
          timeBlock: taskInfo.timeBlock
        });
      } else {
        // 原有的时间段解析逻辑
        if (timeEntity.includes('早上') || timeEntity.includes('上午')) {
          taskInfo.timeBlock = {
            startTime: '08:00',
            endTime: '12:00',
            timeBlockType: 'morning'
          };
        } else if (timeEntity.includes('下午')) {
          taskInfo.timeBlock = {
            startTime: '14:00',
            endTime: '18:00',
            timeBlockType: 'afternoon'
          };
        } else if (timeEntity.includes('晚上')) {
          taskInfo.timeBlock = {
            startTime: '18:00',
            endTime: '22:00',
            timeBlockType: 'evening'
          };
        }
      }
    }
    
    logger.info('提取任务信息完成', {
      title: taskInfo.title,
      timeBlock: taskInfo.timeBlock,
      date: taskInfo.date,
      timeInfoInput: timeInfo
    });

    return taskInfo;
  }

  /**
   * 从用户输入中提取核心任务标题
   * @param {string} userInput 用户输入
   * @returns {string} 提取的任务标题
   */
  extractTaskTitleFromInput(userInput) {
    if (!userInput || typeof userInput !== 'string') {
      return userInput;
    }

    let title = userInput.trim();
    
    // 定义常见的任务关键词
    const taskKeywords = [
      '会议', '开会', '讨论', '汇报', '报告', '演示', '展示',
      '学习', '复习', '预习', '背书', '练习', '作业', '考试',
      '写作', '编程', '开发', '设计', '画图', '制作',
      '购物', '买菜', '采购', '逛街',
      '运动', '跑步', '健身', '游泳', '瑜伽',
      '吃饭', '用餐', '聚餐', '约饭',
      '看电影', '看书', '阅读', '听音乐',
      '打电话', '联系', '沟通', '交流',
      '整理', '清洁', '打扫', '收拾',
      '旅行', '出差', '出游', '度假'
    ];

    // 移除常见的前缀词汇
    title = title.replace(/^(我要|我需要|需要|要|今天|明天|后天|下周|下个月|记得|别忘了|提醒我|帮我|给我|安排|计划)\s*/g, '');
    
    // 移除常见的后缀词汇
    title = title.replace(/\s*(的事情|的任务|这件事|一下|了|啊|呢|吧|哦|嗯)$/g, '');
    
    // 移除修饰词
    title = title.replace(/(很|非常|特别|比较|相当|十分|极其|超级)\s*/g, '');
    title = title.replace(/(重要的?|紧急的?|关键的?|主要的?|核心的?)\s*/g, '');
    
    // 移除量词和指示词
    title = title.replace(/还有个?|有个?/g, '');
    title = title.replace(/个?$/g, ''); // 移除末尾的"个"
    title = title.trim();
    
    // 如果清理后的标题仍然包含任务关键词，提取关键词
    for (const keyword of taskKeywords) {
      if (title.includes(keyword)) {
        return keyword;
      }
    }
    
    return title || userInput; // 如果都失败了，返回原输入
  }

  /**
   * 根据小时数确定时间块类型
   * @param {number} hour 小时数（24小时制）
   * @returns {string} 时间块类型
   */
  getTimeBlockType(hour) {
    if (hour >= 6 && hour < 12) {
      return 'morning';
    } else if (hour >= 12 && hour < 18) {
      return 'afternoon';
    } else if (hour >= 18 && hour < 22) {
      return 'evening';
    } else {
      return 'night';
    }
  }

  /**
   * 存储任务到数据库
   * @param {Object} taskInfo 任务信息
   * @returns {Promise<Object>} 存储的任务
   */
  async storeTask(taskInfo) {
    try {
      logger.info('开始存储任务到数据库', { taskInfo });
      
      // 创建任务实例
      const task = new Task(taskInfo);
      
      // 保存到数据库
      const savedTask = await task.save();
      
      // 查询新创建的任务（包含可能的关联数据）
      const populatedTask = await Task.findById(savedTask._id);
      
      logger.info('任务存储成功', { taskId: savedTask._id });
      
      return populatedTask;
    } catch (error) {
      logger.error('任务存储失败', { 
        error: error.message, 
        taskInfo 
      });
      
      throw error;
    }
  }
}

module.exports = TaskRecognitionService;