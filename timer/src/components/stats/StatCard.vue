<template>
  <div class="stat-card">
    <div class="stat-icon" :class="iconClass">
      <font-awesome-icon :icon="icon" />
    </div>
    <div class="stat-value">{{ value }}</div>
    <div class="stat-label">{{ label }}</div>
  </div>
</template>

<script>
export default {
  name: 'StatCard',
  props: {
    icon: {
      type: String,
      required: true
    },
    iconClass: {
      type: String,
      default: ''
    },
    value: {
      type: [String, Number],
      required: true
    },
    label: {
      type: String,
      required: true
    }
  }
}
</script>

<style scoped>
.stat-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  text-align: center;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 25px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 10px;
  font-size: 24px;
  color: white;
}

.stat-icon.completion {
  background: linear-gradient(135deg, #34c759 0%, #30d158 100%);
}

.stat-icon.streak {
  background: linear-gradient(135deg, #ff9500 0%, #ff6b35 100%);
}

.stat-icon.time {
  background: linear-gradient(135deg, #007aff 0%, #5856d6 100%);
}

.stat-icon.tasks {
  background: linear-gradient(135deg, #af52de 0%, #bf5af2 100%);
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #1d1d1f;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #8e8e93;
}

@media (max-width: 430px) {
  .stat-card {
    padding: 16px;
  }
  
  .stat-icon {
    width: 40px;
    height: 40px;
    font-size: 20px;
  }
  
  .stat-value {
    font-size: 24px;
  }
  
  .stat-label {
    font-size: 12px;
  }
}
</style>