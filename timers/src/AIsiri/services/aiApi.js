/**
 * AI任务助手 API服务
 * 提供与后端AI API的通信功能
 */

// API基础配置
const API_CONFIG = {
  baseURL: 'http://localhost:3000/api/ai',
  timeout: 60000, // 60秒超时，计划生成可能较慢
  headers: {
    'Content-Type': 'application/json'
  }
}

// 生成唯一用户ID（备用函数）
// function generateUserId() {
//   return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
// }

// 获取或创建用户ID，使用固定的测试用户ID
function getUserId() {
  // 使用固定的测试用户ID，与后端保持一致
  return '68974d3a68e7adf1e74f68ab'
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
    
    const options = {
      method,
      headers: API_CONFIG.headers,
      signal: controller.signal
    }
    
    if (data && method !== 'GET') {
      options.body = JSON.stringify(data)
    }
    
    const response = await fetch(url, options)
    clearTimeout(timeoutId)
    
    if (!response.ok) {
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
 * AI服务类
 */
class AIService {
  constructor() {
    this.userId = getUserId()
    console.log(`🤖 AI服务初始化，用户ID: ${this.userId}`)
  }

  /**
   * 健康检查
   */
  async healthCheck() {
    return await makeAPIRequest('/health')
  }

  /**
   * 测试AI连接
   */
  async testConnection() {
    return await makeAPIRequest('/test-connection')
  }

  /**
   * 获取系统状态
   */
  async getStatus() {
    return await makeAPIRequest('/status')
  }

  /**
   * 处理用户输入 - 主要API
   * @param {string} userInput - 用户输入内容
   * @returns {Promise<Object>} 处理结果
   */
  async processInput(userInput) {
    console.log(`\n💬 处理用户输入: "${userInput}"`)
    
    const data = {
      userInput: userInput.trim(),
      userId: this.userId
    }
    
    const result = await makeAPIRequest('/process-input', data, 'POST')
    
    // 解析结果类型
    if (result.success) {
      switch (result.type) {
        case 'simple_todo':
          console.log(`✅ 创建简单待办: ${result.result.task?.title}`)
          if (result.result.timeArrangement) {
            console.log(`⏰ 时间安排: ${result.result.timeArrangement.date} ${result.result.timeArrangement.time || '未指定时间'}`)
          }
          break
        case 'goal_planning':
          console.log(`🎯 目标规划，生成${result.result.questions?.questions?.length || 0}个问题`)
          break
        case 'habit_formation':
          console.log(`🔄 习惯养成，生成${result.result.questions?.questions?.length || 0}个问题`)
          break
        case 'dynamic_adjustment': {
          console.log(`🔄 动态调整完成`)
          const summary = result.result.adjustmentSummary
          if (summary) {
            console.log(`📊 调整统计: 修改${summary.modified_tasks}个，延后${summary.postponed_tasks}个，新增${summary.new_tasks}个任务`)
          }
          break
        }
      }
    }
    
    return result
  }

  /**
   * 分类用户输入（测试用）
   * @param {string} userInput - 用户输入内容
   * @returns {Promise<Object>} 分类结果
   */
  async classifyInput(userInput) {
    const data = { userInput: userInput.trim() }
    return await makeAPIRequest('/classify-input', data, 'POST')
  }

  /**
   * 生成问题
   * @param {string} goal - 用户目标
   * @param {string} goalType - 目标类型
   * @returns {Promise<Object>} 问题列表
   */
  async generateQuestions(goal, goalType) {
    const data = {
      goal: goal.trim(),
      goalType: goalType
    }
    return await makeAPIRequest('/generate-questions', data, 'POST')
  }

  /**
   * 根据用户回答生成计划
   * @param {string} goal - 用户目标
   * @param {string} goalType - 目标类型
   * @param {Array} userAnswers - 用户回答数组
   * @returns {Promise<Object>} 生成的计划
   */
  async generatePlan(goal, goalType, userAnswers) {
    console.log(`\n📋 生成计划: ${goal}`)
    console.log(`📝 用户回答数量: ${userAnswers.length}`)
    
    const data = {
      goal: goal.trim(),
      goalType,
      userAnswers,
      userId: this.userId
    }
    
    const result = await makeAPIRequest('/generate-plan', data, 'POST')
    
    if (result.success) {
      const summary = result.result.summary
      console.log(`✅ 计划生成成功: ${summary?.collections_count}个任务集, ${summary?.tasks_count}个任务`)
    }
    
    return result
  }

  /**
   * 根据用户回答生成习惯计划
   * @param {string} userInput - 用户输入
   * @param {string} habitType - 习惯类型
   * @param {Array} questionAnswers - 问题回答数组
   * @returns {Promise<Object>} 生成的习惯计划
   */
  async generateHabitPlan(userInput, habitType, questionAnswers) {
    console.log(`\n🔄 生成习惯计划: ${userInput}`)
    console.log(`📝 习惯类型: ${habitType}`)
    console.log(`📝 用户回答数量: ${questionAnswers.length}`)
    
    const data = {
      userInput: userInput.trim(),
      habitType,
      questionAnswers,
      userId: this.userId
    }
    
    const result = await makeAPIRequest('/generate-habit-plan', data, 'POST')
    
    if (result.success) {
      const summary = result.result.summary
      console.log(`✅ 习惯计划生成成功: ${summary?.task_count}个任务, 持续${summary?.duration}`)
    }
    
    return result
  }

  /**
   * 调整现有计划
   * @param {string} planId - 计划ID
   * @param {string} userFeedback - 用户反馈
   * @returns {Promise<Object>} 调整结果
   */
  async adjustPlan(planId, userFeedback) {
    console.log(`\n🔧 调整计划: ${planId}`)
    console.log(`💬 用户反馈: ${userFeedback}`)
    
    const data = {
      planId,
      userFeedback: userFeedback.trim(),
      userId: this.userId
    }
    
    return await makeAPIRequest('/adjust-plan', data, 'POST')
  }

  /**
   * 重新设置用户ID（用于测试）
   */
  resetUserId() {
    localStorage.removeItem('ai_user_id')
    this.userId = getUserId()
    console.log(`🔄 重置用户ID: ${this.userId}`)
  }
}

// 创建单例实例
const aiService = new AIService()

// 导出
export default aiService

// 同时导出类，用于需要多实例的场景
export { AIService }