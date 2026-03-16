const axios = require('axios');
const logger = require('../../config/logger');
require('../config/loadEnv');

class SpeechRecognitionService {
  constructor() {
    this.apiKey = process.env.DASHSCOPE_API_KEY;
    // 修复API端点：通义千问ASR使用多模态对话API
    this.baseUrl = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation';
    
    if (!this.apiKey) {
      logger.warn('DASHSCOPE_API_KEY 未配置，语音识别功能将不可用');
    }
  }

  /**
   * 使用通义千问ASR模型进行语音识别
   * @param {string} audioUrl - 音频文件的OSS URL
   * @returns {Promise<string>} 识别结果文本
   */
  async recognizeSpeech(audioUrl) {
    try {
      if (!this.apiKey) {
        throw new Error('语音识别服务未配置API密钥');
      }

      // 根据模型文档，通义千问ASR使用多模态对话格式
      const response = await axios.post(
        this.baseUrl,
        {
          model: 'qwen-audio-asr',
          input: {
            messages: [
              {
                role: 'user',
                content: [
                  {
                    audio: audioUrl
                  }
                ]
              }
            ]
          },
          parameters: {
            result_format: 'message'
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 60000 // 60秒超时，语音识别需要更长时间
        }
      );

      // 解析通义千问ASR的返回格式
      if (response.data && response.data.output && response.data.output.choices && response.data.output.choices[0]) {
        const choice = response.data.output.choices[0];
        if (choice.message && choice.message.content && choice.message.content[0] && choice.message.content[0].text) {
          return choice.message.content[0].text;
        }
      }
      
      // 如果没有找到预期的文本内容，记录完整响应用于调试
      logger.warn('语音识别返回结果格式异常，完整响应:', JSON.stringify(response.data, null, 2));
      throw new Error('语音识别返回结果格式异常');
      
    } catch (error) {
      logger.error('语音识别失败:', error.message);
      if (error.response) {
        logger.error('API响应错误:', error.response.status, error.response.data);
      }
      throw new Error(`语音识别失败: ${error.message}`);
    }
  }

  /**
   * 使用Paraformer模型进行语音识别（备用方案）
   * @param {string} audioUrl - 音频文件的OSS URL
   * @returns {Promise<string>} 识别结果文本
   */
  async recognizeSpeechWithParaformer(audioUrl) {
    try {
      if (!this.apiKey) {
        throw new Error('语音识别服务未配置API密钥');
      }

      // Paraformer使用专门的语音识别API
      const response = await axios.post(
        'https://dashscope.aliyuncs.com/api/v1/services/aigc/text2audio/transcription',
        {
          model: 'paraformer-v2',
          input: {
            audio: audioUrl
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 60000
        }
      );

      if (response.data && response.data.output && response.data.output.text) {
        return response.data.output.text;
      } else {
        throw new Error('Paraformer语音识别返回结果格式异常');
      }
    } catch (error) {
      logger.error('Paraformer语音识别失败:', error.message);
      if (error.response) {
        logger.error('API响应错误:', error.response.status, error.response.data);
      }
      throw new Error(`Paraformer语音识别失败: ${error.message}`);
    }
  }
}

module.exports = new SpeechRecognitionService();
