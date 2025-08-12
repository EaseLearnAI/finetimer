'use strict';

const Task = require('../../models/Task');
const Collection = require('../../models/Collection');
const TaskManagementService = require('./task_management_service');
const IntelligentSchedulerService = require('./intelligent_scheduler_service');

/**
 * 时间调度管理流程服务
 * 专门负责处理未安排时间的任务，确保所有任务都有合理的时间安排
 * 特别关注AI生成的任务能正确显示在任务页面上
 */
class SchedulerManagerService {
  constructor() {
    this.taskManager = new TaskManagementService();
    this.intelligentScheduler = new IntelligentSchedulerService();
    this.DEFAULT_USER_ID = '68974d3a68e7adf1e74f68ab';
    
    console.log('📅 时间调度管理流程服务初始化完成');
  }

  /**
   * 核心方法：调度所有未安排时间的任务
   * 这是确保AI生成任务显示在前端的关键流程
   */
  async scheduleUnscheduledTasks(userId = this.DEFAULT_USER_ID) {
    console.log('\n🎯 === 开始调度未安排时间的任务 ===');
    
    try {
      // 1. 获取所有未安排时间的任务
      const unscheduledTasks = await this.getUnscheduledTasks(userId);
      console.log(`📋 发现 ${unscheduledTasks.length} 个未安排时间的任务`);
      
      if (unscheduledTasks.length === 0) {
        console.log('✅ 所有任务都已安排时间');
        return {
          success: true,
          message: '所有任务都已安排时间',
          scheduled_tasks: 0,
          updated_tasks: []
        };
      }

      // 2. 获取用户现有的时间占用情况
      const existingTasks = await this.taskManager.getUserCurrentTasks(userId);
      
      // 3. 为每个未安排的任务智能分配时间
      const scheduledTasks = [];
      
      for (const task of unscheduledTasks) {
        const scheduledTask = await this.scheduleIndividualTask(task, existingTasks);
        if (scheduledTask) {
          scheduledTasks.push(scheduledTask);
          
          // 更新已占用时间列表，避免新分配的任务互相冲突
          existingTasks.occupiedTimeSlots.push({
            date: scheduledTask.date,
            time: scheduledTask.time,
            duration: scheduledTask.estimatedTime || 60
          });
        }
      }

      console.log(`✅ 成功调度 ${scheduledTasks.length} 个任务`);
      
      return {
        success: true,
        message: `成功为 ${scheduledTasks.length} 个任务安排了时间`,
        scheduled_tasks: scheduledTasks.length,
        updated_tasks: scheduledTasks.map(t => ({
          id: t._id,
          title: t.title,
          date: t.date,
          time: t.time,
          timeBlock: t.timeBlock?.timeBlockType
        }))
      };

    } catch (error) {
      console.error('❌ 调度未安排任务失败:', error);
      throw error;
    }
  }

  /**
   * 获取所有未安排时间的任务
   * 特别关注那些有collectionId但缺少date或time的任务
   */
  async getUnscheduledTasks(userId) {
    try {
      // 查找符合以下条件的任务：
      // 1. 未完成
      // 2. 缺少date字段 或 缺少time字段
      // 3. 或者isScheduled为false
      const unscheduledTasks = await Task.find({
        userId: userId,
        completed: false,
        $or: [
          { date: { $exists: false } },
          { date: null },
          { time: { $exists: false } },
          { time: null },
          { isScheduled: false },
          { isScheduled: { $exists: false } }
        ]
      }).populate('collectionId');

      console.log(`🔍 找到未安排任务明细:`);
      unscheduledTasks.forEach(task => {
        console.log(`  - ${task.title} (集合: ${task.collectionId?.name || '无'})`);
        console.log(`    缺少: ${!task.date ? 'date ' : ''}${!task.time ? 'time ' : ''}${!task.isScheduled ? 'scheduled_flag' : ''}`);
      });

      return unscheduledTasks;
      
    } catch (error) {
      console.error('❌ 获取未安排任务失败:', error);
      return [];
    }
  }

  /**
   * 为单个任务智能分配时间
   */
  async scheduleIndividualTask(task, existingTasks) {
    try {
      console.log(`⏰ 为任务安排时间: ${task.title}`);
      
      // 1. 确定任务的估算时长
      const estimatedTime = task.estimatedTime || this.estimateTaskDuration(task);
      
      // 2. 确定任务的优先日期（今天起的合理日期）
      const targetDate = this.determineTargetDate(task);
      
      // 3. 根据任务类型和优先级确定首选时间段
      const preferredTimeBlock = this.determinePreferredTimeBlock(task);
      
      // 4. 使用智能调度器寻找最佳时间
      const availableTime = this.taskManager.findAvailableTimeSlot(
        existingTasks.occupiedTimeSlots,
        preferredTimeBlock?.startTime,
        estimatedTime,
        targetDate
      );

      // 5. 更新任务数据库记录
      const updatedTask = await Task.findByIdAndUpdate(task._id, {
        date: targetDate,
        time: availableTime,
        estimatedTime: estimatedTime,
        timeBlock: {
          startTime: availableTime,
          endTime: this.addMinutesToTime(availableTime, estimatedTime),
          timeBlockType: this.taskManager.getTimeBlockType(availableTime)
        },
        isScheduled: true
      }, { new: true });

      console.log(`✅ 任务"${task.title}"安排在 ${targetDate} ${availableTime}`);
      
      return updatedTask;
      
    } catch (error) {
      console.error(`❌ 安排任务"${task.title}"失败:`, error);
      return null;
    }
  }

  /**
   * 估算任务持续时间（分钟）
   */
  estimateTaskDuration(task) {
    const title = (task.title || '').toLowerCase();
    const description = (task.description || '').toLowerCase();
    const content = title + ' ' + description;

    // 根据任务内容智能估算时间
    if (content.includes('安装') || content.includes('下载') || content.includes('配置')) {
      return 30; // 安装配置类任务
    } else if (content.includes('学习') || content.includes('阅读') || content.includes('教材')) {
      return 60; // 学习类任务
    } else if (content.includes('练习') || content.includes('训练') || content.includes('背诵')) {
      return 45; // 练习类任务
    } else if (content.includes('计划') || content.includes('制定') || content.includes('安排')) {
      return 30; // 规划类任务
    } else if (content.includes('听力') || content.includes('跟读') || content.includes('口语')) {
      return 20; // 语言练习类任务
    } else {
      return 60; // 默认1小时
    }
  }

  /**
   * 确定任务的目标日期
   */
  determineTargetDate(task) {
    const today = new Date().toISOString().split('T')[0];
    
    // 如果任务有dueDate且在未来，使用dueDate
    if (task.dueDate) {
      const dueDate = new Date(task.dueDate).toISOString().split('T')[0];
      if (dueDate >= today) {
        return dueDate;
      }
    }
    
    // 根据任务优先级确定日期
    if (task.priority === 'high' || task.quadrant === 1) {
      return today; // 高优先级任务安排在今天
    } else if (task.priority === 'medium' || task.quadrant === 2) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split('T')[0]; // 中优先级任务安排在明天
    } else {
      // 低优先级任务安排在后天
      const dayAfterTomorrow = new Date();
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
      return dayAfterTomorrow.toISOString().split('T')[0];
    }
  }

  /**
   * 根据任务特性确定首选时间段
   */
  determinePreferredTimeBlock(task) {
    const title = (task.title || '').toLowerCase();
    const description = (task.description || '').toLowerCase();
    const content = title + ' ' + description;

    // 学习类任务 - 上午精力最好
    if (content.includes('学习') || content.includes('阅读') || content.includes('背诵')) {
      return { startTime: '09:00', timeBlockType: 'forenoon' };
    }
    
    // 练习类任务 - 下午
    if (content.includes('练习') || content.includes('训练') || content.includes('跟读')) {
      return { startTime: '14:00', timeBlockType: 'afternoon' };
    }
    
    // 安装配置类 - 晚上
    if (content.includes('安装') || content.includes('下载') || content.includes('配置')) {
      return { startTime: '19:00', timeBlockType: 'evening' };
    }
    
    // 计划制定类 - 下午
    if (content.includes('计划') || content.includes('制定') || content.includes('安排')) {
      return { startTime: '15:00', timeBlockType: 'afternoon' };
    }
    
    // 根据优先级分配时间段
    if (task.priority === 'high' || task.quadrant === 1) {
      return { startTime: '09:00', timeBlockType: 'forenoon' }; // 高优先级用上午
    } else {
      return { startTime: '14:00', timeBlockType: 'afternoon' }; // 其他用下午
    }
  }

  /**
   * 时间计算辅助方法
   */
  addMinutesToTime(time, minutes) {
    if (!time) return null;
    
    const [hours, mins] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMins = totalMinutes % 60;
    
    return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
  }

  /**
   * 生成调度报告
   */
  async generateScheduleReport(userId = this.DEFAULT_USER_ID) {
    try {
      const allTasks = await Task.find({ userId, completed: false });
      const scheduledTasks = allTasks.filter(t => t.date && t.time);
      const unscheduledTasks = allTasks.filter(t => !t.date || !t.time);
      
      const report = {
        total_tasks: allTasks.length,
        scheduled_tasks: scheduledTasks.length,
        unscheduled_tasks: unscheduledTasks.length,
        scheduling_rate: ((scheduledTasks.length / allTasks.length) * 100).toFixed(1) + '%',
        today_tasks: scheduledTasks.filter(t => t.date === new Date().toISOString().split('T')[0]).length
      };
      
      console.log('📊 调度状况报告:', report);
      return report;
      
    } catch (error) {
      console.error('❌ 生成调度报告失败:', error);
      return null;
    }
  }
}

module.exports = SchedulerManagerService;