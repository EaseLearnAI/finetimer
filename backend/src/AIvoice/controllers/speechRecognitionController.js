const { uploadToOSS } = require('../services/ossService');
const speechRecognitionService = require('../services/speechRecognitionService');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const logger = require('../../config/logger');

const upload = multer({ 
  dest: path.join(process.cwd(), 'uploads'),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB限制
    files: 1
  },
  fileFilter: (req, file, cb) => {
    // 只允许音频文件
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/aac', 'audio/flac'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('只支持音频文件格式: MP3, WAV, M4A, AAC, FLAC'));
    }
  }
});

/**
 * 语音识别接口
 * 上传语音文件到OSS，然后调用语音识别服务
 */
const recognizeVoice = [
  upload.single('audio'),
  async (req, res) => {
    try {
      const userId = req.user && req.user.userId;
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          message: '未认证，缺少用户信息' 
        });
      }

      const file = req.file;
      if (!file) {
        return res.status(400).json({ 
          success: false, 
          error: '缺少音频文件' 
        });
      }

      logger.info(`用户 ${userId} 开始语音识别，文件: ${file.originalname}`);

      // 生成OSS文件名
      const ossFileName = `speech-recognition/${userId}/${Date.now()}_${file.originalname}`;
      let ossUrl;
      let transcription;

      try {
        // 上传到OSS
        logger.info(`开始上传文件到OSS: ${ossFileName}`);
        ossUrl = await uploadToOSS(file.path, ossFileName);
        logger.info(`文件上传成功: ${ossUrl}`);

        // 调用语音识别服务
        logger.info('开始语音识别...');
        transcription = await speechRecognitionService.recognizeSpeech(ossUrl);
        logger.info(`语音识别成功: ${transcription}`);

        // 返回识别结果
        res.json({
          success: true,
          data: {
            transcription,
            audioUrl: ossUrl,
            ossKey: ossFileName
          },
          message: '语音识别成功'
        });

      } catch (error) {
        logger.error('语音识别处理失败:', error.message);
        
        // 如果通义千问ASR失败，尝试使用Paraformer作为备用
        if (error.message.includes('通义千问ASR')) {
          try {
            logger.info('尝试使用Paraformer作为备用方案...');
            transcription = await speechRecognitionService.recognizeSpeechWithParaformer(ossUrl);
            
            res.json({
              success: true,
              data: {
                transcription,
                audioUrl: ossUrl,
                ossKey: ossFileName,
                model: 'paraformer-v2' // 标识使用的模型
              },
              message: '语音识别成功（使用备用模型）'
            });
            return;
          } catch (fallbackError) {
            logger.error('备用模型也失败:', fallbackError.message);
          }
        }

        res.status(500).json({
          success: false,
          error: '语音识别失败',
          detail: error.message
        });
      } finally {
        // 清理临时文件
        try {
          fs.unlinkSync(file.path);
          logger.info('临时文件清理完成');
        } catch (cleanupError) {
          logger.warn('临时文件清理失败:', cleanupError.message);
        }
      }

    } catch (error) {
      logger.error('语音识别接口异常:', error.message);
      res.status(500).json({
        success: false,
        error: '服务器内部错误',
        detail: error.message
      });
    }
  }
];

/**
 * 仅上传语音文件到OSS（不进行识别）
 * 用于需要分步处理的场景
 */
const uploadVoiceOnly = [
  upload.single('audio'),
  async (req, res) => {
    try {
      const userId = req.user && req.user.userId;
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          message: '未认证，缺少用户信息' 
        });
      }

      const file = req.file;
      if (!file) {
        return res.status(400).json({ 
          success: false, 
          error: '缺少音频文件' 
        });
      }

      const ossFileName = `speech-recognition/${userId}/${Date.now()}_${file.originalname}`;
      let ossUrl;

      try {
        ossUrl = await uploadToOSS(file.path, ossFileName);
        
        res.json({
          success: true,
          data: {
            audioUrl: ossUrl,
            ossKey: ossFileName
          },
          message: '语音文件上传成功'
        });

      } catch (error) {
        logger.error('语音文件上传失败:', error.message);
        res.status(500).json({
          success: false,
          error: '文件上传失败',
          detail: error.message
        });
      } finally {
        // 清理临时文件
        try {
          fs.unlinkSync(file.path);
        } catch (cleanupError) {
          logger.warn('临时文件清理失败:', cleanupError.message);
        }
      }

    } catch (error) {
      logger.error('语音上传接口异常:', error.message);
      res.status(500).json({
        success: false,
        error: '服务器内部错误',
        detail: error.message
      });
    }
  }
];

/**
 * 对已上传的OSS文件进行语音识别
 * 用于分步处理的场景
 */
const recognizeFromUrl = async (req, res) => {
  try {
    const userId = req.user && req.user.userId;
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: '未认证，缺少用户信息' 
      });
    }

    const { audioUrl } = req.body;
    if (!audioUrl) {
      return res.status(400).json({ 
        success: false, 
        error: '缺少音频文件URL' 
      });
    }

    logger.info(`用户 ${userId} 开始识别OSS文件: ${audioUrl}`);

    try {
      const transcription = await speechRecognitionService.recognizeSpeech(audioUrl);
      
      res.json({
        success: true,
        data: {
          transcription,
          audioUrl
        },
        message: '语音识别成功'
      });

    } catch (error) {
      logger.error('语音识别失败:', error.message);
      res.status(500).json({
        success: false,
        error: '语音识别失败',
        detail: error.message
      });
    }

  } catch (error) {
    logger.error('URL识别接口异常:', error.message);
    res.status(500).json({
      success: false,
      error: '服务器内部错误',
      detail: error.message
    });
  }
};

module.exports = {
  recognizeVoice,
  uploadVoiceOnly,
  recognizeFromUrl
};
