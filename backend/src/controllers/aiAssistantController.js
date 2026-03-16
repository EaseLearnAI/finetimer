'use strict';

const AIAssistant = require('../models/AIAssistant');
const logger = require('../config/logger');

// 获取或创建AI助手
const getOrCreateAssistant = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // 查找或创建AI助手
    const assistant = await AIAssistant.findOrCreateByUserId(userId);
    
    logger.info(`用户 ${userId} 获取AI助手信息成功`);
    
    res.json({
      success: true,
      data: {
        id: assistant._id,
        name: assistant.name,
        heartValue: assistant.heartValue,
        createdAt: assistant.createdAt,
        updatedAt: assistant.updatedAt
      }
    });
  } catch (error) {
    logger.error(`获取AI助手失败: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '获取AI助手失败',
      error: error.message
    });
  }
};

// 更新AI助手名称
const updateAssistantName = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name } = req.body;
    
    // 验证名称
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: '名称不能为空'
      });
    }
    
    if (name.length > 50) {
      return res.status(400).json({
        success: false,
        message: '名称长度不能超过50个字符'
      });
    }
    
    // 查找AI助手
    let assistant = await AIAssistant.findOne({ userId });
    
    if (!assistant) {
      // 如果不存在，创建一个新的
      assistant = new AIAssistant({
        userId,
        name: name.trim(),
        heartValue: 0
      });
    } else {
      // 更新名称
      assistant.name = name.trim();
    }
    
    await assistant.save();
    
    logger.info(`用户 ${userId} 更新AI助手名称为: ${name}`);
    
    res.json({
      success: true,
      data: {
        id: assistant._id,
        name: assistant.name,
        heartValue: assistant.heartValue,
        updatedAt: assistant.updatedAt
      },
      message: 'AI助手名称更新成功'
    });
  } catch (error) {
    logger.error(`更新AI助手名称失败: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '更新AI助手名称失败',
      error: error.message
    });
  }
};

// 增加心动值（每次对话调用）
const increaseHeartValue = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // 查找或创建AI助手
    let assistant = await AIAssistant.findOne({ userId });
    
    if (!assistant) {
      // 如果不存在，创建一个新的
      assistant = new AIAssistant({
        userId,
        name: 'AI智能助手',
        heartValue: 1 // 第一次对话，心动值为1
      });
    } else {
      // 增加心动值
      assistant.heartValue += 1;
    }
    
    await assistant.save();
    
    logger.info(`用户 ${userId} 心动值增加，当前值: ${assistant.heartValue}`);
    
    res.json({
      success: true,
      data: {
        id: assistant._id,
        name: assistant.name,
        heartValue: assistant.heartValue,
        updatedAt: assistant.updatedAt
      },
      message: '心动值增加成功'
    });
  } catch (error) {
    logger.error(`增加心动值失败: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '增加心动值失败',
      error: error.message
    });
  }
};

// 获取AI助手信息
const getAssistantInfo = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // 查找AI助手
    let assistant = await AIAssistant.findOne({ userId });
    
    if (!assistant) {
      // 如果不存在，创建一个新的
      assistant = new AIAssistant({
        userId,
        name: 'AI智能助手',
        heartValue: 0
      });
      await assistant.save();
    }
    
    logger.info(`用户 ${userId} 查看AI助手信息`);
    
    res.json({
      success: true,
      data: {
        id: assistant._id,
        name: assistant.name,
        heartValue: assistant.heartValue,
        createdAt: assistant.createdAt,
        updatedAt: assistant.updatedAt
      }
    });
  } catch (error) {
    logger.error(`获取AI助手信息失败: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '获取AI助手信息失败',
      error: error.message
    });
  }
};

module.exports = {
  getOrCreateAssistant,
  updateAssistantName,
  increaseHeartValue,
  getAssistantInfo
};
