import axios from 'axios'

// 创建axios实例
const http = axios.create({
  baseURL: 'http://localhost:3001/api',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
http.interceptors.request.use(
  config => {
    // 可以在这里添加认证token等
    console.log('API Request:', config.method?.toUpperCase(), config.url)
    console.log('Request Data:', config.data)
    return config
  },
  error => {
    console.error('Request Error:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
http.interceptors.response.use(
  response => {
    console.log('API Response:', response.status, response.config.url)
    console.log('Response Data:', response.data)
    return response.data
  },
  error => {
    console.error('Response Error:', error.response?.status, error.response?.data || error.message)
    return Promise.reject(error)
  }
)

export default http