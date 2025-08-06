'use strict';

const winston = require('winston');

// 创建日志记录器
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'aisiri-backend' },
  transports: [
    // 错误日志文件
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    // 所有日志文件
    new winston.transports.File({ filename: 'logs/combined.log' }),
    // 控制台输出
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// 确保日志目录存在
const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

module.exports = logger;