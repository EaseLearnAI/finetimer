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

class AITaskService {
  constructor() {
    // 初始化所有链条
    this.inputClassifier = new InputClassifierChain();
    this.questionGenerator = new QuestionGeneratorChain();
    this.planGenerator = new PlanGeneratorChain();
    this.planAdjuster = new PlanAdjusterChain();
    this.habitProcessor = new HabitProcessorChain();
    
    console.log('🤖 AI任务服务初始化完成');
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
   * 处理简单待办事项
   */
  async handleSimpleTodo(userInput, userId, classification) {
    console.log('\n📋 处理简单待办事项...');

    try {
      // 直接创建任务，不需要复杂的规划
      const taskData = this.extractSimpleTaskData(userInput);
      
      // 创建任务集（如果不存在）
      let collection = await this.findOrCreateCollection('临时任务', userId);
      
      // 创建任务
      const task = await this.createTask({
        ...taskData,
        collectionId: collection._id,
        userId: userId
      });

      console.log(`✅ 简单待办创建成功: ${task.title}`);

      return {
        success: true,
        type: 'simple_todo',
        classification: classification,
        result: {
          message: `已为你创建待办事项："${task.title}"`,
          task: task,
          collection: collection
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
          message: questions.greeting || '我需要了解一些信息来帮你制定更好的计划。'
        }
      };

    } catch (error) {
      console.error('❌ 目标规划处理失败:', error.message);
      throw error;
    }
  }

  /**
   * 处理习惯养成
   */
  async handleHabitFormation(userInput, userId, classification) {
    console.log('\n🔄 处理习惯养成...');

    try {
      // 直接处理简单习惯，如果需要更多信息则生成问题
      const habitPlan = await this.habitProcessor.processHabit(userInput);
      
      // 创建习惯任务集
      let collection = await this.findOrCreateCollection('习惯养成', userId);
      
      // 创建习惯任务
      const habitTask = await this.createTask({
        title: habitPlan.task_template.title,
        description: habitPlan.task_template.description,
        priority: habitPlan.task_template.priority,
        timeBlock: habitPlan.task_template.timeBlock,
        collectionId: collection._id,
        userId: userId,
        tags: ['habit', ...habitPlan.task_template.tags]
      });

      console.log(`✅ 习惯任务创建成功: ${habitTask.title}`);

      return {
        success: true,
        type: 'habit_formation',
        classification: classification,
        result: {
          message: `已为你创建习惯计划："${habitTask.title}"`,
          habit_plan: habitPlan,
          task: habitTask,
          collection: collection
        }
      };

    } catch (error) {
      console.error('❌ 习惯养成处理失败:', error.message);
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
      // 步骤3: 生成计划
      const plan = await this.planGenerator.generatePlan(goal, goalType, userAnswers);
      
      // 步骤4: 将计划转换为任务和任务集
      const dbResult = await this.savePlanToDatabase(plan, userId);

      console.log(`✅ 计划生成并保存成功，创建了${dbResult.collections.length}个任务集`);

      return {
        success: true,
        type: 'plan_generated',
        result: {
          message: `已为你的目标"${goal}"制定了详细计划！`,
          plan: plan,
          database_result: dbResult,
          summary: {
            collections_count: dbResult.collections.length,
            tasks_count: dbResult.total_tasks,
            estimated_duration: '待计算'
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

  // === 辅助方法 ===

  extractSimpleTaskData(userInput) {
    // 简单的任务数据提取
    return {
      title: userInput.length > 50 ? userInput.substring(0, 50) + '...' : userInput,
      description: userInput,
      priority: 'medium',
      quadrant: 3, // 默认为紧急不重要
      timeBlock: {
        timeBlockType: 'unscheduled',
        startTime: '',
        endTime: ''
      }
    };
  }

  async findOrCreateCollection(name, userId) {
    let collection = await Collection.findOne({ name: name, userId: userId });
    
    if (!collection) {
      collection = new Collection({
        name: name,
        description: `系统自动创建的${name}集合`,
        userId: userId,
        expanded: true
      });
      await collection.save();
      console.log(`✅ 创建新任务集: ${name}`);
    }
    
    return collection;
  }

  async createTask(taskData) {
    const task = new Task(taskData);
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
    // 这里需要根据实际的数据结构来获取计划
    // 暂时返回一个示例结构
    const collections = await Collection.find({ userId: userId }).populate('tasks');
    
    return {
      plan_overview: '当前计划概述',
      collections: collections.map(col => ({
        name: col.name,
        description: col.description,
        tasks: col.tasks
      }))
    };
  }

  async applyPlanAdjustment(planId, adjustment, userId) {
    console.log('🔄 应用计划调整...');
    
    let modifiedTasks = 0;
    
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