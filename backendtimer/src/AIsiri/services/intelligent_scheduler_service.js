'use strict';

const Task = require('../../models/Task');
const Collection = require('../../models/Collection');
const TimeParsingService = require('./time_parsing_service');

/**
 * 智能时间调度服务
 * 负责为任务智能安排时间，避免冲突，优化时间利用率
 */
class IntelligentSchedulerService {
  constructor() {
    this.timeParsingService = new TimeParsingService();
    
    // 时间块配置
    this.timeBlocks = {
      morning: { start: '07:00', end: '09:00', label: '早晨' },
      forenoon: { start: '09:00', end: '12:00', label: '上午' },
      afternoon: { start: '13:00', end: '18:00', label: '下午' },
      evening: { start: '18:00', end: '22:00', label: '晚上' }
    };
    
    // 默认任务时长（分钟）
    this.defaultDuration = 60;
    
    // 时间间隔（分钟）
    this.timeInterval = 30;
    
    console.log('🕐 智能时间调度服务初始化完成');
  }

  /**
   * 为任务集合智能安排时间
   * @param {Array} collections - 任务集合数组
   * @param {String} userId - 用户ID
   * @param {Object} userPreferences - 用户偏好设置
   * @returns {Array} 带时间安排的任务集合
   */
  async scheduleTaskCollections(collections, userId, userPreferences = {}) {
    console.log(`🎯 开始为${collections.length}个任务集安排时间`);
    
    try {
      // 1. 获取用户现有任务的时间占用情况
      const occupiedSlots = await this.getOccupiedTimeSlots(userId);
      console.log(`📅 已占用时间段: ${occupiedSlots.length}个`);
      
      // 2. 生成可用时间段
      const availableSlots = this.generateAvailableTimeSlots(occupiedSlots, userPreferences);
      console.log(`⏰ 可用时间段: ${availableSlots.length}个`);
      
      // 3. 为每个任务集的任务安排时间
      const scheduledCollections = [];
      let currentSlotIndex = 0;
      
      for (const collection of collections) {
        const scheduledCollection = {
          ...collection,
          tasks: []
        };
        
        console.log(`📋 处理任务集: ${collection.name} (${collection.tasks.length}个任务)`);
        
        for (const task of collection.tasks) {
          const scheduledTask = await this.scheduleTask(
            task, 
            availableSlots, 
            currentSlotIndex, 
            userPreferences
          );
          
          if (scheduledTask.timeBlock && scheduledTask.timeBlock.startTime) {
            // 更新已占用时间段
            occupiedSlots.push({
              date: scheduledTask.date || this.getNextAvailableDate(),
              startTime: scheduledTask.timeBlock.startTime,
              endTime: scheduledTask.timeBlock.endTime,
              taskTitle: scheduledTask.title
            });
            
            // 移动到下一个时间段
            currentSlotIndex++;
          }
          
          scheduledCollection.tasks.push(scheduledTask);
        }
        
        scheduledCollections.push(scheduledCollection);
      }
      
      console.log(`✅ 时间安排完成，共处理${this.getTotalTaskCount(scheduledCollections)}个任务`);
      return scheduledCollections;
      
    } catch (error) {
      console.error('❌ 智能时间调度失败:', error);
      throw error;
    }
  }

  /**
   * 为单个任务安排时间
   */
  async scheduleTask(task, availableSlots, startIndex, userPreferences) {
    const duration = task.estimatedTime || this.defaultDuration;
    
    // 根据任务优先级和类型选择合适的时间段
    const preferredTimeBlock = this.getPreferredTimeBlock(task, userPreferences);
    
    // 在可用时间段中寻找合适的时间
    for (let i = startIndex; i < availableSlots.length; i++) {
      const slot = availableSlots[i];
      
      // 检查时间段是否匹配偏好
      if (preferredTimeBlock && slot.timeBlockType !== preferredTimeBlock) {
        continue;
      }
      
      // 检查时间段是否足够
      if (this.getSlotDuration(slot) >= duration) {
        const scheduledTask = {
          ...task,
          date: slot.date,
          timeBlock: {
            startTime: slot.startTime,
            endTime: this.addMinutes(slot.startTime, duration),
            timeBlockType: slot.timeBlockType
          },
          isScheduled: true
        };
        
        console.log(`⏰ 任务"${task.title}"安排在 ${slot.date} ${slot.startTime}-${scheduledTask.timeBlock.endTime}`);
        return scheduledTask;
      }
    }
    
    // 如果没有找到合适的时间段，返回未安排时间的任务
    console.log(`⚠️ 任务"${task.title}"暂时无法安排时间`);
    return {
      ...task,
      timeBlock: {
        timeBlockType: 'unscheduled'
      },
      isScheduled: false
    };
  }

  /**
   * 获取用户已占用的时间段
   */
  async getOccupiedTimeSlots(userId) {
    try {
      const tasks = await Task.find({
        userId: userId,
        completed: false,
        $and: [
          { 'timeBlock.startTime': { $exists: true, $ne: '' } },
          { 'timeBlock.endTime': { $exists: true, $ne: '' } }
        ]
      }).select('date timeBlock title estimatedTime');
      
      return tasks.map(task => ({
        date: task.date || this.getNextAvailableDate(),
        startTime: task.timeBlock.startTime,
        endTime: task.timeBlock.endTime,
        taskTitle: task.title,
        duration: task.estimatedTime || this.defaultDuration
      }));
      
    } catch (error) {
      console.error('❌ 获取已占用时间段失败:', error);
      return [];
    }
  }

  /**
   * 生成可用时间段
   */
  generateAvailableTimeSlots(occupiedSlots, userPreferences, daysAhead = 30) {
    const availableSlots = [];
    const today = new Date();
    
    for (let dayOffset = 0; dayOffset < daysAhead; dayOffset++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + dayOffset);
      const dateStr = this.formatDate(currentDate);
      
      // 获取当天已占用的时间段
      const dayOccupiedSlots = occupiedSlots.filter(slot => slot.date === dateStr);
      
      // 为每个时间块生成可用时间段
      for (const [blockType, blockInfo] of Object.entries(this.timeBlocks)) {
        const blockSlots = this.generateSlotsForTimeBlock(
          dateStr, 
          blockType, 
          blockInfo, 
          dayOccupiedSlots
        );
        availableSlots.push(...blockSlots);
      }
    }
    
    return availableSlots.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.startTime.localeCompare(b.startTime);
    });
  }

  /**
   * 为特定时间块生成可用时间段
   */
  generateSlotsForTimeBlock(date, blockType, blockInfo, occupiedSlots) {
    const slots = [];
    const startMinutes = this.timeToMinutes(blockInfo.start);
    const endMinutes = this.timeToMinutes(blockInfo.end);
    
    for (let minutes = startMinutes; minutes < endMinutes; minutes += this.timeInterval) {
      const slotStart = this.minutesToTime(minutes);
      const slotEnd = this.minutesToTime(minutes + this.timeInterval);
      
      // 检查是否与已占用时间冲突
      const isOccupied = occupiedSlots.some(occupied => 
        this.isTimeOverlap(slotStart, slotEnd, occupied.startTime, occupied.endTime)
      );
      
      if (!isOccupied) {
        slots.push({
          date: date,
          startTime: slotStart,
          endTime: slotEnd,
          timeBlockType: blockType,
          duration: this.timeInterval
        });
      }
    }
    
    return slots;
  }

  /**
   * 根据任务特性获取偏好时间块
   */
  getPreferredTimeBlock(task, userPreferences) {
    // 根据任务优先级和四象限分类推荐时间段
    if (task.quadrant === 1) { // 重要且紧急
      return 'forenoon'; // 上午精力最好
    } else if (task.quadrant === 2) { // 重要不紧急
      return userPreferences.preferredTimeBlock || 'forenoon';
    } else if (task.priority === 'high') {
      return 'forenoon';
    } else {
      return 'afternoon'; // 一般任务安排在下午
    }
  }

  /**
   * 检查时间是否重叠
   */
  isTimeOverlap(start1, end1, start2, end2) {
    const start1Minutes = this.timeToMinutes(start1);
    const end1Minutes = this.timeToMinutes(end1);
    const start2Minutes = this.timeToMinutes(start2);
    const end2Minutes = this.timeToMinutes(end2);
    
    return start1Minutes < end2Minutes && end1Minutes > start2Minutes;
  }

  /**
   * 时间转换为分钟数
   */
  timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * 分钟数转换为时间
   */
  minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  /**
   * 给时间添加分钟
   */
  addMinutes(timeStr, minutesToAdd) {
    const totalMinutes = this.timeToMinutes(timeStr) + minutesToAdd;
    return this.minutesToTime(totalMinutes);
  }

  /**
   * 获取时间段持续时间
   */
  getSlotDuration(slot) {
    return this.timeToMinutes(slot.endTime) - this.timeToMinutes(slot.startTime);
  }

  /**
   * 格式化日期
   */
  formatDate(date) {
    return date.toISOString().split('T')[0];
  }

  /**
   * 获取下一个可用日期
   */
  getNextAvailableDate() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return this.formatDate(tomorrow);
  }

  /**
   * 获取总任务数
   */
  getTotalTaskCount(collections) {
    return collections.reduce((total, collection) => total + collection.tasks.length, 0);
  }

  /**
   * 优化时间安排
   * 根据任务依赖关系和优先级重新排序
   */
  optimizeSchedule(scheduledCollections) {
    console.log('🔧 优化时间安排...');
    
    // 按优先级和四象限重新排序任务
    for (const collection of scheduledCollections) {
      collection.tasks.sort((a, b) => {
        // 首先按四象限排序
        if (a.quadrant !== b.quadrant) {
          return a.quadrant - b.quadrant;
        }
        
        // 然后按优先级排序
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
    }
    
    return scheduledCollections;
  }

  /**
   * 生成时间安排报告
   */
  generateScheduleReport(scheduledCollections) {
    const report = {
      totalCollections: scheduledCollections.length,
      totalTasks: this.getTotalTaskCount(scheduledCollections),
      scheduledTasks: 0,
      unscheduledTasks: 0,
      timeDistribution: {
        morning: 0,
        forenoon: 0,
        afternoon: 0,
        evening: 0,
        unscheduled: 0
      }
    };
    
    for (const collection of scheduledCollections) {
      for (const task of collection.tasks) {
        if (task.isScheduled) {
          report.scheduledTasks++;
          report.timeDistribution[task.timeBlock.timeBlockType]++;
        } else {
          report.unscheduledTasks++;
          report.timeDistribution.unscheduled++;
        }
      }
    }
    
    console.log('📊 时间安排报告:', report);
    return report;
  }
}

module.exports = IntelligentSchedulerService;