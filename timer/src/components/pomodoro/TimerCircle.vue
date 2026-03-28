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
          #667eea 0deg,
          #667eea ${degrees}deg,
          #e8ebff ${degrees}deg,
          #e8ebff 360deg
        )`,
        transform: 'rotate(-90deg)'
      }
    }
  }
}
</script>

<style scoped>
.timer-circle {
  width: 280px;
  height: 280px;
  border-radius: 50%;
  background: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.15);
}

.timer-progress {
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;
  bottom: 10px;
  border-radius: 50%;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

/* Inner white circle to create ring effect */
.timer-progress::after {
  content: '';
  position: absolute;
  top: 14px;
  left: 14px;
  right: 14px;
  bottom: 14px;
  border-radius: 50%;
  background: #fff;
}

.timer-display {
  font-size: 48px;
  font-weight: 700;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Consolas', monospace;
  margin-bottom: 8px;
  z-index: 10;
  color: #1c1c1e;
  letter-spacing: -1px;
}

.timer-label {
  font-size: 15px;
  z-index: 10;
  color: #8e8e93;
  font-weight: 500;
}

@media (max-width: 430px) {
  .timer-circle {
    width: 240px;
    height: 240px;
  }

  .timer-display {
    font-size: 40px;
  }

  .timer-label {
    font-size: 13px;
  }
}
</style>