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
        max_tokens: 200,
        mock_type: 'classify'
      });

      // 解析JSON响应
      const result = await this.parseJSONResponse(response);

      // 验证分类结果
      const validCategories = ['simple_todo', 'goal_planning', 'habit_formation'];
      if (result.category && validCategories.includes(result.category)) {
        console.log(`✅ 分类成功: ${result.category} (置信度: ${result.confidence})`);
        console.log(`📝 分类原因: ${result.reason}`);
        
        // 如果是习惯养成，处理习惯类型
        if (result.category === 'habit_formation') {
          result.habit_type = result.habit_type || this.extractHabitType(userInput);
          console.log(`🏃 习惯类型: ${result.habit_type}`);
        }
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

  /**
   * 从用户输入中提取习惯类型
   */
  extractHabitType(userInput) {
    const habitTypeMap = {
      '学习': ['学习', '读书', '看书', '阅读', '背单词', '复习', '练习', '刷题', '背诵', '记忆', '教材', '课本'],
      '健身': ['健身', '锻炼', '运动', '跑步', '减肥', '增肌', '瑜伽', '游泳', '健身房', '有氧', '力量'],
      '睡眠': ['睡觉', '早睡', '早起', '作息', '睡眠', '休息', '起床'],
      '饮食': ['饮食', '吃饭', '节食', '营养', '减肥', '增重', '喝水', '蛋白质', '维生素'],
      '冥想': ['冥想', '静坐', '禅修', '正念', '冥思', '放松', '呼吸']
    };

    // 转换为小写进行匹配，提高准确性
    const lowerInput = userInput.toLowerCase();
    
    for (const [type, keywords] of Object.entries(habitTypeMap)) {
      if (keywords.some(keyword => lowerInput.includes(keyword.toLowerCase()))) {
        console.log(`🎯 匹配到习惯类型: ${type} (关键词: ${keyword})`);
        return type;
      }
    }

    console.log(`⚠️ 未匹配到明确习惯类型，输入内容: ${userInput}`);
    return '学习'; // 默认返回学习而不是其他，因为大部分习惯都与自我提升相关
  }
}

module.exports = InputClassifierChain;