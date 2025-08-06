<template>
  <div class="home-container">
    <!-- Header -->
    <div class="header">
      <div class="settings-btn" @click="toggleSidebar">
        <font-awesome-icon icon="cog" />
      </div>
      
      <div class="view-toggle">
        <button 
          class="toggle-btn" 
          :class="{ active: currentView === 'time' }"
          @click="switchView('time')"
        >
          时间块
        </button>
        <button 
          class="toggle-btn" 
          :class="{ active: currentView === 'quadrant' }"
          @click="switchView('quadrant')"
        >
          四象限
        </button>
      </div>
      
      <div class="settings-btn" @click="openAddTask">
        <font-awesome-icon icon="plus" />
      </div>
    </div>
    
    <!-- Content -->
    <div class="content">
      <!-- Time Blocks View -->
      <TaskTimeBlocks
        v-if="currentView === 'time'"
        :time-blocks="timeBlocks"
        :unscheduled-tasks="unscheduledTasks"
        @task-click="openPomodoro"
        @task-toggle="toggleTask"
        @toggle-collapse="toggleTimeBlockCollapse"
      />
      
      <!-- Quadrant View -->
      <TaskQuadrant
        v-else
        :quadrants="quadrants"
        @task-click="openPomodoro"
        @task-toggle="toggleTask"
      />
    </div>
    
    <!-- Sidebar -->
    <div class="sidebar" :class="{ open: sidebarOpen }">
      <div class="sidebar-header">
        <div class="sidebar-title">设置</div>
        <div class="close-sidebar" @click="toggleSidebar">
          <font-awesome-icon icon="times" />
        </div>
      </div>
      <div class="sidebar-content">
        <div v-for="setting in settings" :key="setting.id" class="setting-item">
          <div class="setting-label">{{ setting.label }}</div>
          <div class="setting-description">{{ setting.description }}</div>
        </div>
      </div>
    </div>
    
    <!-- Add Task Modal -->
    <AddTaskModal
      :visible="showAddModal"
      @close="closeAddTask"
      @submit="handleAddTask"
    />
    
    <!-- Overlay -->
    <div 
      v-if="sidebarOpen" 
      class="overlay" 
      @click="toggleSidebar"
    ></div>
    
    <!-- Floating Add Button -->
    <div class="add-task-btn" @click="$router.push('/ai-secretary')">
      <font-awesome-icon icon="plus" />
    </div>
    
    <!-- Tab Bar -->
    <TabBar />
  </div>
</template>

<script>
import TaskTimeBlocks from '../components/task/TaskTimeBlocks.vue'
import TaskQuadrant from '../components/task/TaskQuadrant.vue'
import AddTaskModal from '../components/task/AddTaskModal.vue'
import TabBar from '../components/common/TabBar.vue'
import api from '@/api'

export default {
  name: 'TaskPage',
  components: {
    TaskTimeBlocks,
    TaskQuadrant,
    AddTaskModal,
    TabBar
  },
  data() {
    return {
      currentView: 'time',
      sidebarOpen: false,
      showAddModal: false,
      timeBlocks: [],
      unscheduledTasks: [], // 添加未指定时间的任务数组
      quadrants: [
        {
          id: 1,
          title: '重要且紧急',
          tasks: []
        },
        {
          id: 2,
          title: '重要不紧急',
          tasks: []
        },
        {
          id: 3,
          title: '紧急不重要',
          tasks: []
        },
        {
          id: 4,
          title: '不重要不紧急',
          tasks: []
        }
      ],
      settings: [
        { id: 1, label: '通知设置', description: '管理任务提醒和推送' },
        { id: 2, label: '学习计划', description: '调整AI生成的学习计划' },
        { id: 3, label: '主题设置', description: '切换深色/浅色模式' },
        { id: 4, label: '数据同步', description: '云端备份和恢复' }
      ]
    }
  },
  created() {
    this.fetchTasks()
  },
  methods: {
    async fetchTasks() {
      try {
        const response = await api.tasks.getAllTasks()
        console.log('Fetched tasks:', response)
        // 这里需要根据实际API返回的数据结构进行处理
        // 暂时使用模拟数据处理逻辑
        this.processTasks(response.data || [])
      } catch (error) {
        console.error('Failed to fetch tasks:', error)
        // 出错时使用模拟数据
        this.initializeMockData()
      }
    },
    
    // 修改processTasks方法，添加晚上的时间块和未指定时间的任务处理
    processTasks(tasks) {
      // 根据实际API返回的数据结构进行处理
      
      // 初始化时间块，包含晚上时间段和timeBlockType
      this.timeBlocks = [
        {
          id: 1,
          label: '早上 7:00 - 9:00',
          timeBlockType: 'morning',
          tasks: [],
          collapsed: false
        },
        {
          id: 2,
          label: '上午 9:00 - 12:00',
          timeBlockType: 'forenoon',
          tasks: [],
          collapsed: false
        },
        {
          id: 3,
          label: '下午 14:00 - 18:00',
          timeBlockType: 'afternoon',
          tasks: [],
          collapsed: false
        },
        {
          id: 4,
          label: '晚上 18:00 - 22:00',
          timeBlockType: 'evening',
          tasks: [],
          collapsed: false
        }
      ]
      
      // 清空现有任务
      this.quadrants.forEach(q => (q.tasks = []));
      this.unscheduledTasks = []
      
      // 遍历任务并分配
      tasks.forEach(task => {
        // 分配到四象限
        const quadrant = this.quadrants.find(q => q.id == task.quadrant)
        if (quadrant) {
          quadrant.tasks.push({
            id: task._id,
            title: task.title,
            completed: task.completed
          })
        }
        
        const taskData = {
          id: task._id,
          title: task.title,
          time: task.timeBlock && task.timeBlock.startTime ? `${task.timeBlock.startTime} - ${task.timeBlock.endTime}` : '未指定',
          priority: task.priority || 'medium',
          completed: task.completed
        };

        // 根据isScheduled和timeBlockType分配到时间块或未指定任务列表
        if (task.isScheduled && task.timeBlock && task.timeBlock.timeBlockType !== 'unscheduled') {
          const timeBlock = this.timeBlocks.find(tb => tb.timeBlockType === task.timeBlock.timeBlockType);
          if (timeBlock) {
            timeBlock.tasks.push(taskData);
          } else {
            this.unscheduledTasks.push(taskData);
          }
        } else {
          this.unscheduledTasks.push(taskData);
        }
      })

      // 自动折叠空的时间块
      this.timeBlocks.forEach(tb => {
        if (tb.tasks.length === 0) {
          tb.collapsed = true;
        }
      });
    },
    
    initializeMockData() {
      // 当API调用失败时的备用模拟数据
      this.timeBlocks = [
        {
          id: 1,
          label: '早上 7:00 - 9:00',
          tasks: [
            {
              id: 1,
              title: '英语晨读计划',
              time: '7:30 - 8:00',
              priority: 'high',
              completed: false
            }
          ],
          collapsed: false
        },
        {
          id: 2,
          label: '上午 9:00 - 12:00',
          tasks: [
            {
              id: 2,
              title: '考研数学复习',
              time: '9:00 - 11:00',
              priority: 'high',
              completed: true
            },
            {
              id: 3,
              title: '政治知识点背诵',
              time: '11:00 - 12:00',
              priority: 'medium',
              completed: false
            }
          ],
          collapsed: false
        },
        {
          id: 3,
          label: '下午 14:00 - 18:00',
          tasks: [
            {
              id: 4,
              title: '专业课笔记整理',
              time: '14:00 - 16:00',
              priority: 'medium',
              completed: false
            }
          ],
          collapsed: false
        },
        {
          id: 4,
          label: '晚上 18:00 - 22:00',
          tasks: [],
          collapsed: true // 初始没有任务，设为折叠
        }
      ]
      
      // 添加未指定时间的任务框
      this.unscheduledTasks = [
        {
          id: 5,
          title: '复习英语单词',
          priority: 'low',
          completed: false
        },
        {
          id: 6,
          title: '整理学习资料',
          priority: 'medium',
          completed: false
        }
      ]
      
      this.quadrants = [
        {
          id: 1,
          title: '重要且紧急',
          tasks: [
            {
              id: 2,
              title: '考研数学复习',
              completed: true
            }
          ]
        },
        {
          id: 2,
          title: '重要不紧急',
          tasks: [
            {
              id: 1,
              title: '英语晨读计划',
              completed: false
            },
            {
              id: 4,
              title: '专业课笔记整理',
              completed: false
            }
          ]
        },
        {
          id: 3,
          title: '紧急不重要',
          tasks: [
            {
              id: 3,
              title: '政治知识点背诵',
              completed: false
            }
          ]
        },
        {
          id: 4,
          title: '不重要不紧急',
          tasks: []
        }
      ]
    },
    
    // 添加折叠/展开功能
    toggleTimeBlockCollapse(timeBlockId) {
      const timeBlock = this.timeBlocks.find(tb => tb.id === timeBlockId)
      if (timeBlock) {
        timeBlock.collapsed = !timeBlock.collapsed
      }
    },
    
    // 添加未指定时间的任务到对应时间块
    moveToTimeBlock(task, timeBlockId) {
      const taskIndex = this.unscheduledTasks.findIndex(t => t.id === task.id)
      if (taskIndex > -1) {
        this.unscheduledTasks.splice(taskIndex, 1)
        const timeBlock = this.timeBlocks.find(tb => tb.id === timeBlockId)
        if (timeBlock) {
          timeBlock.tasks.push(task)
        }
      }
    },
    switchView(view) {
      this.currentView = view
    },
    toggleSidebar() {
      this.sidebarOpen = !this.sidebarOpen
    },
    openAddTask() {
      this.showAddModal = true
    },
    closeAddTask() {
      this.showAddModal = false
    },
    async handleAddTask(taskData) {
      try {
        const response = await api.tasks.createTask({
          title: taskData.title,
          description: taskData.description || '',
          priority: taskData.priority || 'medium',
          completed: false,
          quadrant: taskData.quadrant,
          // 其他需要的字段
        })
        console.log('Created task:', response)
        
        // 重新获取任务列表
        this.fetchTasks()
        this.closeAddTask()
      } catch (error) {
        console.error('Failed to create task:', error)
        // 出错时使用原有逻辑
        const task = {
          id: Date.now(), // 使用时间戳作为临时ID
          title: taskData.title,
          time: taskData.time,
          completed: false,
          date: taskData.date
        }
        
        // 添加到对应的象限
        const quadrant = this.quadrants.find(q => q.id === taskData.quadrant)
        if (quadrant) {
          quadrant.tasks.push(task)
        }
        
        // 同时添加到时间块（这里简化处理，可以根据实际需求调整）
        const defaultTimeBlock = this.timeBlocks[1] // 上午时间段
        if (defaultTimeBlock) {
          defaultTimeBlock.tasks.push(task)
        }
        
        this.closeAddTask()
      }
    },
    async toggleTask(task) {
      try {
        const response = await api.tasks.toggleTaskStatus(task.id)
        console.log('Toggled task status:', response)
        
        // 更新本地状态
        task.completed = !task.completed
      } catch (error) {
        console.error('Failed to toggle task status:', error)
        // 出错时使用原有逻辑
        task.completed = !task.completed
      }
    },
    openPomodoro(task) {
      this.$router.push(`/pomodoro?task=${encodeURIComponent(task.title)}`)
    }
  }
}
</script>

<style scoped>
.home-container {
  height: 100vh;
  background: #f2f2f7;
  display: flex;
  flex-direction: column;
}

.header {
  background: #fff;
  padding: 12px 20px;
  border-bottom: 0.5px solid #e5e5ea;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.settings-btn {
  width: 32px;
  height: 32px;
  border-radius: 16px;
  background: #f2f2f7;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;
}

.settings-btn:hover {
  background: #e5e5ea;
}

.view-toggle {
  display: flex;
  background: #f2f2f7;
  border-radius: 20px;
  padding: 4px;
  width: 200px;
}

.toggle-btn {
  flex: 1;
  padding: 8px 16px;
  border: none;
  background: transparent;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  color: #8e8e93;
}

.toggle-btn.active {
  background: #667eea;
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.content {
  flex: 1;
  overflow: hidden;
}

.sidebar {
  position: fixed;
  top: 0;
  left: -300px;
  width: 300px;
  height: 100vh;
  background: white;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  transition: left 0.3s ease;
  z-index: 1000;
  overflow-y: auto;
}

.sidebar.open {
  left: 0;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid #e5e5ea;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sidebar-title {
  font-size: 18px;
  font-weight: 600;
}

.close-sidebar {
  width: 32px;
  height: 32px;
  border-radius: 16px;
  background: #f2f2f7;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.sidebar-content {
  padding: 20px;
}

.setting-item {
  padding: 15px 0;
  border-bottom: 1px solid #f2f2f7;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-label {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 8px;
}

.setting-description {
  font-size: 14px;
  color: #8e8e93;
}



.overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: transparent;
  z-index: 999;
}

.add-task-btn {
  position: fixed;
  bottom: 90px;
  right: 20px;
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  cursor: pointer;
  transition: transform 0.2s;
  z-index: 100;
}

.add-task-btn:hover {
  transform: scale(1.1);
}

@media (max-width: 430px) {
  .header {
    padding: 10px 16px;
  }
  
  .view-toggle {
    width: 160px;
  }
  
  .section {
    margin: 16px;
  }
  
  .quadrant-grid {
    height: calc(100vh - 180px);
  }
  
  .sidebar {
    width: 280px;
  }
}
</style>