'use strict';

const Collection = require('../models/Collection');
const Task = require('../models/Task');
const logger = require('../config/logger');

// 获取所有任务集
const getAllCollections = async (req, res) => {
  try {
    const { userId, limit = 50, offset = 0 } = req.query;
    
    // 构建查询条件
    const query = {};
    if (userId) query.userId = userId;
    
    // 查询数据
    const collections = await Collection.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .populate('tasks'); // 添加获取子任务
    
    // 获取总数
    const total = await Collection.countDocuments(query);
    
    logger.info(`获取到 ${collections.length} 个任务集`);
    
    res.json({
      success: true,
      data: collections,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    // 检查是否是无效的ObjectId导致的错误
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: '任务集未找到'
      });
    }
    logger.error(`获取任务集失败: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '获取任务集失败',
      error: error.message
    });
  }
};

// 创建新任务集
const createCollection = async (req, res) => {
  try {
    const collectionData = req.body;
    
    // 验证必要字段
    if (!collectionData.name) {
      return res.status(400).json({
        success: false,
        message: '任务集名称是必需的'
      });
    }
    
    // 创建新任务集
    const collection = new Collection(collectionData);
    const savedCollection = await collection.save();
    
    logger.info(`创建新任务集: ${savedCollection._id}`);
    
    res.status(201).json({
      success: true,
      data: savedCollection
    });
  } catch (error) {
    logger.error(`创建任务集失败: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '创建任务集失败',
      error: error.message
    });
  }
};

// 获取单个任务集
const getCollectionById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const collection = await Collection.findById(id).populate('tasks');
    
    if (!collection) {
      return res.status(404).json({
        success: false,
        message: '任务集未找到'
      });
    }
    
    logger.info(`获取任务集: ${id}`);
    
    res.json({
      success: true,
      data: collection
    });
  } catch (error) {
    // 检查是否是无效的ObjectId导致的错误
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: '任务集未找到'
      });
    }
    logger.error(`获取任务集失败: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '获取任务集失败',
      error: error.message
    });
  }
};

// 更新任务集
const updateCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const collection = await Collection.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!collection) {
      return res.status(404).json({
        success: false,
        message: '任务集未找到'
      });
    }
    
    logger.info(`更新任务集: ${id}`);
    
    res.json({
      success: true,
      data: collection
    });
  } catch (error) {
    // 检查是否是无效的ObjectId导致的错误
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: '任务集未找到'
      });
    }
    logger.error(`更新任务集失败: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '更新任务集失败',
      error: error.message
    });
  }
};

// 删除任务集
const deleteCollection = async (req, res) => {
  try {
    const { id } = req.params;
    
    const collection = await Collection.findById(id);
    if (!collection) {
      return res.status(404).json({
        success: false,
        message: '任务集未找到'
      });
    }
    
    // 级联删除关联的任务
    const Task = require('../models/Task');
    await Task.deleteMany({ collectionId: id });
    
    // 删除任务集
    await Collection.findByIdAndDelete(id);
    
    logger.info(`删除任务集: ${id}`);
    
    res.json({
      success: true,
      message: '任务集已删除'
    });
  } catch (error) {
    // 检查是否是无效的ObjectId导致的错误
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: '任务集未找到'
      });
    }
    logger.error(`删除任务集失败: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '删除任务集失败',
      error: error.message
    });
  }
};

// 切换任务集展开状态
const toggleCollectionExpand = async (req, res) => {
  try {
    const { id } = req.params;
    
    const collection = await Collection.findById(id);
    
    if (!collection) {
      return res.status(404).json({
        success: false,
        message: '任务集未找到'
      });
    }
    
    // 切换展开状态
    collection.expanded = !collection.expanded;
    const updatedCollection = await collection.save();
    
    logger.info(`切换任务集展开状态: ${id} -> ${collection.expanded}`);
    
    res.json({
      success: true,
      data: updatedCollection
    });
  } catch (error) {
    // 检查是否是无效的ObjectId导致的错误
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: '任务集未找到'
      });
    }
    logger.error(`切换任务集展开状态失败: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '切换任务集展开状态失败',
      error: error.message
    });
  }
};

module.exports = {
  getAllCollections,
  createCollection,
  getCollectionById,
  updateCollection,
  deleteCollection,
  toggleCollectionExpand
};