'use strict';

const express = require('express');
const router = express.Router();

const taskRecognitionController = require('../controllers/taskRecognitionController');
const authenticateToken = require('../../middleware/auth').authenticateToken;

/**
 * @route POST /api/aisiri/tasks/recognize
 * @desc 识别并存储任务
 * @access Private
 */
router.post('/tasks/recognize', 
  authenticateToken, 
  taskRecognitionController.recognizeAndStoreTask
);

/**
 * @route POST /api/aisiri/tasks/recognize/batch
 * @desc 批量识别并存储任务
 * @access Private
 */
router.post('/tasks/recognize/batch', 
  authenticateToken, 
  taskRecognitionController.recognizeAndStoreTasksBatch
);

module.exports = router;