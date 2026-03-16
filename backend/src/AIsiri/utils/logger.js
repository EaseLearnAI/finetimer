/**
 * 日志工具
 * 基于Winston的日志记录器
 */

const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// 确保日志目录存在
const logDir = path.join(__dirname, '../logs');

/**
 * 自定义日志格式
 */
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let logMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    
    // 如果有额外的元数据，添加到日志中
    if (Object.keys(meta).length > 0) {
      logMessage += `\n  ${JSON.stringify(meta, null, 2)}`;
    }
    
    return logMessage;
  })
);

/**
 * 控制台输出格式（彩色）
 */
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss.SSS'
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let logMessage = `[${timestamp}] ${level}: ${message}`;
    
    // 如果有额外的元数据，以简洁的方式显示
    if (Object.keys(meta).length > 0) {
      const metaStr = JSON.stringify(meta, null, 0);
      if (metaStr.length > 100) {
        logMessage += `\n  ${JSON.stringify(meta, null, 2)}`;
      } else {
        logMessage += ` ${metaStr}`;
      }
    }
    
    return logMessage;
  })
);

/**
 * 日志传输器配置
 */
const transports = [
  // 控制台输出
  new winston.transports.Console({
    level: process.env.LOG_LEVEL || 'info',
    format: consoleFormat,
    handleExceptions: true,
    handleRejections: true
  }),

  // 普通日志文件（按日期轮转）
  new DailyRotateFile({
    filename: path.join(logDir, 'intent-recognition-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    level: 'info',
    format: logFormat
  }),

  // 错误日志文件
  new DailyRotateFile({
    filename: path.join(logDir, 'intent-recognition-error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '30d',
    level: 'error',
    format: logFormat
  })
];

/**
 * 创建Winston Logger实例
 */
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: transports,
  exitOnError: false,
  // 异常处理
  exceptionHandlers: [
    new winston.transports.Console({
      format: consoleFormat
    }),
    new DailyRotateFile({
      filename: path.join(logDir, 'exceptions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d'
    })
  ],
  // Promise rejection处理
  rejectionHandlers: [
    new winston.transports.Console({
      format: consoleFormat
    }),
    new DailyRotateFile({
      filename: path.join(logDir, 'rejections-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d'
    })
  ]
});

/**
 * 扩展日志方法
 */

/**
 * 记录API请求日志
 * @param {Object} req Express请求对象
 * @param {string} message 日志消息
 * @param {Object} meta 额外元数据
 */
logger.apiRequest = function(req, message = 'API请求', meta = {}) {
  this.info(message, {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    ...meta
  });
};

/**
 * 记录API响应日志
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 * @param {number} startTime 请求开始时间
 * @param {string} message 日志消息
 * @param {Object} meta 额外元数据
 */
logger.apiResponse = function(req, res, startTime, message = 'API响应', meta = {}) {
  const duration = Date.now() - startTime;
  this.info(message, {
    method: req.method,
    url: req.url,
    statusCode: res.statusCode,
    responseTime: duration + 'ms',
    ...meta
  });
};

/**
 * 记录性能日志
 * @param {string} operation 操作名称
 * @param {number} duration 持续时间(ms)
 * @param {Object} meta 额外元数据
 */
logger.performance = function(operation, duration, meta = {}) {
  this.info(`性能监控: ${operation}`, {
    operation,
    duration: duration + 'ms',
    ...meta
  });
};

/**
 * 记录模型调用日志
 * @param {string} model 模型名称
 * @param {string} input 输入内容
 * @param {string} output 输出内容
 * @param {number} duration 调用时长
 * @param {Object} meta 额外元数据
 */
logger.modelCall = function(model, input, output, duration, meta = {}) {
  this.info('模型调用', {
    model,
    inputLength: input ? input.length : 0,
    outputLength: output ? output.length : 0,
    duration: duration + 'ms',
    ...meta
  });
};

/**
 * 在开发环境下添加调试信息
 */
if (process.env.NODE_ENV === 'development') {
  logger.debug('日志系统初始化完成', {
    logLevel: logger.level,
    logDir: logDir,
    transportsCount: logger.transports.length
  });
}

module.exports = logger;

