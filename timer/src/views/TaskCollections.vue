<template>
  <div class="collections-container">
    <!-- Header -->
    <div class="header">
      <div class="header-title">任务集</div>
      <button 
        class="create-collection-btn" 
        @click="openCreateCollectionModal" 
        title="创建新任务集"
      >
        <font-awesome-icon icon="plus" />
      </button>
    </div>
    
    <!-- Content -->
    <div class="content" v-if="!loading">
      <!-- Collections List -->
      <template v-if="collections.length > 0">
        <CollectionCard
          v-for="collection in collections"
          :key="collection._id"
          :collection="collection"
          @toggle-expansion="handleToggleExpansion"
          @add-subtask="openAddSubtaskModal"
          @toggle-subtask="handleToggleSubtask"
        />
      </template>
      
      <!-- Empty State -->
      <div v-else class="empty-state">
        <div class="empty-icon">📋</div>
        <div class="empty-title">暂无任务集</div>
        <div class="empty-subtitle">点击右上角 + 按钮创建第一个任务集</div>
      </div>
    </div>
    
    <!-- Loading State -->
    <div v-else class="loading-container">
      <LoadingSpinner />
    </div>
    
    <!-- Floating Add Button -->
    <button class="add-collection-btn" @click="openCreateCollectionModal">
      <font-awesome-icon icon="plus" />
    </button>
    
    <!-- Tab Bar -->
    <TabBar />
    
    <!-- Collection Modal -->
    <CollectionModal
      :visible="showCollectionModal"
      :collection="editingCollection"
      @close="closeCollectionModal"
      @submit="handleCollectionSubmit"
    />
    
    <!-- Subtask Modal -->
    <SubtaskModal
      :visible="showSubtaskModal"
      :collection-id="currentCollectionId"
      :subtask="editingSubtask"
      @close="closeSubtaskModal"
      @submit="handleSubtaskSubmit"
    />
  </div>
</template>

<script>
import CollectionCard from '../components/task-collections/CollectionCard.vue'
import CollectionModal from '../components/task-collections/CollectionModal.vue'
import SubtaskModal from '../components/task-collections/SubtaskModal.vue'
import TabBar from '../components/common/TabBar.vue'
import LoadingSpinner from '../components/common/LoadingSpinner.vue'
import api from '@/api'
import collectionApi from '@/api/collections'

export default {
  name: 'TaskCollections',
  components: {
    CollectionCard,
    CollectionModal,
    SubtaskModal,
    TabBar,
    LoadingSpinner
  },
  data() {
    return {
      collections: [],
      loading: true,
      
      // Modal states
      showCollectionModal: false,
      showSubtaskModal: false,
      editingCollection: null,
      editingSubtask: null,
      currentCollectionId: ''
    }
  },
  computed: {
    currentUserId() {
      const user = JSON.parse(localStorage.getItem('user') || 'null')
      return user?._id || user?.id || null
    }
  },
  async mounted() {
    await this.loadCollections();
  },
  methods: {
    // 加载任务集列表
    async loadCollections() {
      try {
        this.loading = true;
        console.log('🔄 [TaskCollections] 开始加载任务集列表...');
        
        const userId = this.currentUserId
        if (!userId) {
          console.warn('⚠️ [TaskCollections] 未登录，跳转到登录页')
          this.$router.replace({ path: '/auth/login', query: { redirect: this.$route.fullPath } })
          return
        }
        
        // 加载普通任务集  
        const response = await collectionApi.getCollections({ userId });
        console.log('📋 [TaskCollections] API响应:', response);
        
        if (response && response.data && response.data.success) {
          this.collections = response.data.data || [];
          console.log('✅ [TaskCollections] 成功加载任务集列表:', this.collections.length);
        } else {
          const message = response?.data?.message || '响应格式错误'
          console.error('❌ [TaskCollections] 加载任务集失败:', message);
          this.$toast?.error(message || '加载任务集失败');
        }
      } catch (error) {
        console.error('💥 [TaskCollections] 加载任务集异常:', error);
        this.$toast?.error('加载任务集失败');
      } finally {
        this.loading = false;
      }
    },
    
    // 任务集相关操作
    openCreateCollectionModal() {
      this.editingCollection = null;
      this.showCollectionModal = true;
    },
    
    closeCollectionModal() {
      this.showCollectionModal = false;
      this.editingCollection = null;
    },
    
    async handleCollectionSubmit(collectionData) {
      try {
        const userId = this.currentUserId
        if (!userId) {
          console.warn('⚠️ [TaskCollections] 未登录，跳转到登录页')
          this.$router.replace({ path: '/auth/login', query: { redirect: this.$route.fullPath } })
          return
        }
        
        let response;
        // 统一带上 userId
        const payload = { ...collectionData, userId }
        if (collectionData._id) {
          // 编辑现有任务集
          response = await collectionApi.updateCollection(collectionData._id, payload);
        } else {
          // 创建新任务集
          response = await collectionApi.createCollection(payload);
        }
        
        if (response.data.success) {
          this.$toast?.success(collectionData._id ? '任务集更新成功' : '任务集创建成功');
          this.closeCollectionModal();
          await this.loadCollections(); // 重新加载列表
        } else {
          this.$toast?.error(response.data.message || '操作失败');
        }
      } catch (error) {
        console.error('任务集操作失败:', error);
        this.$toast?.error('操作失败');
      }
    },
    
    // 子任务相关操作
    openAddSubtaskModal(collectionId) {
      this.currentCollectionId = collectionId;
      // 预置一个草稿对象，确保子任务创建时携带collectionId
      this.editingSubtask = {
        title: '',
        collectionId: collectionId,
        priority: 'medium',
        completed: false
      };
      this.showSubtaskModal = true;
    },
    
    openEditSubtaskModal(subtask) {
      this.currentCollectionId = subtask.collectionId;
      this.editingSubtask = subtask;
      this.showSubtaskModal = true;
    },
    
    closeSubtaskModal() {
      this.showSubtaskModal = false;
      this.editingSubtask = null;
      this.currentCollectionId = '';
    },
    
    async handleSubtaskSubmit(subtaskData) {
      try {
        console.log('🔄 [TaskCollections] 开始处理子任务提交:', subtaskData);
        
        const userId = this.currentUserId
        if (!userId) {
          console.warn('⚠️ [TaskCollections] 未登录，跳转到登录页')
          this.$router.replace({ path: '/auth/login', query: { redirect: this.$route.fullPath } })
          return
        }
        
        // 添加userId字段
        const taskPayload = {
          ...subtaskData,
          collectionId: this.currentCollectionId,
          userId
        };
        
        let response;
        if (subtaskData._id) {
          // 编辑现有子任务
          console.log('📝 [TaskCollections] 更新现有子任务:', subtaskData._id);
          response = await api.tasks.updateTask(subtaskData._id, taskPayload);
        } else {
          // 创建新子任务
          console.log('🆕 [TaskCollections] 创建新子任务');
          response = await api.tasks.createTask(taskPayload);
        }
        
        console.log('✅ [TaskCollections] 子任务API响应:', response);
        
        if (response.success) {
          const message = subtaskData._id ? '子任务更新成功' : '子任务添加成功';
          console.log('🎉 [TaskCollections]', message);
          this.$toast?.success(message);
          
          // 关闭弹窗
          this.closeSubtaskModal();
          
          // 重新加载列表以显示更新
          console.log('🔄 [TaskCollections] 重新加载任务集列表');
          await this.loadCollections();
        } else {
          console.error('❌ [TaskCollections] 子任务操作失败:', response.message);
          this.$toast?.error(response.message || '操作失败');
        }
      } catch (error) {
        console.error('💥 [TaskCollections] 子任务操作异常:', error);
        this.$toast?.error('操作失败');
      }
    },
    
    async handleToggleSubtask(subtaskId) {
      try {
        console.log('🔄 [TaskCollections] 切换子任务状态:', subtaskId);
        
        // 找到对应的子任务
        let targetSubtask = null;
        
        for (const collection of this.collections) {
          if (collection.subtasks) {
            const subtask = collection.subtasks.find(st => st._id === subtaskId);
            if (subtask) {
              targetSubtask = subtask;
              break;
            }
          }
        }
        
        if (!targetSubtask) {
          console.error('❌ [TaskCollections] 未找到目标子任务:', subtaskId);
          return;
        }
        
        const response = await api.tasks.toggleTaskStatus(subtaskId);
        console.log('✅ [TaskCollections] 子任务状态已切换:', response);
        
        // 本地更新状态
        targetSubtask.completed = !targetSubtask.completed;
      } catch (error) {
        console.error('💥 [TaskCollections] 切换子任务状态异常:', error);
      }
    },
    
    handleToggleExpansion(collectionId) {
      // 展开/折叠由子组件管理
      console.log('🔄 [TaskCollections] 切换展开状态:', collectionId)
    }
  }
}
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.collections-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f8f9fe;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.header {
  background: #fff;
  padding: 16px 30px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-title {
  font-size: 32px;
  font-weight: 700;
  color: #1d1d1f;
}

.create-collection-btn {
  width: 36px;
  height: 36px;
  border-radius: 18px;
  background: linear-gradient(135deg, #4a90e2, #007aff);
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 18px;
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);
}

.create-collection-btn:hover {
  transform: translateY(-2px) scale(1.1);
  box-shadow: 0 6px 20px rgba(74, 144, 226, 0.4);
}

.content {
  flex: 1;
  overflow-y: auto;
  padding: 20px 16px;
  padding-bottom: 120px; /* 为底部导航栏和浮动按钮留出空间 */
}

.loading-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #8e8e93;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  color: #d1d1d6;
}

.empty-title {
  font-size: 18px;
  font-weight: 600;
  color: #1d1d1f;
  margin-bottom: 8px;
}

.empty-subtitle {
  font-size: 14px;
  color: #8e8e93;
}

.add-collection-btn {
  position: fixed;
  bottom: 100px;
  right: 30px;
  width: 60px;
  height: 60px;
  border-radius: 30px;
  background: linear-gradient(135deg, #4a90e2, #007aff);
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(74, 144, 226, 0.4);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 100;
  font-size: 24px;
}

.add-collection-btn:hover {
  transform: translateY(-3px) scale(1.1);
  box-shadow: 0 8px 25px rgba(74, 144, 226, 0.5);
}

/* 移动端适配 */
@media (max-width: 768px) {
  .header {
    padding: 12px 20px;
  }
  
  .header-title {
    font-size: 28px;
  }
  
  .content {
    padding: 16px 12px;
    padding-bottom: 120px;
  }
  
  .add-collection-btn {
    bottom: 90px;
    right: 20px;
    width: 56px;
    height: 56px;
    font-size: 22px;
  }
}

/* 超小屏幕适配 */
@media (max-width: 480px) {
  .header {
    padding: 10px 16px;
  }
  
  .header-title {
    font-size: 24px;
  }
  
  .create-collection-btn {
    width: 32px;
    height: 32px;
    font-size: 16px;
  }
  
  .content {
    padding: 12px 8px;
  }
}
</style>