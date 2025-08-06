'use strict';

const express = require('express');
const router = express.Router();
const {
  getAllTasks,
  createTask,
  getTaskById,
  updateTask,
  deleteTask,
  toggleTaskCompletion,
  getUnscheduledTasks,
  getTasksByTimeBlock
} = require('../controllers/taskController');

// 获取所有任务
router.get('/', getAllTasks);

// 获取未指定时间的任务
router.get('/unscheduled', getUnscheduledTasks);

// 根据时间块类型获取任务
router.get('/timeblock/:timeBlockType', getTasksByTimeBlock);

// 创建新任务
router.post('/', createTask);

// 获取单个任务
router.get('/:id', getTaskById);

// 更新任务
router.put('/:id', updateTask);

// 删除任务
router.delete('/:id', deleteTask);

// 切换任务完成状态
router.patch('/:id/toggle', toggleTaskCompletion);

module.exports = router;