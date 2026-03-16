<template>
  <Teleport to="body">
    <div v-if="visible" class="image-analysis-modal" @click.self="closeModal">
      <div class="modal-content">
      <!-- 模态框头部 -->
      <div class="modal-header">
        <h3>🖼️ 图片分析</h3>
        <button class="close-btn" @click="closeModal">
          <font-awesome-icon icon="times" />
        </button>
      </div>

      <!-- 模态框内容 -->
      <div class="modal-body">
              <!-- 图片上传区域 -->
      <div class="upload-area">
          <!-- 拖拽上传区域 -->
          <div 
            class="upload-area"
            :class="{ 
              'dragover': isDragOver, 
              'has-image': selectedFile,
              'uploading': isUploading 
            }"
            @drop="handleDrop"
            @dragover.prevent="isDragOver = true"
            @dragleave.prevent="isDragOver = false"
            @click="triggerFileSelect"
          >
            <div v-if="!selectedFile" class="upload-placeholder">
              <font-awesome-icon icon="cloud-upload-alt" class="upload-icon" />
              <p class="upload-text">拖拽图片到此处或点击选择</p>
              <p class="upload-hint">支持 JPEG、PNG、GIF、WebP、BMP 格式，最大 10MB</p>
            </div>
            
            <div v-else class="image-preview">
              <img :src="previewUrl" :alt="selectedFile.name" class="preview-image" />
              <div class="image-info">
                <p class="image-name">{{ selectedFile.name }}</p>
                <p class="image-size">{{ formatFileSize(selectedFile.size) }}</p>
              </div>
              <button class="remove-image" @click.stop="removeImage">
                <font-awesome-icon icon="times" />
              </button>
            </div>

            <div v-if="isUploading" class="upload-progress">
              <font-awesome-icon icon="spinner" spin />
              <span>正在分析图片...</span>
            </div>
          </div>

          <!-- 隐藏的文件输入 -->
          <input 
            ref="fileInput"
            type="file" 
            accept="image/*"
            style="display: none"
            @change="handleFileSelect"
          >
        </div>

        <!-- 自定义提示词 -->
        <div class="prompt-section">
          <label class="prompt-label">
            <font-awesome-icon icon="comment" />
            自定义分析提示词（可选）
          </label>
          <textarea 
            v-model="customPrompt"
            placeholder="例如：请详细描述这张图片的内容，包括场景、对象、颜色等..."
            class="prompt-input"
            rows="3"
            :disabled="isUploading"
          ></textarea>
        </div>

        <!-- 分析结果 -->
        <div v-if="analysisResult" class="analysis-result">
          <h4>📊 分析结果</h4>
          <div class="result-content">
            <p class="result-text">{{ analysisResult.analysis.content }}</p>
            <div class="result-meta">
              <span class="token-info">
                <font-awesome-icon icon="info-circle" />
                消耗 Token: {{ analysisResult.analysis.usage.total_tokens }}
              </span>
            </div>
          </div>
        </div>

        <!-- 错误提示 -->
        <div v-if="errorMessage" class="error-message">
          <font-awesome-icon icon="exclamation-triangle" />
          {{ errorMessage }}
        </div>
      </div>

      <!-- 模态框底部 -->
      <div class="modal-footer">
        <button class="btn btn-secondary" @click="closeModal">
          取消
        </button>
        <button 
          v-if="activeTab === 'upload' && selectedFile"
          class="btn btn-primary"
          @click="analyzeImage"
          :disabled="isUploading"
        >
          <font-awesome-icon v-if="isUploading" icon="spinner" spin />
          <span v-else>开始分析</span>
        </button>
      </div>
    </div>
  </div>
</Teleport>
</template>

<script>
import imageAnalysisService from '../../AIsiri/services/imageAnalysisService.js'
import { log } from '../../AIsiri/utils/logger.js'

export default {
  name: 'ImageAnalysisModal',
  emits: ['close', 'analysisComplete', 'showToast'],
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    preSelectedFile: {
      type: File,
      default: null
    }
  },
  data() {
    return {
      selectedFile: null,
      previewUrl: '',
      customPrompt: '',
      isDragOver: false,
      isUploading: false,
      analysisResult: null,
      errorMessage: ''
    }
  },
  watch: {
    preSelectedFile: {
      handler(newFile) {
        if (newFile) {
          this.selectFile(newFile);
        }
      },
      immediate: true
    }
  },
  methods: {
    /**
     * 关闭模态框
     */
    closeModal() {
      this.$emit('close')
      this.resetForm()
    },

    /**
     * 重置表单
     */
    resetForm() {
      this.selectedFile = null
      this.previewUrl = ''
      this.customPrompt = ''
      this.isDragOver = false
      this.isUploading = false
      this.analysisResult = null
      this.errorMessage = ''
    },

    /**
     * 触发文件选择
     */
    triggerFileSelect() {
      if (!this.selectedFile && !this.isUploading) {
        this.$refs.fileInput.click()
      }
    },

    /**
     * 处理文件选择
     */
    handleFileSelect(event) {
      const file = event.target.files[0]
      if (file) {
        this.selectFile(file)
      }
    },

    /**
     * 处理拖拽放置
     */
    handleDrop(event) {
      event.preventDefault()
      this.isDragOver = false
      
      const files = event.dataTransfer.files
      if (files.length > 0) {
        this.selectFile(files[0])
      }
    },

    /**
     * 选择文件
     */
    selectFile(file) {
      // 验证文件
      const validation = imageAnalysisService.validateImageFile(file)
      if (!validation.isValid) {
        this.showError(validation.errors.join(', '))
        return
      }

      this.selectedFile = file
      this.previewUrl = URL.createObjectURL(file)
      this.errorMessage = ''
      this.analysisResult = null
    },

    /**
     * 移除图片
     */
    removeImage() {
      if (this.previewUrl) {
        URL.revokeObjectURL(this.previewUrl)
      }
      this.selectedFile = null
      this.previewUrl = ''
      this.analysisResult = null
    },

    /**
     * 分析上传的图片
     */
    async analyzeImage() {
      if (!this.selectedFile) return

      try {
        this.isUploading = true
        this.errorMessage = ''
        this.analysisResult = null

        log.info('开始分析上传的图片', { 
          fileName: this.selectedFile.name,
          customPrompt: this.customPrompt 
        })

        const result = await imageAnalysisService.uploadAndAnalyze(
          this.selectedFile, 
          this.customPrompt
        )

        this.analysisResult = result
        this.showSuccess('图片分析完成！')
        
        // 发送分析结果到父组件
        this.$emit('analysisComplete', result)
      } catch (error) {
        log.error('图片分析失败', error)
        this.showError(error.message || '图片分析失败')
      } finally {
        this.isUploading = false
      }
    },



    /**
     * 格式化文件大小
     */
    formatFileSize(bytes) {
      return imageAnalysisService.formatFileSize(bytes)
    },

    /**
     * 显示成功提示
     */
    showSuccess(message) {
      this.$emit('showToast', message, 'success')
    },

    /**
     * 显示错误提示
     */
    showError(message) {
      this.errorMessage = message
    }
  },

  beforeUnmount() {
    // 清理预览URL
    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl)
    }
  }
}
</script>

<style scoped>
.image-analysis-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  /* 使用flexbox确保弹窗在屏幕正中央 */
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  box-sizing: border-box;
}

.modal-content {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  position: relative;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e5ea;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1d1d1f;
}

.close-btn {
  background: none;
  border: none;
  font-size: 18px;
  color: #8e8e93;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f2f2f7;
  color: #1d1d1f;
}

.modal-body {
  padding: 24px;
  max-height: 60vh;
  overflow-y: auto;
}



/* 上传区域样式 */
.upload-area {
  border: 2px dashed #d1d1d6;
  border-radius: 12px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: #fafafa;
}

.upload-area:hover:not(.uploading) {
  border-color: #007aff;
  background: #f0f8ff;
}

.upload-area.dragover {
  border-color: #007aff;
  background: #e6f3ff;
  transform: scale(1.02);
}

.upload-area.has-image {
  border-style: solid;
  border-color: #34c759;
  background: #f0fff4;
  padding: 20px;
}

.upload-area.uploading {
  border-color: #007aff;
  background: #f0f8ff;
  cursor: not-allowed;
}

.upload-placeholder {
  color: #8e8e93;
}

.upload-icon {
  font-size: 48px;
  color: #d1d1d6;
  margin-bottom: 16px;
}

.upload-text {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #1d1d1f;
}

.upload-hint {
  font-size: 14px;
  margin: 0;
  color: #8e8e93;
}

/* 图片预览样式 */
.image-preview {
  position: relative;
  display: flex;
  align-items: center;
  gap: 16px;
}

.preview-image {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
  border: 2px solid #e5e5ea;
}

.image-info {
  flex: 1;
  text-align: left;
}

.image-name {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: #1d1d1f;
  word-break: break-all;
}

.image-size {
  font-size: 12px;
  margin: 0;
  color: #8e8e93;
}

.remove-image {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #ff3b30;
  color: white;
  border: none;
  width: 24px;
  height: 24px;
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  transition: all 0.2s;
}

.remove-image:hover {
  background: #d70015;
  transform: scale(1.1);
}

/* 上传进度样式 */
.upload-progress {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #007aff;
  font-size: 14px;
  margin-top: 16px;
}

/* URL输入样式 */
.url-input-container {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.url-input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #d1d1d6;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: all 0.2s;
}

.url-input:focus {
  border-color: #007aff;
  box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.2);
}

.analyze-url-btn {
  padding: 12px 20px;
  background: #007aff;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.analyze-url-btn:hover:not(:disabled) {
  background: #0056d3;
}

.analyze-url-btn:disabled {
  background: #e5e5ea;
  color: #8e8e93;
  cursor: not-allowed;
}

/* 提示词输入样式 */
.prompt-section {
  margin-bottom: 20px;
}

.prompt-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #1d1d1f;
  margin-bottom: 8px;
}

.prompt-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #d1d1d6;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  resize: vertical;
  min-height: 80px;
  transition: all 0.2s;
  font-family: inherit;
}

.prompt-input:focus {
  border-color: #007aff;
  box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.2);
}

/* 分析结果样式 */
.analysis-result {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  border-left: 4px solid #007aff;
}

.analysis-result h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1d1d1f;
}

.result-text {
  margin: 0 0 16px 0;
  font-size: 14px;
  line-height: 1.6;
  color: #1d1d1f;
}

.result-meta {
  display: flex;
  align-items: center;
  gap: 16px;
}

.token-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #8e8e93;
}

/* 错误提示样式 */
.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fff5f5;
  color: #dc2626;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid #fecaca;
  margin-bottom: 20px;
  font-size: 14px;
}

/* 模态框底部样式 */
.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #e5e5ea;
  background: #fafafa;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-secondary {
  background: #f2f2f7;
  color: #1d1d1f;
}

.btn-secondary:hover {
  background: #e5e5ea;
}

.btn-primary {
  background: #007aff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0056d3;
}

.btn-primary:disabled {
  background: #e5e5ea;
  color: #8e8e93;
  cursor: not-allowed;
}

/* 响应式设计 */
@media (max-width: 600px) {
  .image-analysis-modal {
    padding: 10px;
  }
  
  .modal-content {
    max-height: 95vh;
    width: calc(100% - 20px);
    max-width: none;
  }
  
  .modal-body {
    padding: 16px;
    max-height: 70vh;
  }
  
  .upload-area {
    padding: 30px 16px;
  }
  
  .upload-area.has-image {
    padding: 16px;
  }
  
  .preview-image {
    width: 60px;
    height: 60px;
  }
  
  .url-input-container {
    flex-direction: column;
  }
  
  .analyze-url-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
