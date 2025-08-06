<template>
  <div class="task-time-blocks-container">
    <div class="time-blocks">
      <div 
        v-for="timeBlock in timeBlocks" 
        :key="timeBlock.id"
        class="time-block-item"
        :class="{ collapsed: timeBlock.collapsed }"
      >
        <div class="time-block-header" @click="toggleCollapse(timeBlock.id)">
          <div class="time-label">
            {{ timeBlock.label }}
            <font-awesome-icon 
              :icon="timeBlock.collapsed ? 'chevron-down' : 'chevron-up'" 
              class="collapse-icon"
            />
          </div>
          <div class="time-count">{{ timeBlock.tasks.length }}</div>
        </div>
        
        <div class="time-block-content" v-show="!timeBlock.collapsed">
          <TaskItem
            v-for="task in timeBlock.tasks"
            :key="task.id"
            :task="task"
            @click="$emit('task-click', task)"
            @toggle="$emit('task-toggle', task)"
          />
          
          <div v-if="timeBlock.tasks.length === 0" class="empty-state">
            <font-awesome-icon icon="clock" />
            <span>暂无安排</span>
          </div>
        </div>
      </div>
      
      <!-- 未指定时间的任务框 -->
      <div v-if="unscheduledTasks && unscheduledTasks.length > 0" class="unscheduled-tasks">
        <div class="unscheduled-header">
          <div class="unscheduled-label">
            未安排时间
            <font-awesome-icon icon="inbox" class="inbox-icon" />
          </div>
          <div class="unscheduled-count">{{ unscheduledTasks.length }}</div>
        </div>
        
        <div class="unscheduled-content">
          <TaskItem
            v-for="task in unscheduledTasks"
            :key="task.id"
            :task="task"
            @click="$emit('task-click', task)"
            @toggle="$emit('task-toggle', task)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import TaskItem from '../common/TaskItem.vue'

export default {
  name: 'TaskTimeBlocks',
  components: {
    TaskItem
  },
  props: {
    timeBlocks: {
      type: Array,
      required: true
    },
    unscheduledTasks: {
      type: Array,
      default: () => []
    }
  },
  emits: ['task-click', 'task-toggle', 'toggle-collapse'],
  methods: {
    toggleCollapse(timeBlockId) {
      this.$emit('toggle-collapse', timeBlockId)
    }
  }
}
</script>

<style scoped>
.task-time-blocks-container {
  height: 100%;
  width: 100%;
  overflow: hidden;
}

.time-blocks {
  height: 100%;
  overflow-y: auto;
  padding: 16px;
}

.time-block-item {
  background: white;
  border-radius: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: all 0.3s ease;
}

.time-block-item.collapsed {
  margin-bottom: 8px;
}

.time-block-item.collapsed .time-block-content {
  padding: 0;
}

.time-block-header {
  padding: 16px 20px;
  border-bottom: 1px solid #f2f2f7;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;
}

.time-label {
  font-size: 16px;
  font-weight: 600;
  color: #667eea;
  display: flex;
  align-items: center;
  gap: 8px;
}

.collapse-icon {
  font-size: 12px;
  transition: transform 0.3s ease;
}

.time-count {
  font-size: 14px;
  color: #8e8e93;
  background: #f2f2f7;
  padding: 4px 12px;
  border-radius: 12px;
}

.time-block-content {
  padding: 12px 20px 20px;
  transition: all 0.3s ease;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #8e8e93;
  font-size: 14px;
}

.empty-state svg {
  font-size: 32px;
  margin-bottom: 8px;
  opacity: 0.5;
}

/* 未指定时间的任务框样式 */
.unscheduled-tasks {
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-top: 16px;
  margin-bottom: 16px;
}

.unscheduled-header {
  padding: 12px 16px;
  border-bottom: 1px solid #f2f2f7;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.unscheduled-label {
  font-size: 14px;
  font-weight: 600;
  color: #8e8e93;
  display: flex;
  align-items: center;
  gap: 6px;
}

.inbox-icon {
  font-size: 14px;
}

.unscheduled-count {
  font-size: 12px;
  color: #8e8e93;
  background: #f2f2f7;
  padding: 2px 8px;
  border-radius: 8px;
}

.unscheduled-content {
  padding: 8px 16px;
}

.unscheduled-content .task-item {
  margin-bottom: 8px;
}

.unscheduled-content .task-item:last-child {
  margin-bottom: 0;
}

/* 隐藏滚动条 */
.time-blocks::-webkit-scrollbar,
.unscheduled-tasks::-webkit-scrollbar {
  display: none;
}

.time-blocks,
.unscheduled-tasks {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .time-blocks {
    padding: 12px;
  }
  
  .time-block-item {
    margin-bottom: 12px;
  }
  
  .time-block-header {
    padding: 14px 16px;
  }
  
  .time-label {
    font-size: 15px;
  }
  
  .time-block-content {
    padding: 10px 16px 16px;
  }
  
  .unscheduled-tasks {
    margin-top: 12px;
    margin-bottom: 70px; /* 为底部导航栏留出空间 */
  }
}
</style>