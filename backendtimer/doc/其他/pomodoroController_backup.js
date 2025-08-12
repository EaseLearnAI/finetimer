'use strict';

const Pomodoro = require('../../src/models/Pomodoro');
const logger = require('../../src/config/logger');

// 获取所有番茄钟记录
const getAllPomodoros = async (req, res) => {
  try {
    const { userId, limit = 50, offset = 0, startDate, endDate, taskName } = req.query;
    
    // 构建查询条件
    const query = {};
    if (userId) query.userId = userId;
    if (taskName) query.taskName = taskName;
    if (startDate || endDate) {
      query.createdAt = {}
      if (startDate) query.createdAt.$gte = new Date(startDate)
      if (endDate) query.createdAt.$lt = new Date(endDate)
    }
    
    // 查询数据
    const pomodoros = await Pomodoro.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset);
    
    // 获取总数
    const total = await Pomodoro.countDocuments(query);
    
    logger.info(`获取到 ${pomodoros.length} 个番茄钟记录`);
    
    res.json({
      success: true,
      data: pomodoros,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    // 检查是否是无效的ObjectId导致的错误
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: '番茄钟记录未找到'
      });
    }
    logger.error(`获取番茄钟记录失败: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '获取番茄钟记录失败',
      error: error.message
    });
  }
};

// 创建新的番茄钟记录
const createPomodoro = async (req, res) => {
  try {
    const { taskName, mode, startTime, endTime, duration, completed, userId, taskId } = req.body;
    
    // 验证必要字段
    if (!taskName || !startTime || !endTime || !duration) {
      return res.status(400).json({
        success: false,
        message: '缺少必要字段'
      });
    }
    
    // 计算本地日期与时间段类型
    const end = new Date(endTime)
    const y = end.getFullYear()
    const m = String(end.getMonth() + 1).padStart(2, '0')
    const d = String(end.getDate()).padStart(2, '0')
    const localDate = `${y}-${m}-${d}`
    const hour = end.getHours()
    let timeBlockType = 'evening'
    if (hour >= 7 && hour < 12) timeBlockType = 'morning'
    else if (hour >= 12 && hour < 18) timeBlockType = 'afternoon'

    // 创建新记录
    const pomodoro = new Pomodoro({
      taskName,
      mode: mode || 'pomodoro',
      startTime,
      endTime,
      duration,
      completed: completed !== undefined ? completed : true,
      userId,
      taskId: taskId || null,
      date: localDate,
      timeBlockType
    });
    
    const savedPomodoro = await pomodoro.save();
    
    logger.info(`创建新的番茄钟记录: ${savedPomodoro._id}`);
    
    res.status(201).json({
      success: true,
      data: savedPomodoro
    });
  } catch (error) {
    logger.error(`创建番茄钟记录失败: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '创建番茄钟记录失败',
      error: error.message
    });
  }
};

// 获取单个番茄钟记录
const getPomodoroById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const pomodoro = await Pomodoro.findById(id);
    
    if (!pomodoro) {
      return res.status(404).json({
        success: false,
        message: '番茄钟记录未找到'
      });
    }
    
    logger.info(`获取番茄钟记录: ${id}`);
    
    res.json({
      success: true,
      data: pomodoro
    });
  } catch (error) {
    // 检查是否是无效的ObjectId导致的错误
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: '番茄钟记录未找到'
      });
    }
    logger.error(`获取番茄钟记录失败: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '获取番茄钟记录失败',
      error: error.message
    });
  }
};

// 更新番茄钟记录
const updatePomodoro = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const pomodoro = await Pomodoro.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!pomodoro) {
      return res.status(404).json({
        success: false,
        message: '番茄钟记录未找到'
      });
    }
    
    logger.info(`更新番茄钟记录: ${id}`);
    
    res.json({
      success: true,
      data: pomodoro
    });
  } catch (error) {
    // 检查是否是无效的ObjectId导致的错误
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: '番茄钟记录未找到'
      });
    }
    logger.error(`更新番茄钟记录失败: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '更新番茄钟记录失败',
      error: error.message
    });
  }
};

// 删除番茄钟记录
const deletePomodoro = async (req, res) => {
  try {
    const { id } = req.params;
    
    const pomodoro = await Pomodoro.findByIdAndDelete(id);
    
    if (!pomodoro) {
      return res.status(404).json({
        success: false,
        message: '番茄钟记录未找到'
      });
    }
    
    logger.info(`删除番茄钟记录: ${id}`);
    
    res.json({
      success: true,
      message: '番茄钟记录已删除'
    });
  } catch (error) {
    // 检查是否是无效的ObjectId导致的错误
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: '番茄钟记录未找到'
      });
    }
    logger.error(`删除番茄钟记录失败: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '删除番茄钟记录失败',
      error: error.message
    });
  }
};

module.exports = {
  getAllPomodoros,
  createPomodoro,
  getPomodoroById,
  updatePomodoro,
  deletePomodoro
};