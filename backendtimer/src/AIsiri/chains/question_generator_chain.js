'use strict';

const BaseChain = require('./base_chain');

class QuestionGeneratorChain extends BaseChain {
  constructor() {
    super();
  }

  async generateQuestions(userGoal, goalType, options = {}) {
    this.logChainStart('问题生成', { userGoal, goalType, options });

    try {
      // 为习惯类型生成专门的问题
      if (goalType === 'habit_formation' && options.habitType) {
        const habitQuestions = this.getHabitSpecificQuestions(options.habitType, userGoal);
        const result = {
          questions: habitQuestions.questions,
          greeting: habitQuestions.greeting,
          habit_type: options.habitType
        };
        
        console.log(`✅ 生成${result.questions.length}个${options.habitType}习惯问题`);
        result.questions.forEach((q, index) => {
          console.log(`❓ 问题${index + 1}: ${q}`);
        });
        
        this.logChainEnd('问题生成', result);
        return result;
      }
      
      // 格式化prompt
      const prompt = this.formatPrompt('question_generator', {
        user_goal: userGoal,
        goal_type: goalType,
        habit_type: options.habitType || ''
      });

      // 调用LLM
      const response = await this.callLLM(prompt, {
        temperature: 0.8, // 问题生成需要一定创造性
        max_tokens: 800,
        mock_type: 'questions'
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
        result.questions = this.getDefaultQuestions(goalType, options.habitType);
        result.greeting = "我需要了解一些信息来帮你制定更好的计划。";
      }

      this.logChainEnd('问题生成', result);
      return result;

    } catch (error) {
      console.error('❌ 问题生成失败:', error.message);
      
      // 返回默认问题
      const fallbackResult = {
        questions: this.getDefaultQuestions(goalType, options.habitType),
        greeting: "系统遇到了一些问题，但我还是想了解一些信息来帮助你。",
        error: error.message
      };
      
      this.logChainEnd('问题生成', fallbackResult);
      return fallbackResult;
    }
  }

  getDefaultQuestions(goalType, habitType = null) {
    if (goalType === 'habit_formation' && habitType) {
      return this.getHabitSpecificQuestions(habitType).questions;
    }
    
    const defaultQuestions = {
      goal_planning: [
        "你想在这个目标上达到什么程度呢？",
        "什么时候开始比较合适，每天能花多少时间？",
        "之前有接触过相关的内容吗？"
      ],
      habit_formation: [
        "你打算多久做一次这个习惯呢？",
        "觉得什么时候做比较容易坚持？",
        "担心在坚持过程中会遇到什么困难吗？"
      ],
      simple_todo: [
        "这个任务有什么具体要求吗？",
        "什么时候需要完成呢？",
        "大概要花多长时间？"
      ]
    };

    return defaultQuestions[goalType] || defaultQuestions.simple_todo;
  }

  /**
   * 根据习惯类型生成专门的问题
   */
  getHabitSpecificQuestions(habitType, userGoal = '') {
    const habitQuestions = {
      '健身': {
        greeting: '想了解一下你的健身计划，这样能为你制定更合适的方案！',
        questions: [
          '你健身的主要目的是什么？（减肥/增肌/保持健康）',
          '想重点锻炼哪些部位呢？',
          '一般什么时候有空去健身？每次大概多长时间？'
        ]
      },
      '学习': {
        greeting: '想了解一下你的学习目标，这样能帮你制定更有效的学习计划！',
        questions: [
          '你想学习什么内容？目标是什么水平？',
          '每天大概能安排多长时间学习？',
          '你比较喜欢什么样的学习方式？'
        ]
      },
      '睡眠': {
        greeting: '想了解一下你的作息情况，帮你制定更好的睡眠计划！',
        questions: [
          '你希望几点睡觉，几点起床？',
          '现在的作息是怎样的？有什么影响睡眠的因素吗？',
          '工作或学习时间是怎么安排的？'
        ]
      },
      '饮食': {
        greeting: '想了解一下你的饮食目标，帮你制定合适的饮食计划！',
        questions: [
          '你的饮食目标是什么？（减肥/增重/健康饮食）',
          '有什么饮食偏好或限制吗？',
          '平时的用餐时间是怎样安排的？'
        ]
      },
      '冥想': {
        greeting: '想了解一下你对冥想的期望，帮你制定适合的练习计划！',
        questions: [
          '你希望通过冥想达到什么效果？',
          '之前有冥想经验吗？比较喜欢什么类型？',
          '每天什么时候比较适合冥想？'
        ]
      },
      '其他': {
        greeting: '想了解一下这个习惯的具体情况，帮你制定合适的计划！',
        questions: [
          '你希望多久做一次这个习惯？',
          '什么时候做比较容易坚持？',
          '担心在坚持过程中会遇到什么困难吗？'
        ]
      }
    };

    return habitQuestions[habitType] || habitQuestions['其他'];
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