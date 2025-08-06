'use strict';

const mongoose = require('mongoose');

// 番茄钟记录模型
const pomodoroSchema = new mongoose.Schema({
  // 任务名称
  taskName: {
    type: String,
    required: true,
    trim: true
  },
  // 番茄钟类型
  mode: {
    type: String,
    enum: ['pomodoro', 'shortBreak', 'longBreak'],
    default: 'pomodoro'
  },
  // 开始时间
  startTime: {
    type: Date,
    required: true
  },
  // 结束时间
  endTime: {
    type: Date,
    required: true
  },
  // 持续时间（秒）
  duration: {
    type: Number,
    required: true
  },
  // 是否完成（true: 完成, false: 放弃）
  completed: {
    type: Boolean,
    default: true
  },
  // 完成状态（normal: 正常完成, early: 提前完成, abandoned: 放弃）
  completionStatus: {
    type: String,
    enum: ['normal', 'early', 'abandoned'],
    default: 'normal'
  },
  // 实际专注时间（秒）- 对于提前完成或放弃的情况
  actualFocusTime: {
    type: Number
  },
  // 用户ID（如果需要支持多用户）
  userId: {
    type: String,
    default: 'default'
  },
  // 来源页面
  sourceRoute: {
    type: String
  }
}, {
  timestamps: true // 自动添加createdAt和updatedAt字段
});

// 索引
pomodoroSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Pomodoro', pomodoroSchema);