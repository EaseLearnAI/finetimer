'use strict';

const TaskRecognitionService = require('../services/taskRecognitionService');
const logger = require('../utils/logger');

/**
 * 任务识别控制器
 * 处理任务识别相关的HTTP请求
 */
class TaskRecognitionController {
  constructor() {
    this.taskRecognitionService = new TaskRecognitionService();
  }

  /**
   * 识别并存储任务
   * POST /api/aisiri/tasks/recognize
   * @param {Object} req Express请求对象
   * @param {Object} res Express响应对象
   */
  recognizeAndStoreTask = async (req, res) => {
    const startTime = Date.now();
    
    try {
      // 获取请求数据
      const { userInput } = req.body;
      const userId = req.user._id;
      
      logger.info('收到任务识别请求', { 
        userId, 
        userInput,
        timestamp: new Date().toISOString()
      });

      // 验证输入
      if (!userInput || typeof userInput !== 'string') {
        logger.warn('任务识别请求缺少用户输入', { userId });
        
        return res.status(400).json({
          success: false,
          message: '用户输入不能为空'
        });
      }

      // 调用任务识别服务
      const result = await this.taskRecognitionService.recognizeAndStoreTask(userInput, userId);
      
      const processingTime = Date.now() - startTime;
      logger.info('任务识别请求处理完成', {
        userId,
        processingTime: processingTime + 'ms'
      });

      // 返回结果
      return res.status(200).json({
        success: true,
        message: '任务识别完成',
        data: result,
        processingTime
      });

    } catch (error) {
      const processingTime = Date.now() - startTime;
      logger.error('任务识别请求处理失败', {
        error: error.message,
        userId,
        processingTime: processingTime + 'ms'
      });
      
      return res.status(500).json({
        success: false,
        message: '任务识别失败',
        error: error.message
      });
    }
  };

  /**
   * 批量识别并存储任务
   * POST /api/aisiri/tasks/recognize/batch
   * @param {Object} req Express请求对象
   * @param {Object} res Express响应对象
   */
  recognizeAndStoreTasksBatch = async (req, res) => {
    const startTime = Date.now();
    
    try {
      // 获取请求数据
      const { userInputs } = req.body;
      const userId = req.user._id;
      
      logger.info('收到批量任务识别请求', { 
        userId, 
        inputCount: userInputs ? userInputs.length : 0,
        timestamp: new Date().toISOString()
      });

      // 验证输入
      if (!Array.isArray(userInputs)) {
        logger.warn('批量任务识别请求缺少用户输入数组', { userId });
        
        return res.status(400).json({
          success: false,
          message: '用户输入必须是数组'
        });
      }

      // 批量处理
      const results = [];
      const errors = [];
      
      for (let i = 0; i < userInputs.length; i++) {
        const input = userInputs[i];
        
        try {
          const result = await this.taskRecognitionService.recognizeAndStoreTask(input, userId);
          results.push({
            index: i,
            input,
            result
          });
        } catch (error) {
          errors.push({
            index: i,
            input,
            error: error.message
          });
        }
      }
      
      const processingTime = Date.now() - startTime;
      logger.info('批量任务识别请求处理完成', {
        userId,
        successCount: results.length,
        errorCount: errors.length,
        processingTime: processingTime + 'ms'
      });

      // 返回结果
      return res.status(200).json({
        success: true,
        message: '批量任务识别完成',
        data: {
          results,
          errors
        },
        processingTime
      });

    } catch (error) {
      const processingTime = Date.now() - startTime;
      logger.error('批量任务识别请求处理失败', {
        error: error.message,
        userId,
        processingTime: processingTime + 'ms'
      });
      
      return res.status(500).json({
        success: false,
        message: '批量任务识别失败',
        error: error.message
      });
    }
  };
}

module.exports = new TaskRecognitionController();