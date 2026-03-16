/**
 * 日志工具
 * 提供统一的日志输出和调试功能
 */

// 日志级别
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
}

// 当前日志级别（可通过环境变量配置）
const CURRENT_LEVEL = process.env.NODE_ENV === 'production' ? LOG_LEVELS.WARN : LOG_LEVELS.DEBUG

// 颜色样式
const COLORS = {
  DEBUG: 'color: #6c757d;',           // 灰色
  INFO: 'color: #007bff;',            // 蓝色  
  WARN: 'color: #ffc107;',            // 黄色
  ERROR: 'color: #dc3545;',           // 红色
  SUCCESS: 'color: #28a745;',         // 绿色
  API: 'color: #17a2b8;',             // 青色
  USER: 'color: #6f42c1;',            // 紫色
  AI: 'color: #fd7e14;'               // 橙色
}

// 图标映射
const ICONS = {
  DEBUG: '🔍',
  INFO: 'ℹ️',
  WARN: '⚠️',
  ERROR: '❌',
  SUCCESS: '✅',
  API: '🌐',
  USER: '👤',
  AI: '🤖',
  TIME: '⏰',
  DATA: '📊',
  PROCESS: '⚙️'
}

class Logger {
  constructor(context = 'AI助手') {
    this.context = context
    this.startTime = Date.now()
    this.sessionId = this.generateSessionId()
    
    this.log('INFO', '日志系统初始化', { sessionId: this.sessionId })
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
  }

  formatTimestamp() {
    return new Date().toLocaleTimeString('zh-CN', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    })
  }

  shouldLog(level) {
    return LOG_LEVELS[level] >= CURRENT_LEVEL
  }

  log(level, message, data = null) {
    if (!this.shouldLog(level)) return

    const timestamp = this.formatTimestamp()
    const icon = ICONS[level] || ''
    const color = COLORS[level] || ''
    
    const prefix = `${icon} [${timestamp}] [${this.context}]`
    
    if (data) {
      console.groupCollapsed(`%c${prefix} ${message}`, color)
      console.log('详细数据:', data)
      console.groupEnd()
    } else {
      console.log(`%c${prefix} ${message}`, color)
    }
  }

  debug(message, data = null) {
    this.log('DEBUG', message, data)
  }

  info(message, data = null) {
    this.log('INFO', message, data)
  }

  warn(message, data = null) {
    this.log('WARN', message, data)
  }

  error(message, error = null) {
    const data = error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : null
    this.log('ERROR', message, data)
  }

  success(message, data = null) {
    this.log('SUCCESS', message, data)
  }

  // 专用日志方法
  api(operation, data = null) {
    this.log('API', `API调用: ${operation}`, data)
  }

  user(action, data = null) {
    this.log('USER', `用户操作: ${action}`, data)
  }

  ai(action, data = null) {
    this.log('AI', `AI处理: ${action}`, data)
  }

  time(operation) {
    const timestamp = this.formatTimestamp()
    console.time(`${ICONS.TIME} [${timestamp}] ${operation}`)
  }

  timeEnd(operation) {
    const timestamp = this.formatTimestamp()
    console.timeEnd(`${ICONS.TIME} [${timestamp}] ${operation}`)
  }

  // 分组日志
  group(title, callback) {
    const timestamp = this.formatTimestamp()
    console.group(`${ICONS.PROCESS} [${timestamp}] ${title}`)
    
    if (typeof callback === 'function') {
      try {
        callback()
      } finally {
        console.groupEnd()
      }
    }
  }

  groupEnd() {
    console.groupEnd()
  }

  // 表格显示
  table(data, title = null) {
    if (title) {
      this.info(title)
    }
    console.table(data)
  }

  // 性能监控
  performance(operation, startTime) {
    const duration = Date.now() - startTime
    const level = duration > 1000 ? 'WARN' : duration > 500 ? 'INFO' : 'DEBUG'
    this.log(level, `性能监控: ${operation} 耗时 ${duration}ms`)
  }

  // 消息统计
  getStats() {
    const uptime = Date.now() - this.startTime
    return {
      sessionId: this.sessionId,
      uptime,
      context: this.context,
      startTime: new Date(this.startTime).toISOString()
    }
  }
}

// 创建默认实例
const logger = new Logger('AI助手')

// 导出实例和类
export default logger
export { Logger }

// 便捷方法
export const log = {
  debug: (msg, data) => logger.debug(msg, data),
  info: (msg, data) => logger.info(msg, data),
  warn: (msg, data) => logger.warn(msg, data),
  error: (msg, error) => logger.error(msg, error),
  success: (msg, data) => logger.success(msg, data),
  api: (op, data) => logger.api(op, data),
  user: (action, data) => logger.user(action, data),
  ai: (action, data) => logger.ai(action, data),
  time: (op) => logger.time(op),
  timeEnd: (op) => logger.timeEnd(op),
  group: (title, cb) => logger.group(title, cb),
  table: (data, title) => logger.table(data, title),
  performance: (op, start) => logger.performance(op, start)
}