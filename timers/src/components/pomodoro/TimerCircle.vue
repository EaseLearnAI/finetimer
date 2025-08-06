<template>
  <div class="timer-circle">
    <div class="timer-progress" :style="progressStyle"></div>
    <div class="timer-display">{{ displayTime }}</div>
    <div class="timer-label">{{ label }}</div>
  </div>
</template>

<script>
export default {
  name: 'TimerCircle',
  props: {
    timeLeft: {
      type: Number,
      required: true
    },
    totalTime: {
      type: Number,
      required: true
    },
    label: {
      type: String,
      default: '专注时间'
    }
  },
  computed: {
    displayTime() {
      const minutes = Math.floor(this.timeLeft / 60)
      const seconds = this.timeLeft % 60
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    },
    progressStyle() {
      const progress = 1 - (this.timeLeft / this.totalTime)
      const degrees = progress * 360
      return {
        background: `conic-gradient(
          from 0deg,
          rgba(255, 255, 255, 0.8) 0deg,
          rgba(255, 255, 255, 0.8) ${degrees}deg,
          rgba(255, 255, 255, 0.15) ${degrees}deg,
          rgba(255, 255, 255, 0.15) 360deg
        )`,
        transform: 'rotate(-90deg)'
      }
    }
  }
}
</script>

<style scoped>
.timer-circle {
  width: 300px;
  height: 300px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.2),
    0 1px 0 rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.timer-progress {
  position: absolute;
  top: 8px;
  left: 8px;
  right: 8px;
  bottom: 8px;
  border-radius: 50%;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.timer-display {
  font-size: 52px;
  font-weight: 700;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Consolas', monospace;
  margin-bottom: 12px;
  z-index: 10;
  color: white;
  text-shadow: 0 2px 20px rgba(0, 0, 0, 0.3);
  letter-spacing: -1px;
}

.timer-label {
  font-size: 18px;
  opacity: 0.9;
  z-index: 10;
  color: white;
  font-weight: 500;
  text-shadow: 0 1px 10px rgba(0, 0, 0, 0.2);
}

@media (max-width: 430px) {
  .timer-circle {
    width: 260px;
    height: 260px;
  }
  
  .timer-display {
    font-size: 44px;
  }
  
  .timer-label {
    font-size: 16px;
  }
}
</style>