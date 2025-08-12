const Task = require('../../models/Task');
const Collection = require('../../models/Collection');

/**
 * 动态任务调整服务
 * 根据用户状态和反馈智能调整任务安排
 */
class DynamicAdjustmentService {
  constructor() {
    this.userStatePatterns = {
      tired: ['累', '疲惫', '疲劳', '困', '没力气', '精疲力尽'],
      busy: ['忙', '没时间', '很赶', '紧急', '来不及'],
      stressed: ['压力大', '焦虑', '紧张', '烦躁', '心情不好'],
      motivated: ['有动力', '精神好', '状态好', '想做事', '充满活力'],
      sick: ['生病', '不舒服', '感冒', '发烧', '头疼']
    };

    this.adjustmentStrategies = {
      tired: {
        description: '用户疲劳状态',
        actions: ['减少任务数量', '延后非紧急任务', '增加休息时间', '简化复杂任务']
      },
      busy: {
        description: '用户时间紧张',
        actions: ['优先重要任务', '合并相似任务', '取消非必要任务', '缩短任务时间']
      },
      stressed: {
        description: '用户压力状态',
        actions: ['安排轻松任务', '增加缓冲时间', '分散高压任务', '添加放松活动']
      },
      motivated: {
        description: '用户状态良好',
        actions: ['增加挑战性任务', '提前重要任务', '增加学习时间', '优化任务顺序']
      },
      sick: {
        description: '用户身体不适',
        actions: ['暂停所有任务', '保留紧急任务', '延后一般任务', '安排休息']
      }
    };
  }

  /**
   * 分析用户状态
   */
  analyzeUserState(userInput) {
    console.log(`🎭 分析用户状态: "${userInput}"`);
    
    const detectedStates = [];
    
    for (const [state, patterns] of Object.entries(this.userStatePatterns)) {
      for (const pattern of patterns) {
        if (userInput.includes(pattern)) {
          detectedStates.push({
            state: state,
            pattern: pattern,
            confidence: this.calculateConfidence(userInput, pattern)
          });
        }
      }
    }

    // 按置信度排序
    detectedStates.sort((a, b) => b.confidence - a.confidence);
    
    const result = {
      primaryState: detectedStates.length > 0 ? detectedStates[0].state : 'normal',
      confidence: detectedStates.length > 0 ? detectedStates[0].confidence : 0,
      allStates: detectedStates,
      needsAdjustment: detectedStates.length > 0
    };

    console.log(`📊 用户状态分析结果:`, result);
    return result;
  }

  /**
   * 根据用户状态动态调整任务
   */
  async adjustTasksBasedOnState(userId, userState, userInput) {
    console.log(`🔄 开始动态调整任务 - 状态: ${userState.primaryState}`);
    
    try {
      // 1. 获取用户今天和未来的任务
      const today = new Date().toISOString().split('T')[0];
      const currentTasks = await this.getUserActiveTasks(userId, today);
      
      // 2. 分析当前任务状况
      const taskAnalysis = this.analyzeCurrentTasks(currentTasks);
      
      // 3. 生成调整建议
      const adjustmentPlan = await this.generateAdjustmentPlan(
        userState, 
        taskAnalysis, 
        userInput
      );
      
      // 4. 执行调整
      const adjustmentResult = await this.executeAdjustment(
        userId, 
        adjustmentPlan, 
        currentTasks
      );

      return {
        success: true,
        userState: userState,
        taskAnalysis: taskAnalysis,
        adjustmentPlan: adjustmentPlan,
        result: adjustmentResult,
        message: this.generateResponseMessage(userState.primaryState, adjustmentResult)
      };

    } catch (error) {
      console.error('❌ 动态调整失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户活动任务
   */
  async getUserActiveTasks(userId, fromDate) {
    const tasks = await Task.find({
      userId: userId,
      completed: false,
      $or: [
        { date: { $gte: fromDate } },
        { date: { $exists: false } }
      ]
    }).sort({ date: 1, time: 1 });

    return tasks;
  }

  /**
   * 分析当前任务状况
   */
  analyzeCurrentTasks(tasks) {
    const today = new Date().toISOString().split('T')[0];
    const currentHour = new Date().getHours();
    
    const analysis = {
      total: tasks.length,
      todayTasks: tasks.filter(t => t.date === today).length,
      urgentTasks: tasks.filter(t => t.quadrant === 1).length,
      importantTasks: tasks.filter(t => t.quadrant === 2).length,
      remainingToday: tasks.filter(t => {
        if (t.date !== today) return false;
        if (!t.time) return true;
        const taskHour = parseInt(t.time.split(':')[0]);
        return taskHour > currentHour;
      }).length,
      overdueTasks: tasks.filter(t => {
        if (!t.date) return false;
        return new Date(t.date) < new Date(today);
      }).length,
      unscheduledTasks: tasks.filter(t => !t.time).length,
      totalEstimatedTime: tasks.reduce((sum, t) => sum + (t.estimatedTime || 60), 0)
    };

    console.log(`📋 任务分析结果:`, analysis);
    return analysis;
  }

  /**
   * 生成调整计划
   */
  async generateAdjustmentPlan(userState, taskAnalysis, userInput) {
    const strategy = this.adjustmentStrategies[userState.primaryState];
    const plan = {
      strategy: strategy,
      actions: [],
      reasoning: []
    };

    // 根据用户状态和任务情况生成具体调整动作
    switch (userState.primaryState) {
      case 'tired':
        plan.actions.push(...this.generateTiredAdjustments(taskAnalysis));
        break;
      case 'busy':
        plan.actions.push(...this.generateBusyAdjustments(taskAnalysis));
        break;
      case 'stressed':
        plan.actions.push(...this.generateStressedAdjustments(taskAnalysis));
        break;
      case 'motivated':
        plan.actions.push(...this.generateMotivatedAdjustments(taskAnalysis));
        break;
      case 'sick':
        plan.actions.push(...this.generateSickAdjustments(taskAnalysis));
        break;
    }

    console.log(`📝 生成调整计划:`, plan);
    return plan;
  }

  /**
   * 疲劳状态调整
   */
  generateTiredAdjustments(analysis) {
    const actions = [];
    
    if (analysis.remainingToday > 3) {
      actions.push({
        type: 'postpone_tasks',
        description: '将部分今日任务延后到明天',
        target: Math.ceil(analysis.remainingToday / 2),
        criteria: 'priority_low_first'
      });
    }

    if (analysis.totalEstimatedTime > 240) { // 超过4小时
      actions.push({
        type: 'reduce_duration',
        description: '缩短任务预估时间',
        reduction: 0.7 // 减少30%
      });
    }

    actions.push({
      type: 'add_rest',
      description: '在任务间增加休息时间',
      duration: 15 // 15分钟休息
    });

    return actions;
  }

  /**
   * 忙碌状态调整
   */
  generateBusyAdjustments(analysis) {
    const actions = [];
    
    if (analysis.urgentTasks > 0 && analysis.importantTasks > 0) {
      actions.push({
        type: 'prioritize_urgent',
        description: '优先处理紧急重要任务',
        focus: 'quadrant_1'
      });
    }

    if (analysis.unscheduledTasks > 2) {
      actions.push({
        type: 'schedule_unscheduled',
        description: '为未安排的任务分配时间',
        method: 'fill_gaps'
      });
    }

    return actions;
  }

  /**
   * 压力状态调整
   */
  generateStressedAdjustments(analysis) {
    const actions = [];
    
    actions.push({
      type: 'add_buffer_time',
      description: '在任务间增加缓冲时间',
      duration: 10
    });

    if (analysis.urgentTasks > 2) {
      actions.push({
        type: 'spread_urgent_tasks',
        description: '分散紧急任务到不同时间段',
        method: 'distribute_evenly'
      });
    }

    return actions;
  }

  /**
   * 状态良好调整
   */
  generateMotivatedAdjustments(analysis) {
    const actions = [];
    
    if (analysis.importantTasks > 0) {
      actions.push({
        type: 'advance_important',
        description: '提前处理重要任务',
        target: 'quadrant_2'
      });
    }

    actions.push({
      type: 'optimize_schedule',
      description: '优化任务时间安排',
      method: 'efficiency_first'
    });

    return actions;
  }

  /**
   * 生病状态调整
   */
  generateSickAdjustments(analysis) {
    const actions = [];
    
    actions.push({
      type: 'postpone_all_except_urgent',
      description: '除紧急任务外全部延后',
      keep_only: 'quadrant_1'
    });

    actions.push({
      type: 'reduce_all_durations',
      description: '大幅减少任务时长',
      reduction: 0.5
    });

    return actions;
  }

  /**
   * 执行调整
   */
  async executeAdjustment(userId, plan, currentTasks) {
    const results = {
      modified_tasks: [],
      postponed_tasks: [],
      cancelled_tasks: [],
      new_tasks: []
    };

    for (const action of plan.actions) {
      switch (action.type) {
        case 'postpone_tasks':
          await this.postponeTasks(userId, currentTasks, action, results);
          break;
        case 'reduce_duration':
          await this.reduceDuration(currentTasks, action, results);
          break;
        case 'add_rest':
          await this.addRestTasks(userId, action, results);
          break;
        // ... 其他调整动作
      }
    }

    console.log(`✅ 调整执行完成:`, results);
    return results;
  }

  /**
   * 延后任务
   */
  async postponeTasks(userId, tasks, action, results) {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const todayTasks = tasks.filter(t => t.date === today && t.quadrant !== 1);
    const tasksToPostpone = todayTasks
      .sort((a, b) => (a.priority === 'low' ? -1 : 1))
      .slice(0, action.target);

    for (const task of tasksToPostpone) {
      await Task.findByIdAndUpdate(task._id, {
        date: tomorrowStr,
        time: null // 重新安排时间
      });
      
      results.postponed_tasks.push({
        id: task._id,
        title: task.title,
        original_date: today,
        new_date: tomorrowStr
      });
    }
  }

  /**
   * 减少任务时长
   */
  async reduceDuration(tasks, action, results) {
    for (const task of tasks) {
      if (task.estimatedTime && task.estimatedTime > 30) {
        const newDuration = Math.round(task.estimatedTime * action.reduction);
        await Task.findByIdAndUpdate(task._id, {
          estimatedTime: newDuration
        });
        
        results.modified_tasks.push({
          id: task._id,
          title: task.title,
          original_duration: task.estimatedTime,
          new_duration: newDuration
        });
      }
    }
  }

  /**
   * 添加休息任务
   */
  async addRestTasks(userId, action, results) {
    const today = new Date().toISOString().split('T')[0];
    
    const restTask = new Task({
      title: '休息放松',
      description: '给自己一些放松的时间',
      priority: 'medium',
      quadrant: 4,
      date: today,
      estimatedTime: action.duration,
      userId: userId,
      completed: false
    });

    const savedTask = await restTask.save();
    
    results.new_tasks.push({
      id: savedTask._id,
      title: savedTask.title,
      type: 'rest',
      duration: action.duration
    });
  }

  /**
   * 计算置信度
   */
  calculateConfidence(input, pattern) {
    const contextWords = ['很', '非常', '特别', '实在', '真的'];
    let confidence = 0.6;
    
    for (const word of contextWords) {
      if (input.includes(word + pattern)) {
        confidence += 0.2;
      }
    }
    
    return Math.min(confidence, 0.9);
  }

  /**
   * 生成响应消息
   */
  generateResponseMessage(state, result) {
    const messages = {
      tired: `我理解你现在很累。我已经为你调整了任务安排：延后了${result.postponed_tasks.length}个任务到明天，并为你安排了休息时间。记得要好好休息哦！`,
      busy: `看起来你时间很紧张。我帮你重新优化了任务优先级，聚焦在最重要的事情上。加油！`,
      stressed: `感觉到你的压力了。我已经调整了任务时间，给你更多缓冲时间，并分散了高压任务。一步一步来，不要着急。`,
      motivated: `你的状态很棒！我为你优化了任务安排，让你能更高效地完成重要事项。继续保持！`,
      sick: `身体不舒服要好好休息。我已经把非紧急的任务都延后了，你现在只需要专注休息和必要的事情。早日康复！`
    };
    
    return messages[state] || '我已经根据你的情况调整了任务安排。';
  }
}

module.exports = DynamicAdjustmentService;

