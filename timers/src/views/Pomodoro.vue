<template>
  <div class="app-container">
    <!-- Header with Back Button -->
    <div class="header">
      <div class="header-top">
        <div class="back-btn" @click="goBack">
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
      fromRoute: '/home', // 记录来源路由
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
      this.taskName = taskFromQuery
    }
    
    // 记录来源路由
    this.fromRoute = this.$route.query.from || '/home'
    
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
      this.resetTimer()
      this.hideStopModal()
      this.goBack()
    },
    async completeTimer() {
      // 记录提前完成的番茄钟
      await this.savePomodoroRecord(true)
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
      this.$router.push(this.fromRoute)
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
      
      const pomodoroData = {
        taskName: this.taskName,
        mode: this.currentMode,
        startTime: this.sessionStartTime.toISOString(),
        endTime: endTime.toISOString(),
        duration: plannedDuration, // 计划持续时间
        actualFocusTime: actualDuration, // 实际专注时间
        completed: completed,
        completionStatus: completionStatus,
        userId: 'default', // 可以根据实际用户系统调整
        sourceRoute: this.fromRoute
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
        const response = await pomodoroApi.getAllPomodoros()
        const today = new Date().toDateString()
        const todayPomodoros = response.data.data.filter(p => {
          const pomodoroDate = new Date(p.createdAt).toDateString()
          return pomodoroDate === today && p.mode === 'pomodoro' && p.completed
        })
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
  background: 
    linear-gradient(135deg, rgba(102, 126, 234, 0.95) 0%, rgba(118, 75, 162, 0.95) 100%),
    url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80') center/cover no-repeat;
  display: flex;
  flex-direction: column;
  color: white;
  overflow: hidden;
  position: relative;
}

.header {
  padding: 20px 24px;
  position: relative;
  z-index: 10;
}

.header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.back-btn {
  width: 44px;
  height: 44px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 18px;
  color: white;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: scale(1.05);
}

.back-btn:active {
  transform: scale(0.95);
}

.header h1 {
  font-size: 24px;
  font-weight: 700;
  margin: 0;
  text-align: center;
  flex: 1;
}

.header-spacer {
  width: 44px;
}

.task-name {
  font-size: 18px;
  opacity: 0.9;
  text-align: center;
  font-weight: 500;
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
  gap: 32px;
  margin-top: 50px;
  align-items: center;
}

.control-btn {
  width: 70px;
  height: 70px;
  border-radius: 35px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
  border: 2px solid rgba(255, 255, 255, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 26px;
  color: white;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.control-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.control-btn:active {
  transform: translateY(0) scale(0.98);
}

.start-btn {
  background: rgba(76, 175, 80, 0.3);
  border-color: rgba(76, 175, 80, 0.5);
}

.start-btn:hover {
  background: rgba(76, 175, 80, 0.4);
}

.pause-btn {
  background: rgba(255, 193, 7, 0.3);
  border-color: rgba(255, 193, 7, 0.5);
}

.pause-btn:hover {
  background: rgba(255, 193, 7, 0.4);
}

.stop-btn {
  background: rgba(244, 67, 54, 0.3);
  border-color: rgba(244, 67, 54, 0.5);
}

.stop-btn:hover {
  background: rgba(244, 67, 54, 0.4);
}

.control-btn.playing {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(255, 255, 255, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
  }
}

.session-info {
  margin-top: 30px;
  text-align: center;
  opacity: 0.9;
}

.session-count {
  font-size: 18px;
  margin-bottom: 8px;
}

.session-message {
  font-size: 14px;
  opacity: 0.7;
}

.motivational-quote {
  position: absolute;
  bottom: 120px;
  left: 24px;
  right: 24px;
  text-align: center;
  font-size: 16px;
  opacity: 0.8;
  font-style: italic;
  padding: 0 20px;
  z-index: 1;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 32px;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  text-align: center;
  margin-bottom: 24px;
}

.modal-header h3 {
  font-size: 22px;
  font-weight: 700;
  color: #2c3e50;
  margin: 0;
}

.modal-body {
  text-align: center;
  margin-bottom: 32px;
}

.modal-body p {
  font-size: 16px;
  color: #5a6c7d;
  margin: 0 0 16px 0;
  line-height: 1.5;
}

.modal-time-info {
  background: rgba(102, 126, 234, 0.1);
  border-radius: 12px;
  padding: 12px 16px;
  font-size: 14px;
  color: #667eea;
  font-weight: 600;
}

.modal-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.modal-btn {
  flex: 1;
  padding: 14px 20px;
  border: none;
  border-radius: 16px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 52px;
}

.abandon-btn {
  background: rgba(244, 67, 54, 0.1);
  color: #f44336;
  border: 2px solid rgba(244, 67, 54, 0.2);
}

.abandon-btn:hover {
  background: rgba(244, 67, 54, 0.15);
  transform: translateY(-1px);
}

.complete-btn {
  background: rgba(76, 175, 80, 0.1);
  color: #4caf50;
  border: 2px solid rgba(76, 175, 80, 0.2);
}

.complete-btn:hover {
  background: rgba(76, 175, 80, 0.15);
  transform: translateY(-1px);
}

@media (max-width: 430px) {
  .header {
    padding: 16px 20px;
  }
  
  .back-btn {
    width: 40px;
    height: 40px;
    font-size: 16px;
  }
  
  .header h1 {
    font-size: 20px;
  }
  
  .header-spacer {
    width: 40px;
  }
  
  .task-name {
    font-size: 16px;
  }
  
  .timer-container {
    padding: 20px 20px;
  }
  
  .timer-controls {
    gap: 24px;
    margin-top: 40px;
  }
  
  .control-btn {
    width: 60px;
    height: 60px;
    font-size: 22px;
  }
  
  .session-info {
    margin-top: 20px;
  }
  
  .session-count {
    font-size: 16px;
  }
  
  .session-message {
    font-size: 13px;
  }
  
  .motivational-quote {
    bottom: 100px;
    font-size: 14px;
    padding: 0 16px;
  }
  
  .modal-content {
    padding: 24px;
    margin: 16px;
  }
  
  .modal-header h3 {
    font-size: 20px;
  }
  
  .modal-body p {
    font-size: 15px;
  }
  
  .modal-actions {
    flex-direction: column;
    gap: 12px;
  }
  
  .modal-btn {
    min-height: 48px;
    font-size: 15px;
  }
}
</style>