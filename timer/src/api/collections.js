import axios from 'axios'
import { API_CONFIG } from '../config/api.js'

// 配置基础URL
const BASE_URL = API_CONFIG.baseURL

// 创建axios实例
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 任务集API
const collectionApi = {
  // 获取任务集列表
  getCollections(params = {}) {
    return api.get('/collections', { params })
  },

  // 获取单个任务集详情
  getCollection(id) {
    return api.get(`/collections/${id}`)
  },

  // 创建新任务集
  createCollection(data) {
    return api.post('/collections', data)
  },

  // 更新任务集
  updateCollection(id, data) {
    return api.put(`/collections/${id}`, data)
  },

  // 删除任务集
  deleteCollection(id, force = false) {
    return api.delete(`/collections/${id}`, {
      params: { force }
    })
  },

  // 归档/取消归档任务集
  archiveCollection(id, archived = true) {
    return api.put(`/collections/${id}/archive`, { archived })
  },

  // 获取统计信息
  getStats(params = {}) {
    return api.get('/collections/stats', { params })
  },

  // 获取"其他"任务集
  getOtherCollection(params = {}) {
    return api.get('/collections/other', { params })
  }
}

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 添加认证token
    const token = localStorage.getItem('token')
    if (token) {
      config.headers = config.headers || {}
      config.headers['Authorization'] = `Bearer ${token}`
    }
    console.log(`🔵 API请求: ${config.method?.toUpperCase()} ${config.url}`, config.data || config.params)
    return config
  },
  (error) => {
    console.error('❌ API请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    console.log(`🟢 API响应: ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data)
    return response
  },
  (error) => {
    console.error('❌ API响应错误:', error.response?.data || error.message)
    
    // 统一错误处理
    const message = error.response?.data?.message || error.message || '网络错误'
    
    // 401 处理：跳转登录
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/auth/login'
    }

    // 可以在这里添加全局错误提示
    if (typeof window !== 'undefined' && window.app && window.app.$toast) {
      window.app.$toast.error(message)
    }
    
    return Promise.reject(error)
  }
)

export default collectionApi