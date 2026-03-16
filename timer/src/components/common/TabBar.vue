<template>
  <div class="tab-bar">
    <router-link 
      v-for="tab in tabs" 
      :key="tab.name"
      :to="tab.path" 
      class="tab-item"
      :class="{ active: $route.name === tab.name }"
    >
      <font-awesome-icon :icon="tab.icon" class="tab-icon" />
      <span>{{ tab.label }}</span>
    </router-link>
  </div>
</template>

<script>
export default {
  name: 'TabBar',
  data() {
    return {
      tabs: [
        { name: 'Task', path: '/task', icon: 'tasks', label: '任务' },
        { name: 'TaskCollections', path: '/task-collections', icon: 'layer-group', label: '任务集' },
        { name: 'AiSecretary', path: '/ai-secretary', icon: 'robot', label: 'AI助手' },
        { name: 'Stats', path: '/stats', icon: 'chart-line', label: '统计' },
        { name: 'Calendar', path: '/calendar', icon: 'calendar', label: '日历' }
      ]
    }
  }
}
</script>

<style scoped>
.tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 62px;
  background: rgba(247, 247, 247, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top: 0.5px solid #e5e5ea;
  display: flex;
  justify-content: space-around;
  align-items: flex-start;
  padding: 10px 0;
  z-index: 100;
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  color: #8e8e93;
  text-decoration: none;
  font-size: 10px;
  font-weight: 500;
  transition: color 0.3s, transform 0.3s;
  padding: 0 12px;
  transform: scale(0.95);
}

.tab-item.active {
  color: #007aff;
  transform: scale(1.05);
}

.tab-icon {
  font-size: 22px;
  margin-bottom: 2px;
  transition: transform 0.3s;
}

.tab-item.active .tab-icon {
  transform: scale(1.1);
}

@media (max-width: 430px) {
  .tab-bar {
    height: 60px;
    padding: 12px 0 8px;
  }
  
  .tab-icon {
    font-size: 20px;
  }
}
</style>