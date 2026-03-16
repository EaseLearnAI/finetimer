<template>
  <div class="collection-card">
    <div class="collection-header" @click="toggleExpansion">
      <div class="collection-info">
        <div class="collection-name">{{ collection.name }}</div>
        <div class="collection-meta">
          <span>{{ collection.subtasks?.length || 0 }}个子任务</span>
          <div class="collection-progress">
            <span>{{ progressPercentage }}%</span>
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: progressPercentage + '%' }"
              ></div>
            </div>
          </div>
        </div>
      </div>
      <div class="collection-actions">
        <button 
          class="add-subtask-btn" 
          @click.stop="$emit('add-subtask', collection._id)"
          title="添加子任务"
        >
          <font-awesome-icon icon="plus" />
        </button>
        <button 
          class="expand-btn"
          :class="{ expanded: isExpanded }"
        >
          <font-awesome-icon icon="chevron-down" />
        </button>
      </div>
    </div>
    
    <div 
      class="subtasks" 
      :class="{ expanded: isExpanded }"
      :style="{ maxHeight: isExpanded ? (collection.subtasks?.length * 70 + 20) + 'px' : '0px' }"
    >
      <template v-if="collection.subtasks && collection.subtasks.length > 0">
        <SubtaskItem
          v-for="subtask in collection.subtasks"
          :key="subtask._id"
          :subtask="subtask"
          @toggle-subtask="$emit('toggle-subtask', $event)"
        />
      </template>
      <div v-else class="empty-state">
        <div class="empty-icon">📋</div>
        <div class="empty-title">暂无子任务</div>
        <div class="empty-subtitle">点击上方 + 按钮添加第一个子任务</div>
      </div>
    </div>
  </div>
</template>

<script>
import SubtaskItem from './SubtaskItem.vue'

export default {
  name: 'CollectionCard',
  components: {
    SubtaskItem
  },
  props: {
    collection: {
      type: Object,
      required: true
    }
  },
  emits: ['toggle-expansion', 'add-subtask', 'toggle-subtask'],
  data() {
    return {
      isExpanded: false
    }
  },
  computed: {
    progressPercentage() {
      if (!this.collection.subtasks || this.collection.subtasks.length === 0) {
        return 0;
      }
      const completed = this.collection.subtasks.filter(subtask => subtask.completed).length;
      return Math.round((completed / this.collection.subtasks.length) * 100);
    }
  },
  methods: {
    toggleExpansion() {
      this.isExpanded = !this.isExpanded;
      this.$emit('toggle-expansion', this.collection._id, this.isExpanded);
    }
  }
}
</script>

<style scoped>
.collection-card {
  background: white;
  border-radius: 20px;
  padding: 20px 24px;
  margin-bottom: 16px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.04), 0 10px 24px rgba(60, 90, 130, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.collection-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0,0,0,0.06), 0 20px 40px rgba(60, 90, 130, 0.12);
}

.collection-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  cursor: pointer;
  position: relative;
}

.collection-info {
  flex: 1;
}

.collection-name {
  font-size: 20px;
  font-weight: 600;
  color: #1d1d1f;
  margin-bottom: 6px;
}

.collection-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: #6b7280;
}

.collection-progress {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-bar {
  width: 60px;
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4a90e2, #007aff);
  border-radius: 2px;
  transition: width 0.4s ease-in-out;
}

.collection-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.add-subtask-btn {
  width: 32px;
  height: 32px;
  border-radius: 16px;
  background: linear-gradient(135deg, #4a90e2, #007aff);
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 14px;
  box-shadow: 0 2px 8px rgba(74, 144, 226, 0.3);
}

.add-subtask-btn:hover {
  transform: translateY(-1px) scale(1.1);
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.4);
}

.expand-btn {
  width: 32px;
  height: 32px;
  border-radius: 16px;
  background: transparent;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  color: #007aff;
}

.expand-btn:hover {
  background: #f8f9fe;
  transform: scale(1.1);
}

.expand-btn.expanded {
  transform: rotate(180deg);
}

.subtasks {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.4s ease-in-out;
}

.subtasks.expanded {
  max-height: 500px;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #8e8e93;
}

.empty-icon {
  font-size: 32px;
  margin-bottom: 12px;
  color: #d1d1d6;
}

.empty-title {
  font-size: 16px;
  font-weight: 600;
  color: #1d1d1f;
  margin-bottom: 6px;
}

.empty-subtitle {
  font-size: 14px;
  color: #8e8e93;
}
</style>