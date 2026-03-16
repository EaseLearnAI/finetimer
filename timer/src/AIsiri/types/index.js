/**
 * AIsiri AI助手类型定义
 */

/**
 * 快速操作按钮配置
 */
export const QUICK_ACTIONS = [
  {
    id: 'create-task',
    label: '创建任务',
    text: '帮我创建一个新任务',
    icon: 'plus'
  },
  {
    id: 'schedule-planning',
    label: '安排日程',
    text: '帮我安排一下今天的日程',
    icon: 'calendar'
  },
  {
    id: 'goal-planning',
    label: '目标规划',
    text: '我想制定一个学习目标计划',
    icon: 'bullseye'
  },
  {
    id: 'habit-formation',
    label: '习惯养成',
    text: '我想养成一个新的学习习惯',
    icon: 'sync'
  },
  {
    id: 'emotional-support',
    label: '情绪支持',
    text: '我今天感觉有点累，需要一些鼓励',
    icon: 'heart'
  }
]

/**
 * 消息类型枚举
 */
export const MESSAGE_TYPES = {
  TEXT: 'text',                    // 普通文本消息
  VOICE: 'voice',                  // 语音消息
  TASK_CREATED: 'task_created',    // 任务创建成功
  SCHEDULE_ADJUSTED: 'schedule_adjusted', // 日程调整
  EMOTIONAL_SUPPORT: 'emotional_support', // 情绪支持
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
 * 智能调度响应类型
 */
export const DISPATCH_RESPONSE_TYPES = {
  TASK_CREATION: 'TASK_CREATION',
  SCHEDULE_PLANNING: 'SCHEDULE_PLANNING',
  CONVERSATION: 'CONVERSATION',
  EMOTIONAL_SUPPORT: 'EMOTIONAL_SUPPORT',
  EXTERNAL_TOOL: 'EXTERNAL_TOOL'
}

/**
 * 服务执行状态
 */
export const SERVICE_STATUS = {
  PENDING: 'pending',
  EXECUTING: 'executing',
  COMPLETED: 'completed',
  FAILED: 'failed'
}

/**
 * 设备信息类型
 */
export const DEVICE_PLATFORMS = {
  WEB: 'web',
  MOBILE: 'mobile',
  DESKTOP: 'desktop'
}

/**
 * 分类结果类型
 */
export const CLASSIFICATION_TYPES = {
  SIMPLE_TODO: 'simple_todo',
  GOAL_PLANNING: 'goal_planning',
  HABIT_FORMATION: 'habit_formation'
}

/**
 * 时间段类型
 */
export const TIME_BLOCKS = {
  MORNING: 'morning',      // 06:00-09:00
  FORENOON: 'forenoon',    // 09:00-12:00
  AFTERNOON: 'afternoon',  // 12:00-18:00
  EVENING: 'evening',      // 18:00-23:00
  UNSCHEDULED: 'unscheduled'
}

/**
 * 优先级
 */
export const PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
}

/**
 * 四象限分类
 */
export const QUADRANTS = {
  URGENT_IMPORTANT: 1,      // 重要且紧急
  IMPORTANT: 2,             // 重要不紧急
  URGENT: 3,                // 紧急不重要
  NEITHER: 4                // 不重要不紧急
}

/**
 * API状态码
 */
export const API_STATUS = {
  SUCCESS: 'success',
  ERROR: 'error',
  LOADING: 'loading',
  IDLE: 'idle'
}

/**
 * 智能建议
 */
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