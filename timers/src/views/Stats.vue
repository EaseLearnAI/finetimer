<template>
  <div class="stats-container">
    <!-- Header -->
    <div class="header">
      <h1>学习统计</h1>
      <p>追踪你的学习进度</p>
    </div>
    
    <!-- Content -->
    <div class="content">
      <!-- Stats Overview -->
      <div class="stats-overview">
        <StatCard
          v-for="stat in statsOverview"
          :key="stat.id"
          :icon="stat.icon"
          :icon-class="stat.iconClass"
          :value="stat.value"
          :label="stat.label"
        />
      </div>
      
      <!-- Weekly Progress -->
      <div class="section">
        <div class="chart-container">
          <div class="chart-title">本周学习进度</div>
          <div 
            v-for="category in weeklyProgress" 
            :key="category.id"
            class="category-stats"
          >
            <div>
              <div class="category-name">{{ category.name }}</div>
              <div class="category-progress">{{ category.completed }}/{{ category.total }} 任务</div>
            </div>
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: category.percentage + '%' }"
              ></div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Habit Tracker -->
      <div class="section">
        <div class="habit-tracker">
          <div class="chart-title">习惯打卡日历</div>
          <div class="habit-grid">
            <!-- Week headers -->
            <div 
              v-for="day in weekHeaders" 
              :key="day"
              class="habit-day empty"
            >
              {{ day }}
            </div>
            
            <!-- Calendar days -->
            <div 
              v-for="day in habitDays" 
              :key="day.id"
              class="habit-day"
              :class="day.status"
            >
              {{ day.date }}
            </div>
          </div>
        </div>
      </div>
      
      <!-- Achievements -->
      <div class="achievement-section">
        <div class="section-title">成就徽章</div>
        <div class="achievements">
          <div 
            v-for="achievement in achievements"
            :key="achievement.id"
            class="achievement"
          >
            <div class="achievement-icon" :class="achievement.iconClass">
              <font-awesome-icon :icon="achievement.icon" />
            </div>
            <div class="achievement-name">{{ achievement.name }}</div>
            <div class="achievement-desc">{{ achievement.description }}</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Tab Bar -->
    <TabBar />
  </div>
</template>

<script>
import StatCard from '../components/stats/StatCard.vue'
import TabBar from '../components/common/TabBar.vue'

export default {
  name: 'StatisticsView',
  components: {
    StatCard,
    TabBar
  },
  data() {
    return {
      statsOverview: [
        {
          id: 1,
          icon: 'check-circle',
          iconClass: 'completion',
          value: '87%',
          label: '任务完成率'
        },
        {
          id: 2,
          icon: 'fire',
          iconClass: 'streak',
          value: '15',
          label: '连续天数'
        },
        {
          id: 3,
          icon: 'clock',
          iconClass: 'time',
          value: '142h',
          label: '总学习时间'
        },
        {
          id: 4,
          icon: 'tasks',
          iconClass: 'tasks',
          value: '156',
          label: '已完成任务'
        }
      ],
      weeklyProgress: [
        {
          id: 1,
          name: '英语',
          completed: 12,
          total: 15,
          percentage: 80
        },
        {
          id: 2,
          name: '数学',
          completed: 8,
          total: 10,
          percentage: 80
        },
        {
          id: 3,
          name: '政治',
          completed: 6,
          total: 8,
          percentage: 75
        },
        {
          id: 4,
          name: '专业课',
          completed: 9,
          total: 12,
          percentage: 75
        }
      ],
      weekHeaders: ['日', '一', '二', '三', '四', '五', '六'],
      habitDays: [
        // Generate habit calendar data
        ...this.generateHabitDays()
      ],
      achievements: [
        {
          id: 1,
          icon: 'sun',
          iconClass: 'early-bird',
          name: '早起鸟',
          description: '连续7天早起学习'
        },
        {
          id: 2,
          icon: 'fire',
          iconClass: 'streak-master',
          name: '坚持达人',
          description: '连续15天完成任务'
        },
        {
          id: 3,
          icon: 'crown',
          iconClass: 'focus-king',
          name: '专注之王',
          description: '单日学习超过8小时'
        }
      ]
    }
  },
  methods: {
    generateHabitDays() {
      const days = []
      const today = new Date()
      const startDate = new Date(today.getFullYear(), today.getMonth(), 1)
      
      // Add empty cells for days before month start
      const startDayOfWeek = startDate.getDay()
      for (let i = 0; i < startDayOfWeek; i++) {
        days.push({
          id: `empty-${i}`,
          date: '',
          status: 'empty'
        })
      }
      
      // Add actual days of the month
      const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
      for (let i = 1; i <= daysInMonth; i++) {
        let status = 'empty'
        
        // Mark some days as completed or partial
        if (i <= today.getDate()) {
          if (i === 13) {
            status = 'partial'
          } else if (i <= 31) {
            status = 'completed'
          }
        }
        
        days.push({
          id: i,
          date: i,
          status: status
        })
      }
      
      return days
    }
  }
}
</script>

<style scoped>
.stats-container {
  height: 100vh;
  background: #f2f2f7;
  display: flex;
  flex-direction: column;
}

.header {
  background: 
    linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.9) 100%),
    url('@/assets/images/stats-bg.jpg') center/cover no-repeat;
  color: white;
  padding: 30px 20px;
  text-align: center;
}

.header h1 {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 8px;
}

.header p {
  font-size: 16px;
  opacity: 0.9;
}

.content {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 100px;
}

.stats-overview {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  margin: 20px;
}

.section {
  margin: 20px;
}

.chart-container {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chart-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 15px;
  color: #1d1d1f;
}

.category-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 0.5px solid #e5e5ea;
}

.category-stats:last-child {
  border-bottom: none;
}

.category-name {
  font-size: 16px;
  font-weight: 500;
  color: #1d1d1f;
}

.category-progress {
  font-size: 14px;
  color: #8e8e93;
}

.progress-bar {
  width: 120px;
  height: 8px;
  background: #f2f2f7;
  border-radius: 4px;
  overflow: hidden;
  margin-left: 16px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.habit-tracker {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.habit-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  margin-top: 15px;
}

.habit-day {
  aspect-ratio: 1;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.habit-day.empty {
  background: #f2f2f7;
  color: #8e8e93;
}

.habit-day.completed {
  background: #34c759;
  color: white;
}

.habit-day.partial {
  background: #ff9500;
  color: white;
}

.achievement-section {
  margin: 20px;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 15px;
  color: #1d1d1f;
}

.achievements {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
}

.achievement {
  background: white;
  border-radius: 16px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.achievement:hover {
  transform: translateY(-2px);
}

.achievement-icon {
  width: 60px;
  height: 60px;
  border-radius: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 10px;
  font-size: 24px;
  color: white;
}

.achievement-icon.early-bird {
  background: linear-gradient(135deg, #ff9500 0%, #ff6b35 100%);
}

.achievement-icon.streak-master {
  background: linear-gradient(135deg, #34c759 0%, #30d158 100%);
}

.achievement-icon.focus-king {
  background: linear-gradient(135deg, #007aff 0%, #5856d6 100%);
}

.achievement-name {
  font-size: 14px;
  font-weight: 600;
  color: #1d1d1f;
  margin-bottom: 5px;
}

.achievement-desc {
  font-size: 12px;
  color: #8e8e93;
}

@media (max-width: 430px) {
  .header {
    padding: 24px 16px;
  }
  
  .header h1 {
    font-size: 24px;
  }
  
  .stats-overview {
    margin: 16px;
    gap: 12px;
  }
  
  .section {
    margin: 16px;
  }
  
  .chart-container,
  .habit-tracker {
    padding: 16px;
  }
  
  .achievements {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .achievement {
    padding: 16px;
  }
  
  .achievement-icon {
    width: 50px;
    height: 50px;
    font-size: 20px;
  }
  
  .progress-bar {
    width: 80px;
  }
}
</style>