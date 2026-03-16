<template>
  <div class="logo">
    <div class="logo-icon">
      <font-awesome-icon icon="robot" />
    </div>
    <h1 class="app-title">Tempo</h1>
    <p class="app-subtitle">不只规划你的时间，更陪伴你的成长。</p>
  </div>
</template>

<script>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

export default {
  name: 'AuthLogo',
  components: {
    FontAwesomeIcon
  }
}
</script>

<style scoped>
.logo {
  margin-bottom: 32px;
  text-align: center;
}

.logo-icon {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
  transition: transform 0.3s ease;
}

.logo-icon:hover {
  transform: scale(1.05);
}

.logo-icon svg {
  font-size: 28px;
  color: white;
}

.app-title {
  font-size: 24px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 8px 0;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.app-subtitle {
  font-size: 14px;
  color: #666;
  font-weight: 400;
  margin: 0;
  line-height: 1.4;
  max-width: 280px;
  margin: 0 auto;
}

/* 移动端适配 */
@media (max-width: 480px) {
  .logo {
    margin-bottom: 28px;
  }
  
  .logo-icon {
    width: 56px;
    height: 56px;
    margin-bottom: 14px;
  }
  
  .logo-icon svg {
    font-size: 24px;
  }
  
  .app-title {
    font-size: 22px;
  }
  
  .app-subtitle {
    font-size: 13px;
  }
}
</style>