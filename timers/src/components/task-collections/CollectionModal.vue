<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>{{ isEdit ? '编辑任务集' : '创建任务集' }}</h2>
        <button @click="$emit('close')" class="close-btn">
          <font-awesome-icon icon="times" />
        </button>
      </div>
      
      <form @submit.prevent="handleSubmit" class="modal-form">
        <div class="form-group">
          <label>任务集名称</label>
          <input 
            v-model="formData.title"
            type="text" 
            placeholder="例如：考研英语复习"
            maxlength="20"
            required
            class="text-input"
            autofocus
          >
        </div>
        
        <div class="form-actions">
          <button type="button" class="btn-cancel" @click="$emit('close')">
            取消
          </button>
          <button type="submit" class="btn-confirm">
            {{ isEdit ? '更新' : '创建' }}
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
    isEdit: {
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
        title: ''
      }
    }
  },
  watch: {
    collection: {
      handler(newVal) {
        if (newVal) {
          this.formData = {
            title: newVal.title
          }
        } else {
          this.resetForm()
        }
      },
      immediate: true
    }
  },
  methods: {
    async handleSubmit() {
      if (this.formData.title.trim()) {
        try {
          console.log('开始提交任务集数据:', this.formData)
          let response
          
          if (this.isEdit) {
            // 编辑任务集
            console.log('更新任务集:', this.collection.id)
            response = await api.collections.updateCollection(this.collection.id, {
              name: this.formData.title
            })
            console.log('任务集更新成功:', response)
          } else {
            // 创建任务集
            console.log('创建新任务集')
            response = await api.collections.createCollection({
              name: this.formData.title
            })
            console.log('任务集创建成功:', response)
          }
          
          // 转换响应数据为前端需要的格式
          const collectionData = {
            id: response.data._id || response.data.id,
            name: response.data.name,
            expanded: response.data.expanded || false,
            subtasks: response.data.tasks || []
          }
          
          this.$emit('submit', collectionData)
          this.$emit('close')
          this.$message.success(this.isEdit ? '任务集更新成功' : '任务集创建成功')
        } catch (error) {
          console.error('任务集操作失败:', error)
          this.$message.error('操作失败: ' + (error.response?.data?.message || error.message))
        }
      }
    },
    resetForm() {
      this.formData = {
        title: ''
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
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(20px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  animation: fadeIn 0.2s ease-out;
}

.modal-content {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 13px;
  width: 100%;
  max-width: 270px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  animation: scaleIn 0.2s ease-out;
  backdrop-filter: blur(20px);
  border: 0.5px solid rgba(0, 0, 0, 0.04);
}

.modal-header {
  padding: 20px 20px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.1);
}

.modal-header h2 {
  font-size: 17px;
  font-weight: 600;
  color: #000000;
}

.close-btn {
  width: 32px;
  height: 32px;
  border-radius: 16px;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;
  color: #8e8e93;
  font-size: 16px;
}

.close-btn:active {
  background: #f2f2f7;
}

.modal-form {
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #000000;
  margin-bottom: 8px;
}

.text-input {
  width: 100%;
  padding: 12px 16px;
  background: #f2f2f7;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  transition: all 0.2s;
  color: #000000;
  box-sizing: border-box;
}

.text-input:focus {
  outline: none;
  background: #e5e5ea;
}

.text-input::placeholder {
  color: #8e8e93;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.btn-cancel,
.btn-confirm {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.btn-cancel {
  background: #f2f2f7;
  color: #007AFF;
}

.btn-cancel:active {
  background: #e5e5ea;
}

.btn-confirm {
  background: #007AFF;
  color: white;
}

.btn-confirm:active {
  opacity: 0.8;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@media (max-width: 430px) {
  .modal-overlay {
    padding: 16px;
  }
  
  .modal-content {
    max-width: 100%;
    margin: 0 16px;
  }
}
</style>