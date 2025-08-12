'use strict';

const BaseChain = require('./base_chain');

class PlanGeneratorChain extends BaseChain {
  constructor() {
    super();
  }

  async generatePlan(userGoal, goalType, userAnswers, existingTasks = null) {
    this.logChainStart('计划生成', { userGoal, goalType, userAnswers, existingTasks });

    try {
      // 格式化用户回答
      const formattedAnswers = this.formatUserAnswers(userAnswers);
      
      // 格式化现有任务信息
      const formattedExistingTasks = this.formatExistingTasks(existingTasks);
      const formattedTimeSlots = this.formatOccupiedTimeSlots(existingTasks?.occupiedTimeSlots || []);
      
      // 格式化prompt
      const prompt = this.formatPrompt('plan_generator', {
        user_goal: userGoal,
        goal_type: goalType,
        user_answers: formattedAnswers,
        existing_tasks: formattedExistingTasks,
        occupied_time_slots: formattedTimeSlots
      });

      // 调用LLM
      const response = await this.callLLM(prompt, {
        temperature: 0.6, // 计划生成需要平衡创造性和准确性
        max_tokens: 2500,
        mock_type: 'plan'
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
    console.log('📋 原始计划数据:', JSON.stringify(plan, null, 2));
    
    // 确保基本结构存在
    const validatedPlan = {
      plan_overview: plan.plan_overview || '系统生成的计划概述',
      collections: [],
      suggestions: plan.suggestions || '请按计划执行，遇到困难及时调整。'
    };

    // 验证任务集
    if (plan.collections && Array.isArray(plan.collections)) {
      console.log(`✅ 找到${plan.collections.length}个任务集`);
      const validCollections = [];
      
      plan.collections.forEach((collection, index) => {
        console.log(`🔍 验证任务集${index + 1}: ${collection.name || '未命名'}`);
        
        // 只有当collection是对象且有基本属性时才处理
        if (collection && typeof collection === 'object') {
          const validatedCollection = {
            name: collection.name || `任务集${index + 1}`,
            description: collection.description || '',
            tasks: this.validateTasks(collection.tasks || [])
          };
          
          console.log(`✅ 任务集${index + 1}验证完成，包含${validatedCollection.tasks.length}个任务`);
          validCollections.push(validatedCollection);
        } else {
          console.log(`⚠️ 任务集${index + 1}格式无效，跳过`);
        }
      });
      
      if (validCollections.length > 0) {
        validatedPlan.collections = validCollections;
      } else {
        console.log('⚠️ 所有任务集验证失败，使用默认值');
        validatedPlan.collections = [{
          name: '主要任务',
          description: '系统生成的默认任务集',
          tasks: []
        }];
      }
    } else {
      console.log('⚠️ collections部分解析失败，使用默认值');
      console.log('📋 plan.collections类型:', typeof plan.collections);
      console.log('📋 plan.collections值:', plan.collections);
      
      // 尝试从原始响应中提取部分信息
      if (plan.raw_response && typeof plan.raw_response === 'string') {
        console.log('🔧 尝试从原始响应中提取collections信息...');
        const extractedCollections = this.extractCollectionsFromRawResponse(plan.raw_response);
        if (extractedCollections && extractedCollections.length > 0) {
          validatedPlan.collections = extractedCollections;
        } else {
          // 如果没有任务集，创建一个默认的
          validatedPlan.collections = [{
            name: '主要任务',
            description: '系统生成的默认任务集',
            tasks: []
          }];
        }
      } else {
        validatedPlan.collections = [{
          name: '主要任务',
          description: '系统生成的默认任务集',
          tasks: []
        }];
      }
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

  /**
   * 格式化现有任务信息
   */
  formatExistingTasks(existingTasks) {
    if (!existingTasks) {
      return '用户暂无现有任务';
    }

    let formatted = `任务集数量: ${existingTasks.collections.length}\n`;
    formatted += `今日任务: ${existingTasks.todayTasks.length}\n`;
    formatted += `总任务数: ${existingTasks.totalTasks}\n`;
    formatted += `已完成: ${existingTasks.completedTasks}\n\n`;

    if (existingTasks.collections.length > 0) {
      formatted += '现有任务集:\n';
      existingTasks.collections.forEach(collection => {
        formatted += `- ${collection.name}: ${collection.completedCount}/${collection.taskCount} 已完成\n`;
      });
      formatted += '\n';
    }

    if (existingTasks.todayTasks.length > 0) {
      formatted += '今日任务:\n';
      existingTasks.todayTasks.forEach(task => {
        const status = task.completed ? '✅' : '⏳';
        formatted += `${status} ${task.title} (${task.time || '无时间'}, 优先级: ${task.priority})\n`;
      });
    }

    return formatted;
  }

  /**
   * 格式化已占用时间段
   */
  formatOccupiedTimeSlots(timeSlots) {
    if (!timeSlots || timeSlots.length === 0) {
      return '暂无已占用时间段';
    }

    let formatted = '已占用时间段:\n';
    timeSlots.forEach(slot => {
      formatted += `- ${slot.date} ${slot.time} (${slot.title}, 预计${slot.duration}分钟)\n`;
    });

    return formatted;
  }

  /**
   * 从原始响应中提取collections信息
   */
  extractCollectionsFromRawResponse(rawResponse) {
    try {
      console.log('🔍 分析原始响应以提取collections...');
      
      // 尝试找到collections数组的开始
      const collectionsMatch = rawResponse.match(/"collections"\s*:\s*\[([\s\S]*?)(?=\]\s*[,}]|$)/i);
      if (!collectionsMatch) {
        console.log('❌ 未找到collections数组');
        return null;
      }
      
      const collectionsContent = collectionsMatch[1];
      console.log('📋 找到collections内容，长度:', collectionsContent.length);
      
      // 尝试解析每个collection对象
      const collections = [];
      const collectionMatches = collectionsContent.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g);
      
      if (collectionMatches) {
        console.log(`🔍 找到${collectionMatches.length}个可能的collection对象`);
        
        collectionMatches.forEach((collectionStr, index) => {
          try {
            // 尝试修复和解析单个collection
            let fixedCollection = collectionStr;
            
            // 基本的JSON修复
            fixedCollection = fixedCollection.replace(/,\s*}/g, '}');
            fixedCollection = fixedCollection.replace(/,\s*]/g, ']');
            
            const collection = JSON.parse(fixedCollection);
            
            if (collection.name) {
              const validatedCollection = {
                name: collection.name,
                description: collection.description || '',
                tasks: this.validateTasks(collection.tasks || [])
              };
              
              collections.push(validatedCollection);
              console.log(`✅ 成功提取任务集: ${collection.name}`);
            }
          } catch (parseError) {
            console.log(`⚠️ 任务集${index + 1}解析失败:`, parseError.message);
          }
        });
      }
      
      console.log(`🎯 成功提取${collections.length}个任务集`);
      return collections.length > 0 ? collections : null;
      
    } catch (error) {
      console.log('❌ 从原始响应提取collections失败:', error.message);
      return null;
    }
  }
}

module.exports = PlanGeneratorChain;