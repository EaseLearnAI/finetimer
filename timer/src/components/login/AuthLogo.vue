<template>
  <div class="logo">
    <div class="logo-icon">
      <img :src="logoSrc" alt="Tempo logo" class="logo-image" />
    </div>
    <h1 class="app-title">Tempo</h1>
    <p class="app-subtitle">不只规划你的时间，更陪伴你的成长。</p>
  </div>
</template>

<script>
export default {
  name: 'AuthLogo',
  data() {
    return {
      logoSrc: `${process.env.BASE_URL}tempo_icon_white.png`
    }
  }
}
</script>

<style scoped>
.logo {
  margin-bottom: 32px;
  text-align: center;
}

.logo-icon {
  width: 88px;
  height: 88px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  transition: transform 0.25s ease;
}

.logo-icon:hover {
  transform: translateY(-1px);
}

.logo-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.app-title {
  font-size: 30px;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: #162033;
  margin: 0 0 8px 0;
}

.app-subtitle {
  font-size: 14px;
  color: #6d7b8d;
  font-weight: 400;
  margin: 0;
  line-height: 1.55;
  max-width: 280px;
  margin: 0 auto;
}

/* 移动端适配 */
@media (max-width: 480px) {
  .logo {
    margin-bottom: 28px;
  }
  
  .logo-icon {
    width: 76px;
    height: 76px;
    margin-bottom: 14px;
  }
  
  .app-title {
    font-size: 22px;
  }
  
  .app-subtitle {
    font-size: 13px;
  }
}
</style>