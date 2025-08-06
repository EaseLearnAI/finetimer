<template>
  <div class="calendar-container">
    <!-- Header -->
    <div class="header">
      <div class="header-content">
        <div class="header-title">日历中心</div>
        <div class="view-toggle">
          <button 
            class="toggle-btn" 
            :class="{ active: currentView === 'week' }"
            @click="switchView('week')"
          >
            周视图
          </button>
          <button 
            class="toggle-btn" 
            :class="{ active: currentView === 'month' }"
            @click="switchView('month')"
          >
            月视图
          </button>
        </div>
      </div>
      
      <!-- Week Navigation -->
      <div class="week-nav">
        <button class="nav-btn" @click="previousPeriod">
          <font-awesome-icon icon="chevron-left" />
        </button>
        <div class="week-range">{{ periodLabel }}</div>
        <button class="nav-btn" @click="nextPeriod">
          <font-awesome-icon icon="chevron-right" />
        </button>
      </div>
      
      <!-- Week Header -->
      <div v-if="currentView === 'week'" class="week-header">
        <div v-for="day in weekDays" :key="day" class="week-day">
          {{ day }}
        </div>
      </div>
      
      <!-- Week Dates -->
      <div v-if="currentView === 'week'" class="week-dates">
        <CalendarCell
          v-for="date in weekDates"
          :key="date.getTime()"
          :date="date"
          :is-selected="isSelectedDate(date)"
          :task-count="getTaskCount(date)"
          @select="selectDate"
        />
      </div>
    </div>
    
    <!-- Content -->
    <div v-if="currentView === 'week'" class="content">
      <div v-for="daySection in daySections" :key="daySection.date" class="day-section">
        <div class="day-header">
          <div class="day-title">{{ daySection.title }}</div>
          <div class="day-date">{{ daySection.dateText }}</div>
        </div>
        
        <div class="task-list">
          <TaskItem
            v-for="task in daySection.tasks"
            :key="task.id"
            :task="task"
            @click="openPomodoro"
            @toggle="toggleTask"
          />
        </div>
      </div>
    </div>
    
    <!-- Month View -->
    <div v-else class="month-view">
      <div class="month-header">
        <div v-for="day in weekDays" :key="day" class="week-day">
          {{ day }}
        </div>
      </div>
      <div class="month-grid">
        <CalendarCell
          v-for="date in monthDates"
          :key="date.getTime()"
          :date="date"
          :is-selected="isSelectedDate(date)"
          :is-other-month="!isCurrentMonth(date)"
          :task-count="getTaskCount(date)"
          @select="selectDate"
        />
      </div>
    </div>
    
    <!-- Add Task Button -->
    <button class="add-task-btn" @click="openAddTask">
      <font-awesome-icon icon="plus" />
    </button>
    
    <!-- Tab Bar -->
    <TabBar />
  </div>
</template>

<script>
import CalendarCell from '../components/calendar/CalendarCell.vue'
import TaskItem from '../components/common/TaskItem.vue'
import TabBar from '../components/common/TabBar.vue'

export default {
  name: 'CalendarView',
  components: {
    CalendarCell,
    TaskItem,
    TabBar
  },
  data() {
    return {
      currentView: 'week',
      selectedDate: new Date(),
      currentDate: new Date(),
      weekDays: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
      tasks: [
        {
          id: 1,
          title: '考研英语阅读训练',
          time: '09:00 - 10:30',
          date: new Date(),
          priority: 'high',
          completed: false
        },
        {
          id: 2,
          title: '高数第三章复习',
          time: '14:00 - 16:00',
          date: new Date(),
          priority: 'medium',
          completed: true
        },
        {
          id: 3,
          title: '政治选择题练习',
          time: '19:30 - 21:00',
          date: new Date(),
          priority: 'low',
          completed: false
        },
        {
          id: 4,
          title: '英语单词背诵',
          time: '08:00 - 09:00',
          date: new Date(Date.now() + 24 * 60 * 60 * 1000),
          priority: 'high',
          completed: false
        },
        {
          id: 5,
          title: '数学真题训练',
          time: '10:00 - 12:00',
          date: new Date(Date.now() + 24 * 60 * 60 * 1000),
          priority: 'medium',
          completed: false
        }
      ]
    }
  },
  computed: {
    periodLabel() {
      if (this.currentView === 'week') {
        const startOfWeek = this.getStartOfWeek(this.currentDate)
        const endOfWeek = new Date(startOfWeek.getTime() + 6 * 24 * 60 * 60 * 1000)
        return `${this.formatDate(startOfWeek)} - ${this.formatDate(endOfWeek)}`
      } else {
        return `${this.currentDate.getFullYear()}年${this.currentDate.getMonth() + 1}月`
      }
    },
    weekDates() {
      const startOfWeek = this.getStartOfWeek(this.currentDate)
      const dates = []
      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek.getTime() + i * 24 * 60 * 60 * 1000)
        dates.push(date)
      }
      return dates
    },
    monthDates() {
      const startOfMonth = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1)
  
      
      // Get start of week for first day of month
      const startDate = this.getStartOfWeek(startOfMonth)
      
      // Get end date (6 weeks worth of days)
      const dates = []
      for (let i = 0; i < 42; i++) {
        const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
        dates.push(date)
      }
      return dates
    },
    daySections() {
      const today = new Date()
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)
      
      return [
        {
          date: today.toDateString(),
          title: '今天',
          dateText: this.formatDateText(today),
          tasks: this.getTasksForDate(today)
        },
        {
          date: tomorrow.toDateString(),
          title: '明天',
          dateText: this.formatDateText(tomorrow),
          tasks: this.getTasksForDate(tomorrow)
        }
      ]
    }
  },
  methods: {
    switchView(view) {
      this.currentView = view
    },
    previousPeriod() {
      if (this.currentView === 'week') {
        this.currentDate = new Date(this.currentDate.getTime() - 7 * 24 * 60 * 60 * 1000)
      } else {
        this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1)
      }
    },
    nextPeriod() {
      if (this.currentView === 'week') {
        this.currentDate = new Date(this.currentDate.getTime() + 7 * 24 * 60 * 60 * 1000)
      } else {
        this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1)
      }
    },
    getStartOfWeek(date) {
      const d = new Date(date)
      const day = d.getDay()
      const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust for Monday start
      return new Date(d.setDate(diff))
    },
    formatDate(date) {
      return `${date.getMonth() + 1}月${date.getDate()}日`
    },
    formatDateText(date) {
      const weekDayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
      return `${date.getMonth() + 1}月${date.getDate()}日 ${weekDayNames[date.getDay()]}`
    },
    isSelectedDate(date) {
      return date.toDateString() === this.selectedDate.toDateString()
    },
    isCurrentMonth(date) {
      return date.getMonth() === this.currentDate.getMonth()
    },
    selectDate(date) {
      this.selectedDate = date
    },
    getTaskCount(date) {
      return this.tasks.filter(task => 
        task.date.toDateString() === date.toDateString()
      ).length
    },
    getTasksForDate(date) {
      return this.tasks.filter(task => 
        task.date.toDateString() === date.toDateString()
      )
    },
    toggleTask(task) {
      task.completed = !task.completed
    },
    openPomodoro(task) {
      this.$router.push(`/pomodoro?task=${encodeURIComponent(task.title)}`)
    },
    openAddTask() {
      // Navigate to AI Secretary for adding tasks
      this.$router.push('/ai-secretary')
    }
  }
}
</script>

<style scoped>
.calendar-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f2f2f7;
}

.header {
  background: #fff;
  padding: 20px 30px;
  border-bottom: 0.5px solid #e5e5ea;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 20px;
}

.header-title {
  font-size: 28px;
  font-weight: 700;
  color: #1d1d1f;
}

.view-toggle {
  display: flex;
  gap: 8px;
  background: #f2f2f7;
  border-radius: 20px;
  padding: 4px;
}

.toggle-btn {
  padding: 8px 16px;
  border: none;
  background: transparent;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  color: #8e8e93;
}

.toggle-btn.active {
  background: #007aff;
  color: white;
}

.week-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.nav-btn {
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background: #f2f2f7;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  color: #007aff;
}

.nav-btn:hover {
  background: #e5e5ea;
}

.week-range {
  font-size: 16px;
  font-weight: 600;
  color: #1d1d1f;
}

.week-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  text-align: center;
  margin-bottom: 20px;
}

.week-day {
  font-size: 12px;
  font-weight: 600;
  color: #8e8e93;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.week-dates {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  text-align: center;
}

.content {
  flex: 1;
  overflow-y: auto;
  padding: 20px 30px 100px;
}

.day-section {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f2f2f7;
}

.day-title {
  font-size: 18px;
  font-weight: 600;
  color: #1d1d1f;
}

.day-date {
  font-size: 14px;
  color: #8e8e93;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.month-view {
  flex: 1;
  padding: 20px 30px 100px;
}

.month-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  text-align: center;
  margin-bottom: 20px;
}

.month-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.add-task-btn {
  position: fixed;
  bottom: 100px;
  right: 30px;
  width: 56px;
  height: 56px;
  border-radius: 28px;
  background: #007aff;
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
  transition: all 0.2s;
  z-index: 100;
}

.add-task-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(0, 122, 255, 0.4);
}

@media (max-width: 430px) {
  .header {
    padding: 16px 20px;
  }
  
  .header-title {
    font-size: 24px;
  }
  
  .content {
    padding: 16px 20px 100px;
  }
  
  .month-view {
    padding: 16px 20px 100px;
  }
  
  .day-section {
    padding: 16px;
  }
  
  .week-nav {
    padding: 0 10px;
  }
}
</style>