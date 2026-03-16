/**
 * 对话控制器
 * 处理用户与AI助手的对话相关HTTP请求
 */

const ConversationService = require('../services/conversationService');
const logger = require('../utils/logger');

/**
 * 对话控制器类
 */
class ConversationController {
  constructor() {
    this.conversationService = new ConversationService();
    
    // 绑定this上下文
    this.sendMessage = this.sendMessage.bind(this);
    this.getHistory = this.getHistory.bind(this);
    this.deleteHistory = this.deleteHistory.bind(this);
    this.getStats = this.getStats.bind(this);
    this.healthCheck = this.healthCheck.bind(this);
  }

  /**
   * 发送对话消息
   * POST /api/ai/conversation/send
   */
  async sendMessage(req, res) {
    const startTime = Date.now();
    logger.apiRequest(req, '对话消息发送请求');

    try {
      const { message, sessionId } = req.body;
      const userId = req.user.userId;

      // 参数验证
      if (!message) {
        logger.warn('对话消息缺失', { userId });
        return res.status(400).json({
          success: false,
          error: '消息内容不能为空',
          code: 'MISSING_MESSAGE'
        });
      }

      if (typeof message !== 'string') {
        logger.warn('对话消息类型错误', { userId, messageType: typeof message });
        return res.status(400).json({
          success: false,
          error: '消息内容必须是字符串',
          code: 'INVALID_MESSAGE_TYPE'
        });
      }

      if (message.trim().length === 0) {
        logger.warn('对话消息为空', { userId });
        return res.status(400).json({
          success: false,
          error: '消息内容不能为空',
          code: 'EMPTY_MESSAGE'
        });
      }

      if (message.length > 2000) {
        logger.warn('对话消息过长', { userId, messageLength: message.length });
        return res.status(400).json({
          success: false,
          error: '消息内容过长，请控制在2000字符以内',
          code: 'MESSAGE_TOO_LONG'
        });
      }

      // 获取设备信息
      const deviceInfo = {
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        platform: req.get('X-Platform') || 'unknown'
      };

      logger.info('开始处理对话消息', {
        userId,
        sessionId,
        messageLength: message.length,
        hasDeviceInfo: !!deviceInfo.userAgent
      });

      // 调用对话服务
      const result = await this.conversationService.processConversation({
        userId,
        message: message.trim(),
        sessionId,
        deviceInfo
      });

      logger.apiResponse(req, res, startTime, '对话消息处理成功', {
        sessionId: result.data?.sessionId,
        intent: result.data?.userMessage?.intent,
        responseLength: result.data?.assistantMessage?.content?.length
      });

      res.json({
        success: true,
        data: result.data,
        processingTime: Date.now() - startTime
      });

    } catch (error) {
      logger.error('对话消息处理失败', {
        userId: req.user?.userId,
        error: error.message,
        stack: error.stack,
        message: req.body.message?.substring(0, 100) + '...'
      });

      logger.apiResponse(req, res, startTime, '对话消息处理失败', {
        error: error.message
      });

      // 根据错误类型返回不同的状态码
      let statusCode = 500;
      let errorCode = 'CONVERSATION_FAILED';

      if (error.message.includes('不属于对话类型')) {
        statusCode = 400;
        errorCode = 'WRONG_INTENT_TYPE';
      } else if (error.message.includes('API密钥')) {
        statusCode = 503;
        errorCode = 'AI_SERVICE_UNAVAILABLE';
      } else if (error.message.includes('超时')) {
        statusCode = 504;
        errorCode = 'AI_SERVICE_TIMEOUT';
      }

      res.status(statusCode).json({
        success: false,
        error: error.message,
        code: errorCode,
        processingTime: Date.now() - startTime
      });
    }
  }

  /**
   * 获取对话历史
   * GET /api/ai/conversation/history
   */
  async getHistory(req, res) {
    const startTime = Date.now();
    logger.apiRequest(req, '获取对话历史请求');

    try {
      const userId = req.user.userId;
      const { 
        sessionId, 
        limit = 20, 
        skip = 0, 
        includeStats = false 
      } = req.query;

      // 参数验证
      const limitNum = parseInt(limit);
      const skipNum = parseInt(skip);

      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        return res.status(400).json({
          success: false,
          error: 'limit参数必须是1-100之间的数字',
          code: 'INVALID_LIMIT'
        });
      }

      if (isNaN(skipNum) || skipNum < 0) {
        return res.status(400).json({
          success: false,
          error: 'skip参数必须是非负整数',
          code: 'INVALID_SKIP'
        });
      }

      logger.info('获取对话历史', {
        userId,
        sessionId,
        limit: limitNum,
        skip: skipNum,
        includeStats: includeStats === 'true'
      });

      const result = await this.conversationService.getConversationHistory(
        userId,
        sessionId,
        {
          limit: limitNum,
          skip: skipNum,
          includeStats: includeStats === 'true'
        }
      );

      logger.apiResponse(req, res, startTime, '对话历史获取成功', {
        conversationCount: result.data.conversations.length,
        hasStats: !!result.data.stats
      });

      res.json({
        success: true,
        data: result.data,
        processingTime: Date.now() - startTime
      });

    } catch (error) {
      logger.error('获取对话历史失败', {
        userId: req.user?.userId,
        error: error.message,
        stack: error.stack,
        query: req.query
      });

      logger.apiResponse(req, res, startTime, '对话历史获取失败', {
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: error.message,
        code: 'GET_HISTORY_FAILED',
        processingTime: Date.now() - startTime
      });
    }
  }

  /**
   * 删除对话历史
   * DELETE /api/ai/conversation/history
   */
  async deleteHistory(req, res) {
    const startTime = Date.now();
    logger.apiRequest(req, '删除对话历史请求');

    try {
      const userId = req.user.userId;
      const { sessionId } = req.query;

      logger.info('删除对话历史', {
        userId,
        sessionId,
        deleteType: sessionId ? 'session' : 'all'
      });

      const result = await this.conversationService.deleteConversationHistory(
        userId,
        sessionId
      );

      logger.apiResponse(req, res, startTime, '对话历史删除成功', {
        deletedCount: result.data.deletedCount,
        sessionId
      });

      res.json({
        success: true,
        data: result.data,
        processingTime: Date.now() - startTime
      });

    } catch (error) {
      logger.error('删除对话历史失败', {
        userId: req.user?.userId,
        error: error.message,
        stack: error.stack,
        sessionId: req.query.sessionId
      });

      logger.apiResponse(req, res, startTime, '对话历史删除失败', {
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: error.message,
        code: 'DELETE_HISTORY_FAILED',
        processingTime: Date.now() - startTime
      });
    }
  }

  /**
   * 获取对话服务统计信息
   * GET /api/ai/conversation/stats
   */
  async getStats(req, res) {
    const startTime = Date.now();
    logger.apiRequest(req, '获取对话统计信息请求');

    try {
      const userId = req.user.userId;

      logger.info('获取对话统计信息', { userId });

      const stats = await this.conversationService.getServiceStats(userId);

      logger.apiResponse(req, res, startTime, '对话统计信息获取成功');

      res.json({
        success: true,
        data: stats,
        processingTime: Date.now() - startTime
      });

    } catch (error) {
      logger.error('获取对话统计信息失败', {
        userId: req.user?.userId,
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: error.message,
        code: 'GET_STATS_FAILED',
        processingTime: Date.now() - startTime
      });
    }
  }

  /**
   * 对话服务健康检查
   * GET /api/ai/conversation/health
   */
  async healthCheck(req, res) {
    const startTime = Date.now();
    logger.apiRequest(req, '对话服务健康检查请求');

    try {
      const health = await this.conversationService.healthCheck();

      logger.apiResponse(req, res, startTime, '对话服务健康检查完成', {
        status: health.status,
        responseTime: health.responseTime
      });

      const statusCode = health.status === 'healthy' ? 200 : 503;
      res.status(statusCode).json({
        success: health.status === 'healthy',
        data: health,
        processingTime: Date.now() - startTime
      });

    } catch (error) {
      logger.error('对话服务健康检查失败', {
        error: error.message,
        stack: error.stack
      });

      res.status(503).json({
        success: false,
        error: error.message,
        code: 'HEALTH_CHECK_FAILED',
        processingTime: Date.now() - startTime
      });
    }
  }

  /**
   * 获取会话列表
   * GET /api/ai/conversation/sessions
   */
  async getSessions(req, res) {
    const startTime = Date.now();
    logger.apiRequest(req, '获取会话列表请求');

    try {
      const userId = req.user.userId;
      const { limit = 10 } = req.query;

      const limitNum = parseInt(limit);
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 50) {
        return res.status(400).json({
          success: false,
          error: 'limit参数必须是1-50之间的数字',
          code: 'INVALID_LIMIT'
        });
      }

      // 获取用户最近的会话
      const Conversation = require('../../models/Conversation');
      const sessions = await Conversation.aggregate([
        {
          $match: {
            userId: new require('mongoose').Types.ObjectId(userId),
            isDeleted: false
          }
        },
        {
          $group: {
            _id: '$sessionId',
            lastMessage: { $last: '$content' },
            lastMessageType: { $last: '$messageType' },
            lastActivity: { $max: '$createdAt' },
            messageCount: { $sum: 1 }
          }
        },
        {
          $sort: { lastActivity: -1 }
        },
        {
          $limit: limitNum
        }
      ]);

      logger.apiResponse(req, res, startTime, '会话列表获取成功', {
        sessionCount: sessions.length
      });

      res.json({
        success: true,
        data: {
          sessions: sessions.map(session => ({
            sessionId: session._id,
            lastMessage: session.lastMessage,
            lastMessageType: session.lastMessageType,
            lastActivity: session.lastActivity,
            messageCount: session.messageCount
          }))
        },
        processingTime: Date.now() - startTime
      });

    } catch (error) {
      logger.error('获取会话列表失败', {
        userId: req.user?.userId,
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: error.message,
        code: 'GET_SESSIONS_FAILED',
        processingTime: Date.now() - startTime
      });
    }
  }
}

module.exports = ConversationController;
