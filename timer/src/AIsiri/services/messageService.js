/**
 * AIsiri 智能调度消息处理服务
 * 处理聊天消息的格式化、存储和状态管理
 */

import aisiriService from './aiApi.js'
import { MESSAGE_TYPES, SENDERS } from '../types/index.js'

/**
 * 生成唯一消息ID
 */
function generateMessageId() {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 创建消息对象
 */
function createMessage(content, sender = SENDERS.AI, type = MESSAGE_TYPES.TEXT, metadata = {}) {
  return {
    id: generateMessageId(),
    content,
    sender,
    type,
    timestamp: new Date(),
    metadata,
    isUser: sender === SENDERS.USER
  }
}

/**
 * 消息服务类
 */
class MessageService {
  constructor() {
    this.messages = []
    this.isProcessing = false
    this.currentSessionId = null
    
    // 添加初始欢迎消息
    this.addWelcomeMessage()
    
    console.log('💬 AIsiri智能调度消息服务初始化完成')
  }

  /**
   * 添加欢迎消息
   */
  addWelcomeMessage() {
    const welcomeMessage = createMessage(
      '你好！我是你的AI智能助手。我可以帮助你创建任务、安排日程、提供情绪支持，以及调用各种外部工具。请告诉我你需要什么帮助？',
      SENDERS.AI,
      MESSAGE_TYPES.TEXT
    )
    this.messages.push(welcomeMessage)
  }

  /**
   * 获取所有消息
   */
  getMessages() {
    return [...this.messages]
  }

  /**
   * 添加用户消息
   */
  addUserMessage(content, type = MESSAGE_TYPES.TEXT, metadata = {}) {
    // 检查是否是图片消息
    let messageType = type
    if (content && content.startsWith('🖼️ 图片：')) {
      messageType = 'IMAGE' // 使用自定义图片类型
    }
    
    const message = createMessage(content, SENDERS.USER, messageType, metadata)
    this.messages.push(message)
    
    console.log(`📝 用户消息: ${content}`)
    return message
  }

  /**
   * 添加AI消息
   */
  addAIMessage(content, type = MESSAGE_TYPES.TEXT, metadata = {}) {
    const message = createMessage(content, SENDERS.AI, type, metadata)
    this.messages.push(message)
    
    console.log(`🤖 AI回复: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`)
    return message
  }

  /**
   * 添加AI回复（不触发智能调度）
   */
  addAIReply(content, type = MESSAGE_TYPES.TEXT, metadata = {}) {
    const message = createMessage(content, SENDERS.AI, type, metadata)
    this.messages.push(message)
    
    console.log(`🤖 AI直接回复: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`)
    return message
  }

  /**
   * 添加语音消息
   */
  addVoiceMessage(voiceData, isUser = false) {
    const message = {
      id: Date.now() + Math.random(),
      type: MESSAGE_TYPES.VOICE,
      isUser: isUser,
      timestamp: new Date(),
      duration: voiceData.transcription ? Math.ceil(voiceData.transcription.length / 5) : 3, // 根据文字长度估算时长
      transcription: voiceData.transcription || '',
      audioUrl: voiceData.audioUrl || '',
      audioFile: voiceData.audioFile || null
    }
    
    this.messages.push(message)
    console.log(`🎤 ${isUser ? '用户' : 'AI'}语音消息已添加: ${voiceData.transcription?.substring(0, 50) || '无文字'}...`)
    
    return message
  }

  /**
   * 添加系统消息
   */
  addSystemMessage(content) {
    const message = createMessage(content, SENDERS.SYSTEM, MESSAGE_TYPES.TEXT)
    this.messages.push(message)
    
    console.log(`⚙️  系统消息: ${content}`)
    return message
  }

  /**
   * 处理用户输入的主要方法 - 使用智能调度系统
   */
  async processUserInput(userInput) {
    if (this.isProcessing) {
      console.log('⏳ 正在处理中，请稍等...')
      return
    }

    this.addUserMessage(userInput)

    await this.dispatchAndRespond(userInput)
  }

  /**
   * 仅执行调度（不添加用户消息），供外部先展示消息后再调用
   */
  async dispatchAndRespond(userInput) {
    if (this.isProcessing) return

    try {
      this.isProcessing = true

      console.log('\n🚀 开始智能调度处理...')
      const response = await aisiriService.dispatch(userInput, this.currentSessionId)

      await this.handleDispatchResponse(response)

    } catch (error) {
      console.error('❌ 智能调度处理失败:', error)
      this.addAIMessage(
        '抱歉，我遇到了一些技术问题。请稍后再试，或者尝试重新描述你的需求。',
        MESSAGE_TYPES.ERROR,
        { error: error.message }
      )
    } finally {
      this.isProcessing = false
    }
  }

  /**
   * 处理用户语音输入 - 返回语音回复
   */
  async processVoiceInput(voiceData) {
    if (this.isProcessing) {
      console.log('⏳ 正在处理中，请稍等...')
      return
    }

    try {
      this.isProcessing = true
      
      // 1. 添加用户语音消息
      this.addVoiceMessage(voiceData, true) // true表示是用户消息
      
      // 2. 调用AIsiri智能调度
      console.log('\n🚀 开始智能调度处理语音输入...')
      const response = await aisiriService.dispatch(voiceData.transcription, this.currentSessionId)
      
      // 3. 处理智能调度响应，生成语音回复
      await this.handleVoiceDispatchResponse(response)
      
    } catch (error) {
      console.error('❌ 语音智能调度处理失败:', error)
      this.addVoiceMessage({
        transcription: '抱歉，我遇到了一些技术问题。请稍后再试，或者尝试重新描述你的需求。',
        duration: 3,
        isUser: false
      }, false) // false表示是AI消息
    } finally {
      this.isProcessing = false
    }
  }

  /**
   * 处理语音智能调度响应 - AI回复保持文字形式
   */
  async handleVoiceDispatchResponse(response) {
    if (!response.success) {
      const errorMessage = response.error || '抱歉，系统遇到了问题。'
      this.addAIMessage(errorMessage, MESSAGE_TYPES.ERROR, { apiError: response.error })
      return
    }

    const { data } = response
    const intents = data.intents || []

    this.addAIMessage(data.response, MESSAGE_TYPES.TEXT, {
      intents,
      servicesExecuted: data.servicesExecuted,
      taskCreated: data.taskCreated,
      scheduleAdjusted: data.scheduleAdjusted,
      emotionalSupport: data.emotionalSupport,
      processingTime: response.processingTime,
      isVoiceInput: true
    })

    if (data.taskCreated && intents.includes('TASK_CREATION')) {
      this.addTaskCreatedMessage(data.taskCreated)
    }

    if (data.scheduleAdjusted && intents.includes('SCHEDULE_PLANNING')) {
      this.addScheduleAdjustedMessage(data.scheduleAdjusted)
    }

    if (data.taskCreated || data.scheduleAdjusted) {
      try {
        window.dispatchEvent(new CustomEvent('ai-dispatch-completed', {
          detail: {
            taskCreated: data.taskCreated,
            scheduleAdjusted: data.scheduleAdjusted,
            intents
          }
        }))
      } catch (_) { /* window may be unavailable */ }
    }
  }

  /**
   * 处理智能调度响应
   */
  async handleDispatchResponse(response) {
    if (!response.success) {
      const errorMessage = response.error || '抱歉，系统遇到了问题。'
      this.addAIMessage(errorMessage, MESSAGE_TYPES.ERROR, { apiError: response.error })
      return
    }

    const { data } = response
    const intents = data.intents || []

    this.addAIMessage(data.response, MESSAGE_TYPES.TEXT, {
      intents,
      servicesExecuted: data.servicesExecuted,
      taskCreated: data.taskCreated,
      scheduleAdjusted: data.scheduleAdjusted,
      emotionalSupport: data.emotionalSupport,
      processingTime: response.processingTime
    })

    if (data.taskCreated && intents.includes('TASK_CREATION')) {
      this.addTaskCreatedMessage(data.taskCreated)
    }

    if (data.scheduleAdjusted && intents.includes('SCHEDULE_PLANNING')) {
      this.addScheduleAdjustedMessage(data.scheduleAdjusted)
    }

    if (data.taskCreated || data.scheduleAdjusted) {
      try {
        window.dispatchEvent(new CustomEvent('ai-dispatch-completed', {
          detail: {
            taskCreated: data.taskCreated,
            scheduleAdjusted: data.scheduleAdjusted,
            intents
          }
        }))
      } catch (_) { /* window may be unavailable */ }
    }
  }

  /**
   * 添加任务创建成功消息
   */
  addTaskCreatedMessage(task) {
    let message = `✅ 任务已创建：${task.title}`
    const displayTime = task.scheduledTime || task.timeBlock?.startTime || task.time
    if (displayTime) {
      message += `，安排在 ${task.date} ${displayTime}`
    }
    
    this.addAIMessage(message, MESSAGE_TYPES.TASK_CREATED, {
      task: task
    })
  }

  /**
   * 添加日程调整消息
   */
  addScheduleAdjustedMessage(scheduleInfo) {
    const executed = scheduleInfo?.executed
    const parts = ['⏰ 日程已调整']
    if (executed) {
      const ops = []
      if (executed.updated?.length) ops.push(`更新 ${executed.updated.length} 个任务`)
      if (executed.created?.length) ops.push(`新增 ${executed.created.length} 个任务`)
      if (executed.deleted?.length) ops.push(`清理 ${executed.deleted.length} 个任务`)
      if (ops.length) parts.push(`（${ops.join('，')}）`)
    }

    this.addAIMessage(parts.join(''), MESSAGE_TYPES.SCHEDULE_ADJUSTED, {
      scheduleInfo: scheduleInfo
    })
  }

  /**
   * 检查是否正在处理中
   */
  isCurrentlyProcessing() {
    return this.isProcessing
  }

  /**
   * 获取当前会话ID
   */
  getCurrentSessionId() {
    return this.currentSessionId
  }

  /**
   * 设置会话ID
   */
  setSessionId(sessionId) {
    this.currentSessionId = sessionId
    console.log(`🔄 设置会话ID: ${sessionId}`)
  }

  /**
   * 创建新会话
   */
  createNewSession() {
    this.currentSessionId = aisiriService.createNewSession()
    console.log(`🆕 创建新会话: ${this.currentSessionId}`)
    return this.currentSessionId
  }

  /**
   * 清除所有消息
   */
  clearMessages() {
    this.messages = []
    this.currentSessionId = null
    this.addWelcomeMessage()
    console.log('🧹 消息历史已清除')
  }

  /**
   * 导出消息历史（用于调试）
   */
  exportMessages() {
    return {
      messages: this.getMessages(),
      sessionId: this.currentSessionId,
      timestamp: new Date().toISOString()
    }
  }
}

// 创建单例实例
const messageService = new MessageService()

export default messageService