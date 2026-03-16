/**
 * 对话服务
 * 处理用户与AI助手的对话交互
 */

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const Conversation = require('../../models/Conversation');
const AIAssistant = require('../../models/AIAssistant');
const IntentRecognitionService = require('./intentRecognitionService');
const logger = require('../utils/logger');
const {
  buildConversationPrompt,
  detectEmotion,
  validateConversationInput,
  getEmotionResponse
} = require('../prompt/conversation');

/**
 * 对话服务类
 */
class ConversationService {
  constructor() {
    this.intentService = new IntentRecognitionService();
    this.apiKey = process.env.DASHSCOPE_API_KEY;
    this.baseURL = 'https://dashscope.aliyuncs.com/compatible-mode/v1';
    this.model = 'qwen-plus';
    
    if (!this.apiKey) {
      throw new Error('DASHSCOPE_API_KEY 环境变量未设置');
    }
    
    logger.info('对话服务初始化成功', {
      model: this.model,
      baseURL: this.baseURL,
      hasApiKey: !!this.apiKey
    });
  }

  /**
   * 处理用户对话消息
   * @param {Object} params 对话参数
   * @returns {Promise<Object>} 对话结果
   */
  async processConversation(params) {
    const startTime = Date.now();
    const {
      userId,
      message,
      sessionId = uuidv4(),
      deviceInfo = {}
    } = params;

    logger.info('开始处理对话', {
      userId,
      sessionId,
      messageLength: message.length,
      timestamp: new Date().toISOString()
    });

    try {
      // 1. 输入验证
      const validation = validateConversationInput(message);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // 2. 进行意图识别
      logger.info('开始意图识别', { userId, message: message.substring(0, 50) + '...' });
      const intentResult = await this.intentService.recognizeIntent(message);
      
      // 检查是否为对话意图
      if (intentResult.intent !== 'CONVERSATION') {
        logger.warn('消息意图不是对话类型', {
          userId,
          intent: intentResult.intent,
          confidence: intentResult.confidence
        });
        
        return {
          success: false,
          error: '该消息不属于对话类型，请使用相应的功能模块处理',
          intent: intentResult.intent,
          suggestion: this.getIntentSuggestion(intentResult.intent)
        };
      }

      // 3. 获取用户的AI助手信息
      let assistantName = '小艾'; // 默认名字
      try {
        const assistant = await AIAssistant.findOne({ userId });
        if (assistant && assistant.name) {
          assistantName = assistant.name;
          logger.info('获取到用户AI助手名字', { userId, assistantName });
        }
      } catch (error) {
        logger.warn('获取AI助手信息失败，使用默认名字', { userId, error: error.message });
      }

      // 4. 保存用户消息到数据库
      const userMessage = await Conversation.createUserMessage({
        userId,
        sessionId,
        content: message,
        intent: intentResult.intent,
        intentConfidence: intentResult.confidence,
        intentReasoning: intentResult.reasoning,
        extractedInfo: intentResult.extracted_info,
        deviceInfo
      });

      logger.info('用户消息已保存', {
        messageId: userMessage._id,
        intent: intentResult.intent,
        confidence: intentResult.confidence
      });

      // 5. 获取对话历史
      const conversationHistory = await Conversation.getUserConversations(
        userId, 
        sessionId, 
        { limit: 10, sortOrder: -1 }
      );

      // 6. 检测用户情绪
      const emotion = detectEmotion(message, intentResult.extracted_info.keywords);
      logger.info('检测到用户情绪', { userId, emotion, keywords: intentResult.extracted_info.keywords });

      // 7. 构建对话提示词
      const userInfo = { nickname: '朋友' }; // 可以从用户数据中获取
      const promptData = buildConversationPrompt(
        conversationHistory.reverse(), // 按时间正序排列
        message,
        userInfo,
        intentResult,
        assistantName // 传递AI助手名字
      );

      // 8. 调用AI模型生成回应
      logger.info('开始生成AI回应', { userId, historyCount: conversationHistory.length });
      const aiResponse = await this.generateAIResponse(promptData.messages);

      // 9. 保存AI回应到数据库
      const assistantMessage = await Conversation.createAssistantMessage({
        userId,
        sessionId,
        content: aiResponse.content,
        aiMetadata: {
          model: this.model,
          responseTime: aiResponse.responseTime,
          temperature: 0.7,
          tokenUsage: aiResponse.usage,
          emotion: emotion
        }
      });

      const totalProcessingTime = Date.now() - startTime;
      logger.info('对话处理完成', {
        userId,
        sessionId,
        userMessageId: userMessage._id,
        assistantMessageId: assistantMessage._id,
        totalTime: totalProcessingTime + 'ms',
        emotion,
        intent: intentResult.intent
      });

      return {
        success: true,
        data: {
          sessionId,
          userMessage: {
            id: userMessage._id,
            content: message,
            timestamp: userMessage.createdAt,
            intent: intentResult.intent,
            confidence: intentResult.confidence
          },
          assistantMessage: {
            id: assistantMessage._id,
            content: aiResponse.content,
            timestamp: assistantMessage.createdAt,
            emotion: emotion
          },
          metadata: {
            processingTime: totalProcessingTime,
            intentInfo: {
              intent: intentResult.intent,
              confidence: intentResult.confidence,
              reasoning: intentResult.reasoning
            },
            conversationStats: {
              historyCount: conversationHistory.length,
              emotion: emotion
            }
          }
        }
      };

    } catch (error) {
      const totalProcessingTime = Date.now() - startTime;
      logger.error('对话处理失败', {
        userId,
        sessionId,
        error: error.message,
        stack: error.stack,
        processingTime: totalProcessingTime + 'ms'
      });

      throw error;
    }
  }

  /**
   * 调用AI模型生成回应
   * @param {Array} messages 消息数组
   * @returns {Promise<Object>} AI回应结果
   */
  async generateAIResponse(messages) {
    const startTime = Date.now();
    
    try {
      const requestData = {
        model: this.model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 500,
        stream: false
      };

      logger.info('调用通义千问API生成回应', {
        model: this.model,
        messagesCount: messages.length,
        url: `${this.baseURL}/chat/completions`
      });

      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      const responseTime = Date.now() - startTime;
      
      logger.info('AI回应生成成功', {
        status: response.status,
        responseTime: responseTime + 'ms',
        usage: response.data.usage,
        model: response.data.model
      });

      if (!response.data.choices || response.data.choices.length === 0) {
        throw new Error('AI API响应中没有choices数据');
      }

      return {
        content: response.data.choices[0].message.content,
        responseTime: responseTime,
        usage: response.data.usage
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      logger.error('AI回应生成失败', {
        error: error.message,
        responseTime: responseTime + 'ms',
        status: error.response?.status,
        statusText: error.response?.statusText
      });

      if (error.response?.status === 401) {
        throw new Error('AI API密钥无效或已过期');
      } else if (error.response?.status === 429) {
        throw new Error('AI API调用频率超限，请稍后重试');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('AI API调用超时，请检查网络连接');
      } else {
        throw new Error(`AI回应生成失败: ${error.message}`);
      }
    }
  }

  /**
   * 获取用户对话历史
   * @param {String} userId 用户ID
   * @param {String} sessionId 会话ID（可选）
   * @param {Object} options 查询选项
   * @returns {Promise<Object>} 对话历史结果
   */
  async getConversationHistory(userId, sessionId = null, options = {}) {
    logger.info('获取对话历史', { userId, sessionId, options });

    try {
      const {
        limit = 20,
        skip = 0,
        includeStats = false
      } = options;

      const conversations = await Conversation.getUserConversations(
        userId,
        sessionId,
        { limit, skip, sortOrder: -1 }
      );

      let stats = null;
      if (includeStats && sessionId) {
        stats = await Conversation.getSessionStats(userId, sessionId);
      }

      logger.info('对话历史获取成功', {
        userId,
        sessionId,
        count: conversations.length,
        hasStats: !!stats
      });

      return {
        success: true,
        data: {
          conversations,
          pagination: {
            limit,
            skip,
            count: conversations.length
          },
          stats
        }
      };

    } catch (error) {
      logger.error('获取对话历史失败', {
        userId,
        sessionId,
        error: error.message,
        stack: error.stack
      });

      throw error;
    }
  }

  /**
   * 删除对话历史
   * @param {String} userId 用户ID
   * @param {String} sessionId 会话ID（可选）
   * @returns {Promise<Object>} 删除结果
   */
  async deleteConversationHistory(userId, sessionId = null) {
    logger.info('删除对话历史', { userId, sessionId });

    try {
      const result = await Conversation.softDeleteConversations(userId, sessionId);

      logger.info('对话历史删除成功', {
        userId,
        sessionId,
        deletedCount: result.modifiedCount
      });

      return {
        success: true,
        data: {
          deletedCount: result.modifiedCount,
          message: sessionId ? '会话已删除' : '所有对话历史已删除'
        }
      };

    } catch (error) {
      logger.error('删除对话历史失败', {
        userId,
        sessionId,
        error: error.message,
        stack: error.stack
      });

      throw error;
    }
  }

  /**
   * 获取意图建议
   * @param {String} intent 意图类型
   * @returns {String} 建议信息
   */
  getIntentSuggestion(intent) {
    const suggestions = {
      'TASK_CREATION': '请使用任务管理功能来创建和管理您的待办事项',
      'SCHEDULE_PLANNING': '请使用日程规划功能来安排和优化您的时间',
      'EXTERNAL_TOOL': '请使用相应的工具功能来获取外部信息（如天气、地图等）'
    };
    
    return suggestions[intent] || '请使用相应的功能模块来处理此类请求';
  }

  /**
   * 健康检查
   * @returns {Promise<Object>} 服务状态
   */
  async healthCheck() {
    try {
      const testParams = {
        userId: 'test-user-id',
        message: '你好',
        sessionId: 'test-session'
      };
      
      const startTime = Date.now();
      
      // 测试意图识别
      await this.intentService.recognizeIntent('你好');
      
      const responseTime = Date.now() - startTime;

      return {
        status: 'healthy',
        model: this.model,
        services: {
          intentRecognition: 'healthy',
          database: 'healthy',
          aiModel: 'healthy'
        },
        responseTime,
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

  /**
   * 获取服务统计信息
   * @param {String} userId 用户ID（可选）
   * @returns {Promise<Object>} 统计信息
   */
  async getServiceStats(userId = null) {
    try {
      const stats = {
        service: 'conversation',
        version: '1.0.0',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
      };

      if (userId) {
        // 获取用户相关统计
        const userConversations = await Conversation.getRecentConversations(userId, 1);
        stats.userStats = {
          hasHistory: userConversations.length > 0,
          lastConversation: userConversations[0]?.createdAt || null
        };
      }

      return stats;
    } catch (error) {
      logger.error('获取服务统计失败', { error: error.message });
      throw error;
    }
  }
}

module.exports = ConversationService;

