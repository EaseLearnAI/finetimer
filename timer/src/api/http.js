import axios from 'axios'
import { API_CONFIG } from '../config/api.js'

// 创建axios实例
const http = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  headers: API_CONFIG.headers
})

// 请求拦截器
http.interceptors.request.use(
  config => {
    // 自动添加认证token
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    console.log('📡 API Request:', config.method?.toUpperCase(), config.url)
    if (config.data) {
      // 隐藏敏感信息
      const logData = { ...config.data }
      if (logData.password) logData.password = '***'
      console.log('📤 Request Data:', logData)
    }
    return config
  },
  error => {
    console.error('❌ Request Error:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
http.interceptors.response.use(
  response => {
    console.log('📨 API Response:', response.status, response.config.url)
    console.log('📥 Response Data:', response.data)
    return response.data
  },
  error => {
    console.error('❌ Response Error:', error.response?.status, error.response?.data || error.message)
    
    // 处理认证失败
    if (error.response?.status === 401) {
      console.log('🔒 Token过期或无效，清除本地存储')
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      
      // 如果不是登录或注册页面，跳转到登录页
      if (!window.location.pathname.includes('/auth')) {
        console.log('🔄 跳转到登录页面')
        window.location.href = '/auth/login'
      }
    }
    
    return Promise.reject(error)
  }
)

export default http