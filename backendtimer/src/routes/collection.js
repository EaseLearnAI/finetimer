'use strict';

const express = require('express');
const router = express.Router();
const {
  getAllCollections,
  createCollection,
  getCollectionById,
  updateCollection,
  deleteCollection,
  toggleCollectionExpand
} = require('../controllers/collectionController');

// 获取所有任务集
router.get('/', getAllCollections);

// 创建新任务集
router.post('/', createCollection);

// 获取单个任务集
router.get('/:id', getCollectionById);

// 更新任务集
router.put('/:id', updateCollection);

// 删除任务集
router.delete('/:id', deleteCollection);

// 切换任务集展开状态
router.patch('/:id/toggle-expand', toggleCollectionExpand);

module.exports = router;