'use strict';

const BaseChain = require('./base_chain');

class QuestionGeneratorChain extends BaseChain {
  constructor() {
    super();
  }

  async generateQuestions(userGoal, goalType) {
    this.logChainStart('问题生成', { userGoal, goalType });

    try {
      // 格式化prompt
      const prompt = this.formatPrompt('question_generator', {
        user_goal: userGoal,
        goal_type: goalType
      });

      // 调用LLM
      const response = await this.callLLM(prompt, {
        temperature: 0.8, // 问题生成需要一定创造性
        max_tokens: 800
      });

      // 解析JSON响应
      const result = await this.parseJSONResponse(response);

      // 验证问题格式
      if (result.questions && Array.isArray(result.questions) && result.questions.length > 0) {
        console.log(`✅ 生成${result.questions.length}个问题`);
        result.questions.forEach((q, index) => {
          console.log(`❓ 问题${index + 1}: ${q}`);
        });
      } else {
        console.warn('⚠️  问题生成失败，使用默认问题');
        result.questions = this.getDefaultQuestions(goalType);
        result.greeting = "我需要了解一些信息来帮你制定更好的计划。";
      }

      this.logChainEnd('问题生成', result);
      return result;

    } catch (error) {
      console.error('❌ 问题生成失败:', error.message);
      
      // 返回默认问题
      const fallbackResult = {
        questions: this.getDefaultQuestions(goalType),
        greeting: "系统遇到了一些问题，但我还是想了解一些信息来帮助你。",
        error: error.message
      };
      
      this.logChainEnd('问题生成', fallbackResult);
      return fallbackResult;
    }
  }

  getDefaultQuestions(goalType) {
    const defaultQuestions = {
      goal_planning: [
        "你希望什么时候完成这个目标？",
        "你目前在这方面有什么基础吗？",
        "每天大概能投入多少时间？",
        "你觉得最大的困难可能是什么？"
      ],
      habit_formation: [
        "你希望多久执行一次这个习惯？",
        "什么时间段最适合你执行这个习惯？",
        "你之前有过类似的习惯吗？",
        "你觉得什么情况下最容易坚持？"
      ],
      simple_todo: [
        "这个任务有截止时间吗？",
        "大概需要多长时间完成？"
      ]
    };

    return defaultQuestions[goalType] || defaultQuestions.simple_todo;
  }

  async generateFollowUpQuestions(previousAnswers, missingInfo) {
    this.logChainStart('补充问题生成', { previousAnswers, missingInfo });

    try {
      const prompt = `
基于用户之前的回答，生成一些补充问题来获取遗漏的关键信息。

之前的回答：${JSON.stringify(previousAnswers)}
需要补充的信息：${missingInfo.join(', ')}

请生成2-3个针对性的补充问题，要求：
1. 简洁明了
2. 有助于完善计划制定
3. 避免重复之前已问的问题

返回JSON格式：{"questions": ["问题1", "问题2"]}
`;

      const response = await this.callLLM(prompt, {
        temperature: 0.7,
        max_tokens: 300
      });

      const result = await this.parseJSONResponse(response);
      
      this.logChainEnd('补充问题生成', result);
      return result;

    } catch (error) {
      console.error('❌ 补充问题生成失败:', error.message);
      return {
        questions: ["还有什么需要补充的信息吗？"],
        error: error.message
      };
    }
  }
}

module.exports = QuestionGeneratorChain;