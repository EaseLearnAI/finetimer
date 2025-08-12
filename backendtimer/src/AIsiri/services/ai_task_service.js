'use strict';

// 导入所有链条
const InputClassifierChain = require('../chains/input_classifier_chain');
const QuestionGeneratorChain = require('../chains/question_generator_chain');
const PlanGeneratorChain = require('../chains/plan_generator_chain');
const PlanAdjusterChain = require('../chains/plan_adjuster_chain');
const HabitProcessorChain = require('../chains/habit_processor_chain');

// 导入数据库模型
const Task = require('../../models/Task');
const Collection = require('../../models/Collection');
const mongoose = require('mongoose');

// 导入任务管理服务
const TaskManagementService = require('./task_management_service');
const TimeParsingService = require('./time_parsing_service');
const DynamicAdjustmentService = require('./dynamic_adjustment_service');

// 默认用户ID（用于开发/测试环境）
const DEFAULT_USER_ID = '68974d3a68e7adf1e74f68ab';

class AITaskService {
  constructor() {
    this.dbDisabled = process.env.MOCK_DB === 'true' || process.env.NODE_ENV === 'test';
    // 初始化所有链条
    this.inputClassifier = new InputClassifierChain();
    this.questionGenerator = new QuestionGeneratorChain();
    this.planGenerator = new PlanGeneratorChain();
    this.planAdjuster = new PlanAdjusterChain();
    this.habitProcessor = new HabitProcessorChain();
    
    // 初始化任务管理服务
    this.taskManager = new TaskManagementService();
    this.timeParser = new TimeParsingService();
    this.dynamicAdjuster = new DynamicAdjustmentService();
    
    console.log('🤖 AI任务服务初始化完成（包含智能时间解析和动态调整）');
  }

  /**
   * 处理用户输入的主要流程
   * 用户输入 → 分类 → 生成问题 → 回答收集 → 生成计划 → 任务展示
   */
  async processUserInput(userInput, userId = null) {
    console.log('\n🚀 === AI任务处理流程开始 ===');
    console.log(`👤 用户ID: ${userId || '未指定'}`);
    console.log(`💬 用户输入: ${userInput}`);

    try {
      userId = userId || DEFAULT_USER_ID;
      
      // 检查是否为动态调整请求
      const userState = this.dynamicAdjuster.analyzeUserState(userInput);
      if (userState.needsAdjustment) {
        console.log('\n🎭 检测到用户状态变化，启动动态调整...');
        return await this.handleDynamicAdjustment(userInput, userId, userState);
      }
      
      // 步骤1: 输入分类
      console.log('\n📝 步骤1: 分类用户输入...');
      const classification = await this.inputClassifier.classify(userInput);
      
      // 根据分类结果选择处理流程
      switch (classification.category) {
        case 'simple_todo':
          return await this.handleSimpleTodo(userInput, userId, classification);
        
        case 'goal_planning':
          return await this.handleGoalPlanning(userInput, userId, classification);
        
        case 'habit_formation':
          return await this.handleHabitFormation(userInput, userId, classification);
        
        default:
          throw new Error(`未知的分类结果: ${classification.category}`);
      }

    } catch (error) {
      console.error('❌ AI任务处理失败:', error.message);
      return {
        success: false,
        error: error.message,
        fallback_suggestion: '抱歉，系统遇到了问题。你可以尝试重新描述你的需求，或者直接创建一个简单的待办事项。'
      };
    } finally {
      console.log('🚀 === AI任务处理流程结束 ===\n');
    }
  }

  /**
   * 处理简单待办事项 - 增强版支持智能时间解析
   */
  async handleSimpleTodo(userInput, userId, classification) {
    console.log('\n📋 处理简单待办事项（智能时间解析）...');

    try {
      userId = userId || DEFAULT_USER_ID;
      
      // 1. 解析时间信息
      const timeInfo = this.timeParser.parseTimeFromInput(userInput);
      
      // 2. 获取用户现有任务（用于时间冲突检测）
      const existingTasks = await this.taskManager.getUserCurrentTasks(userId);
      
      // 3. 提取基础任务数据
      const basicTaskData = this.extractSimpleTaskData(userInput);
      
      // 4. 智能安排时间
      let finalTaskData = { ...basicTaskData };
      
      if (timeInfo.hasTime) {
        if (timeInfo.isSpecific) {
          // 有具体时间，直接使用
          finalTaskData.time = timeInfo.time;
          finalTaskData.date = timeInfo.date;
          finalTaskData.timeBlock = timeInfo.timeBlock;
          console.log(`⏰ 使用用户指定时间: ${timeInfo.time}`);
        } else {
          // 有时间段但不具体，智能安排
          const optimalTime = await this.timeParser.findOptimalTime(
            existingTasks,
            timeInfo.timePeriod,
            timeInfo.date,
            basicTaskData.estimatedTime || 60
          );
          
          finalTaskData.time = optimalTime.time;
          finalTaskData.date = timeInfo.date;
          finalTaskData.timeBlock = optimalTime.timeBlock;
          
          if (optimalTime.warning) {
            console.log(`⚠️ ${optimalTime.warning}`);
          }
          console.log(`🎯 智能安排时间: ${optimalTime.time}`);
        }
      } else {
        // 没有时间信息，使用默认
        finalTaskData.date = new Date().toISOString().split('T')[0];
        console.log(`📅 使用默认日期: ${finalTaskData.date}`);
      }
      
      // 5. 创建任务
      const result = await this.taskManager.createSimpleTask(finalTaskData, userId);

      console.log(`✅ 智能任务创建成功: ${result.task.title}`);

      // 6. 生成响应消息
      let message = `已为你创建待办事项："${result.task.title}"`;
      if (finalTaskData.time) {
        message += `，安排在${finalTaskData.date} ${finalTaskData.time}`;
      }

      return {
        success: true,
        type: 'simple_todo',
        classification: classification,
        timeInfo: timeInfo,
        result: {
          message: message,
          task: result.task,
          timeArrangement: {
            date: finalTaskData.date,
            time: finalTaskData.time,
            timeBlock: finalTaskData.timeBlock
          },
          next_step: 'completed'
        }
      };

    } catch (error) {
      console.error('❌ 简单待办处理失败:', error.message);
      throw error;
    }
  }

  /**
   * 处理目标规划
   */
  async handleGoalPlanning(userInput, userId, classification) {
    console.log('\n🎯 处理目标规划...');

    try {
      userId = userId || DEFAULT_USER_ID;
      
      // 获取用户现有任务信息
      const existingTasks = await this.taskManager.getUserCurrentTasks(userId);
      
      // 步骤2: 生成问题
      console.log('\n❓ 步骤2: 生成问题收集信息...');
      const questions = await this.questionGenerator.generateQuestions(userInput, 'goal_planning');

      return {
        success: true,
        type: 'goal_planning',
        classification: classification,
        result: {
          goal: userInput,
          questions: questions,
          next_step: 'collect_answers',
          message: questions.greeting || '我需要了解一些信息来帮你制定更好的计划。',
          existing_tasks: existingTasks
        }
      };

    } catch (error) {
      console.error('❌ 目标规划处理失败:', error.message);
      throw error;
    }
  }

  /**
   * 处理习惯养成 - 改为生成问题模式
   */
  async handleHabitFormation(userInput, userId, classification) {
    console.log('\n🔄 处理习惯养成...');

    try {
      userId = userId || DEFAULT_USER_ID;
      
      // 获取用户现有任务信息
      const existingTasks = await this.taskManager.getUserCurrentTasks(userId);
      
      // 识别习惯类型并生成针对性问题
      const habitType = classification.habit_type || this.identifyHabitType(userInput);
      console.log(`🎯 识别习惯类型: ${habitType}`);
      
      // 生成针对性问题
      const questions = await this.questionGenerator.generateQuestions(userInput, 'habit_formation', { habitType });

      return {
        success: true,
        type: 'habit_formation',
        classification: classification,
        result: {
          habit_goal: userInput,
          habit_type: habitType,
          questions: questions,
          next_step: 'collect_habit_answers',
          message: questions.greeting || '我需要了解一些细节来为你制定更好的习惯计划。',
          existing_tasks: existingTasks
        }
      };

    } catch (error) {
      console.error('❌ 习惯养成处理失败:', error.message);
      throw error;
    }
  }

  /**
   * 根据用户回答生成习惯计划
   */
  async generateHabitPlanFromAnswers(habitGoal, habitType, userAnswers, userId) {
    console.log('\n📋 根据用户回答生成习惯计划...');
    console.log(`🎯 习惯目标: ${habitGoal}`);
    console.log(`📝 习惯类型: ${habitType}`);
    console.log(`💬 回答数量: ${Array.isArray(userAnswers) ? userAnswers.length : 'N/A'}`);

    try {
      // 验证用户ID
      const validUserId = this.validateUserId(userId);
      
      // 格式化用户详细信息
      const userDetails = this.formatHabitAnswers(userAnswers, habitType);
      
      // 生成详细习惯计划
      const habitPlan = await this.habitProcessor.processHabit(habitGoal, userDetails);
      
      // 创建习惯任务集
      let collection = await this.findOrCreateCollection(`${habitType}习惯`, validUserId);
      
      // 拉取现有任务用于时间冲突检测
      const existingTasks = await this.taskManager.getUserCurrentTasks(validUserId);

      // 根据计划创建多个任务（带智能时间安排）
      const tasks = await this.createHabitTasks(habitPlan, collection._id, validUserId, existingTasks);

      console.log(`✅ 习惯计划创建成功，包含${tasks.length}个任务`);

      return {
        success: true,
        type: 'habit_plan_generated',
        result: {
          message: `已为你制定了详细的${habitType}习惯计划！`,
          habit_plan: habitPlan,
          collection: collection,
          tasks: tasks,
          summary: {
            habit_type: habitType,
            tasks_count: tasks.length,
            duration: habitPlan.schedule?.duration || '未指定'
          }
        }
      };

    } catch (error) {
      console.error('❌ 习惯计划生成失败:', error.message);
      throw error;
    }
  }

  /**
   * 处理用户回答并生成计划
   */
  async generatePlanFromAnswers(goal, goalType, userAnswers, userId) {
    console.log('\n📋 根据用户回答生成计划...');
    console.log(`🎯 目标: ${goal}`);
    console.log(`📝 回答数量: ${Array.isArray(userAnswers) ? userAnswers.length : 'N/A'}`);

    try {
      const validUserId = this.validateUserId(userId);
      // 获取现有任务用于冲突检测
      const existingTasks = await this.taskManager.getUserCurrentTasks(validUserId);

      // 步骤3: 生成计划（带现有任务上下文，避免冲突）
      const plan = await this.planGenerator.generatePlan(goal, goalType, userAnswers, existingTasks);

      // 步骤4: 实施计划（带智能时间调度）
      const implementation = await this.implementPlan(plan, validUserId, existingTasks);

      const collectionsCount = implementation.collections_created.length;
      const tasksCount = implementation.tasks_created.length;
      const estimatedDuration = implementation.tasks_created.reduce((sum, t) => sum + (t.estimatedTime || 0), 0);

      console.log(`✅ 计划生成并实施成功，创建了${collectionsCount}个任务集，${tasksCount}个任务`);

      return {
        success: true,
        type: 'plan_generated',
        result: {
          message: `已为你的目标"${goal}"制定并安排了详细计划！`,
          plan: plan,
          database_result: {
            collections_count: collectionsCount,
            total_tasks: tasksCount,
            time_conflicts_resolved: implementation.time_conflicts_resolved,
            collections_created: implementation.collections_created,
            tasks_created: implementation.tasks_created
          },
          summary: {
            collections_count: collectionsCount,
            tasks_count: tasksCount,
            estimated_duration: `${estimatedDuration}分钟`
          }
        }
      };

    } catch (error) {
      console.error('❌ 计划生成失败:', error.message);
      throw error;
    }
  }

  /**
   * 调整现有计划
   */
  async adjustPlan(planId, userFeedback, userId) {
    console.log('\n🔧 调整现有计划...');
    console.log(`📝 反馈: ${userFeedback}`);

    try {
      // 获取当前计划
      const currentPlan = await this.getCurrentPlan(planId, userId);
      
      // 调整计划
      const adjustment = await this.planAdjuster.adjustPlan(currentPlan, userFeedback);
      
      // 应用调整到数据库
      const updateResult = await this.applyPlanAdjustment(planId, adjustment, userId);

      console.log(`✅ 计划调整完成，影响${updateResult.modified_tasks}个任务`);

      return {
        success: true,
        type: 'plan_adjusted',
        result: {
          message: `已根据你的反馈调整计划：${adjustment.adjustment_summary}`,
          adjustment: adjustment,
          update_result: updateResult
        }
      };

    } catch (error) {
      console.error('❌ 计划调整失败:', error.message);
      throw error;
    }
  }

  /**
   * 处理用户回答并生成最终计划（新增统一处理方法）
   */
  async processAnswersAndGeneratePlan(goalType, userGoal, userAnswers, existingTasks, userId) {
    console.log('\n📋 处理用户回答并生成最终计划...');
    
    try {
      userId = userId || DEFAULT_USER_ID;
      
      // 如果没有现有任务信息，重新获取
      if (!existingTasks) {
        existingTasks = await this.taskManager.getUserCurrentTasks(userId);
      }
      
      // 生成计划
      console.log('\n🎯 步骤3: 生成详细计划...');
      const plan = await this.planGenerator.generatePlan(userGoal, goalType, userAnswers, existingTasks);
      
      // 立即执行计划 - 创建任务集和任务
      console.log('\n💾 步骤4: 导入计划到数据库...');
      const implementationResult = await this.implementPlan(plan, userId, existingTasks);
      
      return {
        success: true,
        type: goalType,
        result: {
          message: '计划制定完成！已为你创建相应的任务和任务集。',
          plan: plan,
          implementation: implementationResult,
          next_step: 'completed'
        }
      };
      
    } catch (error) {
      console.error('❌ 处理回答和生成计划失败:', error.message);
      throw error;
    }
  }

  /**
   * 执行计划 - 创建任务集和任务
   */
  async implementPlan(plan, userId, existingTasks) {
    console.log('\n🚀 开始执行计划实施...');
    
    try {
      const results = {
        collections_created: [],
        tasks_created: [],
        time_conflicts_resolved: []
      };
      
      // 全局已分配时段累积，避免同一批新任务之间互相冲突
      const scheduledSlotsAccumulator = [];

      // 遍历计划中的任务集
      for (const collectionData of plan.collections || []) {
        console.log(`📁 创建任务集: ${collectionData.name}`);
        
        // 创建任务集
        const collection = await this.taskManager.createCollection({
          name: collectionData.name,
          description: collectionData.description
        }, userId);
        
        results.collections_created.push({
          id: collection._id,
          name: collection.name
        });
        
        // 处理任务集中的任务
        const tasksToCreate = [];
        
        for (const taskData of collectionData.tasks || []) {
          // 智能安排时间，避免冲突
          const optimizedTask = this.optimizeTaskScheduling(taskData, existingTasks, scheduledSlotsAccumulator);
          
          // 记录时间冲突解决
          if (optimizedTask.time_adjusted) {
            results.time_conflicts_resolved.push({
              original_time: taskData.timeBlock?.startTime,
              adjusted_time: optimizedTask.time,
              reason: optimizedTask.adjustment_reason
            });
          }
          
          tasksToCreate.push({
            title: optimizedTask.title,
            description: optimizedTask.description,
            priority: optimizedTask.priority,
            quadrant: optimizedTask.quadrant,
            date: optimizedTask.date || new Date().toISOString().split('T')[0],
            time: optimizedTask.time,
            estimatedTime: optimizedTask.estimatedTime || 60,
            timeBlock: {
              startTime: optimizedTask.time,
              endTime: this.addMinutesToTime(optimizedTask.time, optimizedTask.estimatedTime || 60),
              timeBlockType: this.taskManager.getTimeBlockType(optimizedTask.time)
            }
          });
        }
        
        // 批量创建任务
        if (tasksToCreate.length > 0) {
          const createdTasks = await this.taskManager.createTasksBatch(tasksToCreate, collection._id, userId);
          results.tasks_created.push(...createdTasks);
          console.log(`✅ 成功创建 ${createdTasks.length} 个任务`);
        }
      }
      
      console.log(`🎉 计划实施完成: ${results.collections_created.length}个任务集, ${results.tasks_created.length}个任务`);
      return results;
      
    } catch (error) {
      console.error('❌ 计划实施失败:', error.message);
      throw error;
    }
  }

  /**
   * 优化任务时间安排，避免冲突
   */
  optimizeTaskScheduling(taskData, existingTasks, scheduledSlotsAccumulator = []) {
    const originalTime = taskData.timeBlock?.startTime;
    // 优先从文本中解析时长，其次使用任务自带时长，最后回退到基于类型的默认值
    const parsedDuration = this.timeParser
      ? this.timeParser.extractDuration(`${taskData.title || ''} ${taskData.description || ''}`)
      : null;
    let duration = taskData.estimatedTime || parsedDuration;
    if (!duration) {
      const text = `${taskData.title || ''}${taskData.description || ''}`;
      if (/(学习|复习|阅读|编程|作业|练习)/.test(text)) {
        duration = 50; // 番茄两个周期（更科学的学习块）
      } else if (/(健身|跑步|锻炼)/.test(text)) {
        duration = 45; // 运动常见时长
      } else {
        duration = 30; // 默认半小时小任务
      }
    }
    // 约束在 20-120 分钟之间
    duration = Math.max(20, Math.min(120, duration));

    // 选择日期：优先任务自带 dueDate；若缺失或在今天之前，则使用今天，以便新计划能立刻在任务页显示
    const todayStr = new Date().toISOString().split('T')[0];
    let date = taskData.dueDate || taskData.date || todayStr;
    try {
      // 将可能的 Date 对象或字符串统一为 YYYY-MM-DD，并且若早于今天则提至今天
      const toYYYYMMDD = (d) => {
        if (!d) return null;
        if (typeof d === 'string') return d.slice(0, 10);
        const dt = new Date(d);
        if (Number.isNaN(dt.getTime())) return null;
        return dt.toISOString().split('T')[0];
      };
      const normalized = toYYYYMMDD(date);
      if (normalized) {
        date = normalized < todayStr ? todayStr : normalized;
      } else {
        date = todayStr;
      }
    } catch (_) {
      date = todayStr;
    }

    // 组合占用时段：既包含历史占用，也包含本次计划中已分配的时段，避免相互冲突
    const combinedOccupied = [
      ...((existingTasks && Array.isArray(existingTasks.occupiedTimeSlots)) ? existingTasks.occupiedTimeSlots : []),
      ...scheduledSlotsAccumulator
    ];

    const availableTime = this.taskManager.findAvailableTimeSlot(
      combinedOccupied,
      originalTime,
      duration,
      date
    );

    const optimizedTask = {
      ...taskData,
      time: availableTime,
      date: date,
      estimatedTime: duration
    };

    // 如果时间被调整，记录原因
    if (originalTime && originalTime !== availableTime) {
      optimizedTask.time_adjusted = true;
      optimizedTask.adjustment_reason = `原时间${originalTime}已被占用，调整为${availableTime}`;
      console.log(`⏰ 时间冲突解决: ${taskData.title} ${originalTime} → ${availableTime}`);
    }

    // 将当前任务的时间占用加入累积，避免与后续任务冲突
    scheduledSlotsAccumulator.push({ date, time: availableTime, duration });

    return optimizedTask;
  }

  /**
   * 处理动态调整请求
   */
  async handleDynamicAdjustment(userInput, userId, userState) {
    console.log('\n🔄 处理动态调整请求...');
    console.log(`🎭 用户状态: ${userState.primaryState} (置信度: ${userState.confidence})`);

    try {
      // 使用动态调整服务处理
      const adjustmentResult = await this.dynamicAdjuster.adjustTasksBasedOnState(
        userId, 
        userState, 
        userInput
      );

      console.log(`✅ 动态调整完成: ${adjustmentResult.result.modified_tasks.length}个任务被修改`);

      return {
        success: true,
        type: 'dynamic_adjustment',
        userState: userState,
        result: {
          message: adjustmentResult.message,
          adjustmentSummary: {
            modified_tasks: adjustmentResult.result.modified_tasks.length,
            postponed_tasks: adjustmentResult.result.postponed_tasks.length,
            cancelled_tasks: adjustmentResult.result.cancelled_tasks.length,
            new_tasks: adjustmentResult.result.new_tasks.length
          },
          taskAnalysis: adjustmentResult.taskAnalysis,
          adjustmentPlan: adjustmentResult.adjustmentPlan,
          next_step: 'completed'
        }
      };

    } catch (error) {
      console.error('❌ 动态调整失败:', error.message);
      
      return {
        success: false,
        type: 'dynamic_adjustment',
        error: error.message,
        result: {
          message: '抱歉，调整任务时遇到了问题。你可以稍后再试，或者直接告诉我具体需要调整什么。',
          next_step: 'retry'
        }
      };
    }
  }

  /**
   * 给时间添加分钟数
   */
  addMinutesToTime(time, minutes) {
    if (!time) return null;
    
    const [hours, mins] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMins = totalMinutes % 60;
    
    return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
  }

  // === 辅助方法 ===

  /**
   * 验证用户ID格式
   */
  validateUserId(userId) {
    if (!userId) {
      console.log('⚠️ 用户ID为空，使用默认ID');
      return DEFAULT_USER_ID;
    }
    
    // 检查是否为有效的MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(userId)) {
      return userId;
    }
    
    console.log(`⚠️ 用户ID格式无效: ${userId}，使用默认ID`);
    return DEFAULT_USER_ID;
  }

  /**
   * 识别习惯类型
   */
  identifyHabitType(habitGoal) {
    const goal = habitGoal.toLowerCase();
    
    if (goal.includes('运动') || goal.includes('健身') || goal.includes('锻炼') || goal.includes('跑步')) {
      return '健身';
    } else if (goal.includes('学习') || goal.includes('读书') || goal.includes('阅读') || goal.includes('背单词')) {
      return '学习';
    } else if (goal.includes('睡眠') || goal.includes('早睡') || goal.includes('作息')) {
      return '睡眠';
    } else if (goal.includes('饮食') || goal.includes('吃饭') || goal.includes('喝水')) {
      return '饮食';
    } else if (goal.includes('冥想') || goal.includes('放松') || goal.includes('瑜伽')) {
      return '冥想';
    }
    
    return '其他';
  }

  /**
   * 格式化习惯回答
   */
  formatHabitAnswers(userAnswers, habitType) {
    if (!Array.isArray(userAnswers)) {
      return '';
    }
    
    const details = userAnswers.map((answer, index) => {
      return `问题${index + 1}: ${answer}`;
    }).join('\n');
    
    return `习惯类型: ${habitType}\n${details}`;
  }

  /**
   * 创建习惯相关的多个任务
   */
  async createHabitTasks(habitPlan, collectionId, userId, existingTasks) {
    const scheduledSlotsAccumulator = [];
    const tasksToCreate = [];

    // 主要习惯任务（优先安排到当日合适时间）
    const mainBase = {
      title: habitPlan.task_template.title,
      description: habitPlan.task_template.description,
      priority: habitPlan.task_template.priority || 'medium',
      estimatedTime: habitPlan.task_template.estimatedTime || 45,
      timeBlock: habitPlan.task_template.timeBlock
    };
    const mainOptimized = this.optimizeTaskScheduling(mainBase, existingTasks, scheduledSlotsAccumulator);
    tasksToCreate.push({
      title: mainOptimized.title,
      description: mainOptimized.description,
      priority: mainOptimized.priority,
      quadrant: this.analyzeQuadrant(mainOptimized.title || ''),
      date: mainOptimized.date || new Date().toISOString().split('T')[0],
      time: mainOptimized.time,
      estimatedTime: mainOptimized.estimatedTime,
      timeBlock: {
        startTime: mainOptimized.time,
        endTime: this.addMinutesToTime(mainOptimized.time, mainOptimized.estimatedTime),
        timeBlockType: this.taskManager.getTimeBlockType(mainOptimized.time)
      }
    });

    // 阶段性计划任务（同样进行智能时间安排）
    if (habitPlan.phased_plan) {
      const phases = Object.keys(habitPlan.phased_plan);
      for (const phase of phases) {
        if (phase !== 'long_term') {
          const phaseBase = {
            title: `${habitPlan.task_template.title} - ${phase}`,
            description: habitPlan.phased_plan[phase],
            priority: 'low',
            estimatedTime: 30,
            timeBlock: habitPlan.task_template.timeBlock
          };
          const phaseOptimized = this.optimizeTaskScheduling(phaseBase, existingTasks, scheduledSlotsAccumulator);
          tasksToCreate.push({
            title: phaseOptimized.title,
            description: phaseOptimized.description,
            priority: phaseOptimized.priority,
            quadrant: this.analyzeQuadrant(phaseOptimized.title || ''),
            date: phaseOptimized.date || new Date().toISOString().split('T')[0],
            time: phaseOptimized.time,
            estimatedTime: phaseOptimized.estimatedTime,
            timeBlock: {
              startTime: phaseOptimized.time,
              endTime: this.addMinutesToTime(phaseOptimized.time, phaseOptimized.estimatedTime),
              timeBlockType: this.taskManager.getTimeBlockType(phaseOptimized.time)
            }
          });
        }
      }
    }

    const created = await this.taskManager.createTasksBatch(tasksToCreate, collectionId, userId);
    return created;
  }

  extractSimpleTaskData(userInput) {
    // 增强的任务数据提取，支持时间和优先级分析
    const taskData = {
      title: userInput.length > 50 ? userInput.substring(0, 50) + '...' : userInput,
      description: userInput,
      priority: this.analyzePriority(userInput),
      quadrant: this.analyzeQuadrant(userInput),
      estimatedTime: this.timeParser.extractDuration(userInput)
    };

    console.log(`📝 提取任务数据:`, taskData);
    return taskData;
  }

  /**
   * 分析任务优先级
   */
  analyzePriority(input) {
    const highPriorityKeywords = ['紧急', '重要', 'urgent', '马上', '立刻', '赶紧'];
    const lowPriorityKeywords = ['有空', '随时', '不急', '可以', '方便时'];
    
    for (const keyword of highPriorityKeywords) {
      if (input.includes(keyword)) return 'high';
    }
    
    for (const keyword of lowPriorityKeywords) {
      if (input.includes(keyword)) return 'low';
    }
    
    return 'medium';
  }

  /**
   * 分析任务象限
   */
  analyzeQuadrant(input) {
    const urgent = input.includes('紧急') || input.includes('马上') || input.includes('立刻');
    const important = input.includes('重要') || input.includes('必须') || input.includes('一定要');
    
    if (urgent && important) return 1; // 重要且紧急
    if (important && !urgent) return 2; // 重要不紧急
    if (urgent && !important) return 3; // 紧急不重要
    return 4; // 不重要不紧急
  }

  async findOrCreateCollection(name, userId) {
    if (this.dbDisabled) {
      console.log('🧪 MOCK DB: findOrCreateCollection');
      return { _id: 'mock-collection-id', name, description: `系统自动创建的${name}集合`, userId, expanded: true };
    }
    
    // 验证用户ID
    const validUserId = this.validateUserId(userId);
    
    let collection = await Collection.findOne({ name: name, userId: validUserId });
    
    if (!collection) {
      collection = new Collection({
        name: name,
        description: `系统自动创建的${name}集合`,
        userId: validUserId,
        expanded: true
      });
      await collection.save();
      console.log(`✅ 创建新任务集: ${name}`);
    }
    
    return collection;
  }

  async createTask(taskData) {
    if (this.dbDisabled) {
      console.log('🧪 MOCK DB: createTask');
      return { _id: 'mock-task-id', ...taskData, completed: false };
    }
    
    // 验证用户ID
    const validatedTaskData = {
      ...taskData,
      userId: this.validateUserId(taskData.userId)
    };
    
    const task = new Task(validatedTaskData);
    await task.save();
    
    // 更新任务集关联
    await Collection.findByIdAndUpdate(
      taskData.collectionId,
      { $push: { tasks: task._id } }
    );
    
    return task;
  }

  async savePlanToDatabase(plan, userId) {
    console.log('💾 将计划保存到数据库...');
    
    const result = {
      collections: [],
      total_tasks: 0
    };

    if (this.dbDisabled) {
      for (const collectionData of plan.collections) {
        result.collections.push({
          collection: { _id: 'mock-collection-id', name: collectionData.name, description: collectionData.description, userId },
          tasks: (collectionData.tasks || []).map((t, idx) => ({ _id: `mock-task-${idx}`, ...t, userId }))
        });
        result.total_tasks += (collectionData.tasks || []).length;
      }
      console.log(`🧪 MOCK DB: 计划保存完成: ${result.collections.length}个任务集, ${result.total_tasks}个任务`);
      return result;
    }

    for (const collectionData of plan.collections) {
      // 创建任务集
      const collection = await this.findOrCreateCollection(collectionData.name, userId);
      
      // 创建任务
      const tasks = [];
      for (const taskData of collectionData.tasks) {
        const task = await this.createTask({
          ...taskData,
          collectionId: collection._id,
          userId: userId
        });
        tasks.push(task);
      }
      
      result.collections.push({
        collection: collection,
        tasks: tasks
      });
      result.total_tasks += tasks.length;
    }

    console.log(`✅ 计划保存完成: ${result.collections.length}个任务集, ${result.total_tasks}个任务`);
    return result;
  }

  async getCurrentPlan(planId, userId) {
    if (this.dbDisabled) {
      console.log('🧪 MOCK DB: getCurrentPlan');
      return {
        plan_overview: '当前计划概述',
        collections: [{ name: '主要任务', description: 'mock', tasks: [] }]
      };
    }
    const collections = await Collection.find({ userId: userId }).populate('subtasks');
    return {
      plan_overview: '当前计划概述',
      collections: collections.map(col => ({
        name: col.name,
        description: col.description,
        tasks: col.subtasks || []
      }))
    };
  }

  async applyPlanAdjustment(planId, adjustment, userId) {
    console.log('🔄 应用计划调整...');
    
    let modifiedTasks = 0;
    
    if (this.dbDisabled) {
      console.log('🧪 MOCK DB: applyPlanAdjustment');
      return { modified_tasks: 0, applied_changes: adjustment.changes.length };
    }

    // 根据调整记录应用变更
    for (const change of adjustment.changes) {
      switch (change.type) {
        case 'modify':
          // 修改任务
          if (change.target === '整体计划') {
            // 全局调整
            const tasks = await Task.find({ userId: userId, completed: false });
            for (const task of tasks) {
              task.description += ' (已调整)';
              await task.save();
              modifiedTasks++;
            }
          }
          break;
        
        case 'reschedule':
          // 重新安排时间
          // 具体实现根据需求
          break;
      }
    }

    console.log(`✅ 计划调整应用完成，修改了${modifiedTasks}个任务`);
    
    return {
      modified_tasks: modifiedTasks,
      applied_changes: adjustment.changes.length
    };
  }
}

module.exports = AITaskService;