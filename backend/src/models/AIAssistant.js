'use strict';

const mongoose = require('mongoose');

// AI助手模型
const aiAssistantSchema = new mongoose.Schema({
  // 用户ID（关联到User模型）
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  // AI助手名称
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50,
    default: 'AI智能助手'
  },
  // 心动值
  heartValue: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  // 创建时间
  createdAt: {
    type: Date,
    default: Date.now
  },
  // 更新时间
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true, // 自动添加createdAt和updatedAt字段
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 索引
aiAssistantSchema.index({ userId: 1 }, { unique: true });
aiAssistantSchema.index({ heartValue: -1 });

// 中间件：更新时自动更新updatedAt字段
aiAssistantSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// 静态方法：根据用户ID查找或创建AI助手
aiAssistantSchema.statics.findOrCreateByUserId = async function(userId) {
  try {
    let assistant = await this.findOne({ userId });
    
    if (!assistant) {
      // 如果不存在，创建一个新的AI助手
      assistant = new this({
        userId,
        name: 'AI智能助手',
        heartValue: 0
      });
      await assistant.save();
    }
    
    return assistant;
  } catch (error) {
    throw error;
  }
};

// 实例方法：增加心动值
aiAssistantSchema.methods.increaseHeartValue = async function() {
  this.heartValue += 1;
  return this.save();
};

// 实例方法：更新名称
aiAssistantSchema.methods.updateName = async function(newName) {
  this.name = newName;
  return this.save();
};

module.exports = mongoose.model('AIAssistant', aiAssistantSchema);
