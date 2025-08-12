/**
 * AI助手相关的类型定义和常量
 */

// 消息类型
export const MESSAGE_TYPES = {
  TEXT: 'text',
  QUESTIONS: 'questions',
  PLAN: 'plan',
  TASK_CREATED: 'task_created',
  DYNAMIC_ADJUSTMENT: 'dynamic_adjustment',
  ERROR: 'error',
  TYPING: 'typing'
}

// 消息发送者
export const SENDERS = {
  USER: 'user',
  AI: 'ai',
  SYSTEM: 'system'
}

// AI响应类型
export const AI_RESPONSE_TYPES = {
  SIMPLE_TODO: 'simple_todo',
  GOAL_PLANNING: 'goal_planning',
  HABIT_FORMATION: 'habit_formation',
  DYNAMIC_ADJUSTMENT: 'dynamic_adjustment',
  PLAN_GENERATED: 'plan_generated',
  PLAN_ADJUSTED: 'plan_adjusted'
}

// 分类结果类型
export const CLASSIFICATION_TYPES = {
  SIMPLE_TODO: 'simple_todo',
  GOAL_PLANNING: 'goal_planning',
  HABIT_FORMATION: 'habit_formation'
}

// 时间段类型
export const TIME_BLOCKS = {
  MORNING: 'morning',      // 06:00-09:00
  FORENOON: 'forenoon',    // 09:00-12:00
  AFTERNOON: 'afternoon',  // 12:00-18:00
  EVENING: 'evening',      // 18:00-23:00
  UNSCHEDULED: 'unscheduled'
}

// 优先级
export const PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
}

// 四象限分类
export const QUADRANTS = {
  URGENT_IMPORTANT: 1,      // 重要且紧急
  IMPORTANT: 2,             // 重要不紧急
  URGENT: 3,                // 紧急不重要
  NEITHER: 4                // 不重要不紧急
}

// API状态码
export const API_STATUS = {
  SUCCESS: 'success',
  ERROR: 'error',
  LOADING: 'loading',
  IDLE: 'idle'
}

// 快速操作
export const QUICK_ACTIONS = [
  {
    id: 1,
    icon: 'graduation-cap',
    label: '考研规划',
    text: '我想制定考研学习计划',
    category: CLASSIFICATION_TYPES.GOAL_PLANNING
  },
  {
    id: 2,
    icon: 'code',
    label: '编程学习',
    text: '我想学习编程',
    category: CLASSIFICATION_TYPES.GOAL_PLANNING
  },
  {
    id: 3,
    icon: 'language',
    label: '英语提升',
    text: '我想提升英语水平',
    category: CLASSIFICATION_TYPES.GOAL_PLANNING
  },
  {
    id: 4,
    icon: 'dumbbell',
    label: '运动习惯',
    text: '我想养成每天运动的习惯',
    category: CLASSIFICATION_TYPES.HABIT_FORMATION
  },
  {
    id: 5,
    icon: 'book',
    label: '阅读习惯',
    text: '我想养成每天阅读的习惯',
    category: CLASSIFICATION_TYPES.HABIT_FORMATION
  },
  {
    id: 6,
    icon: 'plus',
    label: '简单待办',
    text: '取个外卖',
    category: CLASSIFICATION_TYPES.SIMPLE_TODO
  }
]

// 智能建议
export const SUGGESTIONS = [
  {
    id: 1,
    icon: 'clock',
    title: '调整学习时间',
    description: '根据你的作息习惯优化学习时间安排',
    action: '请帮我调整学习时间安排'
  },
  {
    id: 2,
    icon: 'brain',
    title: '智能任务分配',
    description: '基于任务难度和重要性智能安排',
    action: '请帮我重新分配任务优先级'
  },
  {
    id: 3,
    icon: 'heart',
    title: '情绪调节',
    description: '根据当前状态调整学习强度',
    action: '我感觉有点累，请帮我调整今天的任务'
  },
  {
    id: 4,
    icon: 'chart-line',
    title: '进度分析',
    description: '分析学习进度并提供改进建议',
    action: '请帮我分析最近的学习进度'
  }
]

/**
 * 消息接口定义
 */
export class Message {
  constructor({
    id,
    content,
    sender = SENDERS.AI,
    type = MESSAGE_TYPES.TEXT,
    timestamp = new Date(),
    metadata = {}
  }) {
    this.id = id
    this.content = content
    this.sender = sender
    this.type = type
    this.timestamp = timestamp
    this.metadata = metadata
    this.isUser = sender === SENDERS.USER
  }
}

/**
 * API响应接口定义
 */
export class AIResponse {
  constructor({
    success = false,
    type = null,
    result = null,
    error = null,
    timestamp = new Date()
  }) {
    this.success = success
    this.type = type
    this.result = result
    this.error = error
    this.timestamp = timestamp
  }
}

/**
 * 任务接口定义
 */
export class Task {
  constructor({
    id,
    title,
    description = '',
    priority = PRIORITIES.MEDIUM,
    quadrant = QUADRANTS.IMPORTANT,
    timeBlock = {},
    completed = false,
    dueDate = null,
    tags = [],
    userId,
    collectionId
  }) {
    this.id = id
    this.title = title
    this.description = description
    this.priority = priority
    this.quadrant = quadrant
    this.timeBlock = {
      timeBlockType: TIME_BLOCKS.UNSCHEDULED,
      startTime: '',
      endTime: '',
      ...timeBlock
    }
    this.completed = completed
    this.dueDate = dueDate
    this.tags = tags
    this.userId = userId
    this.collectionId = collectionId
  }
}

/**
 * 任务集接口定义
 */
export class Collection {
  constructor({
    id,
    name,
    description = '',
    expanded = false,
    userId,
    tasks = []
  }) {
    this.id = id
    this.name = name
    this.description = description
    this.expanded = expanded
    this.userId = userId
    this.tasks = tasks
  }
}

// 工具函数
export const utils = {
  /**
   * 格式化时间
   */
  formatTime(date) {
    return new Intl.DateTimeFormat('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  },

  /**
   * 格式化日期
   */
  formatDate(date) {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date)
  },

  /**
   * 获取时间段显示名称
   */
  getTimeBlockName(timeBlockType) {
    const names = {
      [TIME_BLOCKS.MORNING]: '早晨',
      [TIME_BLOCKS.FORENOON]: '上午',
      [TIME_BLOCKS.AFTERNOON]: '下午',
      [TIME_BLOCKS.EVENING]: '晚上',
      [TIME_BLOCKS.UNSCHEDULED]: '未安排'
    }
    return names[timeBlockType] || '未知'
  },

  /**
   * 获取优先级显示名称
   */
  getPriorityName(priority) {
    const names = {
      [PRIORITIES.LOW]: '低',
      [PRIORITIES.MEDIUM]: '中',
      [PRIORITIES.HIGH]: '高'
    }
    return names[priority] || '未知'
  },

  /**
   * 获取象限显示名称
   */
  getQuadrantName(quadrant) {
    const names = {
      [QUADRANTS.URGENT_IMPORTANT]: '重要且紧急',
      [QUADRANTS.IMPORTANT]: '重要不紧急',
      [QUADRANTS.URGENT]: '紧急不重要',
      [QUADRANTS.NEITHER]: '不重要不紧急'
    }
    return names[quadrant] || '未分类'
  }
}