<template>
  <header class="header">
    <div class="back-btn" @click="goBack">
      <font-awesome-icon icon="chevron-left" />
    </div>
    <h1 class="title">{{ title }}</h1>
    <div class="more-btn">
      <font-awesome-icon icon="cog" />
    </div>
  </header>
</template>

<script>
export default {
  name: 'PageHeader',
  props: {
    title: {
      type: String,
      required: true
    }
  },
  methods: {
    goBack() {
      window.history.back();
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

.back-btn, .more-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--blue);
  cursor: pointer;
  font-size: 20px;
}

.title {
  font-size: 17px;
  font-weight: 500;
  color: var(--text-primary);
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}
</style>