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
      
      <!-- Week Dates -->
      <div v-if="currentView === 'week'" class="week-dates">
        <CalendarCell
          v-for="date in weekDates"
          :key="date.getTime()"
          :date="date"
          :is-selected="isSelectedDate(date)"
          :task-count="getTaskCount(date)"
          :show-week-day="true"
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
      <!-- Month Selected Day Content -->
      <div class="month-content">
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
import api from '../api'
import { playRandomVoice } from '@/aivoice/voicePlayer.js'

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
      tasks: [],
      loading: false,
      error: null
    }
  },
  created() {
    this.fetchTasks()
  },
  activated() {
    this.fetchTasks()
  },
  computed: {
    currentUserId() {
      const user = JSON.parse(localStorage.getItem('user') || 'null')
      return user?._id || user?.id || null
    },
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
      const d = this.selectedDate
      return [
        {
          date: d.toDateString(),
          title: '所选日期',
          dateText: this.formatDateText(d),
          tasks: this.getTasksForDate(d)
        }
      ]
    }
  },
  watch: {
    currentView() {
      this.fetchTasks()
    },
    currentDate() {
      // 切换周/月的周期时刷新
      this.fetchTasks()
    },
    selectedDate() {
      if (this.currentView === 'week') {
        // 同步周内切换日期也刷新一次，避免缓存陈旧
        this.fetchTasks()
      }
    }
  },
  methods: {
    async fetchTasks() {
      this.loading = true
      this.error = null
      try {
        const userId = this.currentUserId
        if (!userId) {
          this.error = '未登录，无法获取任务'
          this.loading = false
          return
        }
        // 优先按周期逐日拉取，保证日期精准映射
        if (this.currentView === 'week') {
          const dates = this.weekDates
          this.tasks = await this.fetchTasksForDates(userId, dates)
        } else {
          const dates = this.getMonthDays(this.currentDate)
          this.tasks = await this.fetchTasksForDates(userId, dates)
        }
      } catch (err) {
        console.error('[Calendar] 获取任务失败', err)
        this.error = '获取任务失败'
      } finally {
        this.loading = false
      }
    },
    async fetchTasksForDates(userId, dateObjs) {
      const uniqueDays = Array.from(new Set(dateObjs.map(d => this.formatYmd(d))))
      const requests = uniqueDays.map(dateStr => api.tasks.getAllTasks({ userId, date: dateStr }).then(res => ({ res, dateStr })).catch(() => ({ res: null, dateStr })))
      const results = await Promise.all(requests)
      const merged = []
      const seen = new Set()
      results.forEach(({ res, dateStr }) => {
        let list = []
        if (res && res.success && Array.isArray(res.data)) list = res.data
        else if (res && res.data && Array.isArray(res.data.data)) list = res.data.data
        else if (Array.isArray(res)) list = res
        list.map(raw => this.normalizeTask(raw)).forEach(t => {
          if (!t) return
          if (!t.date) t.date = this.parseToLocalDate(dateStr)
          const key = `${t.id}`
          if (!seen.has(key)) {
            seen.add(key)
            merged.push(t)
          } else {
            // 如果已存在但没有日期，补日期
            const idx = merged.findIndex(x => `${x.id}` === key)
            if (idx >= 0 && !merged[idx].date) merged[idx].date = this.parseToLocalDate(dateStr)
          }
        })
      })
      return merged
    },
    getMonthDays(anchor) {
      const y = anchor.getFullYear()
      const m = anchor.getMonth()
      const daysInMonth = new Date(y, m + 1, 0).getDate()
      const arr = []
      for (let i = 1; i <= daysInMonth; i++) {
        arr.push(new Date(y, m, i))
      }
      return arr
    },
    formatYmd(d) {
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${y}-${m}-${day}`
    },
    normalizeTask(raw) {
      if (!raw) return null
      const id = raw._id || raw.id
      const title = raw.title || raw.name || ''
      const completed = !!raw.completed
      const priority = raw.priority || 'medium'
      // 处理时间显示：若有 time 则展示为 "HH:MM - HH:MM+1h"，否则为空
      let timeDisplay = ''
      if (typeof raw.time === 'string' && raw.time.trim()) {
        timeDisplay = raw.time
      } else if (raw.startTime && raw.endTime) {
        // 兼容可能存在的开始/结束时间字段
        timeDisplay = `${this.formatTime(raw.startTime)} - ${this.formatTime(raw.endTime)}`
      }
      // 处理日期：优先 raw.date，其次 raw.startTime，再次 raw.createdAt，否则丢弃（避免破坏日历统计）
      let dateObj = null
      if (raw.date) {
        dateObj = this.parseToLocalDate(raw.date)
      } else if (raw.startTime) {
        dateObj = this.parseToLocalDate(raw.startTime)
      } else if (raw.createdAt) {
        dateObj = this.parseToLocalDate(raw.createdAt)
      }
      if (!id || !title) return null
      return {
        id,
        title,
        time: timeDisplay,
        date: dateObj,
        priority,
        completed
      }
    },
    parseToLocalDate(input) {
      if (!input) return null
      if (input instanceof Date) return input
      // 处理 'YYYY-MM-DD' 或 ISO 字符串
      try {
        if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
          const [y, m, d] = input.split('-').map(n => parseInt(n, 10))
          return new Date(y, m - 1, d)
        }
        const d = new Date(input)
        return isNaN(d.getTime()) ? null : d
      } catch (e) {
        return null
      }
    },
    formatTime(input) {
      const d = new Date(input)
      if (isNaN(d.getTime())) return ''
      const hh = String(d.getHours()).padStart(2, '0')
      const mm = String(d.getMinutes()).padStart(2, '0')
      return `${hh}:${mm}`
    },
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
      if (this.currentView === 'week') {
        this.currentDate = date
      }
    },
    getTaskCount(date) {
      return this.tasks.filter(task => task && task.date && task.date.toDateString() === date.toDateString()).length
    },
    getTasksForDate(date) {
      return this.tasks.filter(task => task && task.date && task.date.toDateString() === date.toDateString())
    },
    async toggleTask(task) {
      const prev = task.completed
      task.completed = !task.completed
      try {
        await api.tasks.toggleTaskStatus(task.id)
        // 成功后触发语音（完成播放鼓励，取消可选播放批评）
        if (task.completed) {
          playRandomVoice('encourage')
        } else {
          // 如需取消时播放批评，取消注释下一行
          // playRandomVoice('criticize')
        }
      } catch (e) {
        task.completed = prev
      }
    },
    openPomodoro(task) {
      const query = { task: task.title, from: '/calendar' }
      if (task.id) query.taskId = task.id
      this.$router.push({ path: '/pomodoro', query })
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
  overflow-y: auto;
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

.month-content {
  margin-top: 20px;
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
    overflow-y: auto;
  }
  
  .day-section {
    padding: 16px;
  }
  
  .week-nav {
    padding: 0 10px;
  }
}
</style>