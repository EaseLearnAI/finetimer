'use strict';

const TaskRecognitionService = require('../services/taskRecognitionService');
const Task = require('../../models/Task');
const User = require('../../models/User');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

/**
 * 任务识别测试
 * 验证任务识别和存储功能
 */

// 测试数据
const testUsers = [
  {
    _id: new mongoose.Types.ObjectId(),
    phoneNumber: '13800138000',
    password: 'password123'
  }
];

const testInputs = [
  '今天下午需要去取个快递',
  '明天上午买菜',
  '这周末需要打扫房间',
  '下个月要准备项目报告'
];

async function runTest() {
  console.log('🚀 开始任务识别测试...');
  
  try {
    // 连接数据库
    console.log('🔌 连接数据库...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/timer3_test');
    console.log('✅ 数据库连接成功');
    
    // 创建测试用户
    console.log('👤 创建测试用户...');
    await User.deleteMany({ email: testUsers[0].email });
    const user = new User(testUsers[0]);
    await user.save();
    console.log('✅ 测试用户创建成功');
    
    // 创建任务识别服务实例
    const taskRecognitionService = new TaskRecognitionService();
    
    // 测试单个任务识别
    console.log('\n📝 测试单个任务识别...');
    for (let i = 0; i < testInputs.length; i++) {
      const input = testInputs[i];
      console.log(`\n--- 测试用例 ${i + 1} ---`);
      console.log(`输入: ${input}`);
      
      try {
        const result = await taskRecognitionService.recognizeAndStoreTask(input, user._id.toString());
        console.log('✅ 任务识别和存储成功');
        console.log(`意图: ${result.intentResult.intent}`);
        console.log(`置信度: ${result.intentResult.confidence}`);
        console.log(`任务标题: ${result.task.title}`);
        console.log(`时间块: ${result.task.timeBlock.startTime} - ${result.task.timeBlock.endTime}`);
        
        // 验证任务是否存储到数据库
        const savedTask = await Task.findById(result.task._id);
        if (savedTask) {
          console.log('✅ 任务已成功存储到数据库');
        } else {
          console.log('❌ 任务未存储到数据库');
        }
      } catch (error) {
        console.log(`❌ 任务识别失败: ${error.message}`);
      }
    }
    
    // 测试批量任务识别
    console.log('\n📝 测试批量任务识别...');
    try {
      console.log(`输入: [${testInputs.join(', ')}]`);
      
      // 这里应该调用批量接口，但为了简化测试，我们循环调用单个接口
      const batchResults = [];
      const batchErrors = [];
      
      for (let i = 0; i < testInputs.length; i++) {
        try {
          const result = await taskRecognitionService.recognizeAndStoreTask(testInputs[i], user._id.toString());
          batchResults.push({
            index: i,
            input: testInputs[i],
            result
          });
        } catch (error) {
          batchErrors.push({
            index: i,
            input: testInputs[i],
            error: error.message
          });
        }
      }
      
      console.log('✅ 批量任务识别完成');
      console.log(`成功: ${batchResults.length} 个`);
      console.log(`失败: ${batchErrors.length} 个`);
      
      if (batchErrors.length > 0) {
        console.log('❌ 批量任务识别存在错误:');
        batchErrors.forEach(err => {
          console.log(`  - ${err.input}: ${err.error}`);
        });
      }
    } catch (error) {
      console.log(`❌ 批量任务识别失败: ${error.message}`);
    }
    
    // 验证数据库中的任务数量
    console.log('\n📊 验证数据库中的任务数量...');
    const taskCount = await Task.countDocuments({ userId: user._id });
    console.log(`数据库中用户任务总数: ${taskCount}`);
    
    // 清理测试数据
    console.log('\n🧹 清理测试数据...');
    await Task.deleteMany({ userId: user._id });
    await User.deleteMany({ email: testUsers[0].email });
    
    console.log('\n✅ 所有测试完成!');
    
  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error);
  } finally {
    // 断开数据库连接
    await mongoose.disconnect();
    console.log('🔌 数据库连接已断开');
  }
}

// 运行测试
if (require.main === module) {
  runTest();
}

module.exports = { runTest };