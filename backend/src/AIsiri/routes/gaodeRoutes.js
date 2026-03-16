'use strict';

const express = require('express');
const gaodeController = require('../controllers/gaodeController');
const { authenticateToken } = require('../../middleware/auth');

const router = express.Router();

// 天气查询接口
router.get('/weather', authenticateToken, gaodeController.queryWeather);

// 路线规划接口
router.get('/route', authenticateToken, gaodeController.queryRoute);

module.exports = router;