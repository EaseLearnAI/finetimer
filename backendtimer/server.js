'use strict';

require('dotenv').config();

const app = require('./src/app');
const logger = require('./src/config/logger');

// 设置端口
const PORT = process.env.PORT || 3000;

// 启动服务器
const server = app.listen(PORT, () => {
  logger.info(`服务器运行在端口 ${PORT}`);
});

// 处理未捕获的异常
process.on('unhandledRejection', (err, promise) => {
  logger.error(`未处理的拒绝: ${err.message}`);
  server.close(() => {
    process.exit(1);
  });
});

// 处理未捕获的异常
process.on('uncaughtException', (err) => {
  logger.error(`未捕获的异常: ${err.message}`);
  process.exit(1);
});