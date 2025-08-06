<template>
  <div class="collection-card">
    <div class="collection-header" @click="toggleExpand">
      <div class="collection-info">
        <div class="collection-name">{{ collection.name }}</div>
        <div class="collection-meta">
          <span>{{ subtaskCountText }}</span>
          <div class="collection-progress">
            <span>{{ progress }}%</span>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: progress + '%' }"></div>
            </div>
          </div>
        </div>
      </div>
      <div class="collection-actions">
        <button 
          class="add-subtask-btn" 
          @click.stop="openAddSubtaskModal"
          title="添加子任务"
        >
          <font-awesome-icon icon="plus" />
        </button>
        <button 
          class="expand-btn" 
          :class="{ expanded: collection.expanded }" 
          @click.stop="toggleExpand"
        > 
          <font-awesome-icon icon="chevron-down" /> 
        </button>
      </div>
    </div>
    
    <div class="subtasks" :class="{ expanded: collection.expanded }">
      <div 
        v-for="subtask in collection.subtasks" 
        :key="subtask.id"
        class="subtask-item"
      >
        <div 
          class="subtask-checkbox"
          :class="{ completed: subtask.completed }"
          @click="toggleSubtask(subtask)"
        >
          <font-awesome-icon icon="check" v-if="subtask.completed" />
        </div>
        <div class="subtask-content">
          <div class="subtask-name">{{ subtask.name }}</div>
          <div class="subtask-time">{{ subtask.time }}</div>
        </div>
        <div 
          class="subtask-priority"
          :class="`priority-${subtask.priority}`"
        >
          {{ getPriorityText(subtask.priority) }}
        </div>
      </div>
    </div>

    <!-- 添加子任务模态框 -->
    <AddTaskModal
      :visible="showAddSubtaskModal"
      @close="closeAddSubtaskModal"
      @submit="handleAddSubtask"
    />
  </div>
</template>

<script>
import AddTaskModal from '@/components/task/AddTaskModal.vue'
import api from '@/api'

export default {
  name: 'CollectionCard',
  components: {
    AddTaskModal
  },
  props: {
    collection: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      showAddSubtaskModal: false
    }
  },
  computed: {
    subtaskCountText() {
      const count = this.collection.subtasks?.length || 0
      return `${count}个子任务`
    },
    progress() {
      if (!this.collection.subtasks?.length) return 0
      const completed = this.collection.subtasks.filter(s => s.completed).length
      return Math.round((completed / this.collection.subtasks.length) * 100)
    }
  },
  methods: {
    toggleExpand() {
      this.$emit('toggle-expand', this.collection.id)
    },
    toggleSubtask(subtask) {
      this.$emit('toggle-subtask', {
        collectionId: this.collection.id,
        subtaskId: subtask.id
      })
    },
    getPriorityText(priority) {
      const map = {
        high: '高',
        medium: '中',
        low: '低'
      }
      return map[priority] || priority
    },
    openAddSubtaskModal() {
      this.showAddSubtaskModal = true
    },
    closeAddSubtaskModal() {
      this.showAddSubtaskModal = false
    },
    async handleAddSubtask(taskData) {
      try {
        console.log('开始添加子任务:', taskData)
        // 首先创建任务
        const taskResponse = await api.tasks.createTask({
          title: taskData.title,
          description: taskData.description || '',
          dueDate: taskData.date || null,
          quadrant: this.getQuadrantFromPriority(taskData.priority),
          completed: false
        })
        
        console.log('任务创建成功:', taskResponse)
        
        // 然后将任务添加到任务集中
        const updatedTasks = [...(this.collection.subtasks || []).map(t => t.id || t._id), taskResponse.data._id]
        const collectionResponse = await api.collections.updateCollection(this.collection.id, {
          tasks: updatedTasks
        })
        
        console.log('任务集更新成功:', collectionResponse)
        
        // 更新本地数据
        this.$emit('add-subtask', {
          collectionId: this.collection.id,
          subtask: {
            ...taskResponse.data,
            id: taskResponse.data._id,
            name: taskResponse.data.title,
            time: taskResponse.data.dueDate ? new Date(taskResponse.data.dueDate).toLocaleDateString() : '待定',
            priority: this.getPriorityFromQuadrant(taskResponse.data.quadrant),
            completed: taskResponse.data.completed
          }
        })
        
        this.closeAddSubtaskModal()
        this.$message.success('任务添加成功')
      } catch (error) {
        console.error('添加子任务失败:', error)
        this.$message.error('任务添加失败: ' + (error.response?.data?.message || error.message))
      }
    },
    getPriorityFromQuadrant(quadrant) {
      // 将四象限转换为优先级
      const quadrantMap = {
        1: 'high',    // 重要且紧急
        2: 'medium',  // 重要不紧急
        3: 'low',     // 紧急不重要
        4: 'low'      // 不重要不紧急
      }
      return quadrantMap[quadrant] || 'medium'
    },
    getQuadrantFromPriority(priority) {
      const quadrantMap = {
        'high': 1,
        'medium': 2, 
        'low': 3
      }
      return quadrantMap[priority] || 2
    }
  }
}
</script>

<style scoped>
.collection-card {
  background: white;
  border-radius: 20px;
  padding: 20px 24px;
  margin-bottom: 16px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.04), 0 10px 24px rgba(60, 90, 130, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.collection-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0,0,0,0.06), 0 20px 40px rgba(60, 90, 130, 0.12);
}

.collection-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  cursor: pointer;
  position: relative;
}

.collection-info {
  flex: 1;
}

.collection-name {
  font-size: 20px;
  font-weight: 600;
  color: #1d1d1f;
  margin-bottom: 6px;
}

.collection-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: #6b7280;
}

.collection-progress {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-bar {
  width: 60px;
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4a90e2, #007aff);
  border-radius: 2px;
  transition: width 0.4s ease-in-out;
}

.collection-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.expand-btn {
  width: 32px;
  height: 32px;
  border-radius: 16px;
  background: transparent;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  color: #007aff;
}

.expand-btn:hover {
  background: #f8f9fe;
  transform: scale(1.1);
}

.expand-btn.expanded {
  transform: rotate(180deg);
}

.expand-btn.expanded:hover {
  transform: rotate(180deg) scale(1.1);
}

.add-subtask-btn {
  width: 32px;
  height: 32px;
  border-radius: 16px;
  background: linear-gradient(135deg, #4a90e2, #007aff);
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 14px;
  margin-left: 8px;
  box-shadow: 0 2px 8px rgba(74, 144, 226, 0.3);
}

.add-subtask-btn:hover {
  transform: translateY(-1px) scale(1.1);
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.4);
}

.subtasks {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.4s ease-in-out;
}

.subtasks.expanded {
  max-height: 500px;
}

.subtask-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 0;
  border-bottom: 0.5px solid #f2f2f7;
}

.subtask-item:last-child {
  border-bottom: none;
}

.subtask-checkbox {
  width: 22px;
  height: 22px;
  border-radius: 11px;
  border: 2px solid #007aff;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
}

.subtask-checkbox.completed {
  background: linear-gradient(135deg, #4a90e2, #007aff);
  border-color: transparent;
  transform: scale(1.1);
}

.subtask-checkbox:hover {
  transform: scale(1.05);
}

.subtask-content {
  flex: 1;
}

.subtask-name {
  font-size: 16px;
  font-weight: 500;
  color: #1d1d1f;
  margin-bottom: 2px;
}

.subtask-time {
  font-size: 14px;
  color: #6b7280;
}

.subtask-priority {
  padding: 6px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.priority-high {
  background: #ffebee;
  color: #c62828;
}

.priority-medium {
  background: #fff3e0;
  color: #f57c00;
}

.priority-low {
  background: #e8f5e9;
  color: #2e7d32;
}

/* 移动端适配 */
@media (max-width: 430px) {
  .collection-card {
    margin-bottom: 12px;
    padding: 16px 20px;
  }
  
  .collection-name {
    font-size: 18px;
  }
  
  .collection-meta {
    font-size: 13px;
  }
  
  .subtask-name {
    font-size: 15px;
  }
  
  .subtask-time {
    font-size: 13px;
  }
}
</style>