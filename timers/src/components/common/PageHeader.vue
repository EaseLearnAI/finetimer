<template>
  <div class="page-header">
    <div class="header-content">
      <div class="header-left">
        <button 
          v-if="showBack" 
          @click="$emit('back')"
          class="back-btn"
        >
          <font-awesome-icon icon="chevron-left" />
        </button>
        <h1 class="header-title">{{ title }}</h1>
      </div>
      
      <div class="header-right">
        <slot name="actions"></slot>
      </div>
    </div>
    
    <div v-if="subtitle" class="header-subtitle">
      {{ subtitle }}
    </div>
  </div>
</template>

<script>
export default {
  name: 'PageHeader',
  props: {
    title: {
      type: String,
      required: true
    },
    subtitle: {
      type: String,
      default: ''
    },
    showBack: {
      type: Boolean,
      default: false
    }
  },
  emits: ['back']
}
</script>

<style scoped>
.page-header {
  background: #fff;
  padding: 20px 30px;
  border-bottom: 0.5px solid #e5e5ea;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.back-btn {
  width: 32px;
  height: 32px;
  border-radius: 16px;
  background: #f2f2f7;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;
  color: #007aff;
}

.back-btn:hover {
  background: #e5e5ea;
}

.header-title {
  font-size: 28px;
  font-weight: 700;
  color: #1d1d1f;
  margin: 0;
}

.header-subtitle {
  margin-top: 8px;
  font-size: 16px;
  color: #8e8e93;
}

@media (max-width: 430px) {
  .page-header {
    padding: 16px 20px;
  }
  
  .header-title {
    font-size: 24px;
  }
  
  .header-subtitle {
    font-size: 14px;
  }
}
</style>