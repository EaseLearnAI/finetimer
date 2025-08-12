'use strict';

const BaseChain = require('./base_chain');

class PlanAdjusterChain extends BaseChain {
  constructor() {
    super();
  }

  async adjustPlan(currentPlan, userFeedback, userMood = null) {
    this.logChainStart('计划调整', { currentPlan, userFeedback, userMood });

    try {
      // 分析用户情绪
      const analyzedMood = userMood || await this.analyzeMood(userFeedback);
      
      // 格式化当前计划
      const formattedPlan = JSON.stringify(currentPlan, null, 2);
      
      // 格式化prompt
      const prompt = this.formatPrompt('plan_adjuster', {
        current_plan: formattedPlan,
        user_feedback: userFeedback,
        user_mood: analyzedMood
      });

      // 调用LLM
      const response = await this.callLLM(prompt, {
        temperature: 0.7,
        max_tokens: 2000,
        mock_type: 'adjust'
      });

      // 解析JSON响应
      const result = await this.parseJSONResponse(response);

      // 验证调整结果
      const validatedResult = this.validateAdjustment(result, currentPlan);
      
      this.logChainEnd('计划调整', validatedResult);
      return validatedResult;

    } catch (error) {
      console.error('❌ 计划调整失败:', error.message);
      
      // 返回基础调整
      const fallbackResult = this.generateFallbackAdjustment(currentPlan, userFeedback);
      this.logChainEnd('计划调整', fallbackResult);
      return fallbackResult;
    }
  }

  async analyzeMood(userFeedback) {
    console.log('🧠 分析用户情绪...');
    
    const moodKeywords = {
      '疲惫': ['累', '疲惫', '累了', '太累', '疲劳', '困'],
      '焦虑': ['紧张', '焦虑', '压力大', '担心', '不安', '着急'],
      '无动力': ['没动力', '不想', '坚持不下去', '放弃', '懒'],
      '时间不够': ['时间不够', '太忙', '没时间', '太多事', '忙不过来'],
      '太难': ['太难', '难度大', '做不到', '不会', '复杂'],
      '太简单': ['太简单', '太容易', '没挑战', '无聊', '简单'],
      '满意': ['满意', '不错', '好的', '可以', '满意']
    };

    for (const [mood, keywords] of Object.entries(moodKeywords)) {
      if (keywords.some(keyword => userFeedback.includes(keyword))) {
        console.log(`✅ 识别到情绪: ${mood}`);
        return mood;
      }
    }

    console.log('ℹ️  未识别到特定情绪，使用中性状态');
    return '中性';
  }

  validateAdjustment(adjustment, originalPlan) {
    console.log('🔍 验证调整结果...');
    
    const validatedAdjustment = {
      adjustment_summary: adjustment.adjustment_summary || '计划已根据反馈进行调整',
      mood_analysis: adjustment.mood_analysis || '情绪分析结果',
      changes: Array.isArray(adjustment.changes) ? adjustment.changes : [],
      updated_plan: adjustment.updated_plan || originalPlan,
      encouragement: adjustment.encouragement || '请继续加油，我会持续支持你！'
    };

    // 验证变更记录
    validatedAdjustment.changes = validatedAdjustment.changes.map(change => ({
      type: ['add', 'remove', 'modify', 'reschedule'].includes(change.type) ? change.type : 'modify',
      target: change.target || '',
      description: change.description || '未描述的变更',
      reason: change.reason || '用户反馈'
    }));

    console.log(`✅ 调整验证完成，包含${validatedAdjustment.changes.length}个变更`);
    return validatedAdjustment;
  }

  generateFallbackAdjustment(currentPlan, userFeedback) {
    console.log('🛡️  生成默认调整方案');
    
    const adjustmentType = this.determineFallbackAdjustment(userFeedback);
    
    return {
      adjustment_summary: `根据反馈"${userFeedback}"进行基础调整`,
      mood_analysis: '系统基础分析',
      changes: [{
        type: 'modify',
        target: '整体计划',
        description: adjustmentType.description,
        reason: '用户反馈需要调整'
      }],
      updated_plan: this.applyFallbackAdjustment(currentPlan, adjustmentType),
      encouragement: adjustmentType.encouragement,
      error: '调整服务异常，返回基础调整'
    };
  }

  determineFallbackAdjustment(feedback) {
    const adjustmentMap = {
      '疲惫': {
        description: '减少任务量，延长休息时间',
        encouragement: '注意休息，适当放慢节奏是可以的。'
      },
      '时间不够': {
        description: '重新评估任务优先级，聚焦最重要的任务',
        encouragement: '时间管理很重要，我们先专注于核心任务。'
      },
      '太难': {
        description: '将复杂任务分解为更小的步骤',
        encouragement: '一步一步来，每个小进步都值得庆祝。'
      },
      '无动力': {
        description: '设置更小的阶段性目标，增加成就感',
        encouragement: '重新点燃动力需要时间，我们从小目标开始。'
      }
    };

    for (const [key, value] of Object.entries(adjustmentMap)) {
      if (feedback.includes(key)) {
        return value;
      }
    }

    return {
      description: '根据反馈进行适当调整',
      encouragement: '我会根据你的反馈来优化计划。'
    };
  }

  applyFallbackAdjustment(plan, adjustmentType) {
    // 简单的调整逻辑：减少任务量或降低优先级
    if (plan.collections && Array.isArray(plan.collections)) {
      return {
        ...plan,
        collections: plan.collections.map(collection => ({
          ...collection,
          tasks: collection.tasks.map(task => ({
            ...task,
            priority: task.priority === 'high' ? 'medium' : task.priority,
            description: `${task.description} (已根据反馈调整)`
          }))
        }))
      };
    }
    
    return plan;
  }

  async suggestMotivation(userMood, currentProgress) {
    this.logChainStart('动机建议', { userMood, currentProgress });

    try {
      const prompt = `
用户当前情绪状态：${userMood}
当前进度情况：${JSON.stringify(currentProgress)}

请提供适当的鼓励和动机建议，要求：
1. 针对性强，符合当前情绪状态
2. 积极正面，但不过度乐观
3. 提供具体的行动建议
4. 语气友好亲切

返回JSON格式：
{
  "motivation_message": "鼓励消息",
  "action_suggestions": ["建议1", "建议2", "建议3"],
  "tone": "语气类型"
}
`;

      const response = await this.callLLM(prompt, {
        temperature: 0.8,
        max_tokens: 500,
        mock_type: 'adjust'
      });

      const result = await this.parseJSONResponse(response);
      
      this.logChainEnd('动机建议', result);
      return result;

    } catch (error) {
      console.error('❌ 动机建议生成失败:', error.message);
      return {
        motivation_message: "每一步进步都很珍贵，我相信你能做到的！",
        action_suggestions: ["先完成一个小任务", "适当休息", "寻求帮助"],
        tone: "鼓励性",
        error: error.message
      };
    }
  }
}

module.exports = PlanAdjusterChain;