<template>
  <div class="collections-container">
    <div class="header">
      <div class="header-title">任务集</div>
      <button class="create-collection-btn" @click="openCreateModal" title="创建新任务集">
        <font-awesome-icon icon="plus" />
      </button>
    </div>

    <!-- 创建任务集弹窗 -->
    <div class="modal" :class="{ show: showCreateModal }">
      <div class="modal-content">
        <div class="modal-header">创建新任务集</div>
        <input 
          type="text" 
          class="modal-input" 
          v-model="newCollectionName" 
          placeholder="请输入任务集名称" 
          maxlength="20"
          @keyup.enter="createCollection"
        >
        <div class="modal-actions">
          <button class="modal-btn cancel" @click="closeCreateModal">取消</button>
          <button class="modal-btn confirm" @click="createCollection">创建</button>
        </div>
      </div>
    </div>

    <div class="content">
      <div v-if="collections.length === 0" class="empty-state">
        <div class="empty-icon">
          <font-awesome-icon icon="folder-open" />
        </div>
        <div class="empty-title">暂无任务集</div>
        <div class="empty-subtitle">点击右上角 + 创建你的第一个任务集</div>
      </div>

      <div v-else class="collections-list">
        <CollectionCard
          v-for="collection in collections"
          :key="collection.id"
          :collection="collection"
          @toggle-expand="toggleCollectionExpand"
          @add-subtask="addSubtaskToCollection"
          @subtask-added="addSubtaskToCollection"
          @delete="deleteCollection"
        />
      </div>
    </div>

    <TabBar />
  </div>
</template>

<script>
import CollectionCard from '@/components/task-collections/CollectionCard.vue'
import TabBar from '@/components/common/TabBar.vue'
import api from '@/api'

export default {
  name: 'TaskCollections',
  components: {
    CollectionCard,
    TabBar
  },
  data() {
    return {
      collections: [],
      showCreateModal: false,
      newCollectionName: ''
    }
  },
  async created() {
    await this.fetchCollections()
  },
  methods: {
    async fetchCollections() {
      try {
        console.log('开始获取任务集数据...')
        const response = await api.collections.getAllCollections()
        console.log('任务集API响应:', response)
        
        // 转换后端数据结构为前端需要的数据结构
        this.collections = response.data.map(collection => ({
          id: collection._id,
          name: collection.name,
          expanded: collection.expanded || false,
          subtasks: collection.tasks ? collection.tasks.map(task => ({
            id: task._id,
            name: task.title,
            time: task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '待定',
            priority: this.getPriorityFromQuadrant(task.quadrant),
            completed: task.completed
          })) : []
        }))
        
        console.log('转换后的任务集数据:', this.collections)
      } catch (error) {
        console.error('获取任务集失败:', error)
        console.log('使用模拟数据作为备选')
        this.initializeMockData()
      }
    },
    getPriorityFromQuadrant(quadrant) {
      const priorityMap = {
        1: 'high',
        2: 'medium', 
        3: 'low',
        4: 'low'
      }
      return priorityMap[quadrant] || 'medium'
    },
    initializeMockData() {
      this.collections = [
        {
          id: 'mock1',
          name: '考研英语复习',
          expanded: false,
          subtasks: [
            {
              id: 'mocktask1',
              name: '英语单词背诵',
              time: '每天 30 分钟',
              priority: 'high',
              completed: true
            }
          ]
        }
      ]
    },
    openCreateModal() {
      this.showCreateModal = true
      this.newCollectionName = ''
    },
    closeCreateModal() {
      this.showCreateModal = false
      this.newCollectionName = ''
    },
    async createCollection() {
      if (!this.newCollectionName.trim()) return
      
      try {
        console.log('开始创建任务集:', this.newCollectionName.trim())
        const response = await api.collections.createCollection({
          name: this.newCollectionName.trim()
        })
        
        console.log('任务集创建成功:', response)
        
        // 转换后端数据结构为前端需要的数据结构
        const newCollection = {
          id: response.data._id,
          name: response.data.name,
          expanded: response.data.expanded || false,
          subtasks: []
        }
        
        this.collections.unshift(newCollection)
        this.closeCreateModal()
      } catch (error) {
        console.error('创建任务集失败:', error)
        // 如果创建失败，使用本地模拟
        const newCollection = {
          id: Date.now(),
          name: this.newCollectionName.trim(),
          expanded: false,
          subtasks: []
        }
        
        this.collections.unshift(newCollection)
        this.closeCreateModal()
      }
    },
    // 添加子任务到任务集
    addSubtaskToCollection({ collectionId, subtask }) {
      const collection = this.collections.find(c => c.id === collectionId)
      if (collection) {
        // 确保subtasks数组存在
        if (!collection.subtasks) {
          collection.subtasks = []
        }
        collection.subtasks.push(subtask)
        console.log('子任务已添加到任务集:', collectionId, subtask)
      }
    },
    // 删除任务集
    async deleteCollection(collectionId) {
      try {
        console.log('开始删除任务集:', collectionId)
        const response = await api.collections.deleteCollection(collectionId)
        
        console.log('任务集删除成功:', response)
        
        const index = this.collections.findIndex(c => c.id === collectionId)
        if (index !== -1) {
          this.collections.splice(index, 1)
          // this.$message.success('任务集删除成功')
        }
      } catch (error) {
        console.error('删除任务集失败:', error)
        // this.$message.error('删除任务集失败: ' + (error.response?.data?.message || error.message))
      }
    },
    async toggleCollectionExpand(collectionId) {
      try {
        const collection = this.collections.find(c => c.id === collectionId)
        if (collection) {
          console.log('切换任务集展开状态:', collectionId, !collection.expanded)
          const response = await api.collections.toggleCollectionExpand(collectionId)
          
          console.log('任务集展开状态更新成功:', response)
          collection.expanded = !collection.expanded
        }
      } catch (error) {
        console.error('切换任务集展开状态失败:', error)
        // this.$message.error('操作失败: ' + (error.response?.data?.message || error.message))
      }
    },
    async toggleSubtask({ collectionId, subtaskId }) {
      try {
        const collection = this.collections.find(c => c.id === collectionId)
        if (collection) {
          const subtask = collection.subtasks.find(s => s.id === subtaskId)
          if (subtask) {
            // 先更新本地状态以提供即时反馈
            subtask.completed = !subtask.completed
            
            // 调用API更新任务状态
            await api.tasks.updateTask(subtaskId, {
              completed: subtask.completed
            })
          }
        }
      } catch (error) {
        console.error('更新子任务状态失败:', error)
        // 如果API调用失败，可以在这里添加错误处理逻辑
        // 例如，恢复之前的完成状态
        // subtask.completed = !subtask.completed
      }
    }
  }
}
</script>

<style scoped>
.collections-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f8f9fe;
}

.header {
  background: #fff;
  padding: 16px 30px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
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

.collections-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.modal {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  z-index: 1000;
  animation: fadeIn 0.3s ease-out;
}

.modal.show {
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  background: white;
  border-radius: 20px;
  padding: 32px;
  width: 90%;
  max-width: 320px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  animation: slideUp 0.3s ease-out;
}

.modal-header {
  font-size: 20px;
  font-weight: 600;
  color: #1d1d1f;
  margin-bottom: 24px;
  text-align: center;
}

.modal-input {
  width: 100%;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  font-size: 16px;
  font-family: 'Inter', sans-serif;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.modal-input:focus {
  outline: none;
  border-color: #007aff;
}

.modal-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.modal-btn {
  flex: 1;
  padding: 12px 24px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.modal-btn.cancel {
  background: #f3f4f6;
  color: #6b7280;
}

.modal-btn.cancel:hover {
  background: #e5e7eb;
}

.modal-btn.confirm {
  background: linear-gradient(135deg, #4a90e2, #007aff);
  color: white;
}

.modal-btn.confirm:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);
}



@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { 
    opacity: 0;
    transform: translateY(20px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}

/* 移动端适配 */
@media (max-width: 430px) {
  .header {
    padding: 12px 20px;
  }
  
  .header-title {
    font-size: 28px;
  }
  
  .content {
    padding: 16px 12px;
  }
  
  .modal-content {
    padding: 24px 20px;
    margin: 0 16px;
  }
  

}
</style>