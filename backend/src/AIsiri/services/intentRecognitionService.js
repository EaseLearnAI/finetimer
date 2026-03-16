/**
 * 意图识别服务
 * 基于通义千问模型的意图识别核心服务
 */

const axios = require('axios');
const logger = require('../utils/logger');
const { 
  buildIntentRecognitionPrompt, 
  validateIntentResult,
  INTENT_TYPES,
  INTENT_DESCRIPTIONS 
} = require('../prompt/intent_recognition');

/**
 * 意图识别服务类
 */
class IntentRecognitionService {
  constructor() {
    this.apiKey = process.env.DASHSCOPE_API_KEY;
    this.baseURL = 'https://dashscope.aliyuncs.com/compatible-mode/v1';
    this.model = 'qwen-plus';
    
    if (!this.apiKey) {
      throw new Error('DASHSCOPE_API_KEY 环境变量未设置');
    }
    
    logger.info('意图识别服务初始化成功', {
      model: this.model,
      baseURL: this.baseURL,
      hasApiKey: !!this.apiKey
    });
  }

  /**
   * 执行意图识别
   * @param {string} userInput 用户输入文本
   * @param {Object} options 可选参数
   * @returns {Promise<Object>} 意图识别结果
   */
  async recognizeIntent(userInput, options = {}) {
    const startTime = Date.now();
    logger.info('开始意图识别', { 
      userInput, 
      inputLength: userInput.length,
      timestamp: new Date().toISOString()
    });

    try {
      // 输入验证
      if (!userInput || typeof userInput !== 'string' || userInput.trim().length === 0) {
        throw new Error('用户输入不能为空');
      }

      // 构建提示词
      const { messages } = buildIntentRecognitionPrompt(userInput.trim());
      
      logger.info('发送请求到通义千问模型', {
        messagesCount: messages.length,
        systemPromptLength: messages[0].content.length,
        userPromptLength: messages[1].content.length
      });

      // 调用通义千问API
      const response = await this.callQwenAPI(messages);

      logger.info('收到模型响应', {
        responseLength: response.length,
        responseTime: Date.now() - startTime + 'ms'
      });

      // 解析响应结果
      const result = await this.parseModelResponse(response, userInput);
      
      logger.info('意图识别完成', {
        intent: result.intent,
        confidence: result.confidence,
        processingTime: Date.now() - startTime + 'ms',
        success: true
      });

      return result;

    } catch (error) {
      logger.error('意图识别失败', {
        error: error.message,
        userInput,
        processingTime: Date.now() - startTime + 'ms',
        success: false
      });
      throw error;
    }
  }

  /**
   * 调用通义千问API
   * @param {Array} messages 消息数组
   * @returns {Promise<string>} API响应内容
   */
  async callQwenAPI(messages) {
    try {
      const requestData = {
        model: this.model,
        messages: messages,
        temperature: 0.1,
        max_tokens: 1000,
        stream: false
      };

      logger.info('准备调用通义千问API', {
        url: `${this.baseURL}/chat/completions`,
        model: this.model,
        messagesCount: messages.length
      });

      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30秒超时
        }
      );

      logger.info('通义千问API调用成功', {
        status: response.status,
        usage: response.data.usage,
        model: response.data.model
      });

      if (!response.data.choices || response.data.choices.length === 0) {
        throw new Error('API响应中没有choices数据');
      }

      return response.data.choices[0].message.content;

    } catch (error) {
      logger.error('通义千问API调用失败', {
        error: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });

      if (error.response?.status === 401) {
        throw new Error('API密钥无效或已过期');
      } else if (error.response?.status === 429) {
        throw new Error('API调用频率超限，请稍后重试');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('API调用超时，请检查网络连接');
      } else {
        throw new Error(`API调用失败: ${error.message}`);
      }
    }
  }

  /**
   * 解析模型响应
   * @param {string} responseContent 模型响应内容
   * @param {string} originalInput 原始用户输入
   * @returns {Promise<Object>} 解析后的结果
   */
  async parseModelResponse(responseContent, originalInput) {
    try {
      logger.info('开始解析模型响应', { 
        responseContent: responseContent.substring(0, 200) + '...'
      });

      // 尝试解析JSON
      let parsedResult;
      try {
        // 清理响应内容，移除可能的markdown标记
        const cleanedContent = responseContent
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .trim();
        
        parsedResult = JSON.parse(cleanedContent);
      } catch (parseError) {
        logger.warn('JSON解析失败，尝试备用解析方法', { 
          parseError: parseError.message,
          responseContent 
        });
        
        // 备用解析方法：提取可能的JSON部分
        const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResult = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('无法从响应中提取有效的JSON格式');
        }
      }

      // 验证结果格式
      if (!validateIntentResult(parsedResult)) {
        logger.warn('意图识别结果格式无效，使用默认值', { parsedResult });
        
        // 返回默认的对话意图
        return this.createDefaultResult(originalInput);
      }

      // 补全缺失字段
      const completeResult = {
        intent: parsedResult.intent,
        confidence: parsedResult.confidence || 0.8,
        reasoning: parsedResult.reasoning || '基于模型分析',
        extracted_info: parsedResult.extracted_info || {
          keywords: [],
          entities: {}
        },
        original_input: originalInput,
        timestamp: new Date().toISOString(),
        intent_description: INTENT_DESCRIPTIONS[parsedResult.intent]
      };

      logger.info('意图识别结果解析成功', {
        intent: completeResult.intent,
        confidence: completeResult.confidence,
        hasExtractedInfo: !!completeResult.extracted_info
      });

      return completeResult;

    } catch (error) {
      logger.error('解析模型响应失败', { 
        error: error.message,
        responseContent: responseContent.substring(0, 500)
      });
      
      // 返回默认结果
      return this.createDefaultResult(originalInput);
    }
  }

  /**
   * 创建默认的意图识别结果
   * @param {string} originalInput 原始输入
   * @returns {Object} 默认结果
   */
  createDefaultResult(originalInput) {
    logger.info('创建默认意图识别结果', { originalInput });
    
    return {
      intent: INTENT_TYPES.CONVERSATION,
      confidence: 0.5,
      reasoning: '无法准确识别意图，默认为对话类型',
      extracted_info: {
        keywords: [originalInput.split(' ').slice(0, 3)].flat(),
        entities: {}
      },
      original_input: originalInput,
      timestamp: new Date().toISOString(),
      intent_description: INTENT_DESCRIPTIONS[INTENT_TYPES.CONVERSATION],
      fallback: true
    };
  }

  /**
   * 批量意图识别
   * @param {string[]} inputs 用户输入数组
   * @returns {Promise<Object[]>} 意图识别结果数组
   */
  async recognizeIntentBatch(inputs) {
    logger.info('开始批量意图识别', { count: inputs.length });
    
    try {
      const results = await Promise.all(
        inputs.map(async (input, index) => {
          try {
            const result = await this.recognizeIntent(input);
            return { ...result, batch_index: index };
          } catch (error) {
            logger.error(`批量识别第${index}项失败`, { error: error.message, input });
            return this.createDefaultResult(input);
          }
        })
      );

      logger.info('批量意图识别完成', { 
        total: inputs.length,
        successful: results.filter(r => !r.fallback).length,
        failed: results.filter(r => r.fallback).length
      });

      return results;
    } catch (error) {
      logger.error('批量意图识别失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 获取支持的意图类型
   * @returns {Object} 意图类型和描述
   */
  getSupportedIntents() {
    return {
      types: INTENT_TYPES,
      descriptions: INTENT_DESCRIPTIONS,
      count: Object.keys(INTENT_TYPES).length
    };
  }

  /**
   * 健康检查
   * @returns {Promise<Object>} 服务状态
   */
  async healthCheck() {
    try {
      const testInput = "你好";
      const startTime = Date.now();
      
      await this.recognizeIntent(testInput);
      
      return {
        status: 'healthy',
        model: 'qwen-plus',
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = IntentRecognitionService;
