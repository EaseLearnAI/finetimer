/**
 * 消息处理服务
 * 处理聊天消息的格式化、存储和状态管理
 */

import aiService from './aiApi.js'

/**
 * 消息类型枚举
 */
export const MESSAGE_TYPES = {
  TEXT: 'text',                    // 普通文本消息
  QUESTIONS: 'questions',          // 问题列表
  PLAN: 'plan',                    // 计划展示
  TASK_CREATED: 'task_created',    // 任务创建成功
  ERROR: 'error',                  // 错误消息
  TYPING: 'typing'                 // 打字中状态
}

/**
 * 消息发送者枚举
 */
export const SENDERS = {
  USER: 'user',
  AI: 'ai',
  SYSTEM: 'system'
}

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
    this.currentConversationContext = null
    
    // 添加初始欢迎消息
    this.addWelcomeMessage()
    
    console.log('💬 消息服务初始化完成')
  }

  /**
   * 添加欢迎消息
   */
  addWelcomeMessage() {
    const welcomeMessage = createMessage(
      '你好！我是你的AI学习助手。我可以帮助你制定学习计划、调整任务安排，以及根据你的情绪状态优化学习节奏。请告诉我你想要实现什么学习目标？',
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
  addUserMessage(content) {
    const message = createMessage(content, SENDERS.USER, MESSAGE_TYPES.TEXT)
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
   * 添加系统消息
   */
  addSystemMessage(content) {
    const message = createMessage(content, SENDERS.SYSTEM, MESSAGE_TYPES.TEXT)
    this.messages.push(message)
    
    console.log(`⚙️  系统消息: ${content}`)
    return message
  }

  /**
   * 处理用户输入的主要方法
   */
  async processUserInput(userInput) {
    if (this.isProcessing) {
      console.log('⏳ 正在处理中，请稍等...')
      return
    }

    try {
      this.isProcessing = true
      
      // 检查是否在问答流程中
      if (this.currentConversationContext && 
          (this.currentConversationContext.type === 'goal_planning' || 
           this.currentConversationContext.type === 'habit_formation')) {
        console.log('📝 检测到问答流程，处理用户回答...')
        // 在问答流程中，处理用户回答
        await this.handleQuestionAnswer(userInput)
        return
      }
      
      // 1. 添加用户消息
      this.addUserMessage(userInput)
      
      // 2. 调用AI API处理
      console.log('\n🚀 开始处理用户输入...')
      const response = await aiService.processInput(userInput)
      
      // 3. 根据响应类型处理结果
      await this.handleAIResponse(response)
      
    } catch (error) {
      console.error('❌ 处理用户输入失败:', error)
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
   * 处理AI API响应
   */
  async handleAIResponse(response) {
    if (!response.success) {
      // 处理错误响应
      const errorMessage = response.fallback_suggestion || '抱歉，系统遇到了问题。'
      this.addAIMessage(errorMessage, MESSAGE_TYPES.ERROR, { apiError: response.error })
      return
    }

    switch (response.type) {
      case 'simple_todo':
        await this.handleSimpleTodoResponse(response)
        break
        
      case 'goal_planning':
        await this.handleGoalPlanningResponse(response)
        break
        
      case 'habit_formation':
        await this.handleHabitFormationResponse(response)
        break
        
      case 'plan_generated':
        await this.handlePlanGeneratedResponse(response)
        break
        
      case 'plan_adjusted':
        await this.handlePlanAdjustedResponse(response)
        break
        
      case 'habit_plan_generated':
        await this.handleHabitPlanGeneratedResponse(response)
        break
        
      case 'dynamic_adjustment':
        await this.handleDynamicAdjustmentResponse(response)
        break
        
      default:
        this.addAIMessage(
          '我理解了你的需求，让我来帮你处理。',
          MESSAGE_TYPES.TEXT,
          { originalResponse: response }
        )
    }
  }

  /**
   * 处理简单待办响应
   */
  async handleSimpleTodoResponse(response) {
    const { result } = response
    const message = result.message || '已为你创建待办事项'
    
    this.addAIMessage(message, MESSAGE_TYPES.TASK_CREATED, {
      task: result.task,
      collection: result.collection
    })
  }

  /**
   * 处理目标规划响应
   */
  async handleGoalPlanningResponse(response) {
    const { result } = response
    
    // 检查是否包含问题（问题生成阶段）
    if (result.questions) {
      // 添加问候消息
      if (result.questions.greeting) {
        this.addAIMessage(result.questions.greeting, MESSAGE_TYPES.TEXT)
      }
      
      // 添加问题列表
      this.addAIMessage(
        '我需要了解一些信息来制定更好的计划：',
        MESSAGE_TYPES.QUESTIONS,
        {
          questions: result.questions.questions,
          goal: result.goal,
          nextStep: result.next_step
        }
      )
      
      // 设置对话上下文
      this.currentConversationContext = {
        type: 'goal_planning',
        goal: result.goal,
        questions: result.questions.questions,
        answers: [],
        currentQuestionIndex: 0
      }
    } else {
      // 如果没有问题，说明是其他类型的响应，应该重新路由
      console.warn('⚠️ goal_planning 响应中没有 questions，可能是错误的类型判断')
      // 尝试作为计划生成响应处理
      if (result.message && result.plan) {
        await this.handlePlanGeneratedResponse(response)
      } else {
        this.addAIMessage(
          result.message || '处理完成',
          MESSAGE_TYPES.TEXT
        )
      }
    }
  }

  /**
   * 处理习惯养成响应
   */
  async handleHabitFormationResponse(response) {
    const { result } = response
    
    // 检查是否是问题生成阶段（包含questions）
    if (result.questions) {
      // 添加问候消息
      if (result.questions.greeting) {
        this.addAIMessage(result.questions.greeting, MESSAGE_TYPES.TEXT)
      }
      
      // 添加问题列表
      this.addAIMessage(
        '我需要了解一些信息来制定更好的习惯计划：',
        MESSAGE_TYPES.QUESTIONS,
        {
          questions: result.questions.questions,
          goal: result.habit_goal || result.goal,
          habitType: result.habit_type || result.questions.habit_type,
          nextStep: result.next_step
        }
      )
      
      // 设置对话上下文
      this.currentConversationContext = {
        type: 'habit_formation',
        goal: result.habit_goal || result.goal,
        habitType: result.habit_type || result.questions.habit_type,
        questions: result.questions.questions,
        answers: [],
        currentQuestionIndex: 0
      }
    } else {
      // 习惯计划已创建
      const message = result.message || '已为你创建习惯计划'
      
      this.addAIMessage(message, MESSAGE_TYPES.TASK_CREATED, {
        habitPlan: result.habit_plan,
        task: result.task,
        collection: result.collection
      })
    }
  }

  /**
   * 处理计划生成响应
   */
  async handlePlanGeneratedResponse(response) {
    const { result } = response
    
    // 构建符合 MessageCard.vue 期望的 metadata 结构
    const metadata = {
      plan: result.plan,
      summary: {
        collections_count: result.summary?.collections_count || result.database_result?.collections_count || 0,
        tasks_count: result.summary?.tasks_count || result.database_result?.total_tasks || 0
      },
      databaseResult: result.database_result
    }
    
    this.addAIMessage(result.message, MESSAGE_TYPES.PLAN, metadata)

    // 通知任务页刷新（计划已生成并导入数据库）
    try {
      window.dispatchEvent(new CustomEvent('ai-plan-generated'))
    } catch (_) {
      // noop: 部分环境下 window 不可用
    }
  }

  /**
   * 处理计划调整响应
   */
  async handlePlanAdjustedResponse(response) {
    const { result } = response
    
    this.addAIMessage(result.message, MESSAGE_TYPES.PLAN, {
      adjustment: result.adjustment,
      updateResult: result.update_result
    })
  }

  /**
   * 处理习惯计划生成响应
   */
  async handleHabitPlanGeneratedResponse(response) {
    const { result } = response
    
    // 构建符合 MessageCard.vue 期望的 metadata 结构
    const metadata = {
      habitPlan: result.habit_plan,
      plan: result.habit_plan, // 为了兼容 MessageCard.vue 的 plan 字段
      summary: {
        collections_count: result.summary?.collections_count || result.database_result?.collections_count || 0,
        tasks_count: result.summary?.tasks_count || result.database_result?.total_tasks || 0
      },
      databaseResult: result.database_result
    }
    
    this.addAIMessage(result.message, MESSAGE_TYPES.PLAN, metadata)
  }

  /**
   * 处理问题回答（在目标规划或习惯养成流程中）
   */
  async handleQuestionAnswer(answer) {
    if (!this.currentConversationContext || 
        (this.currentConversationContext.type !== 'goal_planning' && 
         this.currentConversationContext.type !== 'habit_formation')) {
      // 如果不在问答流程中，当作普通消息处理
      return this.processUserInput(answer)
    }

    // 添加用户回答到消息历史
    this.addUserMessage(answer)

    const context = this.currentConversationContext
    context.answers.push(answer)
    context.currentQuestionIndex++

    // 检查是否还有更多问题
    if (context.currentQuestionIndex < context.questions.length) {
      // 还有更多问题，继续询问
      const nextQuestion = context.questions[context.currentQuestionIndex]
      this.addAIMessage(`好的，下一个问题：${nextQuestion}`, MESSAGE_TYPES.TEXT)
    } else {
      // 所有问题都回答完了，生成计划
      this.addAIMessage('谢谢你的回答！现在让我为你制定一个详细的计划...', MESSAGE_TYPES.TEXT)
      
      try {
        let planResponse
        
        if (context.type === 'habit_formation') {
          // 调用习惯计划生成接口
          planResponse = await aiService.generateHabitPlan(
            context.goal,
            context.habitType,
            context.answers
          )
        } else {
          // 调用普通计划生成接口
          planResponse = await aiService.generatePlan(
            context.goal,
            'goal_planning',
            context.answers
          )
        }
        
        await this.handleAIResponse(planResponse)
        
        // 清除对话上下文
        this.currentConversationContext = null
        
      } catch (error) {
        console.error('❌ 生成计划失败:', error)
        this.addAIMessage(
          '抱歉，生成计划时遇到了问题。请稍后再试。',
          MESSAGE_TYPES.ERROR,
          { error: error.message }
        )
      }
    }
  }

  /**
   * 处理动态调整响应
   */
  async handleDynamicAdjustmentResponse(response) {
    const { result } = response
    const message = result.message || '任务调整已完成'
    
    this.addAIMessage(message, MESSAGE_TYPES.DYNAMIC_ADJUSTMENT, {
      adjustmentSummary: result.adjustmentSummary,
      taskAnalysis: result.taskAnalysis,
      adjustmentPlan: result.adjustmentPlan,
      userState: response.userState
    })
    
    // 如果有具体的调整信息，可以再添加一条详细说明
    if (result.adjustmentSummary) {
      const summary = result.adjustmentSummary
      const details = []
      
      if (summary.modified_tasks > 0) details.push(`修改了${summary.modified_tasks}个任务`)
      if (summary.postponed_tasks > 0) details.push(`延后了${summary.postponed_tasks}个任务`)
      if (summary.new_tasks > 0) details.push(`新增了${summary.new_tasks}个任务`)
      if (summary.cancelled_tasks > 0) details.push(`取消了${summary.cancelled_tasks}个任务`)
      
      if (details.length > 0) {
        console.log(`📊 调整详情: ${details.join('，')}`)
      }
    }
  }

  /**
   * 检查是否正在处理中
   */
  isCurrentlyProcessing() {
    return this.isProcessing
  }

  /**
   * 获取当前对话上下文
   */
  getCurrentContext() {
    return this.currentConversationContext
  }

  /**
   * 清除所有消息
   */
  clearMessages() {
    this.messages = []
    this.currentConversationContext = null
    this.addWelcomeMessage()
    console.log('🧹 消息历史已清除')
  }

  /**
   * 导出消息历史（用于调试）
   */
  exportMessages() {
    return {
      messages: this.getMessages(),
      context: this.currentConversationContext,
      timestamp: new Date().toISOString()
    }
  }
}

// 创建单例实例
const messageService = new MessageService()

export default messageService