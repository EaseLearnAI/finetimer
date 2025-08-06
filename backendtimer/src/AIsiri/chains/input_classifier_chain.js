'use strict';

const BaseChain = require('./base_chain');

class InputClassifierChain extends BaseChain {
  constructor() {
    super();
  }

  async classify(userInput) {
    this.logChainStart('输入分类', { userInput });

    try {
      // 格式化prompt
      const prompt = this.formatPrompt('input_classifier', {
        user_input: userInput
      });

      // 调用LLM
      const response = await this.callLLM(prompt, {
        temperature: 0.3, // 分类任务需要更确定的结果
        max_tokens: 200
      });

      // 解析JSON响应
      const result = await this.parseJSONResponse(response);

      // 验证分类结果
      const validCategories = ['simple_todo', 'goal_planning', 'habit_formation'];
      if (result.category && validCategories.includes(result.category)) {
        console.log(`✅ 分类成功: ${result.category} (置信度: ${result.confidence})`);
        console.log(`📝 分类原因: ${result.reason}`);
      } else {
        console.warn('⚠️  分类结果无效，使用默认分类');
        result.category = 'simple_todo';
        result.confidence = 0.5;
        result.reason = '无法确定分类，默认为简单待办';
      }

      this.logChainEnd('输入分类', result);
      return result;

    } catch (error) {
      console.error('❌ 输入分类失败:', error.message);
      
      // 返回默认分类
      const fallbackResult = {
        category: 'simple_todo',
        confidence: 0.3,
        reason: '分类服务异常，默认为简单待办',
        error: error.message
      };
      
      this.logChainEnd('输入分类', fallbackResult);
      return fallbackResult;
    }
  }

  async classifyBatch(userInputs) {
    console.log(`🔗 批量分类 ${userInputs.length} 个输入`);
    
    const results = [];
    for (let i = 0; i < userInputs.length; i++) {
      console.log(`📝 处理第 ${i + 1}/${userInputs.length} 个输入`);
      const result = await this.classify(userInputs[i]);
      results.push({
        input: userInputs[i],
        ...result
      });
    }
    
    console.log('✅ 批量分类完成');
    return results;
  }
}

module.exports = InputClassifierChain;