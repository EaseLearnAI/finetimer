<template>
  <div class="voice-recognition-status" v-if="showStatus">
    <div class="status-container" :class="statusType">
      <div class="status-icon">
        <font-awesome-icon 
          :icon="statusIcon" 
          :class="{ 'spin': isProcessing, 'pulse': isSuccess }"
        />
      </div>
      <div class="status-content">
        <div class="status-title">{{ statusTitle }}</div>
        <div class="status-message">{{ statusMessage }}</div>
        <div v-if="showProgress" class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>
      </div>
      <button v-if="showClose" class="status-close" @click="closeStatus">
        <font-awesome-icon icon="times" />
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'VoiceRecognitionStatus',
  props: {
    // 是否显示状态
    show: {
      type: Boolean,
      default: false
    },
    // 状态类型: processing, success, error
    type: {
      type: String,
      default: 'processing'
    },
    // 状态标题
    title: {
      type: String,
      default: ''
    },
    // 状态消息
    message: {
      type: String,
      default: ''
    },
    // 进度百分比 (0-100)
    progress: {
      type: Number,
      default: 0
    },
    // 是否显示关闭按钮
    closable: {
      type: Boolean,
      default: true
    },
    // 自动关闭延迟 (毫秒)
    autoClose: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      isVisible: false,
      autoCloseTimer: null
    }
  },
  computed: {
    showStatus() {
      return this.show && this.isVisible
    },
    statusType() {
      return `status-${this.type}`
    },
    statusIcon() {
      const iconMap = {
        processing: 'spinner',
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle'
      }
      return iconMap[this.type] || 'info-circle'
    },
    statusTitle() {
      if (this.title) return this.title
      
      const titleMap = {
        processing: '正在处理',
        success: '处理完成',
        error: '处理失败',
        warning: '注意事项'
      }
      return titleMap[this.type] || '状态信息'
    },
    statusMessage() {
      return this.message
    },
    showProgress() {
      return this.type === 'processing' && this.progress > 0
    },
    progressPercent() {
      return Math.min(Math.max(this.progress, 0), 100)
    },
    showClose() {
      return this.closable && this.type !== 'processing'
    },
    isProcessing() {
      return this.type === 'processing'
    },
    isSuccess() {
      return this.type === 'success'
    }
  },
  watch: {
    show(newVal) {
      if (newVal) {
        this.showStatusBar()
      } else {
        this.hideStatusBar()
      }
    },
    type(newType) {
      if (newType === 'success' || newType === 'error') {
        this.setupAutoClose()
      }
    }
  },
  methods: {
    showStatusBar() {
      this.isVisible = true
      this.$emit('show')
    },
    hideStatusBar() {
      this.isVisible = false
      this.$emit('hide')
    },
    closeStatus() {
      this.hideStatusBar()
      this.$emit('close')
    },
    setupAutoClose() {
      if (this.autoClose > 0) {
        this.clearAutoCloseTimer()
        this.autoCloseTimer = setTimeout(() => {
          this.closeStatus()
        }, this.autoClose)
      }
    },
    clearAutoCloseTimer() {
      if (this.autoCloseTimer) {
        clearTimeout(this.autoCloseTimer)
        this.autoCloseTimer = null
      }
    }
  },
  mounted() {
    if (this.show) {
      this.showStatusBar()
    }
  },
  beforeUnmount() {
    this.clearAutoCloseTimer()
  }
}
</script>

<style scoped>
.voice-recognition-status {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  max-width: 90vw;
  width: 400px;
}

.status-container {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  animation: slideDown 0.3s ease-out;
  transition: all 0.3s ease;
}

.status-container:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.status-icon {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.status-content {
  flex: 1;
  min-width: 0;
}

.status-title {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 4px;
  color: inherit;
}

.status-message {
  font-size: 13px;
  color: inherit;
  opacity: 0.8;
  line-height: 1.4;
}

.progress-bar {
  margin-top: 8px;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: currentColor;
  border-radius: 2px;
  transition: width 0.3s ease;
}

.status-close {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border: none;
  background: none;
  color: inherit;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s ease;
  opacity: 0.7;
}

.status-close:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.1);
}

/* 状态类型样式 */
.status-processing {
  background: rgba(0, 122, 255, 0.95);
  color: white;
  border-color: rgba(0, 122, 255, 0.3);
}

.status-success {
  background: rgba(52, 199, 89, 0.95);
  color: white;
  border-color: rgba(52, 199, 89, 0.3);
}

.status-error {
  background: rgba(255, 59, 48, 0.95);
  color: white;
  border-color: rgba(255, 59, 48, 0.3);
}

.status-warning {
  background: rgba(255, 149, 0, 0.95);
  color: white;
  border-color: rgba(255, 149, 0, 0.3);
}

/* 图标动画 */
.status-icon .spin {
  animation: spin 1s linear infinite;
}

.status-icon .pulse {
  animation: pulse 2s ease-in-out infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

/* 响应式设计 */
@media (max-width: 480px) {
  .voice-recognition-status {
    top: 16px;
    left: 16px;
    right: 16px;
    transform: none;
    width: auto;
    max-width: none;
  }
  
  .status-container {
    padding: 14px 16px;
    gap: 10px;
  }
  
  .status-icon {
    width: 20px;
    height: 20px;
    font-size: 18px;
  }
  
  .status-title {
    font-size: 13px;
  }
  
  .status-message {
    font-size: 12px;
  }
  
  .status-close {
    width: 20px;
    height: 20px;
  }
}
</style>
