<template>
  <div class="ai-secretary-container">
    <PageHeader title="AI学习助手" />
    
    <div class="chat-container">
      <MessageCard 
        v-for="message in messages" 
        :key="message.id"
        :message="message"
      />
      
      <!-- Typing indicator -->
      <div v-if="isTyping" class="message ai-message">
        <div class="avatar">
          <font-awesome-icon icon="robot" />
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
    
    <MessageInput @sendMessage="sendMessage" />
    
    <!-- Suggestions Panel -->
    <div v-if="showSuggestions" class="suggestions-panel">
      <div class="suggestions-header">
        <h3>智能建议</h3>
        <button @click="showSuggestions = false">
          <font-awesome-icon icon="times" />
        </button>
      </div>
      <div class="suggestions-content">
        <div 
          v-for="suggestion in suggestions"
          :key="suggestion.id"
          class="suggestion-item"
          @click="applySuggestion(suggestion)"
        >
          <div class="suggestion-icon">
            <font-awesome-icon :icon="suggestion.icon" />
          </div>
          <div class="suggestion-text">
            <div class="suggestion-title">{{ suggestion.title }}</div>
            <div class="suggestion-desc">{{ suggestion.description }}</div>
          </div>
        </div>
      </div>
    </div>
    

  </div>
</template>

<script>
import PageHeader from '../components/AIsecretary/PageHeader.vue'
import MessageCard from '../components/AIsecretary/MessageCard.vue'
import MessageInput from '../components/AIsecretary/MessageInput.vue'

export default {
  name: 'AiSecretary',
  components: {
    PageHeader,
    MessageCard,
    MessageInput
  },
  data() {
    return {
      isTyping: false,
      showSuggestions: false,
      messages: [
        {
          id: 1,
          text: '你好！我是你的AI学习助手。我可以帮助你制定学习计划、调整任务安排，以及根据你的情绪状态优化学习节奏。请告诉我你想要实现什么学习目标？',
          isUser: false,
        }
      ],
      quickActions: [
        { id: 1, icon: 'graduation-cap', label: '考研规划', text: '我想制定考研学习计划' },
        { id: 2, icon: 'code', label: '编程学习', text: '我想学习编程' },
        { id: 3, icon: 'language', label: '英语提升', text: '我想提升英语水平' },
        { id: 4, icon: 'chart-line', label: '学习总结', text: '帮我总结最近的学习情况' }
      ],
      suggestions: [
        {
          id: 1,
          icon: 'clock',
          title: '调整学习时间',
          description: '根据你的作息习惯优化学习时间安排'
        },
        {
          id: 2,
          icon: 'brain',
          title: '智能任务分配',
          description: '基于任务难度和重要性智能安排'
        },
        {
          id: 3,
          icon: 'heart',
          title: '情绪调节',
          description: '根据当前状态调整学习强度'
        }
      ],
      aiResponses: [
        '我了解了你的需求，让我为你制定一个个性化的学习计划...',
        '根据你的情况，我建议采用番茄工作法来提高专注度。',
        '我注意到你可能有些疲惫，要不要先休息一下，或者调整今天的任务量？',
        '很好！你的学习进度不错。我建议在当前基础上增加一些挑战性任务。',
        '我为你生成了一个新的学习计划，已经根据你的反馈进行了调整。'
      ]
    }
  },
  methods: {
    sendMessage(text) {
      const userMessage = {
        id: Date.now(),
        text: text,
        isUser: true,
      }
      
      this.messages.push(userMessage)
      
      // Simulate AI response
      this.simulateAIResponse()
    },
    sendQuickMessage(text) {
      this.sendMessage(text)
    },
    simulateAIResponse() {
      this.isTyping = true
      
      setTimeout(() => {
        this.isTyping = false
        
        const aiMessage = {
          id: Date.now(),
          text: this.getRandomAIResponse(),
          isUser: false,
        }
        
        this.messages.push(aiMessage)
        
        // Show suggestions occasionally
        if (Math.random() > 0.7) {
          this.showSuggestions = true
        }
        
        // Auto scroll to bottom
        this.$nextTick(() => {
          this.scrollToBottom()
        })
      }, 1500 + Math.random() * 1000)
    },
    getRandomAIResponse() {
      return this.aiResponses[Math.floor(Math.random() * this.aiResponses.length)]
    },
    applySuggestion(suggestion) {
      const suggestionMessage = {
        id: Date.now(),
        text: `请帮我${suggestion.title}：${suggestion.description}`,
        isUser: true,
      }
      
      this.messages.push(suggestionMessage)
      this.showSuggestions = false
      this.simulateAIResponse()
    },
    scrollToBottom() {
      const chatContainer = document.querySelector('.chat-container')
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight
      }
    }
  },
  mounted() {
    this.scrollToBottom()
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
  border-radius: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin-right: 12px;
  flex-shrink: 0;
}

.user-avatar {
  background: linear-gradient(135deg, #34c759 0%, #30d158 100%);
  margin-right: 0;
  margin-left: 12px;
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
}

.quick-action-btn {
  pointer-events: all;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 10px;
  background: white;
  border: none;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.2s;
  width: 80px;
  height: 70px;
  flex-shrink: 0;
}

.quick-action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}

.quick-action-btn > svg {
  font-size: 20px;
  color: #333;
}

.quick-action-btn span {
  font-size: 11px;
  font-weight: 500;
  color: #333;
  text-align: center;
}

.suggestions-panel {
  position: fixed;
  top: 50%;
  left: 20px;
  right: 20px;
  transform: translateY(-50%);
  background: white;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  max-height: 60vh;
  overflow-y: auto;
}

.suggestions-header {
  padding: 20px;
  border-bottom: 1px solid #f2f2f7;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.suggestions-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1d1d1f;
}

.suggestions-header button {
  width: 32px;
  height: 32px;
  border-radius: 16px;
  border: none;
  background: #f2f2f7;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.suggestions-content {
  padding: 20px;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.2s;
  margin-bottom: 12px;
}

.suggestion-item:hover {
  background: #f8f9fa;
}

.suggestion-item:last-child {
  margin-bottom: 0;
}

.suggestion-icon {
  width: 48px;
  height: 48px;
  border-radius: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
}

.suggestion-text {
  flex: 1;
}

.suggestion-title {
  font-size: 16px;
  font-weight: 600;
  color: #1d1d1f;
  margin-bottom: 4px;
}

.suggestion-desc {
  font-size: 14px;
  color: #8e8e93;
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
    left: 16px;
    right: 16px;
  }
  
  .suggestions-panel {
    left: 16px;
    right: 16px;
  }
  
  .quick-action-btn {
    min-width: 70px;
    padding: 12px 8px;
  }
  
  .quick-action-btn span {
    font-size: 11px;
  }
}
</style>