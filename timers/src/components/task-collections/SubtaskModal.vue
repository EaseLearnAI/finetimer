<template>
  <teleport to="body">
    <transition name="modal-fade">
      <div v-if="visible" class="modal-overlay" @click="handleClose">
        <transition name="modal-slide">
          <div class="modal-container" @click.stop>
            <div class="modal-header">
              <h2 class="modal-title">{{ isEditing ? '编辑子任务' : '添加子任务' }}</h2>
              <button class="close-button" @click="handleClose">
                <font-awesome-icon icon="times" />
              </button>
            </div>
            
            <form @submit.prevent="handleSubmit" class="modal-form">
              <!-- 任务名称 -->
              <div class="form-section">
                <label class="form-label">任务名称</label>
                <input 
                  v-model="formData.title"
                  type="text"
                  class="form-input"
                  placeholder="例如：考研数学复习"
                  maxlength="50"
                  required
                  ref="titleInput"
                >
              </div>

              <!-- 四象限分类 -->
              <div class="form-section">
                <label class="form-label">分类</label>
                <div class="quadrant-selector">
                  <div
                    v-for="quadrant in quadrants"
                    :key="quadrant.id"
                    class="quadrant-option"
                    :class="{ active: formData.quadrant === quadrant.id }"
                    @click="formData.quadrant = quadrant.id"
                  >
                    <div class="quadrant-color" :style="{ backgroundColor: quadrant.color }"></div>
                    <span>{{ quadrant.label }}</span>
                  </div>
                </div>
              </div>

              <!-- 时间选择 -->
              <div class="form-section">
                <label class="form-label">日期和时间 <span class="optional-label">选填</span></label>
                <div class="time-row">
                  <input 
                    v-model="formData.date"
                    type="date"
                    class="form-input date-input"
                    :min="today"
                  >
                  <input 
                    v-model="formData.time"
                    type="time"
                    class="form-input time-input"
                  >
                </div>
              </div>

              <!-- 操作按钮 -->
              <div class="form-actions">
                <button type="button" class="btn-secondary" @click="handleClose">
                  取消
                </button>
                <button type="submit" class="btn-primary" :disabled="!formData.title.trim()">
                  {{ isEditing ? '保存' : '添加子任务' }}
                </button>
              </div>
            </form>
          </div>
        </transition>
      </div>
    </transition>
  </teleport>
</template>

<script>
export default {
  name: 'SubtaskModal',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    collectionId: {
      type: String,
      required: true
    },
    subtask: {
      type: Object,
      default: null
    }
  },
  emits: ['close', 'submit'],
  data() {
    return {
      formData: {
        title: '',
        date: new Date().toISOString().split('T')[0],
        time: '',
        quadrant: 2
      },
      quadrants: [
        { id: 1, label: '重要且紧急', color: '#ff3b30' },
        { id: 2, label: '重要不紧急', color: '#007aff' },
        { id: 3, label: '紧急不重要', color: '#ff9500' },
        { id: 4, label: '不重要不紧急', color: '#34c759' }
      ]
    }
  },
  computed: {
    isEditing() {
      return this.subtask !== null;
    },
    today() {
      return new Date().toISOString().split('T')[0];
    }
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        this.resetForm();
        this.$nextTick(() => {
          this.$refs.titleInput?.focus();
        });
        // 绑定ESC键事件
        document.addEventListener('keydown', this.handleKeyDown);
      } else {
        // 移除ESC键事件监听
        document.removeEventListener('keydown', this.handleKeyDown);
      }
    },
    subtask: {
      handler(newVal) {
        if (newVal) {
          this.formData.title = newVal.title || '';
          this.formData.quadrant = newVal.quadrant || 2;
          this.formData.date = newVal.date ? this.formatDateForInput(newVal.date) : new Date().toISOString().split('T')[0];
          this.formData.time = newVal.time || '';
        } else {
          this.resetForm();
        }
      },
      immediate: true
    }
  },
  methods: {
    resetForm() {
      if (this.subtask) {
        this.formData.title = this.subtask.title || '';
        this.formData.quadrant = this.subtask.quadrant || 2;
        this.formData.date = this.subtask.date ? this.formatDateForInput(this.subtask.date) : new Date().toISOString().split('T')[0];
        this.formData.time = this.subtask.time || '';
      } else {
        this.formData = {
          title: '',
          date: new Date().toISOString().split('T')[0],
          time: '',
          quadrant: 2
        };
      }
    },
    handleSubmit() {
      if (!this.formData.title.trim()) {
        return;
      }
      
      console.log('🚀 [SubtaskModal] 提交子任务数据:', this.formData);
      
      const submitData = {
        title: this.formData.title.trim(),
        quadrant: this.formData.quadrant,
        date: this.formData.date,
        time: this.formData.time,
        collectionId: this.collectionId,
        completed: false,
        createdAt: new Date().toISOString(),
        // 根据时间判断timeBlockType
        timeBlockType: this.getTimeBlockType(this.formData.time),
        isScheduled: !!this.formData.time
      };
      
      if (this.isEditing) {
        submitData._id = this.subtask._id;
      }
      
      console.log('📤 [SubtaskModal] 最终提交数据:', submitData);
      this.$emit('submit', submitData);
    },
    getTimeBlockType(time) {
      if (!time) return 'unscheduled';
      
      const hour = parseInt(time.split(':')[0]);
      if (hour >= 7 && hour < 12) {
        return 'morning';
      } else if (hour >= 12 && hour < 18) {
        return 'afternoon';
      } else if (hour >= 18 && hour < 24) {
        return 'evening';
      }
      return 'unscheduled';
    },
    handleClose() {
      console.log('❌ [SubtaskModal] 关闭弹窗');
      this.$emit('close');
    },
    handleKeyDown(event) {
      if (event.key === 'Escape') {
        this.handleClose();
      }
    },
    formatDateForInput(date) {
      if (!date) return '';
      const d = new Date(date);
      return d.toISOString().split('T')[0];
    }
  },
  beforeUnmount() {
    // 确保移除事件监听
    document.removeEventListener('keydown', this.handleKeyDown);
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
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal-container {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  width: 90%;
  max-width: 380px;
  max-height: 85vh;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.modal-title {
  font-size: 20px;
  font-weight: 600;
  color: #1d1d1f;
  margin: 0;
}

.close-button {
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #8e8e93;
}

.close-button:hover {
  background: rgba(0, 0, 0, 0.1);
  color: #1d1d1f;
}

.modal-form {
  padding: 0 24px 24px;
  overflow-y: auto;
}

.form-section {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: #1d1d1f;
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  font-size: 16px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.8);
  transition: all 0.2s ease;
  color: #1d1d1f;
}

.form-input:focus {
  outline: none;
  border-color: #007aff;
  background: white;
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
}

.form-input::placeholder {
  color: #8e8e93;
}

/* 选填标签样式 */
.optional-label {
  font-size: 12px;
  color: #8e8e93;
  font-weight: 400;
  margin-left: 6px;
}

/* 时间选择器样式 */
.time-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.date-input,
.time-input {
  flex: 1;
}

.date-input,
.time-input {
  -webkit-appearance: none;
  appearance: none;
  position: relative;
  width: 100%;
}

.date-input::-webkit-calendar-picker-indicator,
.time-input::-webkit-calendar-picker-indicator {
  background: none;
  cursor: pointer;
  width: 100%;
  height: 100%;
  position: absolute;
  left: 0;
  top: 0;
}

/* 四象限选择器 */
.quadrant-selector {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.quadrant-option {
  padding: 12px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #1d1d1f;
}

.quadrant-option.active {
  border-color: currentColor;
  background: rgba(255, 255, 255, 1);
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
}

.quadrant-color {
  width: 12px;
  height: 12px;
  border-radius: 6px;
  flex-shrink: 0;
}

/* 操作按钮 */
.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 32px;
  padding-top: 20px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.btn-primary,
.btn-secondary {
  flex: 1;
  padding: 14px 20px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background: #007aff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0051d5;
  transform: translateY(-1px);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: rgba(0, 0, 0, 0.05);
  color: #1d1d1f;
}

.btn-secondary:hover {
  background: rgba(0, 0, 0, 0.1);
}

/* 动画 */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-slide-enter-active,
.modal-slide-leave-active {
  transition: all 0.3s ease;
}

.modal-slide-enter-from {
  opacity: 0;
  transform: scale(0.9) translateY(20px);
}

.modal-slide-leave-to {
  opacity: 0;
  transform: scale(0.9) translateY(20px);
}

/* 响应式设计 */
@media (max-width: 430px) {
  .modal-container {
    width: 95%;
    margin: 20px;
    max-height: 90vh;
  }
  
  .modal-header {
    padding: 16px 20px 12px;
  }
  
  .modal-form {
    padding: 0 20px 20px;
  }
  
  .quadrant-selector {
    grid-template-columns: 1fr;
  }
}
</style>