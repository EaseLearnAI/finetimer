'use strict';

const mongoose = require('mongoose');

// 任务模型
const taskSchema = new mongoose.Schema({
  // 任务标题
  title: {
    type: String,
    required: true,
    trim: true
  },
  // 任务描述
  description: {
    type: String,
    trim: true
  },
  // 优先级
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  // 是否完成
  completed: {
    type: Boolean,
    default: false
  },
  // 截止日期
  dueDate: {
    type: Date
  },
  // 所属任务集ID
  collectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Collection'
  },
  // 用户ID（如果需要支持多用户）
  userId: {
    type: String
  },
  // 时间块信息
  timeBlock: {
    startTime: String, // 例如: "09:00"
    endTime: String,   // 例如: "11:00"
    timeBlockType: {   // 时间块类型
      type: String,
      enum: ['morning', 'forenoon', 'afternoon', 'evening', 'unscheduled'],
      default: 'unscheduled'
    }
  },
  // 四象限分类
  quadrant: {
    type: Number,
    enum: [1, 2, 3, 4] // 1: 重要且紧急, 2: 重要不紧急, 3: 紧急不重要, 4: 不重要不紧急
  },
  // 是否已安排时间
  isScheduled: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true // 自动添加createdAt和updatedAt字段
});

// 索引
taskSchema.index({ userId: 1, completed: 1 });
taskSchema.index({ collectionId: 1 });

taskSchema.virtual('isOverdue').get(function() {
  if (this.dueDate) {
    return this.dueDate < new Date() && !this.completed;
  }
  return false;
});

module.exports = mongoose.model('Task', taskSchema);