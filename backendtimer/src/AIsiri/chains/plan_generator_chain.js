'use strict';

const BaseChain = require('./base_chain');

class PlanGeneratorChain extends BaseChain {
  constructor() {
    super();
  }

  async generatePlan(userGoal, goalType, userAnswers) {
    this.logChainStart('计划生成', { userGoal, goalType, userAnswers });

    try {
      // 格式化用户回答
      const formattedAnswers = this.formatUserAnswers(userAnswers);
      
      // 格式化prompt
      const prompt = this.formatPrompt('plan_generator', {
        user_goal: userGoal,
        goal_type: goalType,
        user_answers: formattedAnswers
      });

      // 调用LLM
      const response = await this.callLLM(prompt, {
        temperature: 0.6, // 计划生成需要平衡创造性和准确性
        max_tokens: 2500
      });

      // 解析JSON响应
      const result = await this.parseJSONResponse(response);

      // 验证和修正计划格式
      const validatedPlan = this.validatePlan(result);
      
      this.logChainEnd('计划生成', validatedPlan);
      return validatedPlan;

    } catch (error) {
      console.error('❌ 计划生成失败:', error.message);
      
      // 返回简化的默认计划
      const fallbackPlan = this.generateFallbackPlan(userGoal, goalType);
      this.logChainEnd('计划生成', fallbackPlan);
      return fallbackPlan;
    }
  }

  formatUserAnswers(userAnswers) {
    if (Array.isArray(userAnswers)) {
      return userAnswers.map((answer, index) => `问题${index + 1}: ${answer}`).join('\n');
    } else if (typeof userAnswers === 'object') {
      return Object.entries(userAnswers)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');
    } else {
      return String(userAnswers);
    }
  }

  validatePlan(plan) {
    console.log('🔍 验证计划格式...');
    
    // 确保基本结构存在
    const validatedPlan = {
      plan_overview: plan.plan_overview || '系统生成的计划概述',
      collections: [],
      suggestions: plan.suggestions || '请按计划执行，遇到困难及时调整。'
    };

    // 验证任务集
    if (plan.collections && Array.isArray(plan.collections)) {
      validatedPlan.collections = plan.collections.map(collection => {
        return {
          name: collection.name || '未命名任务集',
          description: collection.description || '',
          tasks: this.validateTasks(collection.tasks || [])
        };
      });
    } else {
      // 如果没有任务集，创建一个默认的
      validatedPlan.collections = [{
        name: '主要任务',
        description: '系统生成的默认任务集',
        tasks: []
      }];
    }

    console.log(`✅ 计划验证完成，包含${validatedPlan.collections.length}个任务集`);
    return validatedPlan;
  }

  validateTasks(tasks) {
    if (!Array.isArray(tasks)) return [];

    return tasks.map(task => {
      const validatedTask = {
        title: task.title || '未命名任务',
        description: task.description || '',
        priority: ['low', 'medium', 'high'].includes(task.priority) ? task.priority : 'medium',
        quadrant: [1, 2, 3, 4].includes(task.quadrant) ? task.quadrant : 2,
        timeBlock: {
          timeBlockType: ['morning', 'forenoon', 'afternoon', 'evening'].includes(task.timeBlock?.timeBlockType) 
            ? task.timeBlock.timeBlockType : 'unscheduled',
          startTime: task.timeBlock?.startTime || '',
          endTime: task.timeBlock?.endTime || ''
        },
        dueDate: task.dueDate || null,
        tags: Array.isArray(task.tags) ? task.tags : []
      };

      return validatedTask;
    });
  }

  generateFallbackPlan(userGoal, goalType) {
    console.log('🛡️  生成默认回退计划');
    
    return {
      plan_overview: `为目标"${userGoal}"制定的基础计划`,
      collections: [{
        name: '基础任务集',
        description: '系统生成的基础任务安排',
        tasks: [{
          title: userGoal,
          description: '请将此目标分解为具体的可执行任务',
          priority: 'medium',
          quadrant: 2,
          timeBlock: {
            timeBlockType: 'unscheduled',
            startTime: '',
            endTime: ''
          },
          dueDate: null,
          tags: [goalType]
        }]
      }],
      suggestions: '这是一个基础计划，请根据实际情况进行调整和细化。',
      error: '计划生成服务异常，返回基础计划'
    };
  }

  async generateQuickPlan(userGoal) {
    this.logChainStart('快速计划生成', { userGoal });

    try {
      const prompt = `
请为以下目标快速制定一个简单的执行计划：

目标：${userGoal}

请返回JSON格式的简化计划：
{
  "plan_overview": "计划概述",
  "tasks": [
    {
      "title": "任务标题",
      "description": "任务描述",
      "priority": "优先级",
      "timeBlock": "建议时间段"
    }
  ],
  "suggestions": "执行建议"
}
`;

      const response = await this.callLLM(prompt, {
        temperature: 0.7,
        max_tokens: 800
      });

      const result = await this.parseJSONResponse(response);
      
      this.logChainEnd('快速计划生成', result);
      return result;

    } catch (error) {
      console.error('❌ 快速计划生成失败:', error.message);
      return this.generateFallbackPlan(userGoal, 'simple_todo');
    }
  }
}

module.exports = PlanGeneratorChain;