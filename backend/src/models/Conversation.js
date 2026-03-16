'use strict';

const mongoose = require('mongoose');

/**
 * 对话消息模型
 * 用于存储用户与AI助手的聊天记录
 */
const conversationSchema = new mongoose.Schema({
  // 关联用户ID
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // 会话ID - 用于标识一次完整的对话会话
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  
  // 消息类型
  messageType: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true,
    default: 'user'
  },
  
  // 消息内容
  content: {
    type: String,
    required: true,
    maxlength: 4000
  },
  
  // 意图识别结果（仅用户消息有此字段）
  intent: {
    type: String,
    enum: ['CONVERSATION', 'TASK_CREATION', 'SCHEDULE_PLANNING', 'EXTERNAL_TOOL'],
    index: true
  },
  
  // 意图识别置信度
  intentConfidence: {
    type: Number,
    min: 0,
    max: 1
  },
  
  // 意图识别的推理过程
  intentReasoning: {
    type: String,
    maxlength: 1000
  },
  
  // 提取的关键信息
  extractedInfo: {
    keywords: [String],
    entities: {
      time: String,
      location: String,
      task: String
    }
  },
  
  // AI响应的元数据（仅AI消息有此字段）
  aiMetadata: {
    model: String,
    responseTime: Number, // 响应时间(ms)
    temperature: Number,
    tokenUsage: {
      promptTokens: Number,
      completionTokens: Number,
      totalTokens: Number
    }
  },
  
  // 消息状态
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'completed'
  },
  
  // 错误信息（如果处理失败）
  error: {
    message: String,
    code: String
  },
  
  // 用户设备信息
  deviceInfo: {
    userAgent: String,
    ip: String,
    platform: String
  },
  
  // 是否已删除（软删除）
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  }
}, {
  timestamps: true, // 自动添加createdAt和updatedAt
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      // 在JSON输出时移除敏感信息
      if (ret.deviceInfo) {
        delete ret.deviceInfo.ip;
      }
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// 复合索引
conversationSchema.index({ userId: 1, sessionId: 1, createdAt: -1 });
conversationSchema.index({ userId: 1, messageType: 1, createdAt: -1 });
conversationSchema.index({ intent: 1, createdAt: -1 });
conversationSchema.index({ isDeleted: 1, createdAt: -1 });

// 虚拟字段：是否为用户消息
conversationSchema.virtual('isUserMessage').get(function() {
  return this.messageType === 'user';
});

// 虚拟字段：是否为AI消息
conversationSchema.virtual('isAssistantMessage').get(function() {
  return this.messageType === 'assistant';
});

// 虚拟字段：消息长度
conversationSchema.virtual('contentLength').get(function() {
  return this.content ? this.content.length : 0;
});

/**
 * 静态方法：创建用户消息
 * @param {Object} data 消息数据
 * @returns {Promise<Conversation>} 创建的消息对象
 */
conversationSchema.statics.createUserMessage = function(data) {
  const messageData = {
    ...data,
    messageType: 'user',
    status: 'completed'
  };
  const message = new this(messageData);
  return message.save();
};

/**
 * 静态方法：创建AI助手消息
 * @param {Object} data 消息数据
 * @returns {Promise<Conversation>} 创建的消息对象
 */
conversationSchema.statics.createAssistantMessage = function(data) {
  const messageData = {
    ...data,
    messageType: 'assistant',
    status: 'completed'
  };
  const message = new this(messageData);
  return message.save();
};

/**
 * 静态方法：获取用户的对话历史
 * @param {String} userId 用户ID
 * @param {String} sessionId 会话ID（可选）
 * @param {Object} options 查询选项
 * @returns {Promise<Array>} 对话历史数组
 */
conversationSchema.statics.getUserConversations = function(userId, sessionId = null, options = {}) {
  const query = { 
    userId: new mongoose.Types.ObjectId(userId),
    isDeleted: false
  };
  
  if (sessionId) {
    query.sessionId = sessionId;
  }
  
  const {
    limit = 50,
    skip = 0,
    sortOrder = -1 // -1为降序，1为升序
  } = options;
  
  return this.find(query)
    .sort({ createdAt: sortOrder })
    .limit(limit)
    .skip(skip)
    .lean();
};

/**
 * 静态方法：获取用户的最近对话
 * @param {String} userId 用户ID
 * @param {Number} limit 限制数量
 * @returns {Promise<Array>} 最近对话数组
 */
conversationSchema.statics.getRecentConversations = function(userId, limit = 10) {
  return this.find({
    userId: new mongoose.Types.ObjectId(userId),
    isDeleted: false
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .lean();
};

/**
 * 静态方法：获取会话统计信息
 * @param {String} userId 用户ID
 * @param {String} sessionId 会话ID
 * @returns {Promise<Object>} 统计信息
 */
conversationSchema.statics.getSessionStats = async function(userId, sessionId) {
  const stats = await this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        sessionId: sessionId,
        isDeleted: false
      }
    },
    {
      $group: {
        _id: '$messageType',
        count: { $sum: 1 },
        totalLength: { $sum: { $strLenCP: '$content' } },
        avgLength: { $avg: { $strLenCP: '$content' } }
      }
    }
  ]);
  
  return stats.reduce((acc, item) => {
    acc[item._id] = {
      count: item.count,
      totalLength: item.totalLength,
      avgLength: Math.round(item.avgLength)
    };
    return acc;
  }, {});
};

/**
 * 静态方法：软删除对话
 * @param {String} userId 用户ID
 * @param {String} sessionId 会话ID（可选）
 * @returns {Promise<Object>} 删除结果
 */
conversationSchema.statics.softDeleteConversations = function(userId, sessionId = null) {
  const query = {
    userId: new mongoose.Types.ObjectId(userId)
  };
  
  if (sessionId) {
    query.sessionId = sessionId;
  }
  
  return this.updateMany(query, { 
    isDeleted: true, 
    updatedAt: new Date() 
  });
};

/**
 * 实例方法：标记为已删除
 */
conversationSchema.methods.markAsDeleted = function() {
  this.isDeleted = true;
  return this.save();
};

/**
 * 实例方法：更新状态
 */
conversationSchema.methods.updateStatus = function(status, error = null) {
  this.status = status;
  if (error) {
    this.error = error;
  }
  return this.save();
};

module.exports = mongoose.model('Conversation', conversationSchema);
