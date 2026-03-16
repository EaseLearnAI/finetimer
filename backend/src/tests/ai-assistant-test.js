'use strict';

const mongoose = require('mongoose');
const AIAssistant = require('../models/AIAssistant');
const User = require('../models/User');

// 测试数据
const testUserData = {
  phoneNumber: '18176606006',
  password: '123456',
  nickname: '测试用户'
};

const testAssistantData = {
  name: '我的专属AI',
  heartValue: 5
};

// 测试函数
async function testAIAssistant() {
  try {
    console.log('🧪 开始测试AI助手功能...\n');

    // 1. 测试创建用户
    console.log('1. 测试创建用户...');
    const user = new User(testUserData);
    await user.save();
    console.log('✅ 用户创建成功:', user._id);

    // 2. 测试查找或创建AI助手
    console.log('\n2. 测试查找或创建AI助手...');
    let assistant = await AIAssistant.findOrCreateByUserId(user._id);
    console.log('✅ AI助手创建成功:', {
      id: assistant._id,
      name: assistant.name,
      heartValue: assistant.heartValue
    });

    // 3. 测试更新名称
    console.log('\n3. 测试更新AI助手名称...');
    await assistant.updateName('我的专属AI助手');
    console.log('✅ 名称更新成功:', assistant.name);

    // 4. 测试增加心动值
    console.log('\n4. 测试增加心动值...');
    await assistant.increaseHeartValue();
    console.log('✅ 心动值增加成功，当前值:', assistant.heartValue);

    // 5. 测试再次增加心动值
    console.log('\n5. 测试再次增加心动值...');
    await assistant.increaseHeartValue();
    console.log('✅ 心动值再次增加成功，当前值:', assistant.heartValue);

    // 6. 测试查询AI助手信息
    console.log('\n6. 测试查询AI助手信息...');
    const foundAssistant = await AIAssistant.findOne({ userId: user._id });
    console.log('✅ 查询成功:', {
      id: foundAssistant._id,
      name: foundAssistant.name,
      heartValue: foundAssistant.heartValue,
      createdAt: foundAssistant.createdAt,
      updatedAt: foundAssistant.updatedAt
    });

    console.log('\n🎉 所有测试通过！');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  } finally {

    
    // 关闭数据库连接
    await mongoose.connection.close();
    console.log('🔌 数据库连接已关闭');
  }
}

// 运行测试
if (require.main === module) {
  // 连接测试数据库
  mongoose.connect('mongodb://localhost:27017/aisiri_test', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }).then(() => {
    console.log('📡 连接到测试数据库');
    testAIAssistant();
  }).catch(error => {
    console.error('❌ 数据库连接失败:', error.message);
  });
}

module.exports = { testAIAssistant };
