const Collection = require('../../models/Collection');
const Task = require('../../models/Task');

/**
 * 任务管理服务 - 为AI助手提供任务和任务集的数据库操作能力
 */
class TaskManagementService {
  constructor() {
    this.DEFAULT_USER_ID = '68974d3a68e7adf1e74f68ab';
  }

  /**
   * 获取用户现有的任务和时间安排
   */
  async getUserCurrentTasks(userId = this.DEFAULT_USER_ID) {
    try {
      console.log(`📡 获取用户现有任务: ${userId}`);
      
      // 获取今天的日期
      const today = new Date().toISOString().split('T')[0];
      
      // 获取用户的任务集
      const collections = await Collection.find({ 
        userId, 
        archived: false 
      }).populate('subtasks');
      
      // 获取用户今天的任务
      const todayTasks = await Task.find({
        userId,
        date: today
      });
      
      // 获取用户所有未完成的任务（用于时间冲突检测）
      const allUncompletedTasks = await Task.find({
        userId,
        completed: false
      });
      
      const result = {
        collections: collections.map(c => ({
          id: c._id,
          name: c.name,
          description: c.description,
          taskCount: c.subtasks ? c.subtasks.length : 0,
          completedCount: c.subtasks ? c.subtasks.filter(t => t.completed).length : 0
        })),
        todayTasks: todayTasks.map(t => ({
          id: t._id,
          title: t.title,
          time: t.time,
          timeBlock: t.timeBlock,
          priority: t.priority,
          completed: t.completed,
          quadrant: t.quadrant
        })),
        occupiedTimeSlots: this.extractOccupiedTimeSlots(allUncompletedTasks),
        totalTasks: allUncompletedTasks.length,
        completedTasks: await Task.countDocuments({ userId, completed: true })
      };
      
      console.log(`✅ 成功获取用户任务: ${collections.length}个任务集, ${todayTasks.length}个今日任务`);
      return result;
      
    } catch (error) {
      console.error('❌ 获取用户任务失败:', error);
      throw error;
    }
  }

  /**
   * 提取已占用的时间段
   */
  extractOccupiedTimeSlots(tasks) {
    const timeSlots = [];
    
    tasks.forEach(task => {
      if (task.time && task.date) {
        timeSlots.push({
          date: task.date,
          time: task.time,
          title: task.title,
          duration: task.estimatedTime || 60 // 默认60分钟
        });
      }
    });
    
    return timeSlots;
  }

  /**
   * 创建简单任务（随机事件）
   */
  async createSimpleTask(taskData, userId = this.DEFAULT_USER_ID) {
    try {
      console.log(`📡 创建简单任务: ${taskData.title}`);
      
      const task = new Task({
        title: taskData.title,
        description: taskData.description || '',
        priority: taskData.priority || 'medium',
        quadrant: taskData.quadrant || 2,
        date: taskData.date || new Date().toISOString().split('T')[0],
        time: taskData.time,
        estimatedTime: taskData.estimatedTime || 30,
        userId,
        completed: false
      });
      
      const savedTask = await task.save();
      console.log(`✅ 简单任务创建成功: ${savedTask.title}`);
      
      return {
        success: true,
        task: {
          id: savedTask._id,
          title: savedTask.title,
          description: savedTask.description,
          priority: savedTask.priority,
          date: savedTask.date,
          time: savedTask.time
        }
      };
      
    } catch (error) {
      console.error('❌ 创建简单任务失败:', error);
      throw error;
    }
  }

  /**
   * 创建任务集合
   */
  async createCollection(collectionData, userId = this.DEFAULT_USER_ID) {
    try {
      console.log(`📡 创建任务集: ${collectionData.name}`);
      
      const collection = new Collection({
        name: collectionData.name,
        description: collectionData.description || '',
        color: collectionData.color || '#007aff',
        icon: collectionData.icon || 'folder',
        userId
      });
      
      const savedCollection = await collection.save();
      console.log(`✅ 任务集创建成功: ${savedCollection.name}`);
      
      return savedCollection;
      
    } catch (error) {
      console.error('❌ 创建任务集失败:', error);
      throw error;
    }
  }

  /**
   * 批量创建任务
   */
  async createTasksBatch(tasksData, collectionId = null, userId = this.DEFAULT_USER_ID) {
    try {
      console.log(`📡 批量创建任务: ${tasksData.length}个`);
      
      const tasks = tasksData.map(taskData => ({
        title: taskData.title,
        description: taskData.description || '',
        priority: taskData.priority || 'medium',
        quadrant: taskData.quadrant || 2,
        date: taskData.date,
        time: taskData.time,
        estimatedTime: taskData.estimatedTime || 60,
        collectionId,
        userId,
        completed: false,
        timeBlock: taskData.timeBlock
      }));
      
      const savedTasks = await Task.insertMany(tasks);
      console.log(`✅ 批量任务创建成功: ${savedTasks.length}个任务`);
      
      return savedTasks.map(task => ({
        id: task._id,
        title: task.title,
        description: task.description,
        priority: task.priority,
        date: task.date,
        time: task.time,
        quadrant: task.quadrant
      }));
      
    } catch (error) {
      console.error('❌ 批量创建任务失败:', error);
      throw error;
    }
  }

  /**
   * 智能安排时间，避免冲突
   */
  findAvailableTimeSlot(occupiedSlots, preferredTime, duration = 60, date) {
    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();
    const nowTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes()
      .toString()
      .padStart(2, '0')}`;

    // 如果有偏好时间且日期是今天，且偏好时间早于当前时间，则从当前时间之后开始找
    let normalizedPreferred = preferredTime;
    if (date === todayStr && preferredTime && this.timeToMinutes(preferredTime) <= this.timeToMinutes(nowTime)) {
      normalizedPreferred = null; // 让其走候选时间逻辑
    }

    // 如果没有指定偏好时间，使用候选时间段（今日从当前时间往后）。采用更科学的优先级：上午9:30、下午14:00、晚上19:00
    if (!normalizedPreferred) {
      const defaults = ['09:30', '14:00', '19:00'];
      const defaultSlots = date === todayStr ? defaults.filter(t => this.timeToMinutes(t) > this.timeToMinutes(nowTime)) : defaults;
      for (const slot of defaultSlots) {
        if (!this.isTimeSlotOccupied(occupiedSlots, date, slot, duration)) {
          return slot;
        }
      }
    }

    // 检查偏好时间是否可用
    if (normalizedPreferred && !this.isTimeSlotOccupied(occupiedSlots, date, normalizedPreferred, duration)) {
      return normalizedPreferred;
    }

    // 寻找最近的可用时间段（以 30 分钟粒度），今日从“当前时间下一刻度”开始
    const startFrom = date === todayStr ? this.roundUpToNextHalfHour(nowTime) : '07:00';
    const timeSlots = this.generateTimeSlots(startFrom);
    for (const slot of timeSlots) {
      if (!this.isTimeSlotOccupied(occupiedSlots, date, slot, duration)) {
        return slot;
      }
    }

    // 如果都被占用，返回晚间兜底时间段
    return '21:00';
  }

  /**
   * 检查时间段是否被占用
   */
  isTimeSlotOccupied(occupiedSlots, date, time, duration) {
    return occupiedSlots.some(slot => {
      if (slot.date !== date) return false;
      
      const slotStart = this.timeToMinutes(slot.time);
      const slotEnd = slotStart + slot.duration;
      const newStart = this.timeToMinutes(time);
      const newEnd = newStart + duration;
      
      // 检查是否有重叠
      return (newStart < slotEnd && newEnd > slotStart);
    });
  }

  /**
   * 生成可用时间段
   */
  generateTimeSlots(startFrom = '07:00') {
    const slots = [];
    const startMinutes = this.timeToMinutes(startFrom);
    const endMinutes = this.timeToMinutes('22:00');
    for (let minutes = startMinutes; minutes <= endMinutes; minutes += 30) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      slots.push(`${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`);
    }
    return slots;
  }

  roundUpToNextHalfHour(time) {
    const minutes = this.timeToMinutes(time);
    const remainder = minutes % 30;
    const rounded = remainder === 0 ? minutes + 30 : minutes + (30 - remainder);
    return this.minutesToTime(rounded);
  }

  /**
   * 时间转换为分钟数
   */
  timeToMinutes(time) {
    const [hours, minutes] = time.split(':').map(Number);
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
   * 根据时间确定时间块类型
   */
  getTimeBlockType(time) {
    if (!time) return 'unscheduled';
    
    const hour = parseInt(time.split(':')[0]);
    
    if (hour >= 7 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 24) return 'evening';
    
    return 'unscheduled';
  }

  /**
   * 根据内容确定四象限
   */
  determineQuadrant(title, priority, dueDate) {
    const isUrgent = dueDate && new Date(dueDate) - new Date() < 7 * 24 * 60 * 60 * 1000; // 7天内
    const isImportant = priority === 'high';
    
    if (isImportant && isUrgent) return 1; // 重要且紧急
    if (isImportant && !isUrgent) return 2; // 重要不紧急
    if (!isImportant && isUrgent) return 3; // 紧急不重要
    return 4; // 不重要不紧急
  }
}

module.exports = TaskManagementService;
