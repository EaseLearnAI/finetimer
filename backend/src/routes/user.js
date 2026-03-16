'use strict';

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile
} = require('../controllers/userController');

// 用户路由

// POST /api/users/register - 用户注册
router.post('/register', registerUser);

// POST /api/users/login - 用户登录
router.post('/login', loginUser);

// GET /api/users/profile - 获取用户信息（需要认证）
router.get('/profile', authenticateToken, getUserProfile);

// PUT /api/users/profile - 更新用户信息（需要认证）
router.put('/profile', authenticateToken, updateUserProfile);

module.exports = router;