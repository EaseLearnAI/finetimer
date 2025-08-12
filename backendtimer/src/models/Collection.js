'use strict';

const mongoose = require('mongoose');

// 任务集模型
const collectionSchema = new mongoose.Schema({
  // 任务集名称
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  // 任务集描述（可选）
  description: {
    type: String,
    trim: true,
    maxlength: 200,
    default: ''
  },
  // 用户ID（关联用户）
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  // 任务集颜色标识（可选）
  color: {
    type: String,
    default: '#007aff'
  },
  // 任务集图标（可选）
  icon: {
    type: String,
    default: 'folder'
  },
  // 是否已完成
  completed: {
    type: Boolean,
    default: false
  },
  // 排序权重
  sortOrder: {
    type: Number,
    default: 0
  },
  // 是否已归档
  archived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true, // 自动添加createdAt和updatedAt字段
  toJSON: { virtuals: true }, // 在JSON序列化时包含虚拟字段
  toObject: { virtuals: true }
});

// 虚拟字段：关联的子任务
collectionSchema.virtual('subtasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'collectionId'
});

// 虚拟字段：子任务总数
collectionSchema.virtual('totalSubtasks').get(function() {
  return this.subtasks ? this.subtasks.length : 0;
});

// 虚拟字段：已完成的子任务数量
collectionSchema.virtual('completedSubtasks').get(function() {
  if (!this.subtasks) return 0;
  return this.subtasks.filter(task => task.completed).length;
});

// 虚拟字段：完成进度百分比
collectionSchema.virtual('progressPercentage').get(function() {
  if (!this.subtasks || this.subtasks.length === 0) return 0;
  const completed = this.subtasks.filter(task => task.completed).length;
  return Math.round((completed / this.subtasks.length) * 100);
});

// 虚拟字段：是否逾期
collectionSchema.virtual('isOverdue').get(function() {
  if (!this.subtasks) return false;
  const now = new Date();
  return this.subtasks.some(task => 
    task.dueDate && 
    task.dueDate < now && 
    !task.completed
  );
});

// 索引
collectionSchema.index({ userId: 1, archived: 1 });
collectionSchema.index({ userId: 1, completed: 1 });
collectionSchema.index({ createdAt: -1 });

// 实例方法：获取优先级统计
collectionSchema.methods.getPriorityStats = function() {
  if (!this.subtasks) return { high: 0, medium: 0, low: 0 };
  
  const stats = { high: 0, medium: 0, low: 0 };
  this.subtasks.forEach(task => {
    if (stats.hasOwnProperty(task.priority)) {
      stats[task.priority]++;
    }
  });
  
  return stats;
};

// 实例方法：获取预计总时间
collectionSchema.methods.getTotalEstimatedTime = function() {
  if (!this.subtasks) return 0;
  
  return this.subtasks.reduce((total, task) => {
    return total + (task.estimatedTime || 0);
  }, 0);
};

// 静态方法：根据用户获取任务集列表
collectionSchema.statics.getByUser = function(userId, options = {}) {
  const query = { userId };
  
  if (options.archived !== undefined) {
    query.archived = options.archived;
  }
  
  if (options.completed !== undefined) {
    query.completed = options.completed;
  }
  
  return this.find(query)
    .populate({
      path: 'subtasks',
      options: { sort: { createdAt: 1 } }
    })
    .sort({ sortOrder: 1, createdAt: -1 });
};

// 预保存中间件：自动更新完成状态
collectionSchema.pre('save', async function(next) {
  if (this.isModified('subtasks') || this.isNew) {
    // 这里可以添加自动更新逻辑
  }
  next();
});

module.exports = mongoose.model('Collection', collectionSchema);