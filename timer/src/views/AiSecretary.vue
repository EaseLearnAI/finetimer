<template>
  <div class="ai-secretary-container">
    <AIHeader 
      :assistant="assistant" 
      @openSettings="openSettingsModal" 
    />
    
    <!-- 连接状态显示 -->
    <div v-if="connectionStatus === 'connecting'" class="connection-status connecting">
      <font-awesome-icon icon="spinner" spin />
      <span>{{ connectionStatusText }}</span>
    </div>
    
    <!-- 错误提示 -->
    <div v-if="showError" class="error-banner" @click="reconnect">
      <font-awesome-icon icon="exclamation-circle" />
      <span>{{ errorMessage }}</span>
      <small>点击重试</small>
    </div>
    
    <div class="chat-container">
      <MessageCard 
        v-for="message in messages" 
        :key="message.id"
        :message="message"
      />
      
      <!-- Typing indicator -->
      <div v-if="isProcessing" class="message ai-message">
        <div class="avatar">
          <img :src="aiAssistantLogo" alt="AI assistant" class="avatar-image" />
        </div>
        <div class="message-content">
          <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Quick Actions -->
    <div class="quick-actions">
      <button 
        v-for="action in quickActions"
        :key="action.id"
        class="quick-action-btn"
        @click="sendQuickMessage(action.text)"
      >
        <font-awesome-icon :icon="action.icon" />
        <span>{{ action.label }}</span>
      </button>
    </div>
    
    <MessageInput @sendMessage="sendMessage" @sendVoiceMessage="sendVoiceMessage" @aiReply="handleAIReply" />
    
    <!-- AI助手设置模态框 -->
    <AssistantSettingsModal
      :visible="showSettingsModal"
      :assistant="assistant"
      @close="closeSettingsModal"
      @save="saveAssistantSettings"
    />

    <!-- 语音识别状态组件 -->
    <VoiceRecognitionStatus
      :show="showVoiceStatus"
      :type="voiceStatusType"
      :title="voiceStatusTitle"
      :message="voiceStatusMessage"
      :progress="voiceStatusProgress"
      :auto-close="voiceStatusAutoClose"
      @close="hideVoiceStatus"
    />

  </div>
</template>

<script>
import AIHeader from '../components/AIsecretary/Header.vue'
import MessageCard from '../components/AIsecretary/MessageCard.vue'
import MessageInput from '../components/AIsecretary/MessageInput.vue'
import AssistantSettingsModal from '../components/AIsecretary/AssistantSettingsModal.vue'
import VoiceRecognitionStatus from '../components/AIsecretary/VoiceRecognitionStatus.vue'

// 导入AI服务
import messageService from '../AIsiri/services/messageService.js'
import aisiriService from '../AIsiri/services/aiApi.js'
import aiAssistantService from '../AIsiri/services/aiAssistantService.js'
import speechRecognitionService from '../AIsiri/services/speechRecognitionService.js'
import { QUICK_ACTIONS } from '../AIsiri/types/index.js'
import { log } from '../AIsiri/utils/logger.js'

export default {
  name: 'AiSecretary',
  components: {
    AIHeader,
    MessageCard,
    MessageInput,
    AssistantSettingsModal,
    VoiceRecognitionStatus
  },
  data() {
    return {
      aiAssistantLogo: `${process.env.BASE_URL}ai_time_manager_logo_v1.png`,
      isTyping: false,
      messages: [],
      quickActions: QUICK_ACTIONS,
      messageService: messageService,
      // 添加连接状态
      connectionStatus: 'connecting', // connecting, connected, error
      // 添加错误信息
      errorMessage: null,
      // AI助手相关
      assistant: null,
      showSettingsModal: false,
      // 语音识别状态
      showVoiceStatus: false,
      voiceStatusType: 'processing',
      voiceStatusTitle: '',
      voiceStatusMessage: '',
      voiceStatusProgress: 0,
      voiceStatusAutoClose: 3000
    }
  },
  methods: {
    /**
     * 发送消息
     */
    async sendMessage(message) {
      // 检查消息类型
      if (typeof message === 'string') {
        // 文本消息
        if (!message || !message.trim()) {
          log.warn('发送消息失败：消息内容为空')
          return
        }

        try {
          log.user('发送文本消息', { message: message })
          
          const text = message.trim()

          // 1. 先展示用户消息
          this.messageService.addUserMessage(text)
          this.updateMessages()
          this.$nextTick(() => this.scrollToBottom())

          // 2. 显示加载动画
          this.isTyping = true
          
          // 3. 执行调度（不再重复添加用户消息）
          await this.messageService.dispatchAndRespond(text)
          
          // 4. 更新消息列表（加入 AI 回复）
          this.updateMessages()
          
          // 增加心动值
          await this.increaseHeartValue()
          
        } catch (error) {
          log.error('发送消息失败', error)
          this.handleError('发送消息时出现错误，请稍后重试')
        } finally {
          this.isTyping = false
          this.$nextTick(() => {
            this.scrollToBottom()
          })
        }
      } else if (message && message.type === 'image') {
        // 图片消息
        try {
          log.user('发送图片消息', { 
            fileName: message.fileName, 
            fileSize: message.fileSize,
            imageUrl: message.imageUrl 
          })
          
          // 直接添加用户图片消息到消息列表，不触发智能调度
          await this.messageService.addUserMessage(`🖼️ 图片：${message.fileName} (${this.formatFileSize(message.fileSize)})`, 'IMAGE', { imageUrl: message.imageUrl })
          
          // 更新消息列表
          this.updateMessages()
          
          // 滚动到底部
          this.$nextTick(() => {
            this.scrollToBottom()
          })
          
        } catch (error) {
          log.error('发送图片消息失败', error)
          this.handleError('发送图片消息时出现错误，请稍后重试')
        }
      } else {
        log.warn('发送消息失败：无效的消息格式')
        return
      }
    },

    /**
     * 格式化文件大小
     */
    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    /**
     * 发送语音消息
     */
    async sendVoiceMessage(voiceData) {
      try {
        log.user('发送语音消息', { 
          duration: voiceData.duration,
          transcription: voiceData.transcription 
        })
        
        // 如果有识别文本，发送到AI助手
        if (voiceData.transcription) {
          // 显示处理状态
          this.isTyping = true;
          
          // 使用消息服务的语音处理方法（会自动添加用户语音消息）
          await this.messageService.processVoiceInput(voiceData);
          
          // 更新消息列表
          this.updateMessages();
          
          // 增加心动值
          await this.increaseHeartValue();
        }
        
      } catch (error) {
        log.error('发送语音消息失败', error);
        this.handleError('发送语音消息失败，请重试');
      } finally {
        this.isTyping = false;
        this.$nextTick(() => {
          this.scrollToBottom();
        });
      }
    },



    /**
     * 发送快速消息
     */
    async sendQuickMessage(text) {
      log.user('使用快速操作', { message: text })
      await this.sendMessage(text)
    },

    /**
     * 更新消息列表
     */
    updateMessages() {
      this.messages = this.messageService.getMessages()
      log.debug('消息列表已更新', { messageCount: this.messages.length })
    },

    /**
     * 处理错误
     */
    handleError(message) {
      this.errorMessage = message
      this.connectionStatus = 'error'
      
      // 3秒后自动清除错误信息
      setTimeout(() => {
        this.errorMessage = null
        this.connectionStatus = 'connected'
      }, 3000)
    },

    /**
     * 检查连接状态
     */
    async checkConnection() {
      try {
        log.api('检查AIsiri智能调度服务连接状态')
        this.connectionStatus = 'connecting'
        
        const response = await aisiriService.healthCheck()
        
        if (response.success) {
          this.connectionStatus = 'connected'
          log.success('AIsiri智能调度服务连接正常')
        } else {
          throw new Error('健康检查失败')
        }
        
      } catch (error) {
        log.error('连接检查失败', error)
        this.connectionStatus = 'error'
        this.errorMessage = '无法连接到AIsiri智能调度服务，请检查网络连接'
      }
    },

    /**
     * 重新连接
     */
    async reconnect() {
      log.info('尝试重新连接AIsiri智能调度服务')
      await this.checkConnection()
    },

    /**
     * 清除所有消息
     */
    clearMessages() {
      log.user('清除消息历史')
      this.messageService.clearMessages()
      this.updateMessages()
    },

    /**
     * 滚动到底部
     */
    scrollToBottom() {
      this.$nextTick(() => {
        const chatContainer = document.querySelector('.chat-container')
        if (chatContainer) {
          chatContainer.scrollTop = chatContainer.scrollHeight
        }
      })
    },

    /**
     * 导出聊天记录（调试用）
     */
    exportChatHistory() {
      const history = this.messageService.exportMessages()
      log.table(history, '聊天记录导出')
      
      // 下载为JSON文件
      const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `aisiri_chat_history_${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
    },

    /**
     * 增加心动值
     */
    async increaseHeartValue() {
      try {
        await aiAssistantService.increaseHeartValue()
        log.info('心动值增加成功')
      } catch (error) {
        log.error('增加心动值失败:', error)
        // 不影响主要功能，只记录错误
      }
    },

    /**
     * 打开设置模态框
     */
    openSettingsModal() {
      this.showSettingsModal = true
    },

    /**
     * 关闭设置模态框
     */
    closeSettingsModal() {
      this.showSettingsModal = false
    },

    /**
     * 保存AI助手设置
     */
    async saveAssistantSettings(newName) {
      try {
        await aiAssistantService.updateAssistantName(newName)
        log.success('AI助手名称更新成功:', newName)
        // 显示成功提示
        this.$toast?.success?.(`AI助手名称已更新为"${newName}"`) || 
        console.log(`AI助手名称已更新为"${newName}"`)
      } catch (error) {
        log.error('更新AI助手名称失败:', error)
        // 显示错误提示
        this.$toast?.error?.(error.message || '更新失败，请重试') || 
        console.error('更新失败:', error.message)
        throw error
      }
    },

    /**
     * 初始化AI助手
     */
    async initializeAIAssistant() {
      try {
        // 添加监听器，当AI助手信息更新时同步到组件状态
        aiAssistantService.addListener(this.updateAssistantFromService)
        
        // 初始化AI助手
        await aiAssistantService.initialize()
        this.assistant = aiAssistantService.getCurrentAssistant()
        
        log.success('AI助手初始化完成:', this.assistant)
      } catch (error) {
        log.error('AI助手初始化失败:', error)
        // 创建默认助手信息
        this.assistant = {
          id: 'default',
          name: 'AI学习助手',
          heartValue: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      }
    },

    /**
     * 从服务更新AI助手信息（监听器回调）
     */
    updateAssistantFromService(assistant) {
      this.assistant = assistant
      log.debug('AI助手信息已更新:', assistant)
    },

    /**
     * 显示语音识别状态
     */
    showVoiceStatusBar(type, title, message, progress = 0, autoClose = 3000) {
      this.voiceStatusType = type
      this.voiceStatusTitle = title
      this.voiceStatusMessage = message
      this.voiceStatusProgress = progress
      this.voiceStatusAutoClose = autoClose
      this.showVoiceStatus = true
      
      log.info('显示语音识别状态', { type, title, message, progress })
    },

    /**
     * 隐藏语音识别状态
     */
    hideVoiceStatus() {
      this.showVoiceStatus = false
      log.info('隐藏语音识别状态')
    },

    /**
     * 更新语音识别进度
     */
    updateVoiceStatusProgress(progress) {
      this.voiceStatusProgress = progress
    },

    /**
     * 处理AI回复（图片分析结果等）
     */
    async handleAIReply(replyContent) {
      try {
        log.info('收到AI回复', { content: replyContent })
        
        // 直接添加AI回复到消息列表，不触发智能调度
        await this.messageService.addAIReply(replyContent)
        
        // 更新消息列表
        this.updateMessages()
        
        // 滚动到底部
        this.$nextTick(() => {
          this.scrollToBottom()
        })
        
        log.success('AI回复已添加')
        
      } catch (error) {
        log.error('处理AI回复失败', error)
        this.handleError('处理AI回复时出现错误，请稍后重试')
      }
    },

    /**
     * 监听语音识别服务状态变化
     */
    setupVoiceRecognitionListener() {
      // 监听语音识别服务的状态变化
      const checkStatus = () => {
        const isProcessing = speechRecognitionService.getProcessingStatus()
        
        if (isProcessing && !this.showVoiceStatus) {
          this.showVoiceStatusBar(
            'processing',
            '语音识别中',
            '正在处理音频文件，请稍候...',
            0
          )
        } else if (!isProcessing && this.showVoiceStatus && this.voiceStatusType === 'processing') {
          this.hideVoiceStatus()
        }
      }
      
      // 定期检查状态
      this.voiceStatusInterval = setInterval(checkStatus, 500)
    }
  },
  async mounted() {
    log.info('AIsiri智能调度助手页面初始化')
    
    try {
      // 1. 初始化AI助手
      await this.initializeAIAssistant()
      
      // 2. 初始化消息列表
      this.updateMessages()
      
      // 3. 检查连接状态
      await this.checkConnection()
      
      // 4. 设置语音识别监听器
      this.setupVoiceRecognitionListener()
      
      // 5. 滚动到底部
      this.scrollToBottom()
      
      log.success('AIsiri智能调度助手页面初始化完成')
      
    } catch (error) {
      log.error('页面初始化失败', error)
      this.handleError('初始化失败，请刷新页面重试')
    }
  },
  
  beforeUnmount() {
    log.info('AIsiri智能调度助手页面卸载')
    // 移除AI助手监听器
    aiAssistantService.removeListener(this.updateAssistantFromService)
    
    // 清理语音识别状态检查定时器
    if (this.voiceStatusInterval) {
      clearInterval(this.voiceStatusInterval)
    }
  },
  
  watch: {
    // 监听消息变化，自动滚动到底部
    messages: {
      handler() {
        this.$nextTick(() => {
          this.scrollToBottom()
        })
      },
      deep: true
    },
    
    // 监听连接状态变化
    connectionStatus(newStatus) {
      log.info(`连接状态变更: ${newStatus}`)
    }
  },
  
  computed: {
    // 计算是否正在处理
    isProcessing() {
      return this.messageService.isCurrentlyProcessing() || this.isTyping
    },
    
    // 计算连接状态显示
    connectionStatusText() {
      const statusMap = {
        connecting: '连接中...',
        connected: '已连接',
        error: '连接失败'
      }
      return statusMap[this.connectionStatus] || '未知状态'
    },
    
    // 计算是否显示错误状态
    showError() {
      return this.connectionStatus === 'error' && this.errorMessage
    }
  }
}
</script>

<style scoped>
:root {
    --primary-bg: #f7f7f7;
    --chat-bg: #f7f7f7;
    --white: #ffffff;
    --text-primary: #000000;
    --text-secondary: #666666;
    --text-time: #999999;
    --blue: #007aff;
    --green: #07c160;
    --border: #e5e5e5;
    --shadow: 0 1px 3px rgba(0,0,0,0.1);
    --shadow-up: 0 -1px 3px rgba(0,0,0,0.1);
}

.ai-secretary-container {
  height: 100vh;
  background: var(--primary-bg);
  display: flex;
  flex-direction: column;
}

.chat-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  padding-bottom: 160px; /* Adjust for input and quick actions */
}

.message {
  display: flex;
  margin-bottom: 16px;
  animation: fadeIn 0.3s ease-in;
}

.ai-message {
  justify-content: flex-start;
}

.user-message {
  justify-content: flex-end;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  flex-shrink: 0;
  overflow: visible;
  background: transparent;
  box-shadow: none;
}

.user-avatar {
  background: linear-gradient(135deg, #34c759 0%, #30d158 100%);
  margin-right: 0;
  margin-left: 12px;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  border-radius: 12px;
}

.message-content {
  max-width: 80%;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 12px 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.user-message .message-content {
  background: rgba(0, 122, 255, 0.9);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 122, 255, 0.3);
  color: white;
}

.message-text {
  font-size: 16px;
  line-height: 1.4;
  word-wrap: break-word;
}

.typing-indicator {
  display: flex;
  gap: 4px;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #8e8e93;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
.typing-indicator span:nth-child(2) { animation-delay: -0.16s; }

.quick-actions {
  position: fixed;
  bottom: 85px;
  left: 16px;
  display: flex;
  gap: 12px;
  overflow-x: auto;
  background: transparent;
  max-width: calc(100% - 32px);
  padding: 8px 0;
  /* 隐藏滚动条 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE 10+ */
  scroll-behavior: smooth;
}

.quick-actions::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Edge */
}

.quick-action-btn {
  pointer-events: all;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: none;
  border-radius: 20px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 88px;
  height: 76px;
  flex-shrink: 0;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.quick-action-btn:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  background: rgba(255, 255, 255, 1);
}

.quick-action-btn:active {
  transform: translateY(-1px) scale(0.98);
}

.quick-action-btn > svg {
  font-size: 22px;
  color: #4a90e2;
  margin-bottom: 2px;
  transition: color 0.2s ease;
}

.quick-action-btn:hover > svg {
  color: #007aff;
}

.quick-action-btn span {
  font-size: 12px;
  font-weight: 600;
  color: #1d1d1f;
  text-align: center;
  line-height: 1.2;
  white-space: nowrap;
}



@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes typing {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

/* 连接状态样式 */
.connection-status {
  padding: 8px 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #6c757d;
}

.connection-status.connecting {
  background: #e3f2fd;
  color: #1976d2;
}

.connection-status svg {
  font-size: 16px;
}

/* 错误横幅样式 */
.error-banner {
  padding: 12px 16px;
  background: #ffebee;
  border-bottom: 1px solid #ffcdd2;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.error-banner:hover {
  background: #ffcdd2;
}

.error-banner svg {
  color: #d32f2f;
  font-size: 16px;
}

.error-banner span {
  flex: 1;
  color: #d32f2f;
  font-weight: 500;
}

.error-banner small {
  color: #757575;
  font-size: 12px;
}

@media (max-width: 430px) {
  .chat-container {
    padding: 16px;
    padding-bottom: 160px;
  }
  
  .message-content {
    max-width: 85%;
  }
  
  .quick-actions {
    bottom: 80px; /* Adjust for smaller screens */
    left: 12px;
    max-width: calc(100% - 24px);
    gap: 10px;
  }
  

  
  .quick-action-btn {
    min-width: 80px;
    height: 72px;
    padding: 10px 12px;
    border-radius: 16px;
  }
  
  .quick-action-btn > svg {
    font-size: 20px;
  }
  
  .quick-action-btn span {
    font-size: 11px;
    font-weight: 500;
  }
}
</style>