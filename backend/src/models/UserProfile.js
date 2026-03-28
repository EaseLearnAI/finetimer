'use strict';

const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    preferences: {
      workStyle: { type: String, enum: ['intense', 'balanced', 'relaxed'], default: 'balanced' },
      preferredTimeBlocks: [{ type: String, enum: ['morning', 'forenoon', 'afternoon', 'evening'] }],
      notificationLevel: { type: String, enum: ['low', 'normal', 'high'], default: 'normal' },
      taskGranularity: { type: String, enum: ['fine', 'medium', 'coarse'], default: 'medium' },
    },
    emotionHistory: [
      {
        emotion: String,
        confidence: Number,
        timestamp: { type: Date, default: Date.now },
      },
    ],
    behaviorPatterns: {
      avgTaskCompletionRate: { type: Number, default: 0 },
      peakProductivityBlocks: [String],
      commonTaskCategories: [String],
    },
    interactionCount: { type: Number, default: 0 },
    lastActiveAt: { type: Date, default: Date.now },

    // 最近一次情绪触发日程调整的任务快照（用于撤销回退）
    lastScheduleSnapshot: {
      tasks: [{
        taskId: { type: String },
        title: { type: String },
        date: { type: String },
        time: { type: String },
        timeBlock: { type: mongoose.Schema.Types.Mixed },
        priority: { type: String },
        quadrant: { type: Number },
      }],
      savedAt: { type: Date },
      description: { type: String }, // 如 "情绪调度：tired"，用于回复用户
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('UserProfile', userProfileSchema);
