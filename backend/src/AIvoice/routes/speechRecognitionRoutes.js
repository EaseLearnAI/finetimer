const express = require('express');
const router = express.Router();
const { 
  recognizeVoice, 
  uploadVoiceOnly, 
  recognizeFromUrl 
} = require('../controllers/speechRecognitionController');

/**
 * 语音识别相关路由
 * 所有接口都需要用户认证
 */

// 主要接口：上传语音文件并直接进行识别
router.post('/recognize', recognizeVoice);

// 分步处理接口：仅上传语音文件到OSS
router.post('/upload', uploadVoiceOnly);

// 分步处理接口：对已上传的OSS文件进行识别
router.post('/recognize-url', recognizeFromUrl);

module.exports = router;
