import { reactive, computed } from 'vue'
import authAPI from '../api/auth.js'

// 用户认证状态管理
const authState = reactive({
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,
  isLoading: false
})

export const useAuthStore = () => {
  // 计算属性
  const isAuthenticated = computed(() => !!authState.token && !!authState.user)
  const currentUser = computed(() => authState.user)
  const isLoading = computed(() => authState.isLoading)

  // 保存认证信息到本地存储
  const saveAuthData = (user, token) => {
    console.log('💾 保存用户认证信息到本地存储')
    authState.user = user
    authState.token = token
    localStorage.setItem('user', JSON.stringify(user))
    localStorage.setItem('token', token)
  }

  // 清除认证信息
  const clearAuthData = () => {
    console.log('🗑️ 清除用户认证信息')
    authState.user = null
    authState.token = null
    localStorage.removeItem('user')
    localStorage.removeItem('token')
  }

  // 用户注册
  const register = async (userData) => {
    console.log('📝 开始用户注册流程')
    authState.isLoading = true
    try {
      const response = await authAPI.register(userData)
      if (response.success) {
        const { user, token } = response.data
        saveAuthData(user, token)
        console.log('🎉 注册并自动登录成功!')
        return { success: true, user }
      }
      throw new Error(response.message || '注册失败')
    } catch (error) {
      console.error('❌ 注册失败:', error)
      throw error
    } finally {
      authState.isLoading = false
    }
  }

  // 用户登录
  const login = async (credentials) => {
    console.log('🔐 开始用户登录流程')
    authState.isLoading = true
    try {
      const response = await authAPI.login(credentials)
      if (response.success) {
        const { user, token } = response.data
        saveAuthData(user, token)
        console.log('🎉 登录成功!')
        return { success: true, user }
      }
      throw new Error(response.message || '登录失败')
    } catch (error) {
      console.error('❌ 登录失败:', error)
      throw error
    } finally {
      authState.isLoading = false
    }
  }

  // 用户登出
  const logout = () => {
    console.log('👋 用户登出')
    clearAuthData()
  }

  // 获取用户信息
  const fetchUserProfile = async () => {
    console.log('👤 获取用户详细信息')
    try {
      const response = await authAPI.getUserProfile()
      if (response.success) {
        authState.user = response.data.user
        localStorage.setItem('user', JSON.stringify(response.data.user))
        return response.data.user
      }
    } catch (error) {
      console.error('❌ 获取用户信息失败:', error)
      // 如果token无效，清除本地存储
      if (error.response?.status === 401) {
        logout()
      }
      throw error
    }
  }

  // 更新用户信息
  const updateProfile = async (updateData) => {
    console.log('✏️ 更新用户信息')
    try {
      const response = await authAPI.updateUserProfile(updateData)
      if (response.success) {
        authState.user = response.data.user
        localStorage.setItem('user', JSON.stringify(response.data.user))
        console.log('✅ 用户信息更新成功')
        return response.data.user
      }
    } catch (error) {
      console.error('❌ 更新用户信息失败:', error)
      throw error
    }
  }

  return {
    // 状态
    isAuthenticated,
    currentUser,
    isLoading,
    
    // 方法
    register,
    login,
    logout,
    fetchUserProfile,
    updateProfile
  }
}

export default useAuthStore