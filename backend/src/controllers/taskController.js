'use strict';

const Task = require('../models/Task');
const logger = require('../config/logger');

// 已废弃：不再允许默认或请求参数提供的用户ID

// 获取所有任务
const getAllTasks = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: '未认证，缺少用户信息' });
    }
    const { completed, collectionId, limit = 50, offset = 0, date } = req.query;
    
    // 构建查询条件，自动添加userId
    const query = { userId };
    if (completed !== undefined) query.completed = completed === 'true';
    if (collectionId) query.collectionId = collectionId;
    // 按当天日期过滤（字符串YYYY-MM-DD匹配AddTaskModal的date）
    if (date) query.date = date;
    
    // 查询数据
    const tasks = await Task.find(query)
      .sort({ time: 1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .populate('collectionId', 'name');
    
    // 获取总数
    const total = await Task.countDocuments(query);
    
    logger.info(`用户 ${userId} 获取到 ${tasks.length} 个任务`);
    
    res.json({
      success: true,
      data: tasks,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    // 检查是否是无效的ObjectId导致的错误
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: '任务未找到'
      });
    }
    logger.error(`获取任务失败: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '获取任务失败',
      error: error.message
    });
  }
};

// 创建新任务
const createTask = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: '未认证，缺少用户信息' });
    }
    const taskData = { ...req.body, userId };
    
    // 验证必需字段
    if (!taskData.title) {
      return res.status(400).json({
        success: false,
        message: '任务标题不能为空'
      });
    }
    
    const task = new Task(taskData);
    const savedTask = await task.save();
    
    // 查询新创建的任务（包含可能的关联数据）
    const populatedTask = await Task.findById(savedTask._id)
      .populate('collectionId', 'name');
    
    logger.info(`用户 ${userId} 创建任务: ${savedTask.title}`);
    
    res.status(201).json({
      success: true,
      message: '任务创建成功',
      data: populatedTask
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages[0] || '数据验证失败'
      });
    }
    
    logger.error(`创建任务失败: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '创建任务失败',
      error: error.message
    });
  }
};

// 根据ID获取单个任务
const getTaskById = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: '未认证，缺少用户信息' });
    }
    const taskId = req.params.id;
    
    const task = await Task.findOne({ _id: taskId, userId })
      .populate('collectionId', 'name');
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: '任务未找到'
      });
    }
    
    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: '任务未找到'
      });
    }
    
    logger.error(`获取任务失败: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '获取任务失败',
      error: error.message
    });
  }
};

// 更新任务
const updateTask = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: '未认证，缺少用户信息' });
    }
    const taskId = req.params.id;
    
    // 不允许更新userId
    delete req.body.userId;
    
    const task = await Task.findOneAndUpdate(
      { _id: taskId, userId },
      req.body,
      { new: true, runValidators: true }
    ).populate('collectionId', 'name');
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: '任务未找到'
      });
    }
    
    logger.info(`用户 ${userId} 更新任务: ${task.title}`);
    
    res.json({
      success: true,
      message: '任务更新成功',
      data: task
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: '任务未找到'
      });
    }
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages[0] || '数据验证失败'
      });
    }
    
    logger.error(`更新任务失败: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '更新任务失败',
      error: error.message
    });
  }
};

// 删除任务
const deleteTask = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: '未认证，缺少用户信息' });
    }
    const taskId = req.params.id;
    
    const task = await Task.findOneAndDelete({ _id: taskId, userId });
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: '任务未找到'
      });
    }
    
    logger.info(`用户 ${userId} 删除任务: ${task.title}`);
    
    res.json({
      success: true,
      message: '任务删除成功'
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: '任务未找到'
      });
    }
    
    logger.error(`删除任务失败: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '删除任务失败',
      error: error.message
    });
  }
};

// 切换任务完成状态
const toggleTaskCompletion = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: '未认证，缺少用户信息' });
    }
    const taskId = req.params.id;
    
    const task = await Task.findOne({ _id: taskId, userId });
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: '任务未找到'
      });
    }
    
    task.completed = !task.completed;
    await task.save();
    
    // 重新查询以获取关联数据
    const updatedTask = await Task.findById(task._id)
      .populate('collectionId', 'name');
    
    logger.info(`用户 ${userId} 切换任务完成状态: ${task.title} -> ${task.completed}`);
    
    res.json({
      success: true,
      message: `任务已${task.completed ? '完成' : '重新激活'}`,
      data: updatedTask
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: '任务未找到'
      });
    }
    
    logger.error(`切换任务状态失败: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '切换任务状态失败',
      error: error.message
    });
  }
};

// 获取未指定时间的任务
const getUnscheduledTasks = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: '未认证，缺少用户信息' });
    }
    const { limit = 20, offset = 0 } = req.query;
    
    const query = {
      userId,
      completed: false,
      $or: [
        { 'timeBlock.timeBlockType': { $in: ['unscheduled', null] } },
        { 'timeBlock.timeBlockType': { $exists: false } },
        { timeBlock: { $exists: false } }
      ]
    };
    
    const tasks = await Task.find(query)
      .sort({ priority: 1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .populate('collectionId', 'name');
    
    const total = await Task.countDocuments(query);
    
    logger.info(`用户 ${userId} 获取到 ${tasks.length} 个未安排时间的任务`);
    
    res.json({
      success: true,
      data: tasks,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    logger.error(`获取未安排任务失败: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '获取未安排任务失败',
      error: error.message
    });
  }
};

// 根据时间块类型获取任务
const getTasksByTimeBlock = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: '未认证，缺少用户信息' });
    }
    const { timeBlockType } = req.params;
    const { date, limit = 20, offset = 0 } = req.query;
    
    // 验证时间块类型
    const validTimeBlocks = ['morning', 'forenoon', 'afternoon', 'evening'];
    if (!validTimeBlocks.includes(timeBlockType)) {
      return res.status(400).json({
        success: false,
        message: '无效的时间块类型'
      });
    }
    
    const query = {
      userId,
      'timeBlock.timeBlockType': timeBlockType
    };
    
    if (date) {
      query.date = date;
    }
    
    const tasks = await Task.find(query)
      .sort({ 'timeBlock.startTime': 1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .populate('collectionId', 'name');
    
    const total = await Task.countDocuments(query);
    
    logger.info(`用户 ${userId} 获取到 ${tasks.length} 个 ${timeBlockType} 时间块任务`);
    
    res.json({
      success: true,
      data: tasks,
      total,
      timeBlockType,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    logger.error(`获取时间块任务失败: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '获取时间块任务失败',
      error: error.message
    });
  }
};

module.exports = {
  getAllTasks,
  createTask,
  getTaskById,
  updateTask,
  deleteTask,
  toggleTaskCompletion,
  getUnscheduledTasks,
  getTasksByTimeBlock
};