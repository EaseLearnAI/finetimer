'use strict';

const mongoose = require('mongoose');

// 数据库连接配置
const connectDB = async () => {
  try {
    // 从环境变量获取数据库连接字符串，如果没有则使用默认值
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aisiri', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;