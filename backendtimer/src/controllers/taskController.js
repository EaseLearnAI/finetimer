'use strict';

const Task = require('../models/Task');
const logger = require('../config/logger');

// 获取所有任务
const getAllTasks = async (req, res) => {
  try {
    const { userId, completed, collectionId, limit = 50, offset = 0 } = req.query;
    
    // 构建查询条件
    const query = {};
    if (userId) query.userId = userId;
    if (completed !== undefined) query.completed = completed === 'true';
    if (collectionId) query.collectionId = collectionId;
    
    // 查询数据
    const tasks = await Task.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .populate('collectionId', 'name');
    
    // 获取总数
    const total = await Task.countDocuments(query);
    
    logger.info(`获取到 ${tasks.length} 个任务`);
    
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
    const taskData = req.body;

    // 验证必要字段
    if (!taskData.title) {
      return res.status(400).json({
        success: false,
        message: '任务标题是必需的'
      });
    }

    // 如果没有提供时间信息，则明确将其设置为未调度。
    if (!taskData.timeBlock || !taskData.timeBlock.timeBlockType || taskData.timeBlock.timeBlockType === 'unscheduled' || !taskData.timeBlock.startTime) {
      taskData.isScheduled = false;
      if (!taskData.timeBlock) {
        taskData.timeBlock = {};
      }
      taskData.timeBlock.timeBlockType = 'unscheduled';
    } else {
      // 如果提供了时间信息，则将其安排好。
      taskData.isScheduled = true;
    }

    // 创建新任务
    const task = new Task(taskData);
    const savedTask = await task.save();

    // 如果任务有关联的任务集，更新任务集
    if (taskData.collectionId) {
      const Collection = require('../models/Collection');
      await Collection.findByIdAndUpdate(
        taskData.collectionId,
        { $addToSet: { tasks: savedTask._id } }
      );
    }

    logger.info(`创建新任务: ${savedTask._id}`);

    res.status(201).json({
      success: true,
      data: savedTask
    });
  } catch (error) {
    logger.error(`创建任务失败: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '创建任务失败',
      error: error.message
    });
  }
};

// 获取单个任务
const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const task = await Task.findById(id).populate('collectionId', 'name');
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: '任务未找到'
      });
    }
    
    logger.info(`获取任务: ${id}`);
    
    res.json({
      success: true,
      data: task
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

// 更新任务
const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // 获取更新前的任务信息
    const oldTask = await Task.findById(id);
    if (!oldTask) {
      return res.status(404).json({
        success: false,
        message: '任务未找到'
      });
    }
    
    const task = await Task.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('collectionId', 'name');
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: '任务未找到'
      });
    }
    
    // 处理任务集关联的更新
    const Collection = require('../models/Collection');
    
    // 如果任务集发生了变化
    if (updateData.collectionId !== oldTask.collectionId?.toString()) {
      // 从旧任务集中移除任务
      if (oldTask.collectionId) {
        await Collection.findByIdAndUpdate(
          oldTask.collectionId,
          { $pull: { tasks: id } }
        );
      }
      
      // 添加到新任务集
      if (updateData.collectionId) {
        await Collection.findByIdAndUpdate(
          updateData.collectionId,
          { $addToSet: { tasks: id } }
        );
      }
    }
    
    logger.info(`更新任务: ${id}`);
    
    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    // 检查是否是无效的ObjectId导致的错误
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: '任务未找到'
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
    const { id } = req.params;
    
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: '任务未找到'
      });
    }
    
    // 从任务集中移除任务
    if (task.collectionId) {
      const Collection = require('../models/Collection');
      await Collection.findByIdAndUpdate(
        task.collectionId,
        { $pull: { tasks: id } }
      );
    }
    
    // 删除任务
    await Task.findByIdAndDelete(id);
    
    logger.info(`删除任务: ${id}`);
    
    res.json({
      success: true,
      message: '任务已删除'
    });
  } catch (error) {
    // 检查是否是无效的ObjectId导致的错误
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
    const { id } = req.params;
    
    const task = await Task.findById(id);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: '任务未找到'
      });
    }
    
    // 切换完成状态
    task.completed = !task.completed;
    const updatedTask = await task.save();
    
    logger.info(`切换任务完成状态: ${id} -> ${task.completed}`);
    
    res.json({
      success: true,
      data: updatedTask
    });
  } catch (error) {
    // 检查是否是无效的ObjectId导致的错误
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: '任务未找到'
      });
    }
    logger.error(`切换任务完成状态失败: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '切换任务完成状态失败',
      error: error.message
    });
  }
};

// 获取未指定时间的任务
const getUnscheduledTasks = async (req, res) => {
  try {
    const { userId, limit = 50, offset = 0 } = req.query;
    
    // 构建查询条件
    const query = {
      $or: [
        { isScheduled: false },
        { 'timeBlock.timeBlockType': 'unscheduled' },
        { timeBlock: { $exists: false } },
        { 'timeBlock.startTime': { $exists: false } }
      ]
    };
    
    if (userId) query.userId = userId;
    
    // 查询数据
    const tasks = await Task.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .populate('collectionId', 'name');
    
    // 获取总数
    const total = await Task.countDocuments(query);
    
    logger.info(`获取到 ${tasks.length} 个未指定时间的任务`);
    
    res.json({
      success: true,
      data: tasks,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    logger.error(`获取未指定时间任务失败: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '获取未指定时间任务失败',
      error: error.message
    });
  }
};

// 根据时间块获取任务
const getTasksByTimeBlock = async (req, res) => {
  try {
    const { timeBlockType } = req.params;
    const { userId, limit = 50, offset = 0 } = req.query;
    
    // 验证时间块类型
    const validTimeBlocks = ['morning', 'forenoon', 'afternoon', 'evening', 'unscheduled'];
    if (!validTimeBlocks.includes(timeBlockType)) {
      return res.status(400).json({
        success: false,
        message: '无效的时间块类型'
      });
    }
    
    // 构建查询条件
    const query = {
      'timeBlock.timeBlockType': timeBlockType,
      isScheduled: true
    };
    
    if (userId) query.userId = userId;
    
    // 查询数据
    const tasks = await Task.find(query)
      .sort({ 'timeBlock.startTime': 1 })
      .limit(limit)
      .skip(offset)
      .populate('collectionId', 'name');
    
    // 获取总数
    const total = await Task.countDocuments(query);
    
    logger.info(`获取到 ${tasks.length} 个${timeBlockType}时间块的任务`);
    
    res.json({
      success: true,
      data: tasks,
      total,
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