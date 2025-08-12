'use strict';

const Collection = require('../../src/models/Collection');
const Task = require('../../src/models/Task');
const logger = require('../../src/config/logger');

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
      console.log(`🆕 [Collections API] 为用户 ${userId} 创建默认'其他'任务集: ${otherCollection._id}`);
    }
    
    return otherCollection;
  } catch (error) {
    console.error(`❌ [Collections API] 获取或创建'其他'任务集失败:`, error);
    throw error;
  }
};

// 获取所有任务集
const getAllCollections = async (req, res) => {
  try {
    const { 
      userId, 
      archived = false, 
      completed, 
      limit = 50, 
      offset = 0 
    } = req.query;
    
    console.log(`🔍 [Collections API] 获取任务集列表 - userId: ${userId}, archived: ${archived}, completed: ${completed}`);
    
    // 构建查询条件
    const query = {};
    if (userId) query.userId = userId;
    query.archived = archived === 'true';
    if (completed !== undefined) query.completed = completed === 'true';
    
    // 如果有userId，确保存在"其他"任务集
    if (userId) {
      await getOrCreateOtherCollection(userId);
    }
    
    // 查询数据并填充子任务
    const collections = await Collection.find(query)
      .populate({
        path: 'subtasks',
        match: { $or: [ { time: { $exists: false } }, { time: '' } ] }, // 仅未填写时间的任务归入任务集
        options: { sort: { createdAt: 1 } }
      })
      .sort({ sortOrder: 1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));
    
    // 获取总数
    const total = await Collection.countDocuments(query);
    
    console.log(`✅ [Collections API] 成功获取 ${collections.length} 个任务集`);
    
    res.json({
      success: true,
      data: collections,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error(`❌ [Collections API] 获取任务集失败:`, error);
    logger.error(`获取任务集失败: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '获取任务集失败',
      error: error.message
    });
  }
};

// 根据ID获取单个任务集
const getCollectionById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔍 [Collections API] 获取任务集详情 - ID: ${id}`);
    
    const collection = await Collection.findById(id)
      .populate({
        path: 'subtasks',
        options: { sort: { createdAt: 1 } }
      });
    
    if (!collection) {
      console.log(`⚠️ [Collections API] 任务集未找到 - ID: ${id}`);
      return res.status(404).json({
        success: false,
        message: '任务集未找到'
      });
    }
    
    console.log(`✅ [Collections API] 成功获取任务集详情 - ${collection.name}`);
    
    res.json({
      success: true,
      data: collection
    });
  } catch (error) {
    console.error(`❌ [Collections API] 获取任务集详情失败:`, error);
    
    // 检查是否是无效的ObjectId
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: '任务集未找到'
      });
    }
    
    logger.error(`获取任务集详情失败: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '获取任务集详情失败',
      error: error.message
    });
  }
};

// 创建新任务集
const createCollection = async (req, res) => {
  try {
    const collectionData = req.body;
    console.log(`🆕 [Collections API] 创建新任务集:`, collectionData);
    
    // 验证必要字段
    if (!collectionData.name || !collectionData.name.trim()) {
      console.log(`⚠️ [Collections API] 任务集名称为空`);
      return res.status(400).json({
        success: false,
        message: '任务集名称是必需的'
      });
    }
    
    // 创建新任务集
    const collection = new Collection({
      ...collectionData,
      name: collectionData.name.trim(),
      description: collectionData.description ? collectionData.description.trim() : undefined
    });
    
    const savedCollection = await collection.save();
    console.log(`✅ [Collections API] 任务集创建成功 - ID: ${savedCollection._id}, 名称: ${savedCollection.name}`);
    
    // 填充子任务数据后返回
    const populatedCollection = await Collection.findById(savedCollection._id)
      .populate({
        path: 'subtasks',
        options: { sort: { createdAt: 1 } }
      });
    
    logger.info(`创建新任务集: ${savedCollection._id} - ${savedCollection.name}`);
    
    res.status(201).json({
      success: true,
      data: populatedCollection
    });
  } catch (error) {
    console.error(`❌ [Collections API] 创建任务集失败:`, error);
    logger.error(`创建任务集失败: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '创建任务集失败',
      error: error.message
    });
  }
};

// 更新任务集
const updateCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    console.log(`🔄 [Collections API] 更新任务集 - ID: ${id}`, updateData);
    
    // 验证必要字段
    if (updateData.name !== undefined && (!updateData.name || !updateData.name.trim())) {
      console.log(`⚠️ [Collections API] 任务集名称为空`);
      return res.status(400).json({
        success: false,
        message: '任务集名称不能为空'
      });
    }
    
    // 清理数据
    if (updateData.name) {
      updateData.name = updateData.name.trim();
    }
    if (updateData.description !== undefined) {
      updateData.description = updateData.description ? updateData.description.trim() : '';
    }
    
    const updatedCollection = await Collection.findByIdAndUpdate(
      id,
      updateData,
      { 
        new: true, 
        runValidators: true 
      }
    ).populate({
      path: 'subtasks',
      options: { sort: { createdAt: 1 } }
    });
    
    if (!updatedCollection) {
      console.log(`⚠️ [Collections API] 要更新的任务集未找到 - ID: ${id}`);
      return res.status(404).json({
        success: false,
        message: '任务集未找到'
      });
    }
    
    console.log(`✅ [Collections API] 任务集更新成功 - ${updatedCollection.name}`);
    logger.info(`更新任务集: ${updatedCollection._id} - ${updatedCollection.name}`);
    
    res.json({
      success: true,
      data: updatedCollection
    });
  } catch (error) {
    console.error(`❌ [Collections API] 更新任务集失败:`, error);
    
    // 检查是否是无效的ObjectId
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
    const { force = false } = req.query;
    console.log(`🗑️ [Collections API] 删除任务集 - ID: ${id}, force: ${force}`);
    
    const collection = await Collection.findById(id);
    if (!collection) {
      console.log(`⚠️ [Collections API] 要删除的任务集未找到 - ID: ${id}`);
      return res.status(404).json({
        success: false,
        message: '任务集未找到'
      });
    }
    
    // 检查是否有关联的子任务
    const subtaskCount = await Task.countDocuments({ collectionId: id });
    
    if (subtaskCount > 0 && force !== 'true') {
      console.log(`⚠️ [Collections API] 任务集包含 ${subtaskCount} 个子任务，无法删除`);
      return res.status(400).json({
        success: false,
        message: `该任务集包含 ${subtaskCount} 个子任务，请先删除所有子任务或使用强制删除`,
        data: { subtaskCount }
      });
    }
    
    // 如果强制删除，先删除所有关联的子任务
    if (force === 'true') {
      const deletedSubtasks = await Task.deleteMany({ collectionId: id });
      console.log(`🗑️ [Collections API] 强制删除了 ${deletedSubtasks.deletedCount} 个子任务`);
    }
    
    // 删除任务集
    await Collection.findByIdAndDelete(id);
    console.log(`✅ [Collections API] 任务集删除成功 - ${collection.name}`);
    
    logger.info(`删除任务集: ${id} - ${collection.name}${force === 'true' ? ' (强制删除)' : ''}`);
    
    res.json({
      success: true,
      message: '任务集删除成功',
      data: { deletedSubtasks: force === 'true' ? subtaskCount : 0 }
    });
  } catch (error) {
    console.error(`❌ [Collections API] 删除任务集失败:`, error);
    
    // 检查是否是无效的ObjectId
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

// 归档/取消归档任务集
const archiveCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const { archived = true } = req.body;
    console.log(`📦 [Collections API] ${archived ? '归档' : '取消归档'}任务集 - ID: ${id}`);
    
    const collection = await Collection.findByIdAndUpdate(
      id,
      { archived: archived },
      { new: true }
    ).populate({
      path: 'subtasks',
      options: { sort: { createdAt: 1 } }
    });
    
    if (!collection) {
      console.log(`⚠️ [Collections API] 要${archived ? '归档' : '取消归档'}的任务集未找到 - ID: ${id}`);
      return res.status(404).json({
        success: false,
        message: '任务集未找到'
      });
    }
    
    console.log(`✅ [Collections API] 任务集${archived ? '归档' : '取消归档'}成功 - ${collection.name}`);
    logger.info(`${archived ? '归档' : '取消归档'}任务集: ${collection._id} - ${collection.name}`);
    
    res.json({
      success: true,
      data: collection,
      message: `任务集${archived ? '归档' : '取消归档'}成功`
    });
  } catch (error) {
    console.error(`❌ [Collections API] ${archived ? '归档' : '取消归档'}任务集失败:`, error);
    
    // 检查是否是无效的ObjectId
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: '任务集未找到'
      });
    }
    
    logger.error(`${archived ? '归档' : '取消归档'}任务集失败: ${error.message}`);
    res.status(500).json({
      success: false,
      message: `${archived ? '归档' : '取消归档'}任务集失败`,
      error: error.message
    });
  }
};

// 获取任务集统计信息
const getCollectionStats = async (req, res) => {
  try {
    const { userId } = req.query;
    console.log(`📊 [Collections API] 获取任务集统计信息 - userId: ${userId}`);
    
    const query = userId ? { userId } : {};
    
    const [
      totalCollections,
      completedCollections,
      archivedCollections,
      totalSubtasks,
      completedSubtasks
    ] = await Promise.all([
      Collection.countDocuments({ ...query, archived: false }),
      Collection.countDocuments({ ...query, archived: false, completed: true }),
      Collection.countDocuments({ ...query, archived: true }),
      Task.countDocuments(userId ? { userId } : {}),
      Task.countDocuments({ ...(userId ? { userId } : {}), completed: true })
    ]);
    
    const stats = {
      collections: {
        total: totalCollections,
        completed: completedCollections,
        archived: archivedCollections,
        active: totalCollections - completedCollections
      },
      subtasks: {
        total: totalSubtasks,
        completed: completedSubtasks,
        pending: totalSubtasks - completedSubtasks
      },
      progress: {
        collectionsProgress: totalCollections > 0 ? Math.round((completedCollections / totalCollections) * 100) : 0,
        subtasksProgress: totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0
      }
    };
    
    console.log(`✅ [Collections API] 统计信息获取成功:`, stats);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error(`❌ [Collections API] 获取统计信息失败:`, error);
    logger.error(`获取统计信息失败: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '获取统计信息失败',
      error: error.message
    });
  }
};

// 获取"其他"任务集
const getOtherCollection = async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId是必需的'
      });
    }
    
    console.log(`🔍 [Collections API] 获取'其他'任务集 - userId: ${userId}`);
    
    const otherCollection = await getOrCreateOtherCollection(userId);
    
    // 填充子任务数据
    const populatedCollection = await Collection.findById(otherCollection._id)
      .populate({
        path: 'subtasks',
        options: { sort: { createdAt: 1 } }
      });
    
    console.log(`✅ [Collections API] 成功获取'其他'任务集: ${populatedCollection._id}`);
    
    res.json({
      success: true,
      data: populatedCollection
    });
  } catch (error) {
    console.error(`❌ [Collections API] 获取'其他'任务集失败:`, error);
    logger.error(`获取'其他'任务集失败: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '获取其他任务集失败',
      error: error.message
    });
  }
};

module.exports = {
  getAllCollections,
  getCollectionById,
  createCollection,
  updateCollection,
  deleteCollection,
  archiveCollection,
  getCollectionStats,
  getOtherCollection,
  getOrCreateOtherCollection
};