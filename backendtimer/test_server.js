'use strict';

// 创建一个简单的测试服务器来验证AI功能
const express = require('express');
const cors = require('cors');

// 导入数据库连接
const connectDB = require('./src/config/database');

// 只导入AI路由进行测试
const aiRoutes = require('./src/AIsiri/routes/ai_routes');

const app = express();

// 连接数据库
connectDB();

// 应用中间件
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 基本健康检查
app.get('/', (req, res) => {
  res.json({ 
    message: 'AI测试服务器运行正常',
    timestamp: new Date().toISOString()
  });
});

// AI路由
app.use('/api/ai', aiRoutes);

// 错误处理
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    error: '服务器内部错误',
    message: err.message
  });
});

// 启动服务器
const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
  console.log(`🚀 AI测试服务器启动成功！`);
  console.log(`📍 访问地址: http://localhost:${PORT}`);
  console.log(`🤖 AI接口: http://localhost:${PORT}/api/ai/health`);
});

// 处理未捕获的异常
process.on('unhandledRejection', (err, promise) => {
  console.error(`未处理的拒绝: ${err.message}`);
  server.close(() => {
    process.exit(1);
  });
});

process.on('uncaughtException', (err) => {
  console.error(`未捕获的异常: ${err.message}`);
  process.exit(1);
});