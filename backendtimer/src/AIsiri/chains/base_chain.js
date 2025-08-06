'use strict';

const LLMConfig = require('../config/llm_config');
const PromptLoader = require('../utils/prompt_loader');

class BaseChain {
  constructor() {
    this.llmConfig = new LLMConfig();
    this.promptLoader = new PromptLoader();
    this.client = this.llmConfig.getClient();
    this.model = this.llmConfig.getModel();
  }

  async callLLM(prompt, options = {}) {
    try {
      console.log('🤖 调用LLM...');
      console.log('📤 输入prompt长度:', prompt.length);
      
      const requestOptions = {
        model: this.model,
        messages: [
          { role: "user", content: prompt }
        ],
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 2000,
        ...options
      };

      const response = await this.client.chat.completions.create(requestOptions);
      
      const result = response.choices[0].message.content;
      console.log('📥 LLM响应长度:', result.length);
      console.log('💰 Token使用:', response.usage);
      
      return result;
    } catch (error) {
      console.error('❌ LLM调用失败:', error.message);
      throw error;
    }
  }

  async parseJSONResponse(response) {
    try {
      // 尝试从响应中提取JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log('✅ JSON解析成功');
        return parsed;
      } else {
        console.warn('⚠️  未找到JSON格式，返回原始响应');
        return { raw_response: response };
      }
    } catch (error) {
      console.error('❌ JSON解析失败:', error.message);
      console.log('📄 原始响应:', response);
      return { error: 'JSON解析失败', raw_response: response };
    }
  }

  formatPrompt(promptName, variables) {
    return this.promptLoader.formatPrompt(promptName, variables);
  }

  logChainStart(chainName, input) {
    console.log(`\n🔗 === ${chainName} 链条开始 ===`);
    console.log('📥 输入数据:', input);
  }

  logChainEnd(chainName, output) {
    console.log('📤 输出结果:', output);
    console.log(`🔗 === ${chainName} 链条结束 ===\n`);
  }
}

module.exports = BaseChain;