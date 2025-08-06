<template>
  <div 
    class="task-item" 
    :class="{ completed: task.completed }"
    @click="$emit('click', task)"
  >
    <div 
      class="task-checkbox" 
      :class="{ checked: task.completed }"
      @click.stop="toggleTask"
    >
      <font-awesome-icon v-if="task.completed" icon="check" />
    </div>
    
    <div class="task-content">
      <div class="task-title">{{ task.title }}</div>
      <div v-if="task.time" class="task-time">{{ task.time }}</div>
      <div v-if="task.description" class="task-description">{{ task.description }}</div>
    </div>
    
    <div v-if="task.priority" class="task-priority" :class="`priority-${task.priority}`">
      {{ getPriorityText(task.priority) }}
    </div>
    
    <div v-if="showActions" class="task-actions">
      <button @click.stop="$emit('edit', task)" class="action-btn">
        <font-awesome-icon icon="edit" />
      </button>
      <button @click.stop="$emit('delete', task)" class="action-btn delete">
        <font-awesome-icon icon="trash" />
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TaskItem',
  props: {
    task: {
      type: Object,
      required: true
    },
    showActions: {
      type: Boolean,
      default: false
    }
  },
  emits: ['click', 'toggle', 'edit', 'delete'],
  methods: {
    toggleTask() {
      this.$emit('toggle', this.task)
    },
    getPriorityText(priority) {
      const priorityMap = {
        high: '高',
        medium: '中', 
        low: '低'
      }
      return priorityMap[priority] || ''
    }
  }
}
</script>

<style scoped>
.task-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 12px;
}

.task-item:hover {
  background: #f2f2f7;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.task-item.completed {
  opacity: 0.6;
}

.task-item.completed .task-title {
  text-decoration: line-through;
}

.task-checkbox {
  width: 20px;
  height: 20px;
  border-radius: 10px;
  border: 2px solid #007aff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.task-checkbox.checked {
  background: #007aff;
}

.task-content {
  flex: 1;
  text-align: left;
}

.task-title {
  font-size: 16px;
  font-weight: 500;
  color: #1d1d1f;
  margin-bottom: 4px;
}

.task-time {
  font-size: 14px;
  color: #8e8e93;
  margin-bottom: 4px;
}

.task-description {
  font-size: 14px;
  color: #8e8e93;
}

.task-priority {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.priority-high {
  background: #ff3b30;
  color: white;
}

.priority-medium {
  background: #ff9500;
  color: white;
}

.priority-low {
  background: #34c759;
  color: white;
}

.task-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.action-btn {
  width: 32px;
  height: 32px;
  border-radius: 16px;
  border: none;
  background: #f2f2f7;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  color: #007aff;
}

.action-btn:hover {
  background: #e5e5ea;
}

.action-btn.delete {
  color: #ff3b30;
}

@media (max-width: 430px) {
  .task-item {
    padding: 12px;
    gap: 10px;
  }
  
  .task-title {
    font-size: 15px;
  }
  
  .task-time {
    font-size: 13px;
  }
}
</style>