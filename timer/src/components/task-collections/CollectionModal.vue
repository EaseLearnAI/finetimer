<template>
  <div v-if="visible" class="modal" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">{{ isEditing ? '编辑任务集' : '创建新任务集' }}</div>
      
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="collectionName">任务集名称</label>
          <input
            id="collectionName"
            type="text"
            class="modal-input"
            v-model="formData.name"
            placeholder="请输入任务集名称"
            maxlength="50"
            required
            ref="nameInput"
          />
        </div>
        
        <div class="modal-actions">
          <button type="button" class="modal-btn cancel" @click="closeModal">
            取消
          </button>
          <button type="submit" class="modal-btn confirm" :disabled="!formData.name.trim()">
            {{ isEditing ? '保存' : '创建' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CollectionModal',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    collection: {
      type: Object,
      default: null
    }
  },
  emits: ['close', 'submit'],
  data() {
    return {
      formData: {
        name: ''
      }
    }
  },
  computed: {
    isEditing() {
      return this.collection !== null;
    }
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        this.resetForm();
        this.$nextTick(() => {
          this.$refs.nameInput?.focus();
        });
        // 绑定ESC键事件
        document.addEventListener('keydown', this.handleKeyDown);
      } else {
        // 移除ESC键事件监听
        document.removeEventListener('keydown', this.handleKeyDown);
      }
    },
    collection: {
      handler(newVal) {
        if (newVal) {
          this.formData.name = newVal.name || '';
        } else {
          this.resetForm();
        }
      },
      immediate: true
    }
  },
  methods: {
    resetForm() {
      if (this.collection) {
        this.formData.name = this.collection.name || '';
      } else {
        this.formData.name = '';
      }
    },
    handleSubmit() {
      if (!this.formData.name.trim()) {
        return;
      }
      
      const submitData = {
        name: this.formData.name.trim()
      };
      
      if (this.isEditing) {
        submitData._id = this.collection._id;
      }
      
      this.$emit('submit', submitData);
    },
    closeModal() {
      this.$emit('close');
    },
    handleKeyDown(event) {
      if (event.key === 'Escape') {
        this.closeModal();
      }
    }
  },
  beforeUnmount() {
    // 确保移除事件监听
    document.removeEventListener('keydown', this.handleKeyDown);
  }
}
</script>

<style scoped>
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.3s ease-out;
}

.modal-content {
  background: white;
  border-radius: 20px;
  padding: 32px;
  width: 90%;
  max-width: 380px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  animation: slideUp 0.3s ease-out;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  font-size: 20px;
  font-weight: 600;
  color: #1d1d1f;
  margin-bottom: 24px;
  text-align: center;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #1d1d1f;
  margin-bottom: 8px;
}

.modal-input {
  width: 100%;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  font-size: 16px;
  font-family: 'Inter', sans-serif;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.modal-textarea {
  width: 100%;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  font-size: 16px;
  font-family: 'Inter', sans-serif;
  transition: border-color 0.2s;
  box-sizing: border-box;
  resize: vertical;
  min-height: 80px;
}

.modal-input:focus,
.modal-textarea:focus {
  outline: none;
  border-color: #007aff;
}

.modal-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.modal-btn {
  flex: 1;
  padding: 12px 24px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.modal-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modal-btn.cancel {
  background: #f3f4f6;
  color: #6b7280;
}

.modal-btn.cancel:hover:not(:disabled) {
  background: #e5e7eb;
}

.modal-btn.confirm {
  background: linear-gradient(135deg, #4a90e2, #007aff);
  color: white;
}

.modal-btn.confirm:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { 
    opacity: 0;
    transform: translateY(20px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}
</style>