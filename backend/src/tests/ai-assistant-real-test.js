'use strict';

const mongoose = require('mongoose');
const AIAssistant = require('../models/AIAssistant');
const User = require('../models/User');

// 真实账户信息
const realUserData = {
  phoneNumber: '18176606006',
  password: '123456'
};

// 测试函数
async function testAIAssistantWithRealUser() {
  try {
    console.log('🧪 开始使用真实账户测试AI助手功能...\n');

    // 1. 查找真实用户
    console.log('1. 查找真实用户...');
    const user = await User.findByPhoneNumber(realUserData.phoneNumber);
    if (!user) {
      console.log('❌ 用户不存在，请先注册');
      return;
    }
    console.log('✅ 找到用户:', {
      id: user._id,
      phoneNumber: user.phoneNumber,
      nickname: user.nickname
    });

    // 2. 测试查找或创建AI助手
    console.log('\n2. 测试查找或创建AI助手...');
    let assistant = await AIAssistant.findOrCreateByUserId(user._id);
    console.log('✅ AI助手信息:', {
      id: assistant._id,
      name: assistant.name,
      heartValue: assistant.heartValue,
      createdAt: assistant.createdAt,
      updatedAt: assistant.updatedAt
    });

    // 3. 测试更新名称
    console.log('\n3. 测试更新AI助手名称...');
    const newName = '我的专属AI助手_' + Date.now();
    await assistant.updateName(newName);
    console.log('✅ 名称更新成功:', assistant.name);

    // 4. 测试增加心动值
    console.log('\n4. 测试增加心动值...');
    const oldHeartValue = assistant.heartValue;
    await assistant.increaseHeartValue();
    console.log('✅ 心动值增加成功，从', oldHeartValue, '增加到', assistant.heartValue);

    // 5. 测试再次增加心动值
    console.log('\n5. 测试再次增加心动值...');
    const currentHeartValue = assistant.heartValue;
    await assistant.increaseHeartValue();
    console.log('✅ 心动值再次增加成功，从', currentHeartValue, '增加到', assistant.heartValue);

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

    // 7. 显示最终状态
    console.log('\n📊 最终AI助手状态:');
    console.log('名称:', foundAssistant.name);
    console.log('心动值:', foundAssistant.heartValue);
    console.log('创建时间:', foundAssistant.createdAt);
    console.log('最后更新时间:', foundAssistant.updatedAt);

    console.log('\n🎉 所有功能测试通过！');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('错误详情:', error);
  } finally {
    // 不清理数据，保持测试结果
    console.log('\n💾 测试数据已保存，未清理');
    
    // 关闭数据库连接
    await mongoose.connection.close();
    console.log('🔌 数据库连接已关闭');
  }
}

// 运行测试
if (require.main === module) {
  // 连接数据库
  mongoose.connect('mongodb://localhost:27017/aisiri', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }).then(() => {
    console.log('📡 连接到数据库: aisiri');
    testAIAssistantWithRealUser();
  }).catch(error => {
    console.error('❌ 数据库连接失败:', error.message);
  });
}

module.exports = { testAIAssistantWithRealUser };
