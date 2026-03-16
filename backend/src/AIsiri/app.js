const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const intentRoutes = require('./routes/intentRecognition');
const intelligentDispatchRoutes = require('./routes/intelligentDispatchRoutes');
const logger = require('./utils/logger');
require('dotenv').config();

/**
 * AI Siri 意图识别服务主应用
 * 基于LangChain架构的智能意图识别系统
 */
class AISiriApp {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3001;
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * 设置中间件
   */
  setupMiddleware() {
    // 安全中间件
    this.app.use(helmet());
    
    // CORS配置
    this.app.use(cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:8080',
      credentials: true
    }));
    
    // 请求体解析
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // 请求限制
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15分钟
      max: 100, // 限制每个IP 15分钟内最多100个请求
      message: {
        success: false,
        error: '请求过于频繁，请稍后再试',
        code: 'RATE_LIMIT_EXCEEDED'
      }
    });
    this.app.use('/api/', limiter);
    
    // 请求日志中间件
    this.app.use((req, res, next) => {
      const startTime = Date.now();
      
      // 记录请求开始
      logger.info(`🌐 ${req.method} ${req.originalUrl} - IP: ${req.ip}`);
      
      // 监听响应结束
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        const statusEmoji = res.statusCode >= 200 && res.statusCode < 300 ? '✅' : '❌';
        logger.info(`${statusEmoji} ${req.method} ${req.originalUrl} [${res.statusCode}] ${duration}ms`);
      });
      
      next();
    });
    
    logger.info('✅ 中间件配置完成');
  }

  /**
   * 设置路由
   */
  setupRoutes() {
    // 健康检查
    this.app.get('/health', (req, res) => {
      res.json({
        success: true,
        data: {
          service: 'AI Siri Intent Recognition Service',
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        }
      });
    });
    
    // API路由
    this.app.use('/api/intent', intentRoutes);
    this.app.use('/api/aisiri/dispatch', intelligentDispatchRoutes);
    
    // 根路径
    this.app.get('/', (req, res) => {
      res.json({
        success: true,
        data: {
          message: '欢迎使用 AI Siri 意图识别服务',
          service: 'AI Siri Intent Recognition Service',
          version: '1.0.0',
          endpoints: {
            health: 'GET /health',
            status: 'GET /api/intent/status',
            recognize: 'POST /api/intent/recognize',
            process: 'POST /api/intent/process',
            chat: 'POST /api/intent/chat',
            intelligentDispatch: 'POST /api/aisiri/dispatch',
            dispatchStatus: 'GET /api/aisiri/dispatch/status',
            dispatchTest: 'POST /api/aisiri/dispatch/test'
          },
          timestamp: new Date().toISOString()
        }
      });
    });
    
    // 404处理
    this.app.use('*', (req, res) => {
      logger.warn(`❌ 404 - 未找到路由: ${req.method} ${req.originalUrl}`);
      res.status(404).json({
        success: false,
        error: '请求的资源不存在',
        code: 'NOT_FOUND',
        path: req.originalUrl,
        timestamp: new Date().toISOString()
      });
    });
    
    logger.info('✅ 路由配置完成');
  }

  /**
   * 设置错误处理
   */
  setupErrorHandling() {
    // 全局错误处理中间件
    this.app.use((error, req, res, next) => {
      logger.error('🚨 全局错误处理:', error);
      
      // 开发环境返回详细错误信息
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      res.status(error.status || 500).json({
        success: false,
        error: error.message || '服务器内部错误',
        code: error.code || 'INTERNAL_ERROR',
        ...(isDevelopment && { stack: error.stack }),
        timestamp: new Date().toISOString()
      });
    });
    
    // 未捕获的Promise拒绝
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('🚨 未处理的Promise拒绝:', reason);
      // 不要退出进程，记录错误即可
    });
    
    // 未捕获的异常
    process.on('uncaughtException', (error) => {
      logger.error('🚨 未捕获的异常:', error);
      // 优雅关闭
      process.exit(1);
    });
    
    logger.info('✅ 错误处理配置完成');
  }

  /**
   * 启动服务器
   */
  start() {
    return new Promise((resolve, reject) => {
      try {
        const server = this.app.listen(this.port, () => {
          logger.info(`🚀 AI Siri 意图识别服务启动成功`);
          logger.info(`🌐 服务地址: http://localhost:${this.port}`);
          logger.info(`📝 API文档: http://localhost:${this.port}/api/intent/status`);
          logger.info(`💚 健康检查: http://localhost:${this.port}/health`);
          logger.info(`🔧 环境: ${process.env.NODE_ENV || 'development'}`);
          
          resolve(server);
        });
        
        server.on('error', (error) => {
          logger.error('🚨 服务器启动失败:', error);
          reject(error);
        });
        
      } catch (error) {
        logger.error('🚨 应用启动异常:', error);
        reject(error);
      }
    });
  }

  /**
   * 获取Express应用实例
   */
  getApp() {
    return this.app;
  }
}

// 如果直接运行此文件，启动服务器
if (require.main === module) {
  const app = new AISiriApp();
  app.start().catch((error) => {
    logger.error('🚨 应用启动失败:', error);
    process.exit(1);
  });
}

module.exports = AISiriApp;