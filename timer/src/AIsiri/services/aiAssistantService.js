/**
 * AI助手服务
 * 管理AI助手的名称和心动值
 */



// 获取token
function getToken() {
  return localStorage.getItem('token') || ''
}

// 日志输出函数
function logAPI(operation, data) {
  const timestamp = new Date().toISOString()
  console.log(`\n🤖 === AI助手 ${operation} API调用 ===`)
  console.log(`⏰ 时间: ${timestamp}`)
  console.log(`📤 数据:`, data)
}

function logResponse(operation, response) {
  console.log(`📥 响应:`, response)
  console.log(`🤖 === AI助手 ${operation} API完成 ===\n`)
}

// 通用API请求函数
async function makeAPIRequest(endpoint, data = null, method = 'GET') {
  // 直接使用相对路径，因为AI助手接口在主API路径下
  const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  
  try {
    logAPI(endpoint, data)
    
    const token = getToken()
    const headers = {
      'Content-Type': 'application/json'
    }
    if (token) headers['Authorization'] = `Bearer ${token}`
    
    const options = {
      method,
      headers
    }
    
    if (data && method !== 'GET') {
      options.body = JSON.stringify(data)
    }
    
    const response = await fetch(url, options)
    
    if (!response.ok) {
      if (response.status === 401) {
        console.warn('🔒 未认证或token失效')
        throw new Error('未认证，请重新登录')
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const result = await response.json()
    logResponse(endpoint, result)
    
    return result
  } catch (error) {
    console.error(`❌ AI助手API调用失败 ${endpoint}:`, error.message)
    throw error
  }
}

/**
 * AI助手服务类
 */
class AIAssistantService {
  constructor() {
    this.assistant = null
    this.listeners = []
  }

  /**
   * 获取或创建AI助手
   */
  async getOrCreateAssistant() {
    try {
      const response = await makeAPIRequest('/api/ai-assistant', null, 'GET')
      if (response.success) {
        this.assistant = response.data
        this.notifyListeners()
        return this.assistant
      } else {
        throw new Error(response.message || '获取AI助手失败')
      }
    } catch (error) {
      console.error('获取AI助手失败:', error)
      throw error
    }
  }

  /**
   * 获取AI助手信息
   */
  async getAssistantInfo() {
    try {
      const response = await makeAPIRequest('/api/ai-assistant/info', null, 'GET')
      if (response.success) {
        this.assistant = response.data
        this.notifyListeners()
        return this.assistant
      } else {
        throw new Error(response.message || '获取AI助手信息失败')
      }
    } catch (error) {
      console.error('获取AI助手信息失败:', error)
      throw error
    }
  }

  /**
   * 更新AI助手名称
   */
  async updateAssistantName(name) {
    try {
      const response = await makeAPIRequest('/api/ai-assistant/name', { name }, 'PUT')
      if (response.success) {
        this.assistant = response.data
        this.notifyListeners()
        return this.assistant
      } else {
        throw new Error(response.message || '更新AI助手名称失败')
      }
    } catch (error) {
      console.error('更新AI助手名称失败:', error)
      throw error
    }
  }

  /**
   * 增加心动值
   */
  async increaseHeartValue() {
    try {
      const response = await makeAPIRequest('/api/ai-assistant/heart', null, 'POST')
      if (response.success) {
        this.assistant = response.data
        this.notifyListeners()
        return this.assistant
      } else {
        throw new Error(response.message || '增加心动值失败')
      }
    } catch (error) {
      console.error('增加心动值失败:', error)
      throw error
    }
  }

  /**
   * 获取当前AI助手信息
   */
  getCurrentAssistant() {
    return this.assistant
  }

  /**
   * 添加监听器
   */
  addListener(listener) {
    this.listeners.push(listener)
  }

  /**
   * 移除监听器
   */
  removeListener(listener) {
    const index = this.listeners.indexOf(listener)
    if (index > -1) {
      this.listeners.splice(index, 1)
    }
  }

  /**
   * 通知所有监听器
   */
  notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.assistant)
      } catch (error) {
        console.error('监听器执行失败:', error)
      }
    })
  }

  /**
   * 初始化AI助手
   */
  async initialize() {
    try {
      await this.getOrCreateAssistant()
      console.log('🤖 AI助手初始化成功:', this.assistant)
    } catch (error) {
      console.error('🤖 AI助手初始化失败:', error)
      // 创建默认助手信息
      this.assistant = {
        id: 'default',
        name: 'AI学习助手',
        heartValue: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      this.notifyListeners()
    }
  }
}

// 创建单例实例
const aiAssistantService = new AIAssistantService()

export default aiAssistantService
