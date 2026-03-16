'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// 用户模型
const userSchema = new mongoose.Schema({
  // 手机号（唯一标识）
  phoneNumber: {
    type: String,
    required: true,
    trim: true,
    match: [/^1[3-9]\d{9}$/, '请输入有效的手机号码']
  },
  // 密码（加密存储）
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  // 用户昵称（可选）
  nickname: {
    type: String,
    trim: true,
    maxlength: 50,
    default: function() {
      return `用户${this.phoneNumber.slice(-4)}`;
    }
  },
  // 头像URL（可选）
  avatar: {
    type: String,
    default: ''
  },
  // 是否激活
  isActive: {
    type: Boolean,
    default: true
  },
  // 最后登录时间
  lastLoginAt: {
    type: Date
  },
  // 创建时的设备信息（可选）
  deviceInfo: {
    userAgent: String,
    ip: String
  }
}, {
  timestamps: true, // 自动添加createdAt和updatedAt字段
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.password; // 在JSON输出时移除密码字段
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// 索引
userSchema.index({ phoneNumber: 1 }, { unique: true });
userSchema.index({ createdAt: -1 });

// 虚拟字段：脱敏手机号
userSchema.virtual('maskedPhoneNumber').get(function() {
  if (!this.phoneNumber) return '';
  return this.phoneNumber.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
});

// 密码加密中间件
userSchema.pre('save', async function(next) {
  // 只在密码被修改时才进行加密
  if (!this.isModified('password')) return next();
  
  try {
    // 生成盐值并加密密码
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 实例方法：验证密码
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('密码验证失败');
  }
};

// 实例方法：更新最后登录时间
userSchema.methods.updateLastLogin = function() {
  this.lastLoginAt = new Date();
  return this.save();
};

// 静态方法：根据手机号查找用户
userSchema.statics.findByPhoneNumber = function(phoneNumber) {
  return this.findOne({ phoneNumber, isActive: true });
};

// 静态方法：创建用户
userSchema.statics.createUser = function(userData) {
  const user = new this(userData);
  return user.save();
};

module.exports = mongoose.model('User', userSchema);