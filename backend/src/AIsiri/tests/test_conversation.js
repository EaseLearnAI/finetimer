const axios = require('axios');
const mongoose = require('mongoose');

// MongoDB连接
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aisiri';

// API基础URL
const BASE_URL = 'http://localhost:3000/api';

// 测试用户信息
const testUser = {
  phoneNumber: '13800138000',
  password: 'testpassword123',
  nickname: 'TestUser'
};

let authToken = null;
  let currentSessionId = null;

// 测试用例
const testCases = [
  {
    input: "你好，今天天气怎么样？",
    description: "普通聊天对话"
  },
  {
    input: "我想创建一个任务，明天下午3点提醒我开会",
    description: "任务创建意图"
  },
  {
    input: "帮我安排一下这周的日程，我需要在周二和周四有空",
    description: "日程规划意图"
  },
  {
    input: "搜索一下最近的咖啡店",
    description: "外部工具调用意图"
  },
  {
    input: "我今天心情不太好，能安慰我一下吗？",
    description: "情绪安慰对话"
  }
];

async function registerAndLogin() {
  console.log('开始用户注册和登录...');
  
  try {
    // 1. 尝试注册用户
    console.log('\n1. 尝试注册测试用户...');
    try {
      const registerResponse = await axios.post(`${BASE_URL}/users/register`, testUser);
      console.log('✅ 用户注册成功');
      console.log(`   用户ID: ${registerResponse.data.data.user.id}`);
    } catch (error) {
      if (error.response && error.response.status === 409) {
        console.log('ℹ️  用户已存在，跳过注册');
      } else {
        throw error;
      }
    }
    
    // 2. 用户登录
    console.log('\n2. 用户登录...');
    const loginResponse = await axios.post(`${BASE_URL}/users/login`, {
      phoneNumber: testUser.phoneNumber,
      password: testUser.password
    });
    
    authToken = loginResponse.data.data.token;
    console.log('✅ 用户登录成功');
    console.log(`   访问令牌: ${authToken.substring(0, 20)}...`);
    
    return authToken;
  } catch (error) {
    console.log('❌ 注册/登录失败:', error.message);
    if (error.response) {
      console.log('   错误详情:', error.response.data);
    }
    throw error;
  }
}

async function testConversationFlow() {
  console.log('\n开始对话流程测试...');
  
  try {
    // 连接数据库
    await mongoose.connect(MONGODB_URI);
    console.log('✅ 数据库连接成功');
    
    // 测试每个用例
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      console.log(`\n--- 测试用例 ${i + 1}: ${testCase.description} ---`);
      console.log(`输入: ${testCase.input}`);
      
      try {
        // 1. 发送对话消息
        console.log('\n1. 发送对话消息...');
        // 构造请求数据，第一次发送时不提供sessionId
        const requestData = {
          message: testCase.input
        };
        
        // 如果已有sessionId，则添加到请求中
        if (currentSessionId) {
          requestData.sessionId = currentSessionId;
        }
        
        const conversationResponse = await axios.post(`${BASE_URL}/ai/conversation/send`, requestData, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        
        if (conversationResponse.data.success) {
          console.log('✅ 对话消息发送成功');
          console.log(`   会话ID: ${conversationResponse.data.data.sessionId}`);
          console.log(`   用户消息: ${conversationResponse.data.data.userMessage.content.substring(0, 50)}...`);
          console.log(`   AI回应: ${conversationResponse.data.data.assistantMessage.content.substring(0, 50)}...`);
          
          // 保存会话ID用于后续测试
          if (!currentSessionId) {
            currentSessionId = conversationResponse.data.data.sessionId;
          }
        } else {
          // 检查是否是因为意图类型不匹配导致的失败
          if (conversationResponse.data.error && conversationResponse.data.error.includes('不属于对话类型')) {
            console.log('ℹ️  消息意图不是对话类型，这是预期的行为');
            console.log(`   错误信息: ${conversationResponse.data.error}`);
          } else {
            console.log('❌ 对话消息发送失败:', conversationResponse.data.error);
          }
        }
        
      } catch (error) {
        console.log('❌ 测试失败:', error.message);
        if (error.response) {
          console.log('   错误详情:', error.response.data);
        }
      }
    }
    
    // 验证数据库中的对话记录
    console.log('\n--- 验证数据库记录 ---');
    const collections = await mongoose.connection.db.listCollections().toArray();
    const hasConversationCollection = collections.some(col => col.name === 'conversations');
    
    if (hasConversationCollection) {
      const Conversation = mongoose.model('Conversation', 
        require('../../models/Conversation').schema || 
        new mongoose.Schema({}, { strict: false }));
      
      const count = await Conversation.countDocuments();
      console.log(`✅ 对话集合存在，包含 ${count} 条记录`);
      
      if (count > 0) {
        const conversations = await Conversation.find().sort({ createdAt: -1 }).limit(5);
        console.log('最近的对话记录:');
        conversations.forEach((conv, index) => {
          console.log(`${index + 1}. [${conv.messageType}] ${conv.content.substring(0, 50)}...`);
        });
      }
    } else {
      console.log('⚠️  对话集合不存在');
    }
    
    // 获取对话历史
    console.log('\n--- 获取对话历史 ---');
    try {
      const historyResponse = await axios.get(`${BASE_URL}/ai/conversation/history?sessionId=${currentSessionId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (historyResponse.data.success) {
        console.log(`✅ 对话历史获取成功，共 ${historyResponse.data.data.conversations.length} 条记录`);
        historyResponse.data.data.conversations.slice(0, 3).forEach((conv, index) => {
          console.log(`   ${index + 1}. [${conv.messageType}] ${conv.content.substring(0, 50)}...`);
        });
      } else {
        console.log('❌ 对话历史获取失败:', historyResponse.data.error);
      }
    } catch (error) {
      console.log('❌ 获取对话历史失败:', error.message);
      if (error.response) {
        console.log('   错误详情:', error.response.data);
      }
    }
    
    console.log('\n✅ 所有测试完成');
    
  } catch (error) {
    console.log('❌ 测试过程中出现错误:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔒 数据库连接已关闭');
  }
}

async function runTest() {
  console.log('开始完整的对话功能测试...');
  
  try {
    // 用户注册和登录
    await registerAndLogin();
    
    // 对话流程测试
    await testConversationFlow();
    
  } catch (error) {
    console.log('❌ 测试失败:', error.message);
  }
}

// 运行测试
runTest();