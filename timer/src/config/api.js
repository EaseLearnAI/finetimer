// API配置文件
// 支持开发和生产环境的不同配置

const isDevelopment = process.env.NODE_ENV === 'development'

// 开发环境使用代理，生产环境使用相对路径
export const API_CONFIG = {
  // 基础API路径
  baseURL: isDevelopment ? '/api' : '/api',
  
  // AI API路径
  aiBaseURL: isDevelopment ? '/api/ai' : '/api/ai',
  
  // AIsiri智能调度API路径 - 已集成到主应用中，使用相对路径
  aisiriBaseURL: isDevelopment ? '/api/aisiri' : '/api/aisiri',
  
  // 语音识别API路径 - 直接使用相对路径，避免重复
  speechRecognitionBaseURL: '/api',
  
  // 超时设置
  timeout: 60000,
  
  // 请求头
  headers: {
    'Content-Type': 'application/json'
  }
}

// 获取完整的API URL
export function getApiUrl(path) {
  return `${API_CONFIG.baseURL}${path}`
}

// 获取AI API URL
export function getAiApiUrl(path) {
  return `${API_CONFIG.aiBaseURL}${path}`
}

// 获取AIsiri智能调度API URL
export function getAisiriApiUrl(path) {
  return `${API_CONFIG.aisiriBaseURL}${path}`
}

// 获取语音识别API URL - 避免重复的/api前缀
export function getSpeechRecognitionApiUrl(path) {
  // 如果path已经包含/api前缀，直接返回
  if (path.startsWith('/api/')) {
    return path
  }
  // 否则添加/api前缀
  return `/api${path}`
}

// 环境信息
export const ENV_INFO = {
  isDevelopment,
  isProduction: !isDevelopment,
  apiBase: API_CONFIG.baseURL
}

