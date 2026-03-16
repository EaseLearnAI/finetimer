'use strict';

const Pomodoro = require('../models/Pomodoro');
const logger = require('../config/logger');

// 获取所有番茄钟记录
const getAllPomodoros = async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: '未认证，缺少用户信息' });
    }
    
    // 构建查询条件
    const query = { userId };
    
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
    const { 
      taskName, 
      mode, 
      startTime, 
      endTime, 
      duration, 
      completed, 
      completionStatus,
      actualFocusTime,
      sourceRoute 
    } = req.body;
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: '未认证，缺少用户信息' });
    }
    
    // 验证必要字段
    if (!taskName || !startTime || !endTime || !duration) {
      return res.status(400).json({
        success: false,
        message: '缺少必要字段: taskName, startTime, endTime, duration'
      });
    }
    
    // 根据完成状态设置相关字段
    let finalCompletionStatus = completionStatus || 'normal';
    let finalActualFocusTime = actualFocusTime;
    
    if (!completed) {
      finalCompletionStatus = 'abandoned';
      finalActualFocusTime = actualFocusTime || duration;
    } else if (actualFocusTime && actualFocusTime < duration) {
      finalCompletionStatus = 'early';
    }
    
    // 创建新记录
    const pomodoro = new Pomodoro({
      taskName,
      mode: mode || 'pomodoro',
      startTime,
      endTime,
      duration,
      completed: completed !== undefined ? completed : true,
      completionStatus: finalCompletionStatus,
      actualFocusTime: finalActualFocusTime,
      userId: userId,
      sourceRoute
    });
    
    const savedPomodoro = await pomodoro.save();
    
    logger.info(`创建新的番茄钟记录: ${savedPomodoro._id}, 任务: ${taskName}, 状态: ${finalCompletionStatus}`);
    
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

// 获取番茄钟统计数据
const getPomodoroStats = async (req, res) => {
  try {
    const { taskName, startDate, endDate } = req.query;
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: '未认证，缺少用户信息' });
    }
    
    // 构建查询条件
    const query = { userId };
    if (taskName) query.taskName = taskName;
    
    // 日期范围查询
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    // 获取所有匹配的记录
    const pomodoros = await Pomodoro.find(query).sort({ createdAt: -1 });
    
    // 统计数据
    const stats = {
      total: pomodoros.length,
      completed: pomodoros.filter(p => p.completed && p.mode === 'pomodoro').length,
      abandoned: pomodoros.filter(p => !p.completed && p.mode === 'pomodoro').length,
      earlyCompleted: pomodoros.filter(p => p.completionStatus === 'early' && p.mode === 'pomodoro').length,
      totalFocusTime: 0, // 总专注时间（分钟）
      averageSessionTime: 0, // 平均会话时间（分钟）
      taskBreakdown: {}, // 按任务分解
      dailyStats: {} // 按日期统计
    };
    
    // 计算总专注时间和任务分解
    pomodoros.forEach(p => {
      if (p.mode === 'pomodoro') {
        const focusTime = p.actualFocusTime || p.duration;
        stats.totalFocusTime += focusTime;
        
        // 任务分解统计
        if (!stats.taskBreakdown[p.taskName]) {
          stats.taskBreakdown[p.taskName] = {
            total: 0,
            completed: 0,
            abandoned: 0,
            totalTime: 0
          };
        }
        
        stats.taskBreakdown[p.taskName].total++;
        stats.taskBreakdown[p.taskName].totalTime += focusTime;
        
        if (p.completed) {
          stats.taskBreakdown[p.taskName].completed++;
        } else {
          stats.taskBreakdown[p.taskName].abandoned++;
        }
        
        // 按日期统计
        const dateKey = new Date(p.createdAt).toDateString();
        if (!stats.dailyStats[dateKey]) {
          stats.dailyStats[dateKey] = {
            completed: 0,
            abandoned: 0,
            totalTime: 0
          };
        }
        
        stats.dailyStats[dateKey].totalTime += focusTime;
        if (p.completed) {
          stats.dailyStats[dateKey].completed++;
        } else {
          stats.dailyStats[dateKey].abandoned++;
        }
      }
    });
    
    // 转换为分钟并计算平均值
    stats.totalFocusTime = Math.round(stats.totalFocusTime / 60);
    const pomodoroSessions = pomodoros.filter(p => p.mode === 'pomodoro');
    if (pomodoroSessions.length > 0) {
      const avgSeconds = pomodoroSessions.reduce((sum, p) => sum + (p.actualFocusTime || p.duration), 0) / pomodoroSessions.length;
      stats.averageSessionTime = Math.round(avgSeconds / 60);
    }
    
    // 转换任务分解中的时间为分钟
    Object.keys(stats.taskBreakdown).forEach(task => {
      stats.taskBreakdown[task].totalTime = Math.round(stats.taskBreakdown[task].totalTime / 60);
    });
    
    // 转换日期统计中的时间为分钟
    Object.keys(stats.dailyStats).forEach(date => {
      stats.dailyStats[date].totalTime = Math.round(stats.dailyStats[date].totalTime / 60);
    });
    
    logger.info(`获取番茄钟统计数据成功，用户: ${userId}`);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error(`获取番茄钟统计数据失败: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '获取统计数据失败',
      error: error.message
    });
  }
};

module.exports = {
  getAllPomodoros,
  createPomodoro,
  getPomodoroById,
  updatePomodoro,
  deletePomodoro,
  getPomodoroStats
};