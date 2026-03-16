<template>
  <header class="header">
    <div class="back-btn" @click="goBack">
      <font-awesome-icon icon="chevron-left" />
    </div>
    
    <div class="title-section">
      <h1 class="title">{{ assistantName }}</h1>
      <div class="heart-value" v-if="assistant">
        <font-awesome-icon icon="heart" class="heart-icon" />
        <span class="heart-number">{{ assistant.heartValue }}</span>
      </div>
    </div>
    
    <div class="settings-btn" @click="openSettings">
      <font-awesome-icon icon="cog" />
    </div>
  </header>
</template>

<script>
export default {
  name: 'AIHeader',
  props: {
    assistant: {
      type: Object,
      default: null
    }
  },
  computed: {
    assistantName() {
      return this.assistant?.name || 'AI学习助手'
    }
  },
  methods: {
    goBack() {
      window.history.back()
    },
    
    openSettings() {
      this.$emit('openSettings')
    }
  }
}
</script>

<style scoped>
.header {
  background: var(--white);
  padding: 28px 16px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 100;
  border-bottom: 1px solid var(--border);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.back-btn, .settings-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--blue);
  cursor: pointer;
  font-size: 20px;
  transition: all 0.2s;
}

.back-btn:hover, .settings-btn:hover {
  background: rgba(0, 122, 255, 0.1);
  border-radius: 6px;
}

.title-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.title {
  font-size: 17px;
  font-weight: 500;
  color: var(--text-primary);
  margin: 0;
  text-align: center;
}

.heart-value {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: rgba(255, 107, 107, 0.1);
  border-radius: 12px;
  border: 1px solid rgba(255, 107, 107, 0.2);
}

.heart-icon {
  color: #ff6b6b;
  font-size: 12px;
}

.heart-number {
  font-size: 12px;
  font-weight: 600;
  color: #ff6b6b;
}

@media (max-width: 480px) {
  .header {
    padding: 24px 12px 8px;
  }
  
  .title {
    font-size: 16px;
  }
  
  .heart-value {
    padding: 2px 6px;
  }
  
  .heart-icon {
    font-size: 10px;
  }
  
  .heart-number {
    font-size: 10px;
  }
}
</style>
