'use strict';

const BaseChain = require('./base_chain');

class HabitProcessorChain extends BaseChain {
  constructor() {
    super();
  }

  async processHabit(habitGoal, userDetails = {}) {
    this.logChainStart('习惯处理', { habitGoal, userDetails });

    try {
      // 格式化用户详细信息
      const formattedDetails = this.formatUserDetails(userDetails);
      
      // 格式化prompt
      const prompt = this.formatPrompt('habit_processor', {
        habit_goal: habitGoal,
        user_details: formattedDetails
      });

      // 调用LLM
      const response = await this.callLLM(prompt, {
        temperature: 0.7,
        max_tokens: 2000
      });

      // 解析JSON响应
      const result = await this.parseJSONResponse(response);

      // 验证习惯计划格式
      const validatedHabit = this.validateHabitPlan(result, habitGoal);
      
      this.logChainEnd('习惯处理', validatedHabit);
      return validatedHabit;

    } catch (error) {
      console.error('❌ 习惯处理失败:', error.message);
      
      // 返回默认习惯计划
      const fallbackHabit = this.generateFallbackHabit(habitGoal);
      this.logChainEnd('习惯处理', fallbackHabit);
      return fallbackHabit;
    }
  }

  formatUserDetails(userDetails) {
    if (typeof userDetails === 'object' && userDetails !== null) {
      return Object.entries(userDetails)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');
    }
    return String(userDetails) || '无额外信息';
  }

  validateHabitPlan(habitPlan, originalGoal) {
    console.log('🔍 验证习惯计划格式...');
    
    const validatedPlan = {
      habit_analysis: {
        core_behavior: habitPlan.habit_analysis?.core_behavior || originalGoal,
        benefits: Array.isArray(habitPlan.habit_analysis?.benefits) 
          ? habitPlan.habit_analysis.benefits 
          : ['提升个人能力', '改善生活质量', '增强自律性'],
        challenges: Array.isArray(habitPlan.habit_analysis?.challenges)
          ? habitPlan.habit_analysis.challenges
          : ['初期动力不足', '时间安排困难', '坚持困难']
      },
      implementation_strategy: {
        minimal_viable_habit: habitPlan.implementation_strategy?.minimal_viable_habit || '从最小的行为开始',
        trigger_conditions: Array.isArray(habitPlan.implementation_strategy?.trigger_conditions)
          ? habitPlan.implementation_strategy.trigger_conditions
          : ['固定时间提醒', '环境触发'],
        reward_system: habitPlan.implementation_strategy?.reward_system || '完成后给自己小奖励',
        tracking_method: habitPlan.implementation_strategy?.tracking_method || '每日打卡记录'
      },
      schedule: {
        best_time: habitPlan.schedule?.best_time || 'morning',
        frequency: habitPlan.schedule?.frequency || 'daily',
        duration: habitPlan.schedule?.duration || '15-30分钟'
      },
      phased_plan: {
        week_1: habitPlan.phased_plan?.week_1 || '建立基础，适应节奏',
        week_2_4: habitPlan.phased_plan?.week_2_4 || '稳定执行，形成习惯',
        week_5_8: habitPlan.phased_plan?.week_5_8 || '深化习惯，提高质量',
        long_term: habitPlan.phased_plan?.long_term || '长期维持，持续优化'
      },
      task_template: this.validateTaskTemplate(habitPlan.task_template, originalGoal)
    };

    console.log('✅ 习惯计划验证完成');
    return validatedPlan;
  }

  validateTaskTemplate(taskTemplate, habitGoal) {
    return {
      title: taskTemplate?.title || `${habitGoal} - 每日习惯`,
      description: taskTemplate?.description || `执行${habitGoal}的日常习惯`,
      priority: ['low', 'medium', 'high'].includes(taskTemplate?.priority) 
        ? taskTemplate.priority : 'medium',
      timeBlock: {
        timeBlockType: ['morning', 'forenoon', 'afternoon', 'evening'].includes(taskTemplate?.timeBlock?.timeBlockType)
          ? taskTemplate.timeBlock.timeBlockType : 'morning',
        startTime: taskTemplate?.timeBlock?.startTime || '',
        endTime: taskTemplate?.timeBlock?.endTime || ''
      },
      recurrence: taskTemplate?.recurrence || 'daily',
      tags: Array.isArray(taskTemplate?.tags) 
        ? taskTemplate.tags 
        : ['habit', 'daily']
    };
  }

  generateFallbackHabit(habitGoal) {
    console.log('🛡️  生成默认习惯计划');
    
    return {
      habit_analysis: {
        core_behavior: habitGoal,
        benefits: ['培养自律', '改善生活', '个人成长'],
        challenges: ['初期适应', '坚持困难', '时间安排']
      },
      implementation_strategy: {
        minimal_viable_habit: `每天花5分钟${habitGoal}`,
        trigger_conditions: ['设定固定时间', '环境提醒'],
        reward_system: '完成后给自己肯定',
        tracking_method: '简单打卡记录'
      },
      schedule: {
        best_time: 'morning',
        frequency: 'daily',
        duration: '10-15分钟'
      },
      phased_plan: {
        week_1: '适应期，建立基础',
        week_2_4: '稳定期，形成规律',
        week_5_8: '深化期，提升质量',
        long_term: '维持期，持续改进'
      },
      task_template: {
        title: `${habitGoal} - 每日习惯`,
        description: `执行${habitGoal}的日常任务`,
        priority: 'medium',
        timeBlock: {
          timeBlockType: 'morning',
          startTime: '',
          endTime: ''
        },
        recurrence: 'daily',
        tags: ['habit', 'daily']
      },
      error: '习惯处理服务异常，返回基础计划'
    };
  }

  async generateHabitReminder(habitDetails) {
    this.logChainStart('习惯提醒生成', habitDetails);

    try {
      const prompt = `
根据以下习惯信息，生成一个友好的提醒消息：

习惯名称：${habitDetails.title}
执行时间：${habitDetails.timeBlock?.timeBlockType || '未指定'}
频率：${habitDetails.recurrence || 'daily'}
描述：${habitDetails.description}

请生成一个温馨、激励性的提醒消息，要求：
1. 语气友好亲切
2. 包含具体行动指导
3. 适当的鼓励语言
4. 简洁明了

返回JSON格式：
{
  "reminder_message": "提醒消息",
  "action_hint": "行动提示",
  "encouragement": "鼓励语"
}
`;

      const response = await this.callLLM(prompt, {
        temperature: 0.8,
        max_tokens: 300
      });

      const result = await this.parseJSONResponse(response);
      
      this.logChainEnd('习惯提醒生成', result);
      return result;

    } catch (error) {
      console.error('❌ 习惯提醒生成失败:', error.message);
      return {
        reminder_message: `该执行${habitDetails.title}了！`,
        action_hint: '按照计划执行即可',
        encouragement: '坚持就是胜利！',
        error: error.message
      };
    }
  }

  async analyzeHabitProgress(habitHistory, currentStreak) {
    this.logChainStart('习惯进度分析', { habitHistory, currentStreak });

    try {
      const prompt = `
分析以下习惯执行历史和当前连续天数：

执行历史：${JSON.stringify(habitHistory)}
当前连续天数：${currentStreak}

请分析：
1. 执行情况总体评价
2. 发现的模式或趋势
3. 改进建议
4. 鼓励和认可

返回JSON格式：
{
  "overall_rating": "总体评价",
  "patterns_found": ["模式1", "模式2"],
  "improvement_suggestions": ["建议1", "建议2"],
  "recognition_message": "认可和鼓励"
}
`;

      const response = await this.callLLM(prompt, {
        temperature: 0.7,
        max_tokens: 600
      });

      const result = await this.parseJSONResponse(response);
      
      this.logChainEnd('习惯进度分析', result);
      return result;

    } catch (error) {
      console.error('❌ 习惯进度分析失败:', error.message);
      return {
        overall_rating: '保持良好态势',
        patterns_found: ['定期执行'],
        improvement_suggestions: ['继续保持'],
        recognition_message: '你做得很好，继续加油！',
        error: error.message
      };
    }
  }
}

module.exports = HabitProcessorChain;