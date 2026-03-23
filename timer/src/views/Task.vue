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
      <div v-if="currentView === 'time'" class="time-view-container">
        <!-- Time Segment Selector -->
        <div class="time-segment-section">
          <div class="section-title">
            <h3>时间段</h3>
            <a href="/task-collections" class="view-all-link">任务集</a>
          </div>
          <div class="segmented">
            <button 
              v-for="segment in timeSegments"
              :key="segment.value"
              :class="{ active: currentTimeSegment === segment.value }"
              @click="switchTimeSegment(segment.value)"
            >
              {{ segment.label }}
            </button>
          </div>
        </div>
        
        <!-- Time Blocks -->
        <TaskTimeBlocks
          :time-blocks="filteredTimeBlocks"
          @task-click="openPomodoro"
          @task-toggle="toggleTask"
          @toggle-collapse="toggleTimeBlockCollapse"
        />
      </div>
      
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
        <div v-for="setting in settings" :key="setting.id" class="setting-item" @click="handleSettingClick(setting)">
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
    
    <!-- Voice Clone Modal -->
    <VoiceCloneModal
      v-if="showVoiceCloneModal"
      :hasCloned="hasClonedVoice"
      @close="showVoiceCloneModal = false"
      @clone-success="onCloneSuccess"
    />

    <!-- AI Voice Modal -->
    <AIVoiceModal
      v-if="showAIVoiceModal"
      @close="showAIVoiceModal = false"
      @apply-voice="onApplyVoice"
    />
 
    <!-- Overlay -->
    <div 
      v-if="sidebarOpen" 
      class="overlay" 
      @click="toggleSidebar"
    ></div>
    
    <!-- AI Assistant Button -->
    <div 
      class="ai-assistant-btn" 
      @click="goToAISecretary"
    >
      <img :src="aiAssistantLogo" alt="AI assistant" class="ai-assistant-icon" />
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
import VoiceCloneModal from '../components/aivoice/VoiceCloneModal.vue'
import AIVoiceModal from '../components/aivoice/AIVoiceModal.vue'
import api from '@/api'
import { playRandomVoice } from '@/aivoice/voicePlayer.js'

export default {
  name: 'TaskPage',
  components: {
    TaskTimeBlocks,
    TaskQuadrant,
    AddTaskModal,
    TabBar,
    VoiceCloneModal,
    AIVoiceModal
  },
  data() {
    return {
      aiAssistantLogo: `${process.env.BASE_URL}ai_time_manager_logo_v1.png`,
      currentView: 'time',
      currentTimeSegment: 'morning', // 当前选中的时间段
      sidebarOpen: false,
      showAddModal: false,
      timeBlocks: [],
      unscheduledTasks: [], // 添加未指定时间的任务数组
      timeSegments: [
        { value: 'morning', label: '早上' },
        { value: 'afternoon', label: '下午' },
        { value: 'evening', label: '晚上' }
      ],
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
        { id: 4, label: '数据同步', description: '云端备份和恢复' },
        { id: 5, label: 'AI语音', description: '定制你的ai语音助手' },
        { id: 6, label: '退出登录', description: '退出到登录界面' }
      ],
      showVoiceCloneModal: false,
      hasClonedVoice: false,
      showAIVoiceModal: false
    }
  },
  computed: {
    filteredTimeBlocks() {
      // 根据当前选中的时间段过滤时间块
      return this.timeBlocks.filter(block => {
        const segmentMap = {
          'morning': ['morning'],
          'afternoon': ['afternoon'],
          'evening': ['evening']
        };
        return segmentMap[this.currentTimeSegment]?.includes(block.timeBlockType);
      });
    },
    currentUserId() {
      const user = JSON.parse(localStorage.getItem('user') || 'null')
      return user?._id || user?.id || null
    }
  },
  created() {
    this.fetchTasks()
  },
  activated() {
    // 若使用keep-alive，则返回时自动刷新
    this.fetchTasks()
    // 返回时也自动切换到对应时间段
    this.autoSwitchTimeSegment()
  },
  methods: {
    handleSettingClick(setting) {
      if (setting && (setting.id === 5 || setting.label === 'AI语音')) {
        this.showVoiceCloneModal = true
      } else if (setting && (setting.id === 6 || setting.label === '退出登录')) {
        try {
          console.log('🔒 [TaskPage] 执行退出登录')
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          localStorage.removeItem('auth_verified')
        } finally {
          this.sidebarOpen = false
          this.$router.replace({ path: '/auth/login' })
        }
      }
    },
    onCloneSuccess() {
      this.hasClonedVoice = true
      this.showVoiceCloneModal = false
      // 打开AI语音陪伴设置弹窗
      this.showAIVoiceModal = true
    },
    onApplyVoice() {
      // 关闭AI语音弹窗；保留简单处理以不影响原有逻辑
      this.showAIVoiceModal = false
    },
    async fetchTasks() {
      try {
        console.log('🔄 [TaskPage] 开始获取任务列表...');
        
        // 未登录防护
        const userId = this.currentUserId
        if (!userId) {
          console.warn('⚠️ [TaskPage] 未登录，跳转到登录页')
          this.$router.replace({ path: '/auth/login', query: { redirect: this.$route.fullPath } })
          return
        }

        // 直接获取所有任务，不再按日期过滤
        console.log('📋 [TaskPage] 获取所有任务...');
        const response = await api.tasks.getAllTasks({ userId })
        console.log('📋 [TaskPage] 任务响应:', response)
        
        if (response.success && response.data) {
          console.log('✅ [TaskPage] 成功获取任务:', response.data.length);
          this.processTasks(response.data)
        } else {
          console.warn('⚠️ [TaskPage] 任务响应格式异常，使用模拟数据');
          this.initializeMockData()
        }
      } catch (error) {
        console.error('❌ [TaskPage] 获取任务失败:', error)
        // 出错时使用模拟数据
        this.initializeMockData()
      }
    },
    // 外部刷新任务列表（供番茄钟完成后触发）
    async refreshTasks() {
      await this.fetchTasks()
    },
    
    // 修改processTasks方法，处理实际API返回的任务数据
    processTasks(tasks) {
      console.log('📊 [TaskPage] 开始处理任务数据:', tasks.length);
      
      // 初始化时间块，支持更细分的时间段
      this.timeBlocks = [
        {
          id: 1,
          label: '早晨 0:00 - 8:00',
          timeBlockType: 'morning',
          tasks: [],
          collapsed: false
        },
        {
          id: 2,
          label: '上午 8:00 - 16:00',
          timeBlockType: 'afternoon',
          tasks: [],
          collapsed: false
        },
        {
          id: 3,
          label: '晚上 16:00 - 24:00',
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
        console.log('🔍 [TaskPage] 处理任务:', task.title, task);
        
        // 分配到四象限
        const quadrant = this.quadrants.find(q => q.id == task.quadrant)
        if (quadrant) {
          quadrant.tasks.push({
            id: task._id,
            title: task.title,
            completed: task.completed
          })
        }
        
        // 基于API返回的新数据结构处理时间信息
        let taskTimeDisplay = '未指定';
        let targetTimeBlockType = 'unscheduled';
        
        // 判断是AI生成的日程还是用户生成的日程
        if (task.timeBlock && task.timeBlock.startTime) {
          // AI生成的日程，使用timeBlock.startTime作为判断标准
          const hour = parseInt(task.timeBlock.startTime.split(':')[0]);
          taskTimeDisplay = `${task.timeBlock.startTime} - ${task.timeBlock.endTime || this.addHour(task.timeBlock.startTime)}`;
          
          if (hour >= 0 && hour < 8) {
            targetTimeBlockType = 'morning';
          } else if (hour >= 8 && hour < 16) {
            targetTimeBlockType = 'afternoon';
          } else if (hour >= 16 && hour < 24) {
            targetTimeBlockType = 'evening';
          }
          console.log(`🎯 [TaskPage] AI生成任务"${task.title}"根据startTime计算时间块类型: ${targetTimeBlockType}`);
        } else if (task.time && task.time.trim()) {
          // 用户生成的日程，使用time作为判断标准
          const hour = parseInt(task.time.split(':')[0]);
          taskTimeDisplay = `${task.time} - ${this.addHour(task.time)}`;
          
          if (hour >= 0 && hour < 8) {
            targetTimeBlockType = 'morning';
          } else if (hour >= 8 && hour < 16) {
            targetTimeBlockType = 'afternoon';
          } else if (hour >= 16 && hour < 24) {
            targetTimeBlockType = 'evening';
          }
          console.log(`⏰ [TaskPage] 用户生成任务"${task.title}"根据time计算时间块类型: ${targetTimeBlockType}`);
        }
        
        const taskData = {
          id: task._id,
          title: task.title,
          time: taskTimeDisplay,
          priority: task.priority || 'medium',
          completed: task.completed
        };

        // 分配到对应的时间块
        if (targetTimeBlockType !== 'unscheduled') {
          const timeBlock = this.timeBlocks.find(tb => tb.timeBlockType === targetTimeBlockType);
          if (timeBlock) {
            timeBlock.tasks.push(taskData);
            console.log(`📍 [TaskPage] 任务"${task.title}"分配到${timeBlock.label}`);
          } else {
            this.unscheduledTasks.push(taskData);
          }
        } else {
          // 没有时间的任务放到未指定任务列表
          this.unscheduledTasks.push(taskData);
          console.log(`📍 [TaskPage] 任务"${task.title}"分配到未指定任务`);
        }
      })

      // 添加详细的调试信息
      console.log('📊 [TaskPage] 时间块任务分配详情:');
      this.timeBlocks.forEach(tb => {
        console.log(`  ${tb.label} (${tb.timeBlockType}): ${tb.tasks.length}个任务`);
        tb.tasks.forEach(task => {
          console.log(`    - ${task.title} (${task.time})`);
        });
        
        // 自动折叠空的时间块，展开有任务的时间块
        if (tb.tasks.length === 0) {
          tb.collapsed = true;
        } else {
          tb.collapsed = false;
        }
      });
      
      console.log(`📋 [TaskPage] 未指定时间任务: ${this.unscheduledTasks.length}个`);
      this.unscheduledTasks.forEach(task => {
        console.log(`  - ${task.title}`);
      });
    },
    
    initializeMockData() {
      console.log('⚠️ [TaskPage] API调用失败，使用模拟数据');
      // 当API调用失败时的备用模拟数据，使用与processTasks相同的结构
      this.timeBlocks = [
        {
          id: 1,
          label: '早晨 0:00 - 8:00',
          timeBlockType: 'morning',
          tasks: [
            {
              id: 1,
              title: '英语晨读计划',
              time: '7:30 - 8:30',
              priority: 'high',
              completed: false
            }
          ],
          collapsed: false
        },
        {
          id: 2,
          label: '上午 8:00 - 16:00',
          timeBlockType: 'afternoon',
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
            },
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
          id: 3,
          label: '晚上 16:00 - 24:00',
          timeBlockType: 'evening',
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
        console.log('🔄 [TaskPage] 开始创建任务:', taskData);
        
        const userId = this.currentUserId
        if (!userId) {
          console.warn('⚠️ [TaskPage] 未登录，跳转到登录页')
          this.$router.replace({ path: '/auth/login', query: { redirect: this.$route.fullPath } })
          return
        }
        
        const response = await api.tasks.createTask({
          title: taskData.title,
          description: taskData.description || '',
          priority: taskData.priority || 'medium',
          completed: false,
          quadrant: taskData.quadrant,
          date: taskData.date,
          time: taskData.time,
          userId,
          timeBlockType: taskData.timeBlockType,
          isScheduled: taskData.isScheduled
        })
        console.log('✅ [TaskPage] 任务创建成功:', response)
        
        // 重新获取任务列表
        await this.fetchTasks()
        this.closeAddTask()
      } catch (error) {
        console.error('❌ [TaskPage] 创建任务失败:', error)
        // 出错时使用原有逻辑
        const task = {
          id: Date.now(), // 使用时间戳作为临时ID
          title: taskData.title,
          time: taskData.time ? `${taskData.time} - ${this.addHour(taskData.time)}` : '未指定',
          priority: taskData.priority || 'medium',
          completed: false,
          date: taskData.date
        }
        
        // 添加到对应的象限
        const quadrant = this.quadrants.find(q => q.id === taskData.quadrant)
        if (quadrant) {
          quadrant.tasks.push(task)
        }
        
        // 根据时间添加到对应的时间块
        if (taskData.time && taskData.timeBlockType) {
          const timeBlock = this.timeBlocks.find(tb => tb.timeBlockType === taskData.timeBlockType);
          if (timeBlock) {
            timeBlock.tasks.push(task);
            console.log(`✅ [TaskPage] 任务添加到${timeBlock.label}:`, task.title);
          }
        }
        
        this.closeAddTask()
      }
    },
    
    // 辅助方法：给时间加一小时
    addHour(time) {
      const [hour, minute] = time.split(':').map(Number);
      const newHour = (hour + 1) % 24;
      return `${newHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    },
    

    async toggleTask(task) {
      try {
        const response = await api.tasks.toggleTaskStatus(task.id)
        console.log('Toggled task status:', response)
        
        // 更新本地状态
        const willBeCompleted = !task.completed
        task.completed = willBeCompleted
        
        // 若刚完成，播放鼓励语音
        if (willBeCompleted) {
          playRandomVoice('encourage')
        }
      } catch (error) {
        console.error('Failed to toggle task status:', error)
        // 出错时使用原有逻辑
        task.completed = !task.completed
      }
    },
    openPomodoro(task) {
      this.$router.push({
        path: '/pomodoro',
        query: { task: task.title, taskId: task.id, from: '/task' }
      })
    },
    
    // 切换时间段
    switchTimeSegment(segment) {
      console.log('🔄 [TaskPage] 切换时间段:', segment);
      this.currentTimeSegment = segment;
    },
    
    // 根据当前时间自动切换到对应时间段
    autoSwitchTimeSegment() {
      const now = new Date();
      const currentHour = now.getHours();
      
      let targetSegment = 'morning'; // 默认早上
      
      if (currentHour >= 0 && currentHour < 8) {
        targetSegment = 'morning';
      } else if (currentHour >= 8 && currentHour < 16) {
        targetSegment = 'afternoon';
      } else if (currentHour >= 16 && currentHour < 24) {
        targetSegment = 'evening';
      }
      
      console.log(`🕐 [TaskPage] 当前时间: ${currentHour}:00, 自动切换到: ${targetSegment}`);
      this.currentTimeSegment = targetSegment;
    },
    
    // 跳转到AI助手页面
    goToAISecretary() {
      console.log('🤖 [TaskPage] 跳转到AI助手页面');
      this.$router.push('/ai-secretary');
    }
  },
  mounted() {
    console.log('🔄 [TaskPage] 组件挂载，开始获取任务...');
    // 页面加载时立即获取任务
    this.fetchTasks();
    
    // 根据当前时间自动切换到对应时间段
    this.autoSwitchTimeSegment();
    
    // 监听AI生成计划事件，自动刷新任务列表
    this._aiPlanHandler = () => {
      console.log('🎯 [TaskPage] 收到AI计划生成事件，刷新任务列表');
      this.refreshTasks();
    }
    window.addEventListener('ai-dispatch-completed', this._aiPlanHandler);
    

  },
  beforeUnmount() {
    if (this._aiPlanHandler) {
      window.removeEventListener('ai-dispatch-completed', this._aiPlanHandler)
      this._aiPlanHandler = null
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

.ai-assistant-btn {
  position: fixed;
  bottom: 100px;
  right: 20px;
  width: 56px;
  height: 56px;
  border-radius: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  box-shadow: 0 8px 20px rgba(31, 41, 55, 0.12);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 100;
  user-select: none;
  touch-action: none;
  overflow: hidden;
}

.ai-assistant-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 12px 28px rgba(31, 41, 55, 0.18);
}

.ai-assistant-btn:active {
  transform: scale(0.95);
}

.ai-assistant-icon {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
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

/* 时间段选择器样式 */
.time-view-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.time-segment-section {
  padding: 16px 20px 8px;
  background: white;
  border-bottom: 1px solid #f2f2f7;
}

.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.section-title h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1d1d1f;
  margin: 0;
}

.view-all-link {
  font-size: 14px;
  color: #007aff;
  text-decoration: none;
  font-weight: 500;
}

.view-all-link:hover {
  text-decoration: underline;
}

/* 分段控件样式 - 参考home111.html */
.segmented {
  display: flex;
  background: #f2f2f7;
  border-radius: 12px;
  padding: 2px;
  width: 100%;
}

.segmented button {
  flex: 1;
  padding: 10px 16px;
  border: none;
  background: transparent;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  color: #8e8e93;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.segmented button.active {
  background: white;
  color: #1d1d1f;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
}

.segmented button:hover:not(.active) {
  color: #1d1d1f;
}

/* 响应式适配 */
@media (max-width: 430px) {
  .time-segment-section {
    padding: 12px 16px 6px;
  }
  
  .section-title h3 {
    font-size: 16px;
  }
  
  .segmented button {
    padding: 8px 12px;
    font-size: 13px;
  }
}
</style>