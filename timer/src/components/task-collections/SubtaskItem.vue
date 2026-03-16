<template>
  <div class="subtask-item">
    <div 
      class="subtask-checkbox" 
      :class="{ completed: subtask.completed }"
      @click="$emit('toggle-subtask', subtask._id)"
    >
      <font-awesome-icon 
        v-if="subtask.completed" 
        icon="check" 
        class="check-icon" 
      />
    </div>
    <div class="subtask-content">
      <div class="subtask-name">{{ subtask.title }}</div>
      <div class="subtask-time">{{ formatTime(subtask.estimatedTime) || '待安排' }}</div>
    </div>
    <div 
      class="subtask-priority" 
      :class="`priority-${subtask.priority}`"
    >
      {{ priorityLabels[subtask.priority] || '中' }}
    </div>
  </div>
</template>

<script>
export default {
  name: 'SubtaskItem',
  props: {
    subtask: {
      type: Object,
      required: true
    }
  },
  emits: ['toggle-subtask'],
  data() {
    return {
      priorityLabels: {
        low: '低',
        medium: '中', 
        high: '高'
      }
    }
  },
  methods: {
    formatTime(minutes) {
      if (!minutes) return ''
      if (minutes < 60) return `${minutes} 分钟`
      const hours = Math.floor(minutes / 60)
      const remaining = minutes % 60
      return remaining === 0 ? `${hours} 小时` : `${hours} 小时 ${remaining} 分钟`
    }
  }
}
</script>

<style scoped>
.subtask-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 0;
  border-bottom: 0.5px solid #f2f2f7;
}

.subtask-item:last-child {
  border-bottom: none;
}

.subtask-checkbox {
  width: 22px;
  height: 22px;
  border-radius: 11px;
  border: 2px solid #007aff;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
}

.subtask-checkbox.completed {
  background: linear-gradient(135deg, #4a90e2, #007aff);
  border-color: transparent;
  transform: scale(1.1);
}

.subtask-checkbox:hover {
  transform: scale(1.05);
}

.subtask-content {
  flex: 1;
}

.subtask-name {
  font-size: 16px;
  font-weight: 500;
  color: #1d1d1f;
  margin-bottom: 2px;
}

.subtask-time {
  font-size: 14px;
  color: #6b7280;
}

.subtask-priority {
  padding: 6px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.priority-high {
  background: #ffebee;
  color: #c62828;
}

.priority-medium {
  background: #fff3e0;
  color: #f57c00;
}

.priority-low {
  background: #e8f5e9;
  color: #2e7d32;
}

.check-icon {
  font-size: 12px;
}
</style>
 