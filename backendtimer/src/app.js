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
const userRoutes = require('./routes/user');
const pomodoroRoutes = require('./routes/pomodoro');
const taskRoutes = require('./routes/task');
const collectionRoutes = require('./routes/collection');
const aiRoutes = require('./AIsiri/routes/ai_routes');

// 导入中间件
const { authenticateToken, optionalAuth } = require('./middleware/auth');

// 创建Express应用
const app = express();

// 连接数据库（测试环境默认跳过，除非显式强制）
if (process.env.NODE_ENV !== 'test' || process.env.FORCE_DB === 'true') {
  connectDB();
} else {
  console.log('⏭️  测试环境下跳过数据库连接');
}

// 应用中间件
app.use(helmet()); // 安全头部
app.use(cors()); // 跨域资源共享
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } })); // HTTP请求日志
app.use(express.json({ limit: '10mb' })); // JSON解析
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // URL编码解析

// 静态文件服务
app.use(express.static(path.join(__dirname, '../public')));

// 路由
app.use('/api/users', userRoutes); // 用户路由（包含不需要认证的注册和登录）

// 开发环境下使用可选认证，生产环境使用强制认证
const authMiddleware = process.env.NODE_ENV === 'development' ? optionalAuth : authenticateToken;

app.use('/api/pomodoro', authMiddleware, pomodoroRoutes); // 番茄钟路由
app.use('/api/tasks', authMiddleware, taskRoutes); // 任务路由
app.use('/api/collections', authMiddleware, collectionRoutes); // 任务集路由
app.use('/api/ai', authMiddleware, aiRoutes); // AI路由

// 基本路由
app.get('/', (req, res) => {
  res.json({ message: '欢迎使用AIsiri后端API' });
});

// 404处理
app.use('*', (req, res) => {
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