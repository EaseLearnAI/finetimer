const { uploadToOSS } = require('../services/ossService');
const { analyzeImageWithQwen } = require('../services/imageAnalysisService');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const upload = multer({ 
  dest: path.join(process.cwd(), 'uploads'),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 1
  }
});

// 独立上传图片（不进行分析）
const uploadImageOnly = [
  upload.single('image'),
  async (req, res) => {
    try {
      const userId = req.user && req.user.userId;
      if (!userId) {
        return res.status(401).json({ success: false, message: '未认证，缺少用户信息' });
      }

      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: '缺少图片文件' });
      }

      // 检查文件类型
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
      if (!allowedTypes.includes(file.mimetype)) {
        // 删除临时文件
        try { fs.unlinkSync(file.path); } catch (e) {}
        return res.status(400).json({ error: '不支持的文件类型，请上传图片文件' });
      }

      // 检查文件大小（限制为50MB）
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        try { fs.unlinkSync(file.path); } catch (e) {}
        return res.status(400).json({ error: '文件大小超过限制，请上传小于50MB的图片' });
      }

      const ossFileName = `images/${userId}/${Date.now()}_${file.originalname}`;
      let ossUrl;
      
      try {
        // 上传到OSS
        ossUrl = await uploadToOSS(file.path, ossFileName);
        
        return res.json({
          success: true,
          message: '图片上传成功',
          imageUrl: ossUrl,
          ossKey: ossFileName,
          fileName: file.originalname,
          fileSize: file.size,
          mimeType: file.mimetype
        });
        
      } finally {
        // 清理临时文件
        try { fs.unlinkSync(file.path); } catch (e) {}
      }
      
    } catch (error) {
      console.error('图片上传失败:', error);
      return res.status(500).json({ 
        error: '图片上传失败', 
        detail: error.message || error 
      });
    }
  }
];

const uploadAndAnalyzeImage = [
  upload.single('image'),
  async (req, res) => {
    try {
      const userId = req.user && req.user.userId;
      if (!userId) {
        return res.status(401).json({ success: false, message: '未认证，缺少用户信息' });
      }

      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: '缺少图片文件' });
      }

      // 检查文件类型
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
      if (!allowedTypes.includes(file.mimetype)) {
        // 删除临时文件
        try { fs.unlinkSync(file.path); } catch (e) {}
        return res.status(400).json({ error: '不支持的文件类型，请上传图片文件' });
      }

      // 检查文件大小（限制为50MB）
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        try { fs.unlinkSync(file.path); } catch (e) {}
        return res.status(400).json({ error: '文件大小超过限制，请上传小于50MB的图片' });
      }

      const ossFileName = `images/${userId}/${Date.now()}_${file.originalname}`;
      let ossUrl;
      
      try {
        // 上传到OSS
        ossUrl = await uploadToOSS(file.path, ossFileName);
        
        // 照片夸夸小助手的核心提示词
        const praisePrompt = `你是一个高情商、懂生活、善于发现美的"照片夸夸小助手"。你的任务不是简单地说"好看"，而是要仔细观察用户上传的照片，从细节中发现闪光点，并用真诚、自然、温暖的语言进行赞美，为用户带来积极的情绪价值。

夸奖的核心原则：
1. 真诚与具体：避免使用空洞、泛化的词语。你的赞美必须基于照片中的具体细节，例如一个眼神、一缕光线、一个搭配、一种氛围。
2. 自然不夸张：使用亲切、口语化的语言，像是朋友在身边聊天一样。避免使用过于华丽或夸张的形容词，让赞美听起来可信。
3. 关注情绪与故事：尝试读懂照片传递的情绪和背后的故事感。夸奖的重点可以放在照片所定格的那个美好瞬间和它给人的感觉。
4. 多元化角度：不要只夸外貌。可以从人物神态、穿搭品味、摄影技术（构图/光影）、环境氛围、甚至照片传递出的生活态度等多个角度切入。

分析与夸奖的执行流程：
1. 第一印象与整体氛围感知：这张照片给你的第一感觉是什么？（例如：温暖、治愈、酷炫、宁静、有活力、故事感）
2. 聚焦人物细节（如果有人物）：观察人物的表情、眼神、穿搭、姿态等
3. 分析环境与技术元素：光影、色彩、构图、背景、创意等
4. 构建与输出夸奖：将观察结果组合成2-3条不同角度的、完整的夸奖语

输出要求：
- 语气：亲切、温暖、真诚，像一个细心的朋友
- 结构：提供2-3个不同切入点的夸奖，让用户有选择感和被充分欣赏的感觉
- 开头：可以用引导性句子开场，如："哇，这张照片我好喜欢！"、"第一眼看到这张照片，我就觉得..."
- 结尾：用一句美好的祝愿结尾，如："希望你今天也像照片里一样开心呀！"、"被这个美好的瞬间治愈了~"

${req.body.prompt ? `用户特别要求：${req.body.prompt}` : ''}

现在请仔细观察这张照片，按照上述要求进行夸奖。记住要真诚、具体、温暖，让用户感受到被认真看见和欣赏。`;

        // 调用通义千问进行照片夸奖
        const analysisResult = await analyzeImageWithQwen(ossUrl, praisePrompt);
        
        return res.json({
          success: true,
          imageUrl: ossUrl,
          ossKey: ossFileName,
          praise: analysisResult,
          message: '照片夸奖完成！'
        });
        
      } finally {
        // 清理临时文件
        try { fs.unlinkSync(file.path); } catch (e) {}
      }
      
    } catch (error) {
      console.error('照片夸奖失败:', error);
      return res.status(500).json({ 
        error: '照片夸奖失败', 
        detail: error.message || error 
      });
    }
  }
];

const analyzeImageByUrl = async (req, res) => {
  try {
    const userId = req.user && req.user.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: '未认证，缺少用户信息' });
    }

    const { imageUrl, prompt } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({ error: '缺少图片URL' });
    }

    // 照片夸夸小助手的核心提示词
    const praisePrompt = `你是一个高情商、懂生活、善于发现美的"照片夸夸小助手"。你的任务不是简单地说"好看"，而是要仔细观察用户上传的照片，从细节中发现闪光点，并用真诚、自然、温暖的语言进行赞美，为用户带来积极的情绪价值。

夸奖的核心原则：
1. 真诚与具体：避免使用空洞、泛化的词语。你的赞美必须基于照片中的具体细节，例如一个眼神、一缕光线、一个搭配、一种氛围。
2. 自然不夸张：使用亲切、口语化的语言，像是朋友在身边聊天一样。避免使用过于华丽或夸张的形容词，让赞美听起来可信。
3. 关注情绪与故事：尝试读懂照片传递的情绪和背后的故事感。夸奖的重点可以放在照片所定格的那个美好瞬间和它给人的感觉。
4. 多元化角度：不要只夸外貌。可以从人物神态、穿搭品味、摄影技术（构图/光影）、环境氛围、甚至照片传递出的生活态度等多个角度切入。

分析与夸奖的执行流程：
1. 第一印象与整体氛围感知：这张照片给你的第一感觉是什么？（例如：温暖、治愈、酷炫、宁静、有活力、故事感）
2. 聚焦人物细节（如果有人物）：观察人物的表情、眼神、穿搭、姿态等
3. 分析环境与技术元素：光影、色彩、构图、背景、创意等
4. 构建与输出夸奖：将观察结果组合成2-3条不同角度的、完整的夸奖语

输出要求：
- 语气：亲切、温暖、真诚，像一个细心的朋友
- 结构：提供2-3个不同切入点的夸奖，让用户有选择感和被充分欣赏的感觉
- 开头：可以用引导性句子开场，如："哇，这张照片我好喜欢！"、"第一眼看到这张照片，我就觉得..."
- 结尾：用一句美好的祝愿结尾，如："希望你今天也像照片里一样开心呀！"、"被这个美好的瞬间治愈了~"

${prompt ? `用户特别要求：${prompt}` : ''}

现在请仔细观察这张照片，按照上述要求进行夸奖。记住要真诚、具体、温暖，让用户感受到被认真看见和欣赏。`;

    // 调用通义千问进行照片夸奖
    const analysisResult = await analyzeImageWithQwen(imageUrl, praisePrompt);
    
    return res.json({
      success: true,
      imageUrl: imageUrl,
      praise: analysisResult,
      message: '照片夸奖完成！'
    });
    
  } catch (error) {
    console.error('照片夸奖失败:', error);
    return res.status(500).json({ 
      error: '照片夸奖失败', 
      detail: error.message || error 
    });
  }
};

module.exports = { 
  uploadImageOnly,
  uploadAndAnalyzeImage,
  analyzeImageByUrl
};



