'use strict';

const express = require('express');
const router = express.Router();
const collectionController = require('../controllers/collectionController');

// 任务集路由

// GET /api/collections - 获取所有任务集
router.get('/', collectionController.getAllCollections);

// GET /api/collections/stats - 获取任务集统计信息
router.get('/stats', collectionController.getCollectionStats);

// GET /api/collections/other - 获取"其他"任务集 (必须在/:id之前)
router.get('/other', collectionController.getOtherCollection);

// GET /api/collections/:id - 根据ID获取单个任务集
router.get('/:id', collectionController.getCollectionById);

// POST /api/collections - 创建新任务集
router.post('/', collectionController.createCollection);

// PUT /api/collections/:id - 更新任务集
router.put('/:id', collectionController.updateCollection);

// PUT /api/collections/:id/archive - 归档/取消归档任务集
router.put('/:id/archive', collectionController.archiveCollection);

// DELETE /api/collections/:id - 删除任务集
router.delete('/:id', collectionController.deleteCollection);

module.exports = router;