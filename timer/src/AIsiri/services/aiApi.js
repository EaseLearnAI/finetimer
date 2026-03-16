/**
 * AIsiri 智能调度 API服务
 * 提供与后端智能调度系统的通信功能
 */

import { getAisiriApiUrl } from '../../config/api.js'

// API基础配置
const API_CONFIG = {
  baseURL: getAisiriApiUrl(''),
  timeout: 300000, // 5分钟超时，复杂操作需要更长时间
  headers: {
    'Content-Type': 'application/json'
  }
}

// 获取当前登录用户ID
function getCurrentUserId() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null')
    return user?._id || user?.id || null
  } catch (_) {
    return null
  }
}

// 获取token
function getToken() {
  return localStorage.getItem('token') || ''
}

// 日志输出函数
function logAPI(operation, data) {
  const timestamp = new Date().toISOString()
  console.log(`\n🌐 === ${operation} API调用 ===`)
  console.log(`⏰ 时间: ${timestamp}`)
  console.log(`📤 数据:`, data)
}

function logResponse(operation, response) {
  console.log(`📥 响应:`, response)
  console.log(`🌐 === ${operation} API完成 ===\n`)
}

// 通用API请求函数
async function makeAPIRequest(endpoint, data = null, method = 'GET') {
  const url = `${API_CONFIG.baseURL}${endpoint}`
  
  try {
    logAPI(endpoint, data)
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout)
    
    const token = getToken()
    const headers = { ...API_CONFIG.headers }
    if (token) headers['Authorization'] = `Bearer ${token}`
    
    const options = {
      method,
      headers,
      signal: controller.signal
    }
    
    if (data && method !== 'GET') {
      options.body = JSON.stringify(data)
    }
    
    const response = await fetch(url, options)
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      if (response.status === 401) {
        console.warn('🔒 未认证或token失效，重定向到登录页')
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login'
        }
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const result = await response.json()
    logResponse(endpoint, result)
    
    return result
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error(`❌ API调用超时 ${endpoint}: ${API_CONFIG.timeout}ms`)
      throw new Error(`请求失败，超时：${API_CONFIG.timeout}`)
    }
    console.error(`❌ API调用失败 ${endpoint}:`, error.message)
    throw error
  }
}

/**
 * AIsiri智能调度服务类
 */
class AIsiriService {
  constructor() {
    this.userId = getCurrentUserId()
    this.sessionId = this.generateSessionId()
    console.log(`🤖 AIsiri智能调度服务初始化，用户ID: ${this.userId}`)
  }

  /**
   * 生成会话ID
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  ensureUserIdOrRedirect() {
    this.userId = getCurrentUserId()
    if (!this.userId && typeof window !== 'undefined') {
      console.warn('⚠️ [AIsiri] 未登录，跳转到登录页')
      window.location.href = '/auth/login'
      return false
    }
    return true
  }

  /**
   * 健康检查
   */
  async healthCheck() {
    return await makeAPIRequest('/dispatch/status')
  }

  /**
   * 智能调度 - 主要接口
   * @param {string} userInput - 用户输入内容
   * @param {string} sessionId - 会话ID（可选）
   * @returns {Promise<Object>} 智能调度结果
   */
  async dispatch(userInput, sessionId = null) {
    console.log(`\n🚀 AIsiri智能调度: "${userInput}"`)
    if (!this.ensureUserIdOrRedirect()) return
    
    const data = {
      userInput: userInput.trim(),
      sessionId: sessionId || this.sessionId,
      deviceInfo: {
        platform: 'web',
        version: '2.0.0'
      }
    }
    
    const result = await makeAPIRequest('/dispatch', data, 'POST')
    
    // 解析智能调度结果
    if (result.success) {
      console.log(`✅ 智能调度成功`)
      console.log(`🎯 识别意图: ${result.data.intents?.join(', ') || '无'}`)
      console.log(`🔧 执行服务: ${result.data.servicesExecuted?.join(', ') || '无'}`)
      
      // 记录执行的服务
      if (result.data.servicesExecuted) {
        result.data.servicesExecuted.forEach(service => {
          console.log(`⚙️ 执行服务: ${service}`)
        })
      }
      
      // 记录创建的任务
      if (result.data.taskCreated) {
        console.log(`📝 创建任务: ${result.data.taskCreated.title}`)
      }
      
      // 记录日程调整
      if (result.data.scheduleAdjusted) {
        console.log(`⏰ 日程已调整`)
      }
      
      // 记录情绪支持
      if (result.data.emotionalSupport) {
        console.log(`💝 提供情绪支持: ${result.data.emotionalSupport}`)
      }
    }
    
    return result
  }

  /**
   * 获取系统状态
   */
  async getStatus() {
    return await makeAPIRequest('/dispatch/status')
  }

  /**
   * 重新设置用户ID（用于测试）
   */
  resetUserId() {
    this.userId = getCurrentUserId()
    console.log(`🔄 重置用户ID: ${this.userId}`)
  }

  /**
   * 获取当前会话ID
   */
  getCurrentSessionId() {
    return this.sessionId
  }

  /**
   * 创建新会话
   */
  createNewSession() {
    this.sessionId = this.generateSessionId()
    console.log(`🆕 创建新会话: ${this.sessionId}`)
    return this.sessionId
  }
}

// 创建单例实例
const aisiriService = new AIsiriService()

export default aisiriService

// 同时导出类，用于需要多实例的场景
export { AIsiriService }