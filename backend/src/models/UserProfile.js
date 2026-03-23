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
  },
  { timestamps: true }
);

module.exports = mongoose.model('UserProfile', userProfileSchema);
