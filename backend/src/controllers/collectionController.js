'use strict';

const Collection = require('../models/Collection');
const Task = require('../models/Task');
const logger = require('../config/logger');
const mongoose = require('mongoose');

// 已废弃：不再允许默认或请求参数提供的用户ID

// 获取或创建默认的"其他"任务集
const getOrCreateOtherCollection = async (userId) => {
  try {
    // 查找是否已存在"其他"任务集
    let otherCollection = await Collection.findOne({
      userId: userId,
      name: '其他',
      archived: false
    });
    
    if (!otherCollection) {
      // 创建默认的"其他"任务集
      otherCollection = new Collection({
        name: '其他',
        description: '未分类的任务',
        userId: userId,
        color: '#8e8e93',
        icon: 'inbox',
        sortOrder: 999 // 放在最后
      });
      await otherCollection.save();
      logger.info(`为用户 ${userId} 创建默认'其他'任务集: ${otherCollection._id}`);
    }
    
    return otherCollection;
  } catch (error) {
    logger.error(`获取或创建'其他'任务集失败:`, error);
    throw error;
  }
};

// 获取所有任务集
const getAllCollections = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: '未认证，缺少用户信息' });
    }
    const { 
      archived = false, 
      completed, 
      limit = 50, 
      offset = 0 
    } = req.query;
    
    logger.info(`用户 ${userId} 获取任务集列表 - archived: ${archived}, completed: ${completed}`);
    
    // 构建查询条件，自动添加userId
    const query = { userId };
    query.archived = archived === 'true';
    if (completed !== undefined) query.completed = completed === 'true';
    
    // 确保存在"其他"任务集
    await getOrCreateOtherCollection(userId);
    
    // 查询任务集并填充子任务信息
    const collections = await Collection.find(query)
      .populate({
        path: 'subtasks',
        options: { sort: { createdAt: 1 } }
      })
      .sort({ sortOrder: 1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));
    
    // 获取总数
    const total = await Collection.countDocuments(query);
    
    logger.info(`用户 ${userId} 获取到 ${collections.length} 个任务集`);
    
    res.json({
      success: true,
      data: collections,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
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
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: '未认证，缺少用户信息' });
    }
    const collectionData = { ...req.body, userId };
    
    // 验证必需字段
    if (!collectionData.name) {
      return res.status(400).json({
        success: false,
        message: '任务集名称不能为空'
      });
    }
    
    // 检查名称是否重复（同一用户下）
    const existingCollection = await Collection.findOne({
      userId,
      name: collectionData.name,
      archived: false
    });
    
    if (existingCollection) {
      return res.status(400).json({
        success: false,
        message: '任务集名称已存在'
      });
    }
    
    const collection = new Collection(collectionData);
    const savedCollection = await collection.save();
    
    // 查询新创建的任务集（包含虚拟字段）
    const populatedCollection = await Collection.findById(savedCollection._id)
      .populate({
        path: 'subtasks',
        options: { sort: { createdAt: 1 } }
      });
    
    logger.info(`用户 ${userId} 创建任务集: ${savedCollection.name}`);
    
    res.status(201).json({
      success: true,
      message: '任务集创建成功',
      data: populatedCollection
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages[0] || '数据验证失败'
      });
    }
    
    logger.error(`创建任务集失败: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '创建任务集失败',
      error: error.message
    });
  }
};

// 根据ID获取单个任务集
const getCollectionById = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: '未认证，缺少用户信息' });
    }
    const collectionId = req.params.id;
    
    const collection = await Collection.findOne({ _id: collectionId, userId })
      .populate({
        path: 'subtasks',
        options: { sort: { createdAt: 1 } }
      });
    
    if (!collection) {
      return res.status(404).json({
        success: false,
        message: '任务集未找到'
      });
    }
    
    res.json({
      success: true,
      data: collection
    });
  } catch (error) {
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
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: '未认证，缺少用户信息' });
    }
    const collectionId = req.params.id;
    
    // 不允许更新userId
    delete req.body.userId;
    
    // 如果更新名称，检查是否重复
    if (req.body.name) {
      const existingCollection = await Collection.findOne({
        userId,
        name: req.body.name,
        archived: false,
        _id: { $ne: collectionId }
      });
      
      if (existingCollection) {
        return res.status(400).json({
          success: false,
          message: '任务集名称已存在'
        });
      }
    }
    
    const collection = await Collection.findOneAndUpdate(
      { _id: collectionId, userId },
      req.body,
      { new: true, runValidators: true }
    ).populate({
      path: 'subtasks',
      options: { sort: { createdAt: 1 } }
    });
    
    if (!collection) {
      return res.status(404).json({
        success: false,
        message: '任务集未找到'
      });
    }
    
    logger.info(`用户 ${userId} 更新任务集: ${collection.name}`);
    
    res.json({
      success: true,
      message: '任务集更新成功',
      data: collection
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: '任务集未找到'
      });
    }
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages[0] || '数据验证失败'
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

// 归档/取消归档任务集
const archiveCollection = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: '未认证，缺少用户信息' });
    }
    const collectionId = req.params.id;
    const { archived } = req.body;
    
    if (archived === undefined) {
      return res.status(400).json({
        success: false,
        message: '请指定归档状态'
      });
    }
    
    const collection = await Collection.findOneAndUpdate(
      { _id: collectionId, userId },
      { archived: Boolean(archived) },
      { new: true }
    ).populate({
      path: 'subtasks',
      options: { sort: { createdAt: 1 } }
    });
    
    if (!collection) {
      return res.status(404).json({
        success: false,
        message: '任务集未找到'
      });
    }
    
    logger.info(`用户 ${userId} ${archived ? '归档' : '取消归档'}任务集: ${collection.name}`);
    
    res.json({
      success: true,
      message: `任务集已${archived ? '归档' : '取消归档'}`,
      data: collection
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: '任务集未找到'
      });
    }
    
    logger.error(`归档任务集失败: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '归档任务集失败',
      error: error.message
    });
  }
};

// 删除任务集
const deleteCollection = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: '未认证，缺少用户信息' });
    }
    const collectionId = req.params.id;
    
    // 检查任务集是否存在
    const collection = await Collection.findOne({ _id: collectionId, userId });
    
    if (!collection) {
      return res.status(404).json({
        success: false,
        message: '任务集未找到'
      });
    }
    
    // 检查是否是默认的"其他"任务集
    if (collection.name === '其他') {
      return res.status(400).json({
        success: false,
        message: '默认"其他"任务集不能删除'
      });
    }
    
    // 检查是否有关联的任务
    const taskCount = await Task.countDocuments({ collectionId: collection._id });
    if (taskCount > 0) {
      return res.status(400).json({
        success: false,
        message: `任务集中还有 ${taskCount} 个任务，无法删除`
      });
    }
    
    await Collection.findByIdAndDelete(collection._id);
    
    logger.info(`用户 ${userId} 删除任务集: ${collection.name}`);
    
    res.json({
      success: true,
      message: '任务集删除成功'
    });
  } catch (error) {
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

// 获取"其他"任务集
const getOtherCollection = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: '未认证，缺少用户信息' });
    }
    
    const otherCollection = await getOrCreateOtherCollection(userId);
    const populatedCollection = await Collection.findById(otherCollection._id)
      .populate({
        path: 'subtasks',
        options: { sort: { createdAt: 1 } }
      });
    
    res.json({
      success: true,
      data: populatedCollection
    });
  } catch (error) {
    logger.error(`获取'其他'任务集失败: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '获取"其他"任务集失败',
      error: error.message
    });
  }
};

// 获取任务集统计信息
const getCollectionStats = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: '未认证，缺少用户信息' });
    }
    
    // 获取用户的所有任务集
    const collections = await Collection.find({ userId, archived: false })
      .populate('subtasks');
    
    // 计算统计信息
    const stats = {
      totalCollections: collections.length,
      completedCollections: collections.filter(c => c.completed).length,
      totalTasks: 0,
      completedTasks: 0,
      priorityStats: { high: 0, medium: 0, low: 0 },
      quadrantStats: { 1: 0, 2: 0, 3: 0, 4: 0 }
    };
    
    collections.forEach(collection => {
      if (collection.subtasks) {
        stats.totalTasks += collection.subtasks.length;
        stats.completedTasks += collection.subtasks.filter(task => task.completed).length;
        
        collection.subtasks.forEach(task => {
          if (stats.priorityStats[task.priority] !== undefined) {
            stats.priorityStats[task.priority]++;
          }
          if (stats.quadrantStats[task.quadrant] !== undefined) {
            stats.quadrantStats[task.quadrant]++;
          }
        });
      }
    });
    
    // 计算完成率
    stats.completionRate = stats.totalTasks > 0 ? 
      Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0;
    
    logger.info(`用户 ${userId} 获取任务集统计信息`);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error(`获取任务集统计失败: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '获取统计信息失败',
      error: error.message
    });
  }
};

module.exports = {
  getAllCollections,
  createCollection,
  getCollectionById,
  updateCollection,
  archiveCollection,
  deleteCollection,
  getOtherCollection,
  getCollectionStats
};