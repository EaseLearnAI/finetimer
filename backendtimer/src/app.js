'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

// 导入配置
const logger = require('./config/logger');
const connectDB = require('./config/database');

// 导入路由
const pomodoroRoutes = require('./routes/pomodoro');
const taskRoutes = require('./routes/task');
const collectionRoutes = require('./routes/collection');
const aiRoutes = require('./AIsiri/routes/ai_routes');

// 创建Express应用
const app = express();

// 连接数据库
connectDB();

// 应用中间件
app.use(helmet()); // 安全头部
app.use(cors()); // 跨域资源共享
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } })); // HTTP请求日志
app.use(express.json({ limit: '10mb' })); // JSON解析
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // URL编码解析

// 静态文件服务
app.use(express.static(path.join(__dirname, '../public')));

// 路由
app.use('/api/pomodoro', pomodoroRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/ai', aiRoutes);

// 基本路由
app.get('/', (req, res) => {
  res.json({ message: '欢迎使用AIsiri后端API' });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({ message: '路由未找到' });
});

// 全局错误处理中间件
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

module.exports = app;