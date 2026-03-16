<template>
  <div v-if="visible" class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>AI助手设置</h3>
        <button class="close-btn" @click="closeModal">
          <font-awesome-icon icon="times" />
        </button>
      </div>
      
      <div class="modal-body">
        <div class="setting-item">
          <label for="assistant-name">助手名称</label>
          <div class="input-group">
            <input
              id="assistant-name"
              v-model="assistantName"
              type="text"
              placeholder="请输入AI助手名称"
              maxlength="50"
              class="name-input"
            />
            <span class="char-count">{{ assistantName.length }}/50</span>
          </div>
          <small class="help-text">为你的AI助手起一个专属名字吧！</small>
        </div>
        
        <div class="setting-item">
          <label>当前心动值</label>
          <div class="heart-value-display">
            <font-awesome-icon icon="heart" class="heart-icon" />
            <span class="heart-number">{{ currentHeartValue }}</span>
            <span class="heart-text">点</span>
          </div>
          <small class="help-text">每次对话都会增加心动值，体现你们的亲密度</small>
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="btn btn-secondary" @click="closeModal">取消</button>
        <button 
          class="btn btn-primary" 
          @click="saveSettings"
          :disabled="!assistantName.trim() || isSaving"
        >
          <font-awesome-icon v-if="isSaving" icon="spinner" spin />
          {{ isSaving ? '保存中...' : '保存' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AssistantSettingsModal',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    assistant: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      assistantName: '',
      isSaving: false
    }
  },
  computed: {
    currentHeartValue() {
      return this.assistant?.heartValue || 0
    }
  },
  watch: {
    visible(newVal) {
      if (newVal && this.assistant) {
        this.assistantName = this.assistant.name || ''
      }
    },
    assistant: {
      handler(newVal) {
        if (newVal && this.visible) {
          this.assistantName = newVal.name || ''
        }
      },
      immediate: true
    }
  },
  methods: {
    closeModal() {
      this.$emit('close')
    },
    
    async saveSettings() {
      if (!this.assistantName.trim()) {
        return
      }
      
      try {
        this.isSaving = true
        await this.$emit('save', this.assistantName.trim())
        this.closeModal()
      } catch (error) {
        console.error('保存设置失败:', error)
      } finally {
        this.isSaving = false
      }
    }
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 400px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.modal-header {
  padding: 20px 24px 16px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  color: #999;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f5f5f5;
  color: #666;
}

.modal-body {
  padding: 24px;
}

.setting-item {
  margin-bottom: 24px;
}

.setting-item:last-child {
  margin-bottom: 0;
}

.setting-item label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
}

.input-group {
  position: relative;
  display: flex;
  align-items: center;
}

.name-input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #e5e5e5;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.2s;
}

.name-input:focus {
  outline: none;
  border-color: #007aff;
}

.char-count {
  position: absolute;
  right: 12px;
  font-size: 12px;
  color: #999;
  background: white;
  padding: 2px 6px;
  border-radius: 4px;
}

.help-text {
  display: block;
  font-size: 12px;
  color: #999;
  margin-top: 6px;
}

.heart-value-display {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.heart-icon {
  color: #ff6b6b;
  font-size: 20px;
}

.heart-number {
  font-size: 24px;
  font-weight: 600;
  color: #ff6b6b;
}

.heart-text {
  font-size: 14px;
  color: #666;
}

.modal-footer {
  padding: 16px 24px 24px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f8f9fa;
  color: #666;
}

.btn-secondary:hover:not(:disabled) {
  background: #e9ecef;
}

.btn-primary {
  background: #007aff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0056cc;
}

@media (max-width: 480px) {
  .modal-content {
    margin: 20px;
    max-height: calc(100vh - 40px);
  }
  
  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 16px 20px;
  }
  
  .btn {
    padding: 10px 20px;
    font-size: 14px;
  }
}
</style>
