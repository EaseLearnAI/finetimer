'use strict';

const OpenAI = require('openai');
const path = require('path');
const fs = require('fs');

class LLMConfig {
  constructor() {
    this.mockMode = process.env.MOCK_LLM === 'true' || process.env.NODE_ENV === 'test';
    this.loadAPIKey();
    this.initializeClient();
  }

  loadAPIKey() {
    try {
      if (this.mockMode) {
        this.apiKey = 'mock-api-key';
        this.model = process.env.LLM_MODEL || 'qwen-plus';
        console.log('🧪 MOCK LLM 模式已启用');
        return;
      }

      // 读取API密钥文件（优先从环境变量读取）
      const envKey = process.env.OPENAI_API_KEY || process.env.DASHSCOPE_API_KEY;
      const envModel = process.env.LLM_MODEL;
      if (envKey) {
        this.apiKey = envKey.trim();
        this.model = (envModel || 'qwen-plus').trim();
      } else {
        const apiKeyPath = path.join(__dirname, '../../../doc/APIkey');
        const apiKeyContent = fs.readFileSync(apiKeyPath, 'utf8');
        const lines = apiKeyContent.trim().split('\n');
        this.apiKey = lines[0].trim();
        this.model = (lines[2] ? lines[2].trim() : 'qwen-plus');
      }

      console.log('✅ API配置加载成功');
      console.log(`📝 使用模型: ${this.model}`);
    } catch (error) {
      console.error('❌ 无法加载API密钥:', error.message);
      throw error;
    }
  }

  initializeClient() {
    try {
      if (this.mockMode) {
        this.client = {
          chat: {
            completions: {
              create: async (options) => {
                // 简单的mock响应
                return {
                  choices: [{ message: { content: '{"mock":true}' } }],
                  usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
                };
              }
            }
          }
        };
        console.log('🧪 使用 Mock OpenAI 客户端');
        return;
      }

      this.client = new OpenAI({
        apiKey: this.apiKey,
        baseURL: process.env.OPENAI_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1'
      });
      console.log('✅ OpenAI客户端初始化成功');
    } catch (error) {
      console.error('❌ OpenAI客户端初始化失败:', error.message);
      throw error;
    }
  }

  async testConnection() {
    try {
      console.log('🔗 测试LLM连接...');
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: "Hello, please respond with 'Connection successful!'" }
        ],
        max_tokens: 50
      });
      
      console.log('✅ LLM连接测试成功');
      console.log('📤 响应:', response.choices[0].message.content);
      return true;
    } catch (error) {
      console.error('❌ LLM连接测试失败:', error.message);
      return false;
    }
  }

  getClient() {
    return this.client;
  }

  getModel() {
    return this.model;
  }
}

module.exports = LLMConfig;