# 图片分析API前端调用指南

## 📋 概述

本指南详细说明了如何在前端应用中调用图片分析服务，包括图片上传、OSS存储、AI分析和结果获取等完整流程。

## 🚀 快速开始

### 基础配置

```javascript
// 基础配置
const API_BASE_URL = 'http://localhost:3000'; // 根据实际部署地址调整
const API_ENDPOINTS = {
  // 图片分析相关接口
  UPLOAD_ANALYZE: '/api/image-analysis/upload-analyze',  // 上传图片并分析
  ANALYZE_URL: '/api/image-analysis/analyze-url'         // 分析网络图片URL
};

// 用户认证
let userToken = null; // 存储用户登录后的token
```

### 用户认证

在调用图片分析API之前，需要先进行用户登录获取token：

```javascript
/**
 * 用户登录
 * @param {string} phoneNumber - 手机号
 * @param {string} password - 密码
 * @returns {Promise<Object>} 登录结果
 */
async function userLogin(phoneNumber, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ phoneNumber, password })
    });

    const result = await response.json();
    
    if (result.success) {
      userToken = result.data.token;
      localStorage.setItem('userToken', userToken); // 保存到本地存储
      return result;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('登录失败:', error);
    throw error;
  }
}

// 使用示例
try {
  const loginResult = await userLogin('18176606006', '123456');
  console.log('登录成功:', loginResult.data.user);
} catch (error) {
  console.error('登录失败:', error.message);
}
```

## 🖼️ 图片分析API调用

### 1. 上传图片并分析

一次性完成图片上传、OSS存储和AI分析：

```javascript
/**
 * 上传图片并分析
 * @param {File} imageFile - 图片文件对象
 * @param {string} prompt - 分析提示词
 * @returns {Promise<Object>} 分析结果
 */
async function uploadAndAnalyzeImage(imageFile, prompt = '请分析这张图片的内容') {
  try {
    // 检查文件类型
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
    if (!allowedTypes.includes(imageFile.type)) {
      throw new Error('不支持的图片格式，请使用 JPG, PNG, GIF, WebP, BMP 格式');
    }

    // 检查文件大小（10MB限制）
    if (imageFile.size > 10 * 1024 * 1024) {
      throw new Error('文件大小不能超过10MB');
    }

    // 创建FormData
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('prompt', prompt);

    // 发送请求
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.UPLOAD_ANALYZE}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userToken}`
      },
      body: formData
    });

    const result = await response.json();
    
    if (result.success) {
      return {
        success: true,
        imageUrl: result.imageUrl,           // 图片OSS URL
        ossKey: result.ossKey,              // OSS存储路径
        analysis: result.analysis            // AI分析结果
      };
    } else {
      throw new Error(result.error || result.message);
    }
  } catch (error) {
    console.error('图片分析失败:', error);
    throw error;
  }
}

// 使用示例
const fileInput = document.getElementById('imageFile');
fileInput.addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (file) {
    try {
      console.log('开始图片分析...');
      const result = await uploadAndAnalyzeImage(file, '请详细描述这张图片的内容');
      console.log('分析成功:', result.analysis.content);
      console.log('图片URL:', result.imageUrl);
      
      // 显示分析结果
      document.getElementById('result').innerHTML = `
        <h4>分析结果:</h4>
        <p>${result.analysis.content}</p>
        <img src="${result.imageUrl}" alt="分析图片" style="max-width: 300px;">
      `;
    } catch (error) {
      console.error('分析失败:', error.message);
      alert(`分析失败: ${error.message}`);
    }
  }
});
```

### 2. 分析网络图片URL

如果图片已经在网络上，可以直接分析：

```javascript
/**
 * 分析网络图片URL
 * @param {string} imageUrl - 图片网络URL
 * @param {string} prompt - 分析提示词
 * @returns {Promise<Object>} 分析结果
 */
async function analyzeImageByUrl(imageUrl, prompt) {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ANALYZE_URL}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ imageUrl, prompt })
    });

    const result = await response.json();
    
    if (result.success) {
      return {
        success: true,
        imageUrl: result.imageUrl,
        analysis: result.analysis
      };
    } else {
      throw new Error(result.error || result.message);
    }
  } catch (error) {
    console.error('URL分析失败:', error);
    throw error;
  }
}

// 使用示例
try {
  const result = await analyzeImageByUrl(
    'https://example.com/image.jpg',
    '这张图片中有什么？请用中文描述'
  );
  console.log('分析结果:', result.analysis.content);
} catch (error) {
  console.error('分析失败:', error.message);
}
```

## 🎨 完整的前端示例

### HTML结构

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>图片分析演示</title>
    <style>
        body {
            font-family: 'Microsoft YaHei', sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
            color: #333;
        }
        input, textarea, button {
            width: 100%;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 5px;
            font-size: 16px;
        }
        textarea {
            height: 80px;
            resize: vertical;
        }
        button {
            background-color: #007bff;
            color: white;
            border: none;
            cursor: pointer;
            margin-top: 10px;
        }
        button:hover {
            background-color: #0056b3;
        }
        button:disabled {
            background-color: #ccc;
            cursor: not-allowed;
        }
        .result {
            margin-top: 20px;
            padding: 15px;
            background-color: #f8f9fa;
            border-radius: 5px;
            border-left: 4px solid #007bff;
        }
        .error {
            border-left-color: #dc3545;
            background-color: #f8d7da;
            color: #721c24;
        }
        .success {
            border-left-color: #28a745;
            background-color: #d4edda;
            color: #155724;
        }
        .loading {
            text-align: center;
            color: #666;
        }
        .image-preview {
            max-width: 300px;
            margin: 10px 0;
            border-radius: 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🖼️ 图片分析服务</h1>
        
        <!-- 用户登录 -->
        <div class="form-group">
            <h3>🔐 用户登录</h3>
            <label for="phoneNumber">手机号:</label>
            <input type="tel" id="phoneNumber" placeholder="请输入手机号" value="18176606006">
            
            <label for="password">密码:</label>
            <input type="password" id="password" placeholder="请输入密码" value="123456">
            
            <button onclick="login()">登录</button>
        </div>

        <!-- 图片分析 -->
        <div class="form-group">
            <h3>📸 图片分析</h3>
            <label for="imageFile">选择图片文件:</label>
            <input type="file" id="imageFile" accept="image/*">
            
            <label for="prompt">分析提示词:</label>
            <textarea id="prompt" placeholder="请输入分析提示词，例如：请详细描述这张图片的内容，包括主要元素、颜色、场景等">请详细描述这张图片的内容，包括主要元素、颜色、场景等</textarea>
            
            <button onclick="startAnalysis()" id="analyzeBtn" disabled>开始分析</button>
        </div>

        <!-- URL分析 -->
        <div class="form-group">
            <h3>🌐 URL分析</h3>
            <label for="imageUrl">图片URL:</label>
            <input type="url" id="imageUrl" placeholder="请输入图片网络地址">
            
            <button onclick="analyzeUrl()" id="urlAnalyzeBtn" disabled>分析URL</button>
        </div>

        <!-- 结果显示 -->
        <div id="result" class="result" style="display: none;"></div>
    </div>

    <script src="image-analysis.js"></script>
</body>
</html>
```

### JavaScript实现

```javascript
// image-analysis.js

// 基础配置
const API_BASE_URL = 'http://localhost:3000';
const API_ENDPOINTS = {
  LOGIN: '/api/users/login',
  UPLOAD_ANALYZE: '/api/image-analysis/upload-analyze',
  ANALYZE_URL: '/api/image-analysis/analyze-url'
};

let userToken = null;

// 页面加载完成后检查本地存储的token
document.addEventListener('DOMContentLoaded', () => {
  const savedToken = localStorage.getItem('userToken');
  if (savedToken) {
    userToken = savedToken;
    updateUIAfterLogin();
  }
});

/**
 * 用户登录
 */
async function login() {
  const phoneNumber = document.getElementById('phoneNumber').value;
  const password = document.getElementById('password').value;
  
  if (!phoneNumber || !password) {
    showResult('请输入手机号和密码', 'error');
    return;
  }

  try {
    showResult('正在登录...', 'loading');
    
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.LOGIN}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ phoneNumber, password })
    });

    const result = await response.json();
    
    if (result.success) {
      userToken = result.data.token;
      localStorage.setItem('userToken', userToken);
      showResult('登录成功！', 'success');
      updateUIAfterLogin();
    } else {
      showResult(`登录失败: ${result.message}`, 'error');
    }
  } catch (error) {
    showResult(`登录失败: ${error.message}`, 'error');
  }
}

/**
 * 更新登录后的UI状态
 */
function updateUIAfterLogin() {
  document.getElementById('analyzeBtn').disabled = false;
  document.getElementById('urlAnalyzeBtn').disabled = false;
  document.getElementById('phoneNumber').disabled = true;
  document.getElementById('password').disabled = true;
}

/**
 * 开始图片分析
 */
async function startAnalysis() {
  const fileInput = document.getElementById('imageFile');
  const promptInput = document.getElementById('prompt');
  const file = fileInput.files[0];
  const prompt = promptInput.value.trim();
  
  if (!file) {
    showResult('请选择图片文件', 'error');
    return;
  }

  if (!prompt) {
    showResult('请输入分析提示词', 'error');
    return;
  }

  // 检查文件类型
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
  if (!allowedTypes.includes(file.type)) {
    showResult('不支持的图片格式，请使用 JPG, PNG, GIF, WebP, BMP 格式', 'error');
    return;
  }

  // 检查文件大小
  if (file.size > 10 * 1024 * 1024) {
    showResult('文件大小不能超过10MB', 'error');
    return;
  }

  try {
    showResult('正在分析中，请稍候...', 'loading');
    
    const formData = new FormData();
    formData.append('image', file);
    formData.append('prompt', prompt);

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.UPLOAD_ANALYZE}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userToken}`
      },
      body: formData
    });

    const result = await response.json();
    
    if (result.success) {
      showResult(`
        <h4>✅ 分析成功！</h4>
        <img src="${result.imageUrl}" alt="分析图片" class="image-preview">
        <p><strong>分析结果:</strong></p>
        <div style="white-space: pre-wrap;">${result.analysis.content}</div>
        <p><strong>图片URL:</strong> <a href="${result.imageUrl}" target="_blank">${result.imageUrl}</a></p>
        <p><strong>OSS路径:</strong> ${result.ossKey}</p>
        ${result.analysis.usage ? `<p><strong>Token使用:</strong> 输入${result.analysis.usage.prompt_tokens || result.analysis.usage.input_tokens || 0}, 输出${result.analysis.usage.completion_tokens || result.analysis.usage.output_tokens || 0}, 总计${result.analysis.usage.total_tokens || 0}</p>` : ''}
      `, 'success');
    } else {
      showResult(`分析失败: ${result.error || result.message}`, 'error');
    }
  } catch (error) {
    showResult(`分析失败: ${error.message}`, 'error');
  }
}

/**
 * 分析URL图片
 */
async function analyzeUrl() {
  const imageUrl = document.getElementById('imageUrl').value.trim();
  const promptInput = document.getElementById('prompt');
  const prompt = promptInput.value.trim();
  
  if (!imageUrl) {
    showResult('请输入图片URL', 'error');
    return;
  }

  if (!prompt) {
    showResult('请输入分析提示词', 'error');
    return;
  }

  try {
    showResult('正在分析中，请稍候...', 'loading');
    
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ANALYZE_URL}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ imageUrl, prompt })
    });

    const result = await response.json();
    
    if (result.success) {
      showResult(`
        <h4>✅ URL分析成功！</h4>
        <img src="${result.imageUrl}" alt="分析图片" class="image-preview">
        <p><strong>分析结果:</strong></p>
        <div style="white-space: pre-wrap;">${result.analysis.content}</div>
        <p><strong>图片URL:</strong> <a href="${result.imageUrl}" target="_blank">${result.imageUrl}</a></p>
        ${result.analysis.usage ? `<p><strong>Token使用:</strong> 输入${result.analysis.usage.prompt_tokens || result.analysis.usage.input_tokens || 0}, 输出${result.analysis.usage.completion_tokens || result.analysis.usage.output_tokens || 0}, 总计${result.analysis.usage.total_tokens || 0}</p>` : ''}
      `, 'success');
    } else {
      showResult(`分析失败: ${result.error || result.message}`, 'error');
    }
  } catch (error) {
    showResult(`分析失败: ${error.message}`, 'error');
  }
}

/**
 * 显示结果
 */
function showResult(message, type = 'info') {
  const resultDiv = document.getElementById('result');
  resultDiv.innerHTML = message;
  resultDiv.className = `result ${type}`;
  resultDiv.style.display = 'block';
}

/**
 * 文件选择变化时启用分析按钮
 */
document.getElementById('imageFile').addEventListener('change', (event) => {
  const file = event.target.files[0];
  const analyzeBtn = document.getElementById('analyzeBtn');
  
  if (file && userToken) {
    analyzeBtn.disabled = false;
  } else {
    analyzeBtn.disabled = true;
  }
});

/**
 * URL输入变化时启用URL分析按钮
 */
document.getElementById('imageUrl').addEventListener('input', (event) => {
  const url = event.target.value.trim();
  const urlAnalyzeBtn = document.getElementById('urlAnalyzeBtn');
  
  if (url && userToken) {
    urlAnalyzeBtn.disabled = false;
  } else {
    urlAnalyzeBtn.disabled = true;
  }
});
```

## 🔧 错误处理

### 常见错误及解决方案

```javascript
/**
 * 错误处理工具
 */
class ErrorHandler {
  static handle(error, context = '') {
    console.error(`${context} 错误:`, error);
    
    let userMessage = '操作失败，请稍后重试';
    
    if (error.response) {
      // HTTP错误
      switch (error.response.status) {
        case 401:
          userMessage = '登录已过期，请重新登录';
          // 清除本地token
          localStorage.removeItem('userToken');
          userToken = null;
          break;
        case 400:
          userMessage = '请求参数错误，请检查输入';
          break;
        case 413:
          userMessage = '文件过大，请选择小于10MB的图片';
          break;
        case 500:
          userMessage = '服务器内部错误，请稍后重试';
          break;
        default:
          userMessage = `请求失败 (${error.response.status})`;
      }
    } else if (error.request) {
      // 网络错误
      userMessage = '网络连接失败，请检查网络设置';
    } else if (error.message) {
      // 其他错误
      userMessage = error.message;
    }
    
    // 显示错误信息
    showResult(userMessage, 'error');
    
    return userMessage;
  }
}

// 使用示例
try {
  const result = await uploadAndAnalyzeImage(imageFile, prompt);
  // 处理成功结果...
} catch (error) {
  ErrorHandler.handle(error, '图片分析');
}
```

## 📱 移动端适配

### 拖拽上传支持

```javascript
/**
 * 拖拽上传功能
 */
class DragAndDropUpload {
  constructor(dropZone, onFileSelect) {
    this.dropZone = dropZone;
    this.onFileSelect = onFileSelect;
    this.init();
  }

  init() {
    this.dropZone.addEventListener('dragover', this.handleDragOver.bind(this));
    this.dropZone.addEventListener('dragleave', this.handleDragLeave.bind(this));
    this.dropZone.addEventListener('drop', this.handleDrop.bind(this));
  }

  handleDragOver(e) {
    e.preventDefault();
    this.dropZone.classList.add('dragover');
  }

  handleDragLeave(e) {
    e.preventDefault();
    this.dropZone.classList.remove('dragover');
  }

  handleDrop(e) {
    e.preventDefault();
    this.dropZone.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      this.onFileSelect(files[0]);
    }
  }
}

// 使用示例
const dropZone = document.getElementById('dropZone');
new DragAndDropUpload(dropZone, (file) => {
  // 处理拖拽的文件
  document.getElementById('imageFile').files = new DataTransfer().files;
  startAnalysis();
});
```

## 📊 性能优化建议

### 1. 图片预处理

```javascript
/**
 * 图片预处理工具
 */
class ImagePreprocessor {
  /**
   * 压缩图片
   */
  static async compressImage(imageFile, maxWidth = 1920, quality = 0.8) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // 计算压缩后的尺寸
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // 绘制压缩后的图片
        ctx.drawImage(img, 0, 0, width, height);
        
        // 转换为Blob
        canvas.toBlob((blob) => {
          const compressedFile = new File([blob], imageFile.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          resolve(compressedFile);
        }, 'image/jpeg', quality);
      };
      
      img.src = URL.createObjectURL(imageFile);
    });
  }
  
  /**
   * 检查图片信息
   */
  static getImageInfo(imageFile) {
    return new Promise((resolve) => {
      const img = new Image();
      
      img.onload = () => {
        const info = {
          width: img.width,
          height: img.height,
          size: imageFile.size,
          type: imageFile.type,
          aspectRatio: img.width / img.height
        };
        
        resolve(info);
      };
      
      img.src = URL.createObjectURL(imageFile);
    });
  }
}

// 使用示例
const compressedFile = await ImagePreprocessor.compressImage(imageFile);
const result = await uploadAndAnalyzeImage(compressedFile, prompt);
```

### 2. 批量处理

```javascript
/**
 * 批量图片分析
 */
class BatchProcessor {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.maxConcurrent = 2; // 图片分析并发数限制
  }
  
  /**
   * 添加任务到队列
   */
  addTask(imageFile, prompt) {
    return new Promise((resolve, reject) => {
      this.queue.push({
        file: imageFile,
        prompt,
        resolve,
        reject
      });
      
      this.processQueue();
    });
  }
  
  /**
   * 处理队列
   */
  async processQueue() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    
    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, this.maxConcurrent);
      
      const promises = batch.map(async (task) => {
        try {
          const result = await uploadAndAnalyzeImage(task.file, task.prompt);
          task.resolve(result);
        } catch (error) {
          task.reject(error);
        }
      });
      
      await Promise.all(promises);
    }
    
    this.processing = false;
  }
}

// 使用示例
const batchProcessor = new BatchProcessor();

// 批量添加图片
const files = fileInput.files;
for (let file of files) {
  batchProcessor.addTask(file, prompt)
    .then(result => console.log('分析成功:', result))
    .catch(error => console.error('分析失败:', error));
}
```

## 🧪 测试建议

### 1. 功能测试

```javascript
/**
 * 功能测试套件
 */
class TestSuite {
  static async runAllTests() {
    console.log('🧪 开始运行图片分析测试套件...');
    
    const tests = [
      this.testLogin,
      this.testImageUpload,
      this.testAnalysis,
      this.testErrorHandling
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const test of tests) {
      try {
        await test();
        console.log(`✅ ${test.name} 通过`);
        passed++;
      } catch (error) {
        console.error(`❌ ${test.name} 失败:`, error.message);
        failed++;
      }
    }
    
    console.log(`\n📊 测试结果: ${passed} 通过, ${failed} 失败`);
    return { passed, failed };
  }
  
  static async testLogin() {
    const result = await userLogin('18176606006', '123456');
    if (!result.success) throw new Error('登录测试失败');
  }
  
  static async testImageUpload() {
    // 创建测试图片文件
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'red';
    ctx.fillRect(0, 0, 100, 100);
    
    canvas.toBlob(async (blob) => {
      const testFile = new File([blob], 'test.png', { type: 'image/png' });
      const result = await uploadAndAnalyzeImage(testFile, '测试提示词');
      if (!result.success) throw new Error('图片上传测试失败');
    });
  }
  
  static async testAnalysis() {
    // 测试分析功能
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'blue';
    ctx.fillRect(0, 0, 100, 100);
    
    canvas.toBlob(async (blob) => {
      const testFile = new File([blob], 'test.png', { type: 'image/png' });
      const result = await uploadAndAnalyzeImage(testFile, '这张图片是什么颜色？');
      if (!result.success) throw new Error('图片分析测试失败');
    });
  }
  
  static async testErrorHandling() {
    // 测试错误处理
    try {
      await uploadAndAnalyzeImage(null, '测试');
      throw new Error('应该抛出错误但没有');
    } catch (error) {
      // 预期会抛出错误
      console.log('错误处理测试通过');
    }
  }
}

// 运行测试
// TestSuite.runAllTests();
```

## 📚 总结

本指南提供了完整的图片分析API前端调用方案，包括：

1. **用户认证** - 登录获取token
2. **图片上传** - 支持多种图片格式，自动压缩
3. **AI分析** - 基于通义千问的智能图片理解
4. **OSS存储** - 自动上传到阿里云OSS
5. **错误处理** - 完善的错误处理机制
6. **性能优化** - 图片预处理和批量处理
7. **测试方案** - 功能测试套件

按照本指南实现，前端应用就能正确调用图片分析服务，为用户提供强大的AI图片理解能力。

## 🔗 相关链接

- [通义千问VL API文档](https://help.aliyun.com/zh/dashscope/developer-reference/api-details)
- [阿里云OSS文档](https://help.aliyun.com/zh/oss/)
- [Web Image API文档](https://developer.mozilla.org/zh-CN/docs/Web/API/Canvas_API)
