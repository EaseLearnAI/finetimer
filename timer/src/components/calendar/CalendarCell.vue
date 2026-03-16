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
    <div v-if="showWeekDay" class="week-day-name">{{ weekDayName }}</div>
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
    },
    showWeekDay: {
      type: Boolean,
      default: false
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
    },
    weekDayName() {
      const names = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
      return names[this.date.getDay()]
    }
  }
}
</script>

<style scoped>
.date-cell {
  width: 100%;
  height: auto;
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s, box-shadow 0.2s;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
}

.week-day-name {
  font-size: 12px;
  color: #8e8e93;
  line-height: 16px;
  margin-bottom: 4px;
}

/* 圆形日期 */
.date-number {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 15px;
  font-weight: 500;
  color: #333;
}

.date-cell:not(.selected):hover .date-number {
  background: #e6f0ff;
}

/* 选中：蓝底白字 */
.date-cell.selected .date-number {
  background: #007aff;
  color: #fff;
}

/* 今天：未选中时显示内描边 */
.date-cell.today:not(.selected) .date-number {
  box-shadow: inset 0 0 0 2px #007aff;
  background: transparent;
}

/* 其他月份日期在月视图中弱化 */
.date-cell.other-month .date-number {
  color: #bbb;
}

/* 任务小圆点 */
.task-indicator {
  position: absolute;
  bottom: 3px;
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
  .date-number {
    width: 36px;
    height: 36px;
    font-size: 14px;
  }
}
</style>