# 语音识别功能模块

## 概述
本模块为AIsiri应用提供了完整的语音识别功能，支持用户上传语音文件并转换为文本，为后续的AI助手交互提供语音输入能力。

## 功能特性

### 🎯 核心功能
- **语音文件上传**: 支持多种音频格式，自动上传到OSS
- **智能识别**: 集成阿里云通义千问ASR和Paraformer模型
- **自动降级**: 主模型失败时自动切换到备用模型
- **分步处理**: 支持上传和识别分离，适用于大文件场景

### 🔧 技术特性
- **多格式支持**: MP3, WAV, M4A, AAC, FLAC
- **文件验证**: 类型、大小、格式自动验证
- **错误处理**: 完善的错误处理和用户提示
- **日志记录**: 详细的操作日志和错误追踪
- **认证保护**: 所有接口都需要JWT认证

## 快速开始

### 1. 环境配置
```bash
# 必需的环境变量
DASHSCOPE_API_KEY=your_dashscope_api_key_here
OSS_REGION=oss-cn-hangzhou
OSS_ACCESS_KEY_ID=your_oss_access_key_id
OSS_ACCESS_KEY_SECRET=your_oss_access_key_secret
OSS_BUCKET=your_oss_bucket_name
```

### 2. 启动服务
```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

### 3. 测试功能
```bash
# 运行语音识别测试
npm run test:speech
```

## API接口

### 主要接口

#### 1. 完整语音识别
```http
POST /api/speech-recognition/recognize
Content-Type: multipart/form-data
Authorization: Bearer <token>

# 请求参数
audio: <音频文件>

# 响应示例
{
  "success": true,
  "data": {
    "transcription": "识别出的文本内容",
    "audioUrl": "https://your-bucket.oss-cn-hangzhou.aliyuncs.com/...",
    "ossKey": "speech-recognition/userId/timestamp_filename.mp3"
  },
  "message": "语音识别成功"
}
```

#### 2. 仅上传文件
```http
POST /api/speech-recognition/upload
Content-Type: multipart/form-data
Authorization: Bearer <token>

# 响应示例
{
  "success": true,
  "data": {
    "audioUrl": "https://your-bucket.oss-cn-hangzhou.aliyuncs.com/...",
    "ossKey": "speech-recognition/userId/timestamp_filename.mp3"
  },
  "message": "语音文件上传成功"
}
```

#### 3. 从URL识别
```http
POST /api/speech-recognition/recognize-url
Content-Type: application/json
Authorization: Bearer <token>

# 请求体
{
  "audioUrl": "https://your-bucket.oss-cn-hangzhou.aliyuncs.com/..."
}
```

## 文件结构

```
src/AIvoice/
├── controllers/
│   └── speechRecognitionController.js    # 语音识别控制器
├── services/
│   └── speechRecognitionService.js       # 语音识别服务
├── routes/
│   └── speechRecognitionRoutes.js        # 语音识别路由
├── tests/
│   └── speech-recognition-test.js        # 功能测试
└── docs/
    ├── 语音识别配置说明.md               # 配置说明
    └── 前端调用示例.md                   # 前端集成示例
```

## 使用流程

### 推荐流程（一步到位）
```
用户选择音频文件 → 上传到OSS → 调用语音识别 → 返回识别结果 → 清理临时文件
```

### 分步流程（适用于大文件）
```
用户选择音频文件 → 上传到OSS → 返回OSS URL → 用户选择时机调用识别 → 返回识别结果
```

## 模型选择

### 通义千问ASR（主模型）
- **优势**: 支持本地文件、流式输出、中文英语效果好
- **限制**: 文件大小10MB，时长3分钟
- **适用**: 中文普通话、英语语音识别

### Paraformer-v2（备用模型）
- **优势**: 支持更多语言、方言、热词定制
- **限制**: 仅支持URL输入
- **适用**: 方言、其他语言、需要热词定制

## 配置说明

### 环境变量
| 变量名 | 说明 | 示例 |
|--------|------|------|
| `DASHSCOPE_API_KEY` | 阿里云DashScope API密钥 | `sk-xxx...` |
| `OSS_REGION` | OSS区域 | `oss-cn-hangzhou` |
| `OSS_ACCESS_KEY_ID` | OSS访问密钥ID | `LTAI5txxx...` |
| `OSS_ACCESS_KEY_SECRET` | OSS访问密钥Secret | `xxx...` |
| `OSS_BUCKET` | OSS存储桶名称 | `your-bucket` |

### 文件限制
- **文件大小**: 最大10MB
- **时长限制**: 最大3分钟
- **支持格式**: MP3, WAV, M4A, AAC, FLAC

## 错误处理

### 常见错误码
- `400`: 请求参数错误
- `401`: 未认证或认证失败
- `500`: 服务器内部错误

### 错误响应格式
```json
{
  "success": false,
  "error": "错误描述",
  "detail": "详细错误信息"
}
```

## 性能优化

### 建议
1. **音频预处理**: 转换为16kHz采样率，单声道
2. **文件大小**: 控制在10MB以内
3. **并发控制**: 避免同时处理过多大文件
4. **缓存策略**: 考虑缓存相同内容的识别结果

## 测试

### 运行测试
```bash
# 进入项目目录
cd backend

# 运行语音识别测试
npm run test:speech
```

### 测试前准备
1. 确保服务器正在运行
2. 配置有效的测试token
3. 配置所有必需的环境变量
4. 准备测试音频文件

## 前端集成

### 基础用法
```javascript
// 上传并识别
const formData = new FormData();
formData.append('audio', audioFile);

const response = await fetch('/api/speech-recognition/recognize', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const result = await response.json();
console.log('识别结果:', result.data.transcription);
```

### 完整示例
参考 `docs/前端调用示例.md` 文件，包含HTML、JavaScript和React组件的完整实现。

## 故障排除

### 常见问题

#### 1. API密钥无效
**症状**: 返回"语音识别服务未配置API密钥"错误
**解决**: 检查`DASHSCOPE_API_KEY`环境变量是否正确配置

#### 2. OSS上传失败
**症状**: 返回"OSS上传失败"错误
**解决**: 检查OSS配置和网络连接

#### 3. 识别超时
**症状**: 请求超时或长时间无响应
**解决**: 检查文件大小，建议控制在10MB以内

#### 4. 格式不支持
**症状**: 返回"只支持音频文件格式"错误
**解决**: 确保使用支持的音频格式

### 日志查看
语音识别相关的日志记录在：
- `logs/combined.log` - 一般信息
- `logs/error.log` - 错误信息

## 注意事项

### 安全
- 所有接口都需要JWT认证
- 文件上传有类型和大小限制
- 建议定期清理OSS中的临时文件

### 成本
- OSS存储会产生费用
- DashScope API调用会产生费用
- 建议监控使用量，控制成本

### 性能
- 大文件会影响响应时间
- 建议实现进度提示
- 考虑异步处理大文件

## 更新日志

### v1.0.0 (2025-01-XX)
- 初始版本发布
- 支持通义千问ASR和Paraformer模型
- 完整的文件上传和识别流程
- 完善的错误处理和日志记录

## 贡献

欢迎提交Issue和Pull Request来改进这个模块。

## 许可证

本项目采用MIT许可证。
