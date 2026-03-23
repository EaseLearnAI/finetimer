'use strict';

/**
 * 统一 LLM 调用客户端
 * 封装通义千问 API 调用，供所有智能体复用
 */

const axios = require('axios');
const logger = require('../utils/logger');

class LLMClient {
  constructor() {
    this.apiKey = process.env.DASHSCOPE_API_KEY;
    this.baseURL = 'https://dashscope.aliyuncs.com/compatible-mode/v1';
    this.model = 'qwen-plus';

    if (!this.apiKey) {
      throw new Error('DASHSCOPE_API_KEY 环境变量未设置');
    }
  }

  async chat(messages, options = {}) {
    const {
      temperature = 0.7,
      maxTokens = 500,
      timeout = 30000,
      responseFormat,
    } = options;

    const startTime = Date.now();

    const requestData = {
      model: this.model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: false,
    };

    if (responseFormat) {
      requestData.response_format = responseFormat;
    }

    try {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        requestData,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout,
        }
      );

      if (!response.data.choices || response.data.choices.length === 0) {
        throw new Error('API 响应中没有 choices 数据');
      }

      return {
        content: response.data.choices[0].message.content,
        usage: response.data.usage,
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      logger.error('LLM 调用失败', {
        error: error.message,
        status: error.response?.status,
        responseTime: Date.now() - startTime,
      });

      if (error.response?.status === 401) throw new Error('API 密钥无效');
      if (error.response?.status === 429) throw new Error('API 频率超限');
      if (error.code === 'ECONNABORTED') throw new Error('API 调用超时');
      throw error;
    }
  }

  async chatJSON(messages, options = {}) {
    const result = await this.chat(messages, {
      ...options,
      temperature: options.temperature ?? 0.1,
    });

    try {
      const cleaned = result.content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('响应中无 JSON');
      result.parsed = JSON.parse(jsonMatch[0]);
    } catch (e) {
      logger.warn('JSON 解析失败，返回原始内容', { error: e.message });
      result.parsed = null;
    }

    return result;
  }
}

module.exports = new LLMClient();
