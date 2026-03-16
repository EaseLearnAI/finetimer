'use strict';

const User = require('../models/User');
const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

// JWT密钥（生产环境应从环境变量获取）
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * 生成JWT token
 * @param {Object} user - 用户对象
 * @returns {String} JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    { 
      userId: user._id,
      phoneNumber: user.phoneNumber
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

/**
 * 用户注册
 * POST /api/users/register
 */
const registerUser = async (req, res) => {
  const startTime = Date.now();
  logger.info(`[用户注册] 开始处理注册请求: ${JSON.stringify({
    phoneNumber: req.body.phoneNumber,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  })}`);

  try {
    const { phoneNumber, password, nickname } = req.body;

    // 参数验证
    if (!phoneNumber || !password) {
      logger.warn(`[用户注册] 参数缺失: phoneNumber=${phoneNumber}, password=${!!password}`);
      return res.status(400).json({
        success: false,
        message: '手机号和密码不能为空'
      });
    }

    // 验证手机号格式
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phoneNumber)) {
      logger.warn(`[用户注册] 手机号格式错误: ${phoneNumber}`);
      return res.status(400).json({
        success: false,
        message: '请输入有效的手机号码'
      });
    }

    // 验证密码长度
    if (password.length < 6) {
      logger.warn(`[用户注册] 密码长度不足: ${password.length}`);
      return res.status(400).json({
        success: false,
        message: '密码长度至少为6位'
      });
    }

    // 检查用户是否已存在
    const existingUser = await User.findByPhoneNumber(phoneNumber);
    if (existingUser) {
      logger.warn(`[用户注册] 手机号已存在: ${phoneNumber}`);
      return res.status(409).json({
        success: false,
        message: '该手机号已注册'
      });
    }

    // 创建新用户
    const userData = {
      phoneNumber,
      password,
      deviceInfo: {
        userAgent: req.get('User-Agent'),
        ip: req.ip
      }
    };

    if (nickname) {
      userData.nickname = nickname;
    }

    const user = await User.createUser(userData);
    logger.info(`[用户注册] 用户创建成功: userId=${user._id}, phoneNumber=${phoneNumber}`);

    // 生成JWT token
    const token = generateToken(user);

    // 更新最后登录时间
    await user.updateLastLogin();

    const responseTime = Date.now() - startTime;
    logger.info(`[用户注册] 注册成功，耗时: ${responseTime}ms, userId: ${user._id}`);

    res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        user: {
          id: user._id,
          phoneNumber: user.phoneNumber,
          maskedPhoneNumber: user.maskedPhoneNumber,
          nickname: user.nickname,
          avatar: user.avatar,
          createdAt: user.createdAt
        },
        token
      }
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    logger.error(`[用户注册] 注册失败，耗时: ${responseTime}ms, 错误: ${error.message}`, error);
    
    res.status(500).json({
      success: false,
      message: '注册失败，请稍后重试'
    });
  }
};

/**
 * 用户登录
 * POST /api/users/login
 */
const loginUser = async (req, res) => {
  const startTime = Date.now();
  logger.info(`[用户登录] 开始处理登录请求: ${JSON.stringify({
    phoneNumber: req.body.phoneNumber,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  })}`);

  try {
    const { phoneNumber, password } = req.body;

    // 参数验证
    if (!phoneNumber || !password) {
      logger.warn(`[用户登录] 参数缺失: phoneNumber=${phoneNumber}, password=${!!password}`);
      return res.status(400).json({
        success: false,
        message: '手机号和密码不能为空'
      });
    }

    // 查找用户
    const user = await User.findByPhoneNumber(phoneNumber);
    if (!user) {
      logger.warn(`[用户登录] 用户不存在: ${phoneNumber}`);
      return res.status(401).json({
        success: false,
        message: '手机号或密码错误'
      });
    }

    // 验证密码
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      logger.warn(`[用户登录] 密码错误: userId=${user._id}, phoneNumber=${phoneNumber}`);
      return res.status(401).json({
        success: false,
        message: '手机号或密码错误'
      });
    }

    // 生成JWT token
    const token = generateToken(user);

    // 更新最后登录时间
    await user.updateLastLogin();

    const responseTime = Date.now() - startTime;
    logger.info(`[用户登录] 登录成功，耗时: ${responseTime}ms, userId: ${user._id}`);

    res.json({
      success: true,
      message: '登录成功',
      data: {
        user: {
          id: user._id,
          phoneNumber: user.phoneNumber,
          maskedPhoneNumber: user.maskedPhoneNumber,
          nickname: user.nickname,
          avatar: user.avatar,
          lastLoginAt: user.lastLoginAt
        },
        token
      }
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    logger.error(`[用户登录] 登录失败，耗时: ${responseTime}ms, 错误: ${error.message}`, error);
    
    res.status(500).json({
      success: false,
      message: '登录失败，请稍后重试'
    });
  }
};

/**
 * 获取用户信息
 * GET /api/users/profile
 */
const getUserProfile = async (req, res) => {
  const startTime = Date.now();
  logger.info(`[获取用户信息] userId: ${req.user.userId}`);

  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      logger.warn(`[获取用户信息] 用户不存在: userId=${req.user.userId}`);
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    const responseTime = Date.now() - startTime;
    logger.info(`[获取用户信息] 成功，耗时: ${responseTime}ms, userId: ${user._id}`);

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          phoneNumber: user.phoneNumber,
          maskedPhoneNumber: user.maskedPhoneNumber,
          nickname: user.nickname,
          avatar: user.avatar,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt
        }
      }
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    logger.error(`[获取用户信息] 失败，耗时: ${responseTime}ms, 错误: ${error.message}`, error);
    
    res.status(500).json({
      success: false,
      message: '获取用户信息失败'
    });
  }
};

/**
 * 更新用户信息
 * PUT /api/users/profile
 */
const updateUserProfile = async (req, res) => {
  const startTime = Date.now();
  logger.info(`[更新用户信息] userId: ${req.user.userId}, 更新数据: ${JSON.stringify(req.body)}`);

  try {
    const { nickname, avatar } = req.body;
    const userId = req.user.userId;

    // 构建更新数据
    const updateData = {};
    if (nickname !== undefined) {
      if (nickname.length > 50) {
        return res.status(400).json({
          success: false,
          message: '昵称长度不能超过50个字符'
        });
      }
      updateData.nickname = nickname;
    }
    if (avatar !== undefined) {
      updateData.avatar = avatar;
    }

    if (Object.keys(updateData).length === 0) {
      logger.warn(`[更新用户信息] 没有需要更新的数据: userId=${userId}`);
      return res.status(400).json({
        success: false,
        message: '没有需要更新的数据'
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!user) {
      logger.warn(`[更新用户信息] 用户不存在: userId=${userId}`);
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    const responseTime = Date.now() - startTime;
    logger.info(`[更新用户信息] 成功，耗时: ${responseTime}ms, userId: ${user._id}`);

    res.json({
      success: true,
      message: '更新成功',
      data: {
        user: {
          id: user._id,
          phoneNumber: user.phoneNumber,
          maskedPhoneNumber: user.maskedPhoneNumber,
          nickname: user.nickname,
          avatar: user.avatar,
          updatedAt: user.updatedAt
        }
      }
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    logger.error(`[更新用户信息] 失败，耗时: ${responseTime}ms, 错误: ${error.message}`, error);
    
    res.status(500).json({
      success: false,
      message: '更新用户信息失败'
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile
};