<template>
  <div class="message"
    :class="{ 'user-message': message.isUser, 'ai-message': !message.isUser }">
    <div v-if="!message.isUser" class="avatar">
      <font-awesome-icon icon="robot" />
    </div>
    <div class="message-content">
      <!-- 普通文本消息 -->
      <div v-if="isTextMessage" class="message-text">{{ message.content }}</div>
      
      <!-- 图片消息 -->
      <div v-else-if="isImageMessage" class="image-message">
        <img :src="extractImageUrl(message.content)" :alt="'用户上传的图片'" class="message-image" />
      </div>
      
      <!-- 语音消息 -->
      <div v-else-if="isVoiceMessage" class="voice-message">
        <div class="voice-content">
          <div class="voice-icon">
            <font-awesome-icon icon="play" />
          </div>
          <div class="voice-duration">{{ formatDuration(message.duration || 0) }}</div>
        </div>
        <!-- 不显示语音识别文本 -->
      </div>
      
      <!-- 问题列表消息 -->
      <div v-else-if="isQuestionsMessage" class="questions-container">
        <div class="message-text">{{ message.content }}</div>
        <div class="questions-list">
          <div 
            v-for="(question, index) in message.metadata.questions"
            :key="index"
            class="question-item"
          >
            <span class="question-number">{{ index + 1 }}</span>
            <span class="question-text">{{ question }}</span>
          </div>
        </div>
        <div class="questions-tip">
          <font-awesome-icon icon="lightbulb" />
          <span>请逐一回答这些问题，我会根据你的回答制定详细计划</span>
        </div>
      </div>
      
      <!-- 任务创建成功消息 -->
      <div v-else-if="isTaskCreatedMessage" class="task-created-container">
        <div class="message-text">{{ message.content }}</div>
        <div v-if="message.metadata.task" class="task-info">
          <div class="task-title">
            <font-awesome-icon icon="check-circle" />
            <span>{{ message.metadata.task.title }}</span>
          </div>
          <div class="task-details">
            <div class="task-detail">
              <span class="label">优先级：</span>
              <span class="value priority" :class="message.metadata.task.priority">
                {{ getPriorityText(message.metadata.task.priority) }}
              </span>
            </div>
            <div class="task-detail">
              <span class="label">时间安排：</span>
              <span class="value">{{ getTimeBlockText(message.metadata.task.timeBlock) }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 计划展示消息 -->
      <div v-else-if="isPlanMessage" class="plan-container">
        <div class="message-text">{{ message.content }}</div>
        <div v-if="message.metadata.plan" class="plan-info">
          <div class="plan-overview">{{ message.metadata.plan.plan_overview }}</div>
          <div class="plan-summary" v-if="message.metadata.summary">
            <div class="summary-item">
              <font-awesome-icon icon="folder" />
              <span>{{ message.metadata.summary.collections_count }}个任务集</span>
            </div>
            <div class="summary-item">
              <font-awesome-icon icon="tasks" />
              <span>{{ message.metadata.summary.tasks_count }}个任务</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 动态调整消息 -->
      <div v-else-if="isDynamicAdjustmentMessage" class="dynamic-adjustment-container">
        <div class="message-text">{{ message.content }}</div>
        <div v-if="message.metadata.adjustmentSummary" class="adjustment-summary">
          <div class="adjustment-header">
            <font-awesome-icon icon="magic" />
            <span>任务调整结果</span>
          </div>
          <div class="adjustment-stats">
            <div class="stat-item" v-if="message.metadata.adjustmentSummary.modified_tasks > 0">
              <font-awesome-icon icon="edit" />
              <span>修改了 {{ message.metadata.adjustmentSummary.modified_tasks }} 个任务</span>
            </div>
            <div class="stat-item" v-if="message.metadata.adjustmentSummary.postponed_tasks > 0">
              <font-awesome-icon icon="clock" />
              <span>延后了 {{ message.metadata.adjustmentSummary.postponed_tasks }} 个任务</span>
            </div>
            <div class="stat-item" v-if="message.metadata.adjustmentSummary.new_tasks > 0">
              <font-awesome-icon icon="plus-circle" />
              <span>新增了 {{ message.metadata.adjustmentSummary.new_tasks }} 个任务</span>
            </div>
            <div class="stat-item" v-if="message.metadata.adjustmentSummary.cancelled_tasks > 0">
              <font-awesome-icon icon="times-circle" />
              <span>取消了 {{ message.metadata.adjustmentSummary.cancelled_tasks }} 个任务</span>
            </div>
          </div>
          <div v-if="message.metadata.userState" class="user-state-info">
            <div class="state-indicator">
              <span class="state-label">检测状态：</span>
              <span class="state-value" :class="getStateClass(message.metadata.userState.primaryState)">
                {{ getStateText(message.metadata.userState.primaryState) }}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 错误消息 -->
      <div v-else-if="isErrorMessage" class="error-container">
        <div class="message-text error-text">
          <font-awesome-icon icon="exclamation-circle" />
          <span>{{ message.content }}</span>
        </div>
      </div>
      
      <!-- 兜底显示 -->
      <div v-else class="message-text">{{ message.content || message.text }}</div>
    </div>
    <div v-if="message.isUser" class="avatar user-avatar">
      <font-awesome-icon icon="user" />
    </div>
  </div>
</template>

<script>
import { MESSAGE_TYPES, utils } from '../../AIsiri/types/index.js'

export default {
  name: 'MessageCard',
  props: {
    message: {
      type: Object,
      required: true
    }
  },
  computed: {
    // 判断消息类型
    isTextMessage() {
      return !this.message.type || this.message.type === MESSAGE_TYPES.TEXT
    },
    
    isQuestionsMessage() {
      return this.message.type === MESSAGE_TYPES.QUESTIONS
    },
    
    isTaskCreatedMessage() {
      return this.message.type === MESSAGE_TYPES.TASK_CREATED
    },
    
    isPlanMessage() {
      return this.message.type === MESSAGE_TYPES.PLAN
    },
    
    isErrorMessage() {
      return this.message.type === MESSAGE_TYPES.ERROR
    },
    
    isDynamicAdjustmentMessage() {
      return this.message.type === MESSAGE_TYPES.DYNAMIC_ADJUSTMENT
    },
    
    isVoiceMessage() {
      return this.message.type === MESSAGE_TYPES.VOICE
    },
    
    isImageMessage() {
      // 检查消息类型是否为IMAGE，或者消息内容是否以🖼️ 图片：开头
      return this.message.type === 'IMAGE' || (this.message.content && this.message.content.startsWith('🖼️ 图片：'))
    }
  },
  
  methods: {
    // 获取优先级文本
    getPriorityText(priority) {
      return utils.getPriorityName(priority)
    },
    
    // 获取时间段文本
    getTimeBlockText(timeBlock) {
      if (!timeBlock) return '未安排'
      
      const typeName = utils.getTimeBlockName(timeBlock.timeBlockType)
      if (timeBlock.startTime && timeBlock.endTime) {
        return `${typeName} (${timeBlock.startTime}-${timeBlock.endTime})`
      }
      return typeName
    },
    
    // 获取用户状态文本
    getStateText(state) {
      const stateMap = {
        tired: '疲劳',
        busy: '忙碌',
        stressed: '压力大',
        motivated: '状态良好',
        sick: '身体不适',
        normal: '正常'
      }
      return stateMap[state] || state
    },
    
    // 获取状态样式类
    getStateClass(state) {
      return `state-${state}`
    },
    
    // 格式化语音时长
    formatDuration(seconds) {
      if (seconds < 60) {
        return `${seconds}"`;
      } else {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
      }
    },
    
    // 提取图片URL
    extractImageUrl(content) {
      // 优先从metadata中获取图片URL
      if (this.message.metadata && this.message.metadata.imageUrl) {
        return this.message.metadata.imageUrl;
      }
      
      // 兼容旧格式：从文本内容中提取
      if (content && content.startsWith('[图片]')) {
        return content.substring(4); // 移除[图片]前缀，返回URL
      }
      
      return '';
    }
  }
}
</script>

<style scoped>
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

/* 图片消息样式 */
.image-message {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.message-image {
  max-width: 100%;
  max-height: 300px;
  border-radius: 8px;
  object-fit: cover;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.image-caption {
  font-size: 12px;
  color: #666;
  text-align: center;
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
  margin-top: 4px;
}

/* 语音消息样式 */
.voice-message {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.voice-content {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
}

.voice-icon {
  width: 32px;
  height: 32px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.voice-icon:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.voice-icon svg {
  font-size: 14px;
}

.voice-duration {
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  min-width: 30px;
}

.voice-transcription {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.3;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  margin-top: 4px;
}

/* 问题列表样式 */
.questions-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.questions-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}

.question-item {
  display: flex;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(0, 122, 255, 0.05);
  border-radius: 8px;
  border-left: 3px solid #007aff;
}

.question-number {
  font-weight: 600;
  color: #007aff;
  min-width: 20px;
}

.question-text {
  flex: 1;
  line-height: 1.4;
}

.questions-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(255, 193, 7, 0.1);
  border-radius: 8px;
  font-size: 14px;
  color: #856404;
}

.questions-tip svg {
  color: #ffc107;
}

/* 任务创建成功样式 */
.task-created-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-info {
  background: rgba(40, 167, 69, 0.05);
  border-radius: 8px;
  padding: 12px;
  border-left: 3px solid #28a745;
}

.task-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  margin-bottom: 8px;
}

.task-title svg {
  color: #28a745;
}

.task-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.task-detail {
  display: flex;
  align-items: center;
  font-size: 14px;
}

.task-detail .label {
  color: #6c757d;
  min-width: 70px;
}

.task-detail .value {
  font-weight: 500;
}

.priority.high {
  color: #dc3545;
}

.priority.medium {
  color: #ffc107;
}

.priority.low {
  color: #28a745;
}

/* 计划展示样式 */
.plan-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.plan-info {
  background: rgba(23, 162, 184, 0.05);
  border-radius: 8px;
  padding: 12px;
  border-left: 3px solid #17a2b8;
}

.plan-overview {
  font-size: 14px;
  color: #495057;
  margin-bottom: 8px;
  line-height: 1.4;
}

.plan-summary {
  display: flex;
  gap: 16px;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #17a2b8;
}

.summary-item svg {
  font-size: 16px;
}

/* 错误消息样式 */
.error-container {
  background: rgba(220, 53, 69, 0.05);
  border-radius: 8px;
  padding: 12px;
  border-left: 3px solid #dc3545;
}

.error-text {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #721c24;
}

.error-text svg {
  color: #dc3545;
  font-size: 16px;
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
</style>