'use strict';

const mongoose = require('mongoose');

// 任务集模型
const collectionSchema = new mongoose.Schema({
  // 任务集名称
  name: {
    type: String,
    required: true,
    trim: true
  },
  // 任务集描述
  description: {
    type: String,
    trim: true
  },
  // 是否展开
  expanded: {
    type: Boolean,
    default: false
  },
  // 用户ID（如果需要支持多用户）
  userId: {
    type: String
  },
  // 关联的任务
  tasks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }]
}, {
  timestamps: true // 自动添加createdAt和updatedAt字段
});

// 索引
collectionSchema.index({ userId: 1 });

module.exports = mongoose.model('Collection', collectionSchema);