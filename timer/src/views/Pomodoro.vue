<template>
  <div class="app-container">
    <!-- Header with Back Button -->
      <div class="header">
        <div class="header-top">
          <div class="back-btn" @click="goBack" title="返回任务列表">
            <font-awesome-icon icon="arrow-left" />
          </div>
          <h1>番茄工作法</h1>
          <div class="header-spacer"></div>
        </div>
        <div class="task-name">{{ taskName }}</div>
      </div>

    <!-- Timer Container -->
    <div class="timer-container">
      <TimerCircle
        :time-left="timeLeft"
        :total-time="modes[currentMode]"
        :label="modeLabels[currentMode]"
      />

      <!-- Timer Controls -->
      <div class="timer-controls">
        <div 
          v-if="!isRunning" 
          class="control-btn start-btn" 
          @click="startTimer"
        >
          <font-awesome-icon icon="play" />
        </div>
        <div 
          v-else 
          class="control-btn pause-btn playing" 
          @click="pauseTimer"
        >
          <font-awesome-icon icon="pause" />
        </div>
        <div class="control-btn stop-btn" @click="showStopModal">
          <font-awesome-icon icon="stop" />
        </div>
      </div>

      <!-- Session Info -->
      <div class="session-info">
        <div class="session-count">今日已完成: {{ completedPomodoros }}个番茄</div>
        <div class="session-message">{{ sessionMessage }}</div>
      </div>
    </div>

    <!-- Motivational Quote -->
    <div class="motivational-quote">
      {{ currentQuote }}
    </div>

    <!-- Stop Modal -->
    <div v-if="showModal" class="modal-overlay" @click="hideStopModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>结束当前计时</h3>
        </div>
        <div class="modal-body">
          <p>您想要如何处理当前的计时？</p>
          <div class="modal-time-info">
            <span>已用时间: {{ formatTime(modes[currentMode] - timeLeft) }}</span>
          </div>
        </div>
        <div class="modal-actions">
          <button class="modal-btn abandon-btn" @click="abandonTimer">
            <font-awesome-icon icon="times" />
            放弃计时
          </button>
          <button class="modal-btn complete-btn" @click="completeTimer">
            <font-awesome-icon icon="check" />
            提前完成
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import TimerCircle from '../components/pomodoro/TimerCircle.vue'
import pomodoroApi from '../api/pomodoros.js'
import api from '@/api'
import { playRandomVoice } from '@/aivoice/voicePlayer.js'

export default {
  name: 'PomodoroTimer',
  components: {
    TimerCircle
  },
  data() {
    return {
      timer: null,
      timeLeft: 25 * 60, // 25 minutes in seconds
      isRunning: false,
      currentMode: 'pomodoro',
      completedPomodoros: 0,
      taskName: '英语晨读计划',
      sessionMessage: '专注时间，保持高效！',
      showModal: false,
      sessionStartTime: null,
      currentSessionId: null,
      fromRoute: '/task', // 记录来源路由
      modes: {
        pomodoro: 25 * 60,
        shortBreak: 5 * 60,
        longBreak: 15 * 60
      },
      modeLabels: {
        pomodoro: '专注时间',
        shortBreak: '短休息',
        longBreak: '长休息'
      },
      quotes: [
        "成功的秘诀在于坚持目标的志向不懈。",
        "每一个番茄时间都是向梦想迈进的一步。",
        "专注当下，成就未来。",
        "今天的努力，是明天的实力。",
        "坚持就是胜利，专注就是力量。",
        "小步快跑，持续进步。"
      ],
      currentQuote: ''
    }
  },
  mounted() {
    // Get task name from route query
    const taskFromQuery = this.$route.query.task
    if (taskFromQuery) {
      this.taskName = typeof taskFromQuery === 'string' ? taskFromQuery : String(taskFromQuery)
    }
    
    // 记录来源路由（默认回到任务页）
    this.fromRoute = (this.$route.query.from && typeof this.$route.query.from === 'string') ? this.$route.query.from : '/task'
    
    // Set initial quote
    this.currentQuote = this.getRandomQuote()
    
    // Set initial time
    this.timeLeft = this.modes[this.currentMode]
    
    // 加载今日完成的番茄钟数量
    this.loadTodayPomodoros()
  },
  beforeUnmount() {
    if (this.timer) {
      clearInterval(this.timer)
    }
  },
  methods: {
    startTimer() {
      if (!this.isRunning) {
        this.isRunning = true
        this.sessionStartTime = new Date()
        
        this.timer = setInterval(() => {
          this.timeLeft--
          
          if (this.timeLeft <= 0) {
            this.onTimerComplete()
          }
        }, 1000)
      }
    },
    pauseTimer() {
      if (this.isRunning) {
        clearInterval(this.timer)
        this.isRunning = false
      }
    },
    showStopModal() {
      this.showModal = true
    },
    hideStopModal() {
      this.showModal = false
    },
    async abandonTimer() {
      // 记录放弃的番茄钟
      await this.savePomodoroRecord(false)
      // 播放批评语音
      playRandomVoice('criticize')
      this.resetTimer()
      this.hideStopModal()
      this.goBack()
    },
    async completeTimer() {
      // 记录提前完成的番茄钟
      await this.savePomodoroRecord(true)
      // 播放鼓励语音
      playRandomVoice('encourage')
      // 若带有taskId，回写任务完成状态
      try {
        const taskId = this.$route.query.taskId
        if (taskId) {
          console.log('🔄 [Pomodoro] 更新任务完成状态:', taskId)
          const resp = await api.tasks.updateTask(taskId, { completed: true })
          console.log('✅ [Pomodoro] 任务状态更新响应:', resp)
        } else {
          console.warn('⚠️ [Pomodoro] 未提供taskId，无法回写任务完成状态')
        }
      } catch (e) {
        console.error('❌ [Pomodoro] 更新任务完成状态失败:', e)
      }
      if (this.currentMode === 'pomodoro') {
        this.completedPomodoros++
      }
      this.resetTimer()
      this.hideStopModal()
      this.goBack()
    },
    resetTimer() {
      clearInterval(this.timer)
      this.isRunning = false
      this.timeLeft = this.modes[this.currentMode]
      this.sessionStartTime = null
    },
    setMode(mode) {
      this.currentMode = mode
      this.timeLeft = this.modes[mode]
      this.resetTimer()
    },
    async onTimerComplete() {
      clearInterval(this.timer)
      this.isRunning = false
      
      // Play notification sound
      this.playNotificationSound()
      
      // 保存完成的番茄钟记录
      await this.savePomodoroRecord(true)
      // 播放鼓励语音
      playRandomVoice('encourage')
      
      if (this.currentMode === 'pomodoro') {
        this.completedPomodoros++
        
        // Auto switch to break mode
        const nextMode = this.completedPomodoros % 4 === 0 ? 'longBreak' : 'shortBreak'
        this.sessionMessage = nextMode === 'longBreak' ? '长时间休息，好好放松！' : '短暂休息，准备下一轮！'
        
        setTimeout(() => {
          this.setMode(nextMode)
          // Auto start break timer
          setTimeout(() => {
            this.startTimer()
          }, 1000)
        }, 2000)
      } else {
        // Break finished, back to pomodoro
        this.sessionMessage = '继续加油！保持专注'
        setTimeout(() => {
          this.setMode('pomodoro')
          // Auto start pomodoro timer
          setTimeout(() => {
            this.startTimer()
          }, 1000)
        }, 2000)
      }
      
      // Update motivational quote
      this.currentQuote = this.getRandomQuote()
    },
    playNotificationSound() {
      // Create a simple beep sound
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = 800
      oscillator.type = 'sine'
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.5)
    },
    getRandomQuote() {
      return this.quotes[Math.floor(Math.random() * this.quotes.length)]
    },
    goBack() {
      const target = this.fromRoute || '/task'
      this.$router.replace(target)
    },
    formatTime(seconds) {
      const minutes = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    },
    async savePomodoroRecord(completed) {
      if (!this.sessionStartTime) return
      
      const endTime = new Date()
      const actualDuration = Math.floor((endTime - this.sessionStartTime) / 1000)
      const plannedDuration = this.modes[this.currentMode]
      
      // 确定完成状态
      let completionStatus = 'normal'
      if (!completed) {
        completionStatus = 'abandoned'
      } else if (actualDuration < plannedDuration) {
        completionStatus = 'early'
      }
      
      // 计算本地日期与时间段
      const y = endTime.getFullYear()
      const m = String(endTime.getMonth() + 1).padStart(2, '0')
      const d = String(endTime.getDate()).padStart(2, '0')
      const localDate = `${y}-${m}-${d}`
      const hour = endTime.getHours()
      let timeBlockType = 'evening'
      if (hour >= 7 && hour < 12) timeBlockType = 'morning'
      else if (hour >= 12 && hour < 18) timeBlockType = 'afternoon'

      const user = JSON.parse(localStorage.getItem('user') || 'null')
      const userId = user?._id || user?.id || null
      if (!userId) {
        console.warn('⚠️ [Pomodoro] 未登录，跳转到登录页')
        this.$router.replace({ path: '/auth/login', query: { redirect: this.$route.fullPath } })
        return
      }

      const pomodoroData = {
        taskName: this.taskName,
        mode: this.currentMode,
        startTime: this.sessionStartTime.toISOString(),
        endTime: endTime.toISOString(),
        duration: plannedDuration, // 计划持续时间
        actualFocusTime: actualDuration, // 实际专注时间
        completed: completed,
        completionStatus: completionStatus,
        userId,
        sourceRoute: this.fromRoute,
        date: localDate,
        timeBlockType,
        taskId: this.$route.query.taskId || null
      }
      
      try {
        const response = await pomodoroApi.createPomodoro(pomodoroData)
        console.log('番茄钟记录保存成功:', response.data)
        
        // 显示保存成功的提示
        this.sessionMessage = completed ? 
          (completionStatus === 'early' ? '提前完成，记录已保存！' : '任务完成，记录已保存！') : 
          '已放弃，记录已保存！'
      } catch (error) {
        console.error('保存番茄钟记录失败:', error)
        this.sessionMessage = '记录保存失败，请检查网络连接'
      }
    },
    async loadTodayPomodoros() {
      try {
        const user = JSON.parse(localStorage.getItem('user') || 'null')
        const userId = user?._id || user?.id || null
        if (!userId) {
          console.warn('⚠️ [Pomodoro] 未登录，跳转到登录页')
          this.$router.replace({ path: '/auth/login', query: { redirect: this.$route.fullPath } })
          return
        }

        const today = new Date()
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
        const response = await pomodoroApi.getAllPomodoros({
          userId,
          startDate: startOfDay.toISOString(),
          endDate: endOfDay.toISOString()
        })
        const list = response.data?.data || response.data || []
        const todayPomodoros = list.filter(p => p.mode === 'pomodoro' && p.completed)
        this.completedPomodoros = todayPomodoros.length
      } catch (error) {
        console.error('加载今日番茄钟记录失败:', error)
      }
    }
  }
}
</script>

<style scoped>
.app-container {
  width: 100%;
  height: 100vh;
  background: #f2f2f7;
  display: flex;
  flex-direction: column;
  color: #1c1c1e;
  overflow: hidden;
  position: relative;
}

.header {
  background: #fff;
  padding: 16px 20px;
  border-bottom: 0.5px solid #e5e5ea;
  position: relative;
  z-index: 10;
}

.header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.back-btn {
  width: 36px;
  height: 36px;
  border-radius: 18px;
  background: #f2f2f7;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;
  font-size: 16px;
  color: #667eea;
}

.back-btn:hover {
  background: #e5e5ea;
}

.back-btn:active {
  transform: scale(0.95);
}

.header h1 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  text-align: center;
  flex: 1;
  color: #1c1c1e;
}

.header-spacer {
  width: 36px;
}

.task-name {
  font-size: 14px;
  color: #8e8e93;
  text-align: center;
  font-weight: 400;
}

.timer-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
  position: relative;
  z-index: 5;
}

.timer-controls {
  display: flex;
  gap: 28px;
  margin-top: 48px;
  align-items: center;
}

.control-btn {
  width: 64px;
  height: 64px;
  border-radius: 32px;
  background: #fff;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 22px;
  color: #667eea;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.12);
}

.control-btn:hover {
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.18);
  transform: translateY(-1px);
}

.control-btn:active {
  transform: scale(0.96);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
}

.start-btn {
  color: #34c759;
  box-shadow: 0 4px 16px rgba(52, 199, 89, 0.15);
}

.start-btn:hover {
  box-shadow: 0 6px 20px rgba(52, 199, 89, 0.22);
}

.pause-btn {
  color: #ff9500;
  box-shadow: 0 4px 16px rgba(255, 149, 0, 0.15);
}

.pause-btn:hover {
  box-shadow: 0 6px 20px rgba(255, 149, 0, 0.22);
}

.stop-btn {
  color: #ff3b30;
  box-shadow: 0 4px 16px rgba(255, 59, 48, 0.15);
}

.stop-btn:hover {
  box-shadow: 0 6px 20px rgba(255, 59, 48, 0.22);
}

.control-btn.playing {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(255, 149, 0, 0.3); }
  70% { box-shadow: 0 0 0 10px rgba(255, 149, 0, 0); }
  100% { box-shadow: 0 0 0 0 rgba(255, 149, 0, 0); }
}

.session-info {
  margin-top: 28px;
  text-align: center;
}

.session-count {
  font-size: 15px;
  font-weight: 500;
  color: #3c3c43;
  margin-bottom: 6px;
}

.session-message {
  font-size: 13px;
  color: #8e8e93;
}

.motivational-quote {
  padding: 16px 24px;
  text-align: center;
  font-size: 14px;
  color: #8e8e93;
  font-style: italic;
  line-height: 1.5;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: #fff;
  border-radius: 20px;
  padding: 28px 24px;
  max-width: 360px;
  width: 100%;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.12);
  animation: modalSlideIn 0.25s ease-out;
}

@keyframes modalSlideIn {
  from { opacity: 0; transform: translateY(20px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.modal-header {
  text-align: center;
  margin-bottom: 20px;
}

.modal-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1c1c1e;
  margin: 0;
}

.modal-body {
  text-align: center;
  margin-bottom: 24px;
}

.modal-body p {
  font-size: 15px;
  color: #3c3c43;
  margin: 0 0 12px 0;
  line-height: 1.5;
}

.modal-time-info {
  background: rgba(102, 126, 234, 0.08);
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 14px;
  color: #667eea;
  font-weight: 600;
}

.modal-actions {
  display: flex;
  gap: 12px;
}

.modal-btn {
  flex: 1;
  padding: 13px 16px;
  border: none;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 48px;
}

.abandon-btn {
  background: rgba(255, 59, 48, 0.08);
  color: #ff3b30;
}

.abandon-btn:hover {
  background: rgba(255, 59, 48, 0.13);
}

.complete-btn {
  background: rgba(52, 199, 89, 0.08);
  color: #34c759;
}

.complete-btn:hover {
  background: rgba(52, 199, 89, 0.13);
}

@media (max-width: 430px) {
  .header {
    padding: 12px 16px;
  }

  .back-btn {
    width: 32px;
    height: 32px;
    font-size: 14px;
  }

  .header h1 {
    font-size: 16px;
  }

  .header-spacer {
    width: 32px;
  }

  .timer-container {
    padding: 24px 20px;
  }

  .timer-controls {
    gap: 20px;
    margin-top: 36px;
  }

  .control-btn {
    width: 56px;
    height: 56px;
    font-size: 20px;
  }

  .session-info {
    margin-top: 20px;
  }

  .modal-content {
    padding: 24px 20px;
  }

  .modal-actions {
    flex-direction: column;
    gap: 10px;
  }
}
</style>