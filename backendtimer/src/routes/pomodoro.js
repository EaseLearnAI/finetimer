'use strict';

const express = require('express');
const router = express.Router();
const {
  getAllPomodoros,
  createPomodoro,
  getPomodoroById,
  updatePomodoro,
  deletePomodoro,
  getPomodoroStats
} = require('../controllers/pomodoroController');

// 获取番茄钟统计数据 - 必须在 /:id 路由之前
router.get('/stats', getPomodoroStats);

// 获取所有番茄钟记录
router.get('/', getAllPomodoros);

// 创建新的番茄钟记录
router.post('/', createPomodoro);

// 获取单个番茄钟记录
router.get('/:id', getPomodoroById);

// 更新番茄钟记录
router.put('/:id', updatePomodoro);

// 删除番茄钟记录
router.delete('/:id', deletePomodoro);

module.exports = router;