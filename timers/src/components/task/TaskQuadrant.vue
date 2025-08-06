<template>
  <div class="task-quadrant-container">
    <div class="quadrant-grid">
      <div 
        v-for="quadrant in quadrants" 
        :key="quadrant.id"
        class="quadrant-item"
        :class="`quadrant-${quadrant.id}`"
      >
        <div class="quadrant-header">
          <div class="quadrant-title">{{ quadrant.title }}</div>
          <div class="quadrant-count">{{ quadrant.tasks.length }}</div>
        </div>
        
        <div class="quadrant-content">
          <TaskItem
            v-for="task in quadrant.tasks"
            :key="task.id"
            :task="task"
            @click="$emit('task-click', task)"
            @toggle="$emit('task-toggle', task)"
          />
          
          <div v-if="quadrant.tasks.length === 0" class="empty-state">
            <font-awesome-icon icon="inbox" />
            <span>暂无任务</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import TaskItem from '../common/TaskItem.vue'

export default {
  name: 'TaskQuadrant',
  components: {
    TaskItem
  },
  props: {
    quadrants: {
      type: Array,
      required: true
    }
  },
  emits: ['task-click', 'task-toggle']
}
</script>

<style scoped>
.task-quadrant-container {
  height: 100%;
  width: 100%;
  overflow: hidden;
}

.quadrant-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 1px;
  height: 100%;
  background: #e5e5ea;
}

.quadrant-item {
  background: white;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.quadrant-header {
  padding: 12px 16px;
  border-bottom: 1px solid #f2f2f7;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.quadrant-title {
  font-size: 14px;
  font-weight: 600;
}

.quadrant-count {
  font-size: 12px;
  color: #8e8e93;
  background: #f2f2f7;
  padding: 2px 8px;
  border-radius: 10px;
}

.quadrant-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100px;
  color: #8e8e93;
  font-size: 14px;
}

.empty-state svg {
  font-size: 24px;
  margin-bottom: 8px;
  opacity: 0.5;
}

/* 四象限颜色主题 */
.quadrant-1 .quadrant-title { color: #ff3b30; }
.quadrant-2 .quadrant-title { color: #007aff; }
.quadrant-3 .quadrant-title { color: #ff9500; }
.quadrant-4 .quadrant-title { color: #34c759; }

/* 隐藏滚动条 */
.quadrant-content::-webkit-scrollbar {
  display: none;
}

.quadrant-content {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .quadrant-grid {
    gap: 0.5px;
  }
  
  .quadrant-header {
    padding: 10px 12px;
  }
  
  .quadrant-title {
    font-size: 13px;
  }
  
  .quadrant-content {
    padding: 6px;
  }
}
</style>