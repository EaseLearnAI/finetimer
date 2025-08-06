<template>
  <div 
    class="date-cell" 
    :class="{
      today: isToday,
      selected: isSelected,
      'other-month': isOtherMonth
    }"
    @click="$emit('select', date)"
  >
    <div class="date-number">{{ date.getDate() }}</div>
    <div 
      v-if="hasMultipleTasks" 
      class="task-indicator multiple"
    ></div>
    <div 
      v-else-if="hasTasks" 
      class="task-indicator"
    ></div>
  </div>
</template>

<script>
export default {
  name: 'CalendarCell',
  props: {
    date: {
      type: Date,
      required: true
    },
    isSelected: {
      type: Boolean,
      default: false
    },
    isOtherMonth: {
      type: Boolean,
      default: false
    },
    taskCount: {
      type: Number,
      default: 0
    }
  },
  emits: ['select'],
  computed: {
    isToday() {
      const today = new Date()
      return this.date.toDateString() === today.toDateString()
    },
    hasTasks() {
      return this.taskCount > 0
    },
    hasMultipleTasks() {
      return this.taskCount > 2
    }
  }
}
</script>

<style scoped>
.date-cell {
  padding: 12px 0;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 40px;
}

.date-cell:hover {
  background: #f2f2f7;
}

.date-number {
  font-size: 16px;
  font-weight: 600;
  color: #1d1d1f;
}

.date-cell.today {
  background: #007aff;
}

.date-cell.today .date-number {
  color: white;
}

.date-cell.selected {
  background: rgba(0, 122, 255, 0.1);
  border: 2px solid #007aff;
}

.date-cell.other-month {
  opacity: 0.3;
}

.task-indicator {
  position: absolute;
  bottom: 2px;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  height: 4px;
  border-radius: 2px;
  background: #ff3b30;
}

.task-indicator.multiple {
  width: 12px;
  background: linear-gradient(90deg, #ff3b30 0%, #ff9500 50%, #34c759 100%);
}

@media (max-width: 430px) {
  .date-cell {
    min-height: 35px;
    padding: 8px 0;
  }
  
  .date-number {
    font-size: 14px;
  }
}
</style>