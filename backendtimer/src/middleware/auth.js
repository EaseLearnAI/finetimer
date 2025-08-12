'use strict';

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../config/logger');

// JWT密钥（应与用户控制器中的保持一致）
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * JWT认证中间件
 * 验证请求头中的token，并将用户信息添加到req.user
 */
const authenticateToken = async (req, res, next) => {
  const startTime = Date.now();
  
  try {
    // 从请求头获取token
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;

    if (!token) {
      logger.warn(`[JWT认证] Token缺失, URL: ${req.originalUrl}, IP: ${req.ip}`);
      return res.status(401).json({
        success: false,
        message: '访问令牌缺失，请先登录'
      });
    }

    // 验证token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // 检查用户是否存在且处于激活状态
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      logger.warn(`[JWT认证] 用户不存在或已禁用: userId=${decoded.userId}, exists=${!!user}, isActive=${user?.isActive}`);
      return res.status(401).json({
        success: false,
        message: '用户不存在或已被禁用'
      });
    }

    // 将用户信息添加到请求对象
    req.user = {
      userId: user._id.toString(),
      phoneNumber: user.phoneNumber,
      nickname: user.nickname
    };

    const responseTime = Date.now() - startTime;
    logger.info(`[JWT认证] 认证成功，耗时: ${responseTime}ms, userId: ${user._id}, URL: ${req.originalUrl}`);
    
    next();

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    if (error.name === 'JsonWebTokenError') {
      logger.warn(`[JWT认证] Token无效，耗时: ${responseTime}ms, URL: ${req.originalUrl}, 错误: ${error.message}`);
      return res.status(401).json({
        success: false,
        message: '访问令牌无效'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      logger.warn(`[JWT认证] Token过期，耗时: ${responseTime}ms, URL: ${req.originalUrl}, 过期时间: ${error.expiredAt}`);
      return res.status(401).json({
        success: false,
        message: '访问令牌已过期，请重新登录'
      });
    }

    logger.error(`[JWT认证] 认证失败，耗时: ${responseTime}ms, URL: ${req.originalUrl}, 错误: ${error.message}`, error);
    
    res.status(500).json({
      success: false,
      message: '认证失败，请稍后重试'
    });
  }
};

/**
 * 可选认证中间件
 * 如果提供了token则验证，但不强制要求
 */
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : null;

  if (!token) {
    // 没有token，继续执行，但不设置req.user
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (user && user.isActive) {
      req.user = {
        userId: user._id.toString(),
        phoneNumber: user.phoneNumber,
        nickname: user.nickname
      };
      logger.info(`[可选认证] 认证成功, userId: ${user._id}, URL: ${req.originalUrl}`);
    }
  } catch (error) {
    // 可选认证失败时不返回错误，只记录日志
    logger.warn(`[可选认证] Token验证失败, URL: ${req.originalUrl}, 错误: ${error.message}`);
  }

  next();
};

module.exports = {
  authenticateToken,
  optionalAuth
};