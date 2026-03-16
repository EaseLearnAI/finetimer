/**
 * 智能调度服务
 * 整合多个AI服务，实现真正的智能调度
 */

const IntentRecognitionService = require('./intentRecognitionService');
const ConversationService = require('./conversationService');
const TaskRecognitionService = require('./taskRecognitionService');
const SchedulePlanningService = require('./schedulePlanningService');
const AIAssistant = require('../../models/AIAssistant');
const gaodeMcpClient = require('./gaodeMcpClient');
const logger = require('../utils/logger');

// 添加图片分析服务
const { analyzeImageWithQwen } = require('../../AIvoice/services/imageAnalysisService');

/**
 * 智能调度服务类
 */
class IntelligentDispatchService {
  constructor() {
    // 初始化各个服务
    this.intentService = new IntentRecognitionService();
    this.conversationService = new ConversationService();
    this.taskService = new TaskRecognitionService();
    this.scheduleService = new SchedulePlanningService();
    
    logger.info('智能调度服务初始化完成', {
      services: ['intentRecognition', 'conversation', 'taskRecognition', 'schedulePlanning']
    });
  }

  /**
   * 检测输入是否包含图片
   * @param {string} userInput 用户输入
   * @returns {Object} 检测结果
   */
  detectImageInput(userInput) {
    // 检测图片相关的关键词和表情符号
    const imagePatterns = [
      /🖼️|📷|🖼|📸|🖼️|📱|💻|🖥️/, // 图片相关表情
      /图片|照片|截图|image|photo|screenshot/i, // 图片相关词汇
      /\.(jpg|jpeg|png|gif|bmp|webp)$/i, // 图片文件扩展名
      /\([0-9.]+ MB\)/, // 文件大小信息
      /[0-9]{13}-[a-zA-Z]+-[0-9]+\.(jpg|jpeg|png|gif|bmp|webp)/i // 上传的文件名格式
    ];
    
    const hasImage = imagePatterns.some(pattern => pattern.test(userInput));
    
    return {
      hasImage,
      patterns: imagePatterns.map(pattern => pattern.source),
      detected: hasImage
    };
  }

  /**
   * 分析图片内容
   * @param {string} userInput 用户输入
   * @returns {Promise<Object>} 图片分析结果
   */
  async analyzeImageContent(userInput) {
    try {
      // 提取图片URL（这里需要根据实际情况调整）
      // 假设图片已经上传到服务器，URL在userInput中
      const imageUrl = this.extractImageUrl(userInput);
      
      if (!imageUrl) {
        return {
          success: false,
          error: '无法提取图片URL'
        };
      }

      // 调用图片分析服务
      const analysisResult = await analyzeImageWithQwen(
        imageUrl, 
        '请详细描述这张图片的内容，包括主要元素、场景、文字、颜色等信息'
      );

      return {
        success: true,
        imageUrl,
        analysis: analysisResult.content,
        usage: analysisResult.usage
      };
    } catch (error) {
      logger.error('图片分析失败', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 提取图片URL
   * @param {string} userInput 用户输入
   * @returns {string|null} 图片URL
   */
  extractImageUrl(userInput) {
    try {
      // 从用户输入中提取文件名
      const fileNameMatch = userInput.match(/([0-9]{13}-[a-zA-Z]+-[0-9]+\.(jpg|jpeg|png|gif|bmp|webp))/i);
      
      if (fileNameMatch) {
        const fileName = fileNameMatch[1];
        
        // 从环境变量获取OSS配置
        const ossRegion = process.env.OSS_REGION || 'oss-cn-hangzhou';
        const ossBucket = process.env.OSS_BUCKET || 'vitebucket';
        
        // 构建OSS URL
        const ossUrl = `https://${ossBucket}.${ossRegion}.aliyuncs.com/images/${fileName}`;
        
        logger.info('提取到图片URL', { fileName, ossUrl });
        return ossUrl;
      }
      
      return null;
    } catch (error) {
      logger.error('提取图片URL失败', { error: error.message });
      return null;
    }
  }

  /**
   * 处理用户输入的智能调度
   * @param {string} userInput 用户输入
   * @param {string} userId 用户ID
   * @param {string} sessionId 会话ID
   * @param {Object} deviceInfo 设备信息
   * @returns {Promise<Object>} 调度结果
   */
  async processUserInput(userInput, userId, sessionId = null, deviceInfo = {}) {
    const startTime = Date.now();
    const requestId = `dispatch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    logger.info('开始智能调度处理', {
      requestId,
      userInput: userInput.substring(0, 100) + (userInput.length > 100 ? '...' : ''),
      userId,
      sessionId,
      inputLength: userInput.length
    });

    try {
      // 步骤0: 检测和处理图片输入
      logger.info('步骤0: 检测图片输入', { requestId });
      const imageDetection = this.detectImageInput(userInput);
      
      let imageContext = '';
      if (imageDetection.hasImage) {
        logger.info('检测到图片输入，开始分析图片内容', { requestId });
        const imageAnalysis = await this.analyzeImageContent(userInput);
        
        if (imageAnalysis.success) {
          imageContext = `\n\n[图片内容分析结果：${imageAnalysis.analysis}]\n\n`;
          logger.info('图片分析成功，已获取图片内容', { 
            requestId, 
            imageUrl: imageAnalysis.imageUrl,
            analysisLength: imageAnalysis.analysis.length 
          });
        } else {
          logger.warn('图片分析失败', { requestId, error: imageAnalysis.error });
        }
      }

      // 步骤1: 执行意图识别（包含图片上下文）
      logger.info('步骤1: 执行意图识别', { requestId });
      const enhancedInput = imageContext ? userInput + imageContext : userInput;
      const intentResult = await this.intentService.recognizeIntent(enhancedInput);
      
      logger.info('意图识别完成', {
        requestId,
        intent: intentResult.intent,
        confidence: intentResult.confidence,
        hasImageContext: !!imageContext
      });

      // 步骤2: 分析多重意图
      logger.info('步骤2: 分析多重意图', { requestId });
      const multipleIntents = await this.analyzeMultipleIntents(userInput, intentResult);
      
      logger.info('多重意图分析完成', {
        requestId,
        intents: multipleIntents.map(i => i.intent),
        count: multipleIntents.length
      });

      // 步骤3: 执行相应的服务
      logger.info('步骤3: 执行相应的服务', { requestId });
      const executionResults = await this.executeServices(userInput, multipleIntents, userId, sessionId);
      
      logger.info('服务执行完成', {
        requestId,
        servicesExecuted: Object.keys(executionResults),
        successCount: Object.values(executionResults).filter(r => r.success).length
      });

      // 步骤4: 生成统一回复
      logger.info('步骤4: 生成统一回复', { requestId });
      const unifiedResponse = await this.generateUnifiedResponse(userInput, multipleIntents, executionResults, userId);
      
      logger.info('回复生成完成', {
        requestId,
        responseLength: unifiedResponse.length
      });

      // 步骤5: 构建最终结果
      const result = this.buildFinalResult(userInput, multipleIntents, executionResults, unifiedResponse);
      
      const processingTime = Date.now() - startTime;
      logger.info('智能调度处理完成', {
        requestId,
        userId,
        processingTime: processingTime + 'ms',
        responseLength: result.response.length,
        servicesExecuted: result.servicesExecuted
      });

      return {
        ...result,
        processingTime,
        requestId
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      logger.error('智能调度处理失败', {
        requestId,
        error: error.message,
        stack: error.stack,
        userId,
        processingTime: processingTime + 'ms'
      });
      
      // 返回错误响应
      throw error;
    }
  }

  /**
   * Action Router - 决定调用哪些功能模块及其顺序
   * @param {string} userInput 用户输入
   * @param {Object} primaryIntent 主要意图
   * @returns {Promise<Array>} 按执行顺序排列的意图列表
   */
  async analyzeMultipleIntents(userInput, primaryIntent) {
    const input = userInput.toLowerCase();
    const actionPlan = [];
    
    // 检测是否包含任务创建意图
    const hasTaskCreation = this.detectTaskCreation(input, primaryIntent);
    // 检测是否包含时间调度意图
    const hasSchedulePlanning = this.detectSchedulePlanning(input, primaryIntent);
    // 检测是否包含外部工具调用意图
    const hasExternalTool = this.detectExternalTool(input, primaryIntent);
    // 检测是否包含对话意图
    const hasConversation = this.detectConversation(input, primaryIntent);

    // Action Router 逻辑：确定执行顺序
    // 1. 优先执行任务创建（如果需要）
    if (hasTaskCreation) {
      actionPlan.push({
        intent: 'TASK_CREATION',
        confidence: hasTaskCreation.confidence,
        reasoning: hasTaskCreation.reasoning,
        priority: 1,
        timeInfo: this.extractTimeInfo(input)
      });
    }

    // 2. 然后执行时间调度（如果需要且有任务创建）
    if (hasSchedulePlanning && (hasTaskCreation || this.hasExistingTasks(input))) {
      actionPlan.push({
        intent: 'SCHEDULE_PLANNING',
        confidence: hasSchedulePlanning.confidence,
        reasoning: hasSchedulePlanning.reasoning,
        priority: 2,
        dependsOn: hasTaskCreation ? ['TASK_CREATION'] : []
      });
    }

    // 3. 外部工具调用（并行执行）
    if (hasExternalTool) {
      actionPlan.push({
        intent: 'EXTERNAL_TOOL',
        confidence: hasExternalTool.confidence,
        reasoning: hasExternalTool.reasoning,
        priority: 1,
        toolType: this.detectExternalToolType(input)
      });
    }

    // 4. 对话回复（最后执行，整合所有结果）
    if (hasConversation || actionPlan.length === 0) {
      actionPlan.push({
        intent: 'CONVERSATION',
        confidence: hasConversation ? hasConversation.confidence : 0.9,
        reasoning: hasConversation ? hasConversation.reasoning : '默认对话回复',
        priority: 3
      });
    }

    // 按优先级排序
    actionPlan.sort((a, b) => a.priority - b.priority);
    
    logger.info('Action Router 分析完成', {
      userInput: input.substring(0, 50),
      actionPlan: actionPlan.map(a => ({ intent: a.intent, priority: a.priority })),
      totalActions: actionPlan.length
    });

    return actionPlan;
  }

  /**
   * 检测任务创建意图
   */
  detectTaskCreation(input, primaryIntent) {
    if (primaryIntent.intent === 'TASK_CREATION') {
      return { confidence: primaryIntent.confidence, reasoning: '主要意图为任务创建' };
    }

    // 任务创建关键词检测
    const taskKeywords = [
      '要', '需要', '打电话', '开会', '取快递', '买', '去', '做', '完成',
      '提醒', '记住', '安排', '预约', '约', '见面', '拜访', '处理'
    ];
    
    const timeKeywords = ['明天', '后天', '下周', '早上', '上午', '下午', '晚上', '今天'];
    
    const hasTaskKeyword = taskKeywords.some(keyword => input.includes(keyword));
    const hasTimeKeyword = timeKeywords.some(keyword => input.includes(keyword));
    
    if (hasTaskKeyword && hasTimeKeyword) {
      return { 
        confidence: 0.9, 
        reasoning: '检测到任务关键词和时间关键词，判断为任务创建' 
      };
    }
    
    if (hasTaskKeyword) {
      return { 
        confidence: 0.7, 
        reasoning: '检测到任务关键词' 
      };
    }
    
    return null;
  }

  /**
   * 检测时间调度意图
   */
  detectSchedulePlanning(input, primaryIntent) {
    if (primaryIntent.intent === 'SCHEDULE_PLANNING') {
      return { confidence: primaryIntent.confidence, reasoning: '主要意图为时间调度' };
    }

    const scheduleKeywords = [
      '安排', '规划', '调整', '时间', '日程', '计划', '重新安排',
      '早上', '上午', '下午', '晚上', '几点', '什么时候'
    ];
    
    const hasScheduleKeyword = scheduleKeywords.some(keyword => input.includes(keyword));
    
    // 如果包含时间词汇，很可能需要调度
    if (hasScheduleKeyword) {
      return { 
        confidence: 0.8, 
        reasoning: '检测到时间调度相关关键词' 
      };
    }
    
    return null;
  }

  /**
   * 检测外部工具调用意图
   */
  detectExternalTool(input, primaryIntent) {
    if (primaryIntent.intent === 'EXTERNAL_TOOL') {
      return { confidence: primaryIntent.confidence, reasoning: '主要意图为外部工具调用' };
    }

    const externalToolKeywords = [
      '天气', '路线', '多久', '怎么走', '附近', '地图', '导航',
      '现在几点', '时间', '日期', '今天星期几'
    ];
    
    const hasExternalKeyword = externalToolKeywords.some(keyword => input.includes(keyword));
    
    if (hasExternalKeyword) {
      return { 
        confidence: 0.8, 
        reasoning: '检测到外部工具调用关键词' 
      };
    }
    
    // 检查是否因负面情绪需要触发天气查询
    if (this.shouldTriggerWeatherForEmotion(input)) {
      return {
        confidence: 0.7,
        reasoning: '检测到负面情绪，建议查询天气以提供外出建议'
      };
    }
    
    return null;
  }

  /**
   * 检测对话意图
   */
  detectConversation(input, primaryIntent) {
    if (primaryIntent.intent === 'CONVERSATION') {
      return { confidence: primaryIntent.confidence, reasoning: '主要意图为对话' };
    }

    const conversationKeywords = [
      '你好', '谢谢', '感谢', '累', '开心', '难过', '压力', '焦虑',
      '怎么样', '如何', '为什么', '聊天', '说说'
    ];
    
    const hasConversationKeyword = conversationKeywords.some(keyword => input.includes(keyword));
    
    if (hasConversationKeyword) {
      return { 
        confidence: 0.7, 
        reasoning: '检测到对话相关关键词' 
      };
    }
    
    return null;
  }

  /**
   * 提取时间信息
   */
  extractTimeInfo(input) {
    const timeInfo = {
      date: null,
      timeBlock: null,
      specificTime: null
    };
    
    // 日期检测
    if (input.includes('明天')) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      timeInfo.date = tomorrow.toISOString().split('T')[0];
    } else if (input.includes('后天')) {
      const dayAfterTomorrow = new Date();
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
      timeInfo.date = dayAfterTomorrow.toISOString().split('T')[0];
    } else if (input.includes('今天')) {
      timeInfo.date = new Date().toISOString().split('T')[0];
    }
    
    // 时间段检测
    if (input.includes('早上')) {
      timeInfo.timeBlock = {
        timeBlockType: 'morning',
        startTime: '08:00',
        endTime: '12:00'
      };
    } else if (input.includes('上午')) {
      timeInfo.timeBlock = {
        timeBlockType: 'forenoon',
        startTime: '09:00',
        endTime: '12:00'
      };
    } else if (input.includes('下午')) {
      timeInfo.timeBlock = {
        timeBlockType: 'afternoon',
        startTime: '14:00',
        endTime: '18:00'
      };
    } else if (input.includes('晚上')) {
      timeInfo.timeBlock = {
        timeBlockType: 'evening',
        startTime: '19:00',
        endTime: '22:00'
      };
    }
    
    return timeInfo;
  }

  /**
   * 检查是否有现有任务需要调度
   */
  hasExistingTasks(input) {
    // 这里可以检查数据库中是否有相关任务
    // 暂时返回false，后续可以集成数据库查询
    return false;
  }

  /**
   * 旧的多重意图分析方法（保留兼容性）
   */
  async analyzeMultipleIntentsOld(userInput, primaryIntent) {
    const intents = [primaryIntent];
    const input = userInput.toLowerCase();

    // 基于关键词分析可能的额外意图
    if (primaryIntent.intent !== 'TASK_CREATION' && 
        (input.includes('快递') || input.includes('取') || input.includes('买') || input.includes('开会'))) {
      intents.push({
        intent: 'TASK_CREATION',
        confidence: 0.8,
        reasoning: '检测到任务相关关键词'
      });
    }

    if (primaryIntent.intent !== 'SCHEDULE_PLANNING' && 
        (input.includes('安排') || input.includes('时间') || input.includes('日程') || input.includes('重新规划'))) {
      intents.push({
        intent: 'SCHEDULE_PLANNING',
        confidence: 0.8,
        reasoning: '检测到调度相关关键词'
      });
    }

    if (primaryIntent.intent !== 'EXTERNAL_TOOL' && 
        (input.includes('天气') || input.includes('路线') || input.includes('多久'))) {
      intents.push({
        intent: 'EXTERNAL_TOOL',
        confidence: 0.8,
        reasoning: '检测到外部工具需求'
      });
    }

    if (primaryIntent.intent !== 'CONVERSATION' && 
        (input.includes('累') || input.includes('压力') || input.includes('焦虑') || input.includes('心情'))) {
      intents.push({
        intent: 'CONVERSATION',
        confidence: 0.8,
        reasoning: '检测到情绪表达'
      });
    }

    return intents;
  }

  /**
   * 执行相应的服务（按优先级顺序执行）
   * @param {string} userInput 用户输入
   * @param {Array} intents 意图列表
   * @param {string} userId 用户ID
   * @param {string} sessionId 会话ID
   * @returns {Promise<Object>} 服务执行结果
   */
  async executeServices(userInput, intents, userId, sessionId) {
    const results = {};
    
    // 按优先级分组
    const priorityGroups = {};
    intents.forEach(intent => {
      const priority = intent.priority || 1;
      if (!priorityGroups[priority]) {
        priorityGroups[priority] = [];
      }
      priorityGroups[priority].push(intent);
    });

    // 按优先级顺序执行
    const sortedPriorities = Object.keys(priorityGroups).sort((a, b) => parseInt(a) - parseInt(b));
    
    for (const priority of sortedPriorities) {
      const currentIntents = priorityGroups[priority];
      const promises = [];
      
      logger.info(`执行优先级 ${priority} 的服务`, {
        intents: currentIntents.map(i => i.intent),
        count: currentIntents.length
      });

      // 同一优先级的服务并行执行
      for (const intent of currentIntents) {
        switch (intent.intent) {
          case 'TASK_CREATION':
            promises.push(
              this.executeTaskCreation(userInput, intent, userId)
                .then(result => { 
                  results.taskCreation = result;
                  logger.info('任务创建完成', { success: result.success });
                })
                .catch(error => { 
                  results.taskCreation = { success: false, error: error.message };
                  logger.error('任务创建失败', { error: error.message });
                })
            );
            break;

          case 'SCHEDULE_PLANNING':
            promises.push(
              this.executeSchedulePlanning(userInput, intent, userId, results)
                .then(result => { 
                  results.schedulePlanning = result;
                  logger.info('时间调度完成', { success: result.success });
                })
                .catch(error => { 
                  results.schedulePlanning = { success: false, error: error.message };
                  logger.error('时间调度失败', { error: error.message });
                })
            );
            break;

          case 'EXTERNAL_TOOL':
            promises.push(
              this.executeExternalTool(userInput, intent, userId)
                .then(result => { 
                  results.externalTool = result;
                  logger.info('外部工具调用完成', { success: result.success });
                })
                .catch(error => { 
                  results.externalTool = { success: false, error: error.message };
                  logger.error('外部工具调用失败', { error: error.message });
                })
            );
            break;

          case 'CONVERSATION':
            promises.push(
              this.executeConversation(userInput, intent, userId, sessionId, results)
                .then(result => { 
                  results.conversation = result;
                  logger.info('对话处理完成', { success: result.success });
                })
                .catch(error => { 
                  results.conversation = { success: false, error: error.message };
                  logger.error('对话处理失败', { error: error.message });
                })
            );
            break;
        }
      }

      // 等待当前优先级的所有服务执行完成
      await Promise.all(promises);
      
      logger.info(`优先级 ${priority} 的服务执行完成`, {
        results: Object.keys(results).filter(key => results[key])
      });
    }

    return results;
  }

  /**
   * 执行任务创建
   */
  async executeTaskCreation(userInput, intent, userId) {
    const timeInfo = intent.timeInfo || {};
    
    // 构建任务创建的参数
    const taskParams = {
      userInput,
      userId,
      timeInfo
    };
    
    logger.info('开始执行任务创建', {
      userInput: userInput.substring(0, 50),
      timeInfo,
      userId
    });
    
    // 使用直接创建任务的方法，因为Action Router已经确定了这是任务创建意图
    return await this.taskService.createTaskDirectly(userInput, userId, timeInfo);
  }

  /**
   * 执行时间调度
   */
  async executeSchedulePlanning(userInput, intent, userId, previousResults) {
    // 获取目标日期
    let targetDate = new Date().toISOString().split('T')[0];
    if (intent.timeInfo && intent.timeInfo.date) {
      targetDate = intent.timeInfo.date;
    }
    
    logger.info('开始执行时间调度', {
      userInput: userInput.substring(0, 50),
      targetDate,
      userId,
      hasPreviousTaskCreation: !!previousResults.taskCreation
    });
    
    return await this.scheduleService.planSchedule({
      userId,
      userInput,
      targetDate,
      userContext: { 
        emotionalState: this.detectEmotionalState(userInput),
        previousTaskCreation: previousResults.taskCreation
      }
    });
  }

  /**
   * 执行外部工具调用
   */
  async executeExternalTool(userInput, intent, userId) {
    const toolType = intent.toolType || this.detectExternalToolType(userInput);
    
    logger.info('开始执行外部工具调用', {
      userInput: userInput.substring(0, 50),
      toolType,
      userId
    });
    
    try {
      let result;
      
      switch (toolType) {
        case 'weather':
          // 天气查询 - 默认查询上海天气
          result = await gaodeMcpClient.queryWeather('上海');
          return {
            success: true,
            type: 'weather',
            message: '天气查询成功',
            data: result
          };
          
        case 'route':
          // 路线规划 - 从上海漕河泾B栋出发
          const destination = this.extractDestination(userInput) || '虹桥机场';
          result = await gaodeMcpClient.queryRoute({
            origin: '上海漕河泾B栋',
            destination: destination,
            mode: 'driving'
          });
          return {
            success: true,
            type: 'route',
            message: '路线规划成功',
            data: result
          };
          
        default:
          return {
            success: false,
            type: toolType,
            message: `不支持的工具类型: ${toolType}`,
            data: {
              toolType,
              query: userInput
            }
          };
      }
    } catch (error) {
      logger.error('外部工具调用失败', {
        error: error.message,
        toolType,
        userInput: userInput.substring(0, 50)
      });
      
      return {
        success: false,
        type: toolType,
        message: `外部工具调用失败: ${error.message}`,
        data: {
          toolType,
          query: userInput,
          error: error.message
        }
      };
    }
  }

  /**
   * 执行对话处理
   */
  async executeConversation(userInput, intent, userId, sessionId, previousResults) {
    logger.info('开始执行对话处理', {
      userInput: userInput.substring(0, 50),
      userId,
      sessionId,
      hasPreviousResults: Object.keys(previousResults).length > 0
    });
    
    return await this.conversationService.processConversation({
      userId,
      message: userInput,
      sessionId,
      context: { 
        emotionalState: this.detectEmotionalState(userInput),
        previousResults
      }
    });
  }

  /**
   * 检测情绪状态
   * @param {string} userInput 用户输入
   * @returns {string} 情绪状态
   */
  detectEmotionalState(userInput) {
    const input = userInput.toLowerCase();
    
    // 疲惫状态
    if (input.includes('累') || input.includes('疲惫') || input.includes('疲劳') || input.includes('困')) return 'tired';
    
    // 压力状态
    if (input.includes('压力') || input.includes('紧张') || input.includes('忙') || input.includes('烦躁')) return 'stressed';
    
    // 焦虑状态
    if (input.includes('焦虑') || input.includes('担心') || input.includes('不安') || input.includes('紧张')) return 'anxious';
    
    // 沮丧/难过状态
    if (input.includes('沮丧') || input.includes('难过') || input.includes('郁闷') || 
        input.includes('心情不好') || input.includes('不开心') || input.includes('失落') ||
        input.includes('烦恼') || input.includes('烦') || input.includes('糟糕')) return 'sad';
    
    // 愤怒状态
    if (input.includes('生气') || input.includes('愤怒') || input.includes('气愤') || input.includes('恼火')) return 'angry';
    
    // 开心状态
    if (input.includes('开心') || input.includes('高兴') || input.includes('快乐') || input.includes('兴奋')) return 'happy';
    
    return 'neutral';
  }

  /**
   * 检查是否需要因情绪触发天气查询
   * @param {string} userInput 用户输入
   * @returns {boolean} 是否需要天气查询
   */
  shouldTriggerWeatherForEmotion(userInput) {
    const emotionalState = this.detectEmotionalState(userInput);
    const negativeEmotions = ['tired', 'stressed', 'anxious', 'sad', 'angry'];
    return negativeEmotions.includes(emotionalState);
  }

  /**
   * 检测外部工具类型
   * @param {string} userInput 用户输入
   * @returns {string} 工具类型
   */
  detectExternalToolType(userInput) {
    const input = userInput.toLowerCase();
    
    if (input.includes('天气')) return 'weather';
    if (input.includes('路线') || input.includes('多久')) return 'route';
    if (input.includes('时间')) return 'time';
    
    return 'unknown';
  }

  /**
   * 从用户输入中提取目的地
   * @param {string} userInput 用户输入
   * @returns {string|null} 提取的目的地
   */
  extractDestination(userInput) {
    const input = userInput.toLowerCase();
    
    // 常见目的地关键词映射
    const destinationMap = {
      '机场': '虹桥机场',
      '虹桥': '虹桥机场',
      '浦东': '浦东机场',
      '火车站': '上海火车站',
      '南站': '上海南站',
      '虹桥站': '虹桥火车站',
      '外滩': '外滩',
      '陆家嘴': '陆家嘴',
      '人民广场': '人民广场'
    };
    
    // 查找匹配的目的地
    for (const [keyword, destination] of Object.entries(destinationMap)) {
      if (input.includes(keyword)) {
        return destination;
      }
    }
    
    // 尝试提取"到"字后面的地点
    const toMatch = input.match(/到(.+?)(?:[需要多久|要多久|怎么走|路线]|$)/);
    if (toMatch && toMatch[1]) {
      return toMatch[1].trim();
    }
    
    return null;
  }

  /**
   * 生成统一回复
   * @param {string} userInput 用户输入
   * @param {Array} intents 意图列表
   * @param {Object} executionResults 执行结果
   * @param {string} userId 用户ID
   * @returns {Promise<string>} 统一回复
   */
  async generateUnifiedResponse(userInput, intents, executionResults, userId) {
    try {
      // 获取用户的AI助手名字
      let assistantName = '小艾'; // 默认名字
      try {
        const assistant = await AIAssistant.findOne({ userId });
        if (assistant && assistant.name) {
          assistantName = assistant.name;
          logger.info('获取到用户AI助手名字用于统一回复', { userId, assistantName });
        }
      } catch (error) {
        logger.warn('获取AI助手信息失败，使用默认名字', { userId, error: error.message });
      }

      // 添加调试日志
      logger.info('开始生成统一回复', {
        userInput: userInput.substring(0, 50),
        intentsCount: intents.length,
        executionResultsKeys: Object.keys(executionResults),
        executionResults: executionResults,
        assistantName
      });

      // 构建回复提示词
      const prompt = this.buildResponsePrompt(userInput, intents, executionResults, assistantName);
      
      // 调用AI生成回复
      const response = await this.conversationService.generateAIResponse([
        { role: 'system', content: prompt.system },
        { role: 'user', content: prompt.user }
      ]);

      return response.content;

    } catch (error) {
      logger.warn('AI回复生成失败，使用备用逻辑', { 
        error: error.message,
        stack: error.stack,
        userInput: userInput.substring(0, 50),
        intentsCount: intents.length,
        executionResultsKeys: Object.keys(executionResults)
      });
      
      // 备用回复逻辑
      return this.generateFallbackResponse(userInput, intents, executionResults);
    }
  }

  /**
   * 构建回复提示词
   * @param {string} userInput 用户输入
   * @param {Array} intents 意图列表
   * @param {Object} executionResults 执行结果
   * @param {string} assistantName AI助手名字
   * @returns {Object} 提示词对象
   */
  buildResponsePrompt(userInput, intents, executionResults, assistantName = '小艾') {
    const systemPrompt = `你是一个智能AI助手${assistantName}，负责将多个服务模块的执行结果整合成一个自然、友好的统一回复。

你的任务：
1. 分析各个模块的执行结果
2. 按照逻辑顺序组织信息
3. 生成自然流畅的对话回复
4. 体现对用户的关心和帮助

回复原则：
- 语调温暖友善，像朋友一样
- 先处理任务，再给予情感支持
- 信息要准确完整
- 避免机械化的模板回复
- 长度控制在150字以内
- 在回复中自然地提到自己的名字${assistantName}，让用户感受到个性化服务`;

    const resultsSummary = Object.keys(executionResults).map(service => {
      const result = executionResults[service];
      if (!result.success) return `${service}: 执行失败`;
      
      switch (service) {
        case 'taskCreation':
          return `任务创建: 成功创建任务"${result.task?.title || '新任务'}"`;
        case 'schedulePlanning':
          return `时间调度: 重新安排了日程`;
        case 'conversation':
          return `情绪支持: 提供了情感安慰`;
        case 'externalTool':
          if (result.type === 'weather') {
            return `天气查询: 获取了天气信息`;
          } else if (result.type === 'route' && result.data && result.data.data) {
            const routeData = result.data.data;
            if (routeData.routes && routeData.routes.length > 0) {
              const route = routeData.routes[0];
              const distance = route.distance ? `${route.distance}公里` : '未知距离';
              const duration = route.duration ? `${route.duration}分钟` : '未知时间';
              return `路线规划: 从${route.origin || '起点'}到${route.destination || '终点'}，距离${distance}，预计用时${duration}`;
            }
            return `路线规划: 获取了路线信息`;
          }
          return `外部工具: 执行成功`;
        default:
          return `${service}: 执行成功`;
      }
    }).join('\n');

    const userPrompt = `请基于以下信息生成一个自然、友好的统一回复：

用户原始输入："${userInput}"

识别到的意图：
${intents.map(intent => `- ${intent.intent} (置信度: ${intent.confidence})`).join('\n')}

各服务执行结果：
${resultsSummary}

请生成一个温暖、自然的回复，体现出：
1. 对用户请求的准确理解
2. 已完成的任务或安排
3. 对用户情绪的关心
4. 积极正面的态度

直接返回回复内容，不需要额外说明。`;

    return { system: systemPrompt, user: userPrompt };
  }

  /**
   * 生成备用回复
   * @param {string} userInput 用户输入
   * @param {Array} intents 意图列表
   * @param {Object} executionResults 执行结果
   * @returns {string} 备用回复
   */
  generateFallbackResponse(userInput, intents, executionResults) {
    let response = '';

    // 基于执行结果生成简单回复
    if (executionResults.taskCreation?.success) {
      response += '好的，我已经帮你记录了这个任务。';
    }

    if (executionResults.schedulePlanning?.success) {
      response += '时间安排已经调整好了。';
    }

    if (executionResults.conversation?.success) {
      response += '我理解你的感受，希望我的建议对你有帮助。';
    }

    if (executionResults.externalTool?.success) {
      response += '相关信息已经查询完成。';
    }

    // 如果没有生成任何回复，提供默认回复
    if (!response) {
      response = '我理解你的需求，让我来帮你处理。';
    }

    return response;
  }

  /**
   * 构建最终结果
   * @param {string} userInput 用户输入
   * @param {Array} intents 意图列表
   * @param {Object} executionResults 执行结果
   * @param {string} response 统一回复
   * @returns {Object} 最终结果
   */
  buildFinalResult(userInput, intents, executionResults, response) {
    return {
      response,
      intents: intents.map(i => i.intent),
      servicesExecuted: Object.keys(executionResults),
      taskCreated: executionResults.taskCreation?.success ? executionResults.taskCreation.task : null,
      scheduleAdjusted: executionResults.schedulePlanning?.success,
      emotionalSupport: executionResults.conversation?.success ? '提供情绪安慰' : null,
      externalToolResult: executionResults.externalTool?.success ? executionResults.externalTool : null
    };
  }

  /**
   * 健康检查
   * @returns {Promise<Object>} 服务状态
   */
  async healthCheck() {
    try {
      const services = {
        intentRecognition: true,
        conversation: true,
        taskRecognition: true,
        schedulePlanning: true
      };

      // 测试各个服务
      try {
        await this.intentService.healthCheck();
      } catch (error) {
        services.intentRecognition = false;
      }

      return {
        status: 'healthy',
        services,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = IntelligentDispatchService;
