const { uploadToOSS } = require('../services/ossService');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const upload = multer({ 
  dest: path.join(process.cwd(), 'uploads'),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB for audio files
    files: 1
  }
});

const uploadVoice = [
  upload.single('file'),
  async (req, res) => {
    try {
      const userId = req.user && req.user.userId;
      if (!userId) {
        return res.status(401).json({ success: false, message: '未认证，缺少用户信息' });
      }
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: '缺少文件file' });
      }
      const ossFileName = `voice/${userId}/${Date.now()}_${file.originalname}`;
      let ossUrl;
      try {
        ossUrl = await uploadToOSS(file.path, ossFileName);
      } finally {
        try { fs.unlinkSync(file.path); } catch (e) {}
      }
      return res.json({ success: true, url: ossUrl, ossKey: ossFileName });
    } catch (e) {
      return res.status(500).json({ error: 'OSS上传失败', detail: e.message || e });
    }
  }
];

module.exports = { uploadVoice }; 