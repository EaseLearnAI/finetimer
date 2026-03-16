const express = require('express');
const router = express.Router();
const { 
  uploadAndAnalyzeImage, 
  analyzeImageByUrl,
  uploadImageOnly
} = require('../controllers/imageAnalysisController');

// 独立上传图片接口（只上传，不分析）
router.post('/upload', uploadImageOnly);

// 上传图片并分析
router.post('/upload-analyze', uploadAndAnalyzeImage);

// 根据URL分析图片
router.post('/analyze-url', analyzeImageByUrl);

module.exports = router;



