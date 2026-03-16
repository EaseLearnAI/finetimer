const axios = require('axios');
require('../config/loadEnv');

class ImageAnalysisService {
  constructor() {
    this.apiKey = process.env.DASHSCOPE_API_KEY;
    // 直接使用OpenAI兼容模式，避免原生API的复杂格式问题
    this.baseURL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
    
    if (!this.apiKey) {
      throw new Error('缺少DASHSCOPE_API_KEY环境变量');
    }
  }

  /**
   * 使用通义千问分析图片
   * @param {string} imageUrl - 图片URL
   * @param {string} prompt - 分析提示词
   * @returns {Promise<Object>} 分析结果
   */
  async analyzeImageWithQwen(imageUrl, prompt) {
    try {
      const requestBody = {
        model: 'qwen-vl-max',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl
                }
              },
              {
                type: 'text',
                text: prompt
              }
            ]
          }
        ],
        max_tokens: 2048,
        temperature: 0.7,
        top_p: 0.8,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      };

      console.log('🔗 发送请求到通义千问API:', {
        url: this.baseURL,
        model: requestBody.model,
        imageUrl: imageUrl,
        prompt: prompt
      });

      const response = await axios.post(this.baseURL, requestBody, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
          // 移除 X-DashScope-DataInspection 请求头，因为 Qwen-VL 系列模型不支持
        },
        timeout: 60000 // 增加到60秒超时
      });

      if (response.data.choices && response.data.choices.length > 0) {
        const choice = response.data.choices[0];
        return {
          content: choice.message.content,
          finishReason: choice.finish_reason,
          usage: response.data.usage || null
        };
      } else {
        throw new Error('API返回结果格式异常');
      }
      
    } catch (error) {
      console.error('❌ 通义千问API调用失败:', {
        error: error.message,
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          timeout: error.config?.timeout,
          headers: error.config?.headers
        }
      });

      if (error.response) {
        // API返回错误
        const errorData = error.response.data;
        throw new Error(`通义千问API错误: ${errorData.message || errorData.code || '未知错误'}`);
      } else if (error.request) {
        // 网络请求错误
        throw new Error(`网络请求失败: ${error.message}`);
      } else {
        // 其他错误
        throw error;
      }
    }
  }


}

// 创建服务实例
const imageAnalysisService = new ImageAnalysisService();

/**
 * 分析图片的主函数
 * @param {string} imageUrl - 图片URL
 * @param {string} prompt - 分析提示词
 * @returns {Promise<Object>} 分析结果
 */
async function analyzeImageWithQwen(imageUrl, prompt) {
  try {
    // 直接使用OpenAI兼容模式，避免原生API的复杂格式问题
    return await imageAnalysisService.analyzeImageWithQwen(imageUrl, prompt);
  } catch (error) {
    console.error('图片分析失败:', error.message);
    throw error;
  }
}

module.exports = {
  analyzeImageWithQwen,
  ImageAnalysisService
};



