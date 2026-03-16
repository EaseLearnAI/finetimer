const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('../src/config/database');

async function initDatabase() {
  try {
    console.log('🗄️  连接数据库...');
    await connectDB();
    
    console.log('✅ 数据库连接成功');
    console.log('📊 数据库名称:', mongoose.connection.name);
    console.log('🔗 连接地址:', mongoose.connection.host);
    
    // 创建必要的索引
    console.log('📝 创建数据库索引...');
    
    // 这里可以添加创建索引的代码
    // 例如：await User.collection.createIndex({ email: 1 }, { unique: true });
    
    console.log('✅ 数据库初始化完成');
    process.exit(0);
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    process.exit(1);
  }
}

initDatabase();


