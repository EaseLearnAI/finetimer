import http from './http.js'

// 用户认证相关API
export const authAPI = {
  // 用户注册
  register: async (userData) => {
    console.log('🔄 发起注册请求:', userData)
    try {
      const response = await http.post('/users/register', userData)
      console.log('✅ 注册成功:', response)
      return response
    } catch (error) {
      console.error('❌ 注册失败:', error.response?.data || error.message)
      throw error
    }
  },

  // 用户登录
  login: async (credentials) => {
    console.log('🔄 发起登录请求:', { phoneNumber: credentials.phoneNumber, password: '***' })
    try {
      const response = await http.post('/users/login', credentials)
      console.log('✅ 登录成功:', {
        ...response,
        data: {
          ...response.data,
          token: '***' // 隐藏token信息
        }
      })
      return response
    } catch (error) {
      console.error('❌ 登录失败:', error.response?.data || error.message)
      throw error
    }
  },

  // 获取用户信息
  getUserProfile: async () => {
    console.log('🔄 获取用户信息...')
    try {
      const response = await http.get('/users/profile')
      console.log('✅ 用户信息获取成功:', response)
      return response
    } catch (error) {
      console.error('❌ 获取用户信息失败:', error.response?.data || error.message)
      throw error
    }
  },

  // 更新用户信息
  updateUserProfile: async (updateData) => {
    console.log('🔄 更新用户信息:', updateData)
    try {
      const response = await http.put('/users/profile', updateData)
      console.log('✅ 用户信息更新成功:', response)
      return response
    } catch (error) {
      console.error('❌ 用户信息更新失败:', error.response?.data || error.message)
      throw error
    }
  }
}

export default authAPI