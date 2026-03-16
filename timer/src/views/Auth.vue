<template>
  <div class="auth-page">
    <div class="auth-container">
      <!-- Logo部分 -->
      <AuthLogo />

      <!-- 登录表单 -->
      <LoginForm
        v-if="currentMode === 'login'"
        @switch-mode="switchMode"
        @submit="handleLogin"
      />

      <!-- 注册表单 -->
      <RegisterForm
        v-else
        @switch-mode="switchMode"
        @submit="handleRegister"
      />
    </div>

    <!-- 背景装饰 -->
    <div class="bg-decoration">
      <div class="bg-circle bg-circle-1"></div>
      <div class="bg-circle bg-circle-2"></div>
      <div class="bg-circle bg-circle-3"></div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useToast } from 'vue-toastification'
import AuthLogo from '../components/login/AuthLogo.vue'
import LoginForm from '../components/login/LoginForm.vue'
import RegisterForm from '../components/login/RegisterForm.vue'
import { useAuthStore } from '../store/auth.js'

export default {
  name: 'AuthPage',
  components: {
    AuthLogo,
    LoginForm,
    RegisterForm
  },
  setup() {
    const router = useRouter()
    const route = useRoute()
    const toast = useToast()
    const authStore = useAuthStore()

    // 当前模式（登录/注册）
    const currentMode = ref('login')

    // 检查是否已经登录
    onMounted(() => {
      console.log('🔍 检查用户登录状态')
      if (authStore.isAuthenticated.value) {
        console.log('✅ 用户已登录，跳转到主页')
        router.replace('/')
        return
      }

      // 根据路由参数设置模式
      const mode = route.params.mode || 'login'
      if (['login', 'register'].includes(mode)) {
        currentMode.value = mode
        console.log(`📱 设置认证模式: ${mode}`)
      }
    })

    // 切换模式
    const switchMode = (mode) => {
      console.log(`🔄 切换认证模式: ${currentMode.value} -> ${mode}`)
      currentMode.value = mode
      // 更新URL但不触发路由跳转
      const newPath = `/auth/${mode}`
      if (route.path !== newPath) {
        router.replace(newPath)
      }
    }

    // 处理登录
    const handleLogin = async (credentials) => {
      console.log('🔐 处理用户登录')
      try {
        const result = await authStore.login(credentials)
        
        if (result.success) {
          toast.success(`欢迎回来，${result.user.nickname || result.user.maskedPhoneNumber}！`)
          console.log('🎉 登录成功，准备跳转')
          
          // 延迟跳转以显示成功消息
          setTimeout(() => {
            const redirectPath = route.query.redirect || '/'
            console.log(`🔄 跳转到: ${redirectPath}`)
            router.replace(redirectPath)
          }, 1000)
        }
      } catch (error) {
        console.error('❌ 登录失败:', error)
        const errorMessage = error.response?.data?.message || error.message || '登录失败，请重试'
        toast.error(errorMessage)
        // 不再向上传递错误，避免触发“Unhandled error during execution of component event handler”
      }
    }

    // 处理注册
    const handleRegister = async (userData) => {
      console.log('📝 处理用户注册')
      try {
        const result = await authStore.register(userData)
        
        if (result.success) {
          toast.success(`注册成功！欢迎加入，${result.user.nickname || result.user.maskedPhoneNumber}！`)
          console.log('🎉 注册成功，准备跳转')
          
          // 延迟跳转以显示成功消息
          setTimeout(() => {
            console.log('🔄 跳转到主页')
            router.replace('/')
          }, 1000)
        }
      } catch (error) {
        console.error('❌ 注册失败:', error)
        const errorMessage = error.response?.data?.message || error.message || '注册失败，请重试'
        toast.error(errorMessage)
        throw error // 让表单组件也能处理错误
      }
    }

    return {
      currentMode,
      switchMode,
      handleLogin,
      handleRegister
    }
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
  overflow: hidden;
}

.auth-container {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  padding: 48px 40px;
  width: 100%;
  max-width: 380px;
  position: relative;
  z-index: 10;
  transition: all 0.3s ease;
}

.auth-container:hover {
  transform: translateY(-2px);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
}

/* 背景装饰 */
.bg-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 1;
}

.bg-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  animation: float 6s ease-in-out infinite;
}

.bg-circle-1 {
  width: 120px;
  height: 120px;
  top: 10%;
  left: 10%;
  animation-delay: 0s;
}

.bg-circle-2 {
  width: 80px;
  height: 80px;
  top: 70%;
  right: 15%;
  animation-delay: 2s;
}

.bg-circle-3 {
  width: 60px;
  height: 60px;
  top: 30%;
  right: 25%;
  animation-delay: 4s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
    opacity: 0.7;
  }
  50% {
    transform: translateY(-20px) rotate(180deg);
    opacity: 1;
  }
}

/* 移动端适配 */
@media (max-width: 480px) {
  .auth-page {
    padding: 16px;
  }
  
  .auth-container {
    padding: 40px 32px;
    max-width: 100%;
    border-radius: 20px;
  }
  
  /* 移动端隐藏部分背景装饰以提升性能 */
  .bg-circle-2,
  .bg-circle-3 {
    display: none;
  }
}

/* 平板适配 */
@media (min-width: 481px) and (max-width: 768px) {
  .auth-container {
    max-width: 420px;
    padding: 44px 36px;
  }
}

/* 大屏幕优化 */
@media (min-width: 1200px) {
  .auth-container {
    max-width: 400px;
    padding: 52px 44px;
  }
}

/* 高度较小的屏幕适配 */
@media (max-height: 700px) {
  .auth-page {
    padding: 10px;
  }
  
  .auth-container {
    padding: 30px 32px;
  }
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .auth-container {
    background: rgba(26, 26, 26, 0.95);
    color: #fff;
  }
}

/* 减少动画以节省电量 */
@media (prefers-reduced-motion: reduce) {
  .auth-container,
  .bg-circle {
    animation: none;
    transition: none;
  }
  
  .auth-container:hover {
    transform: none;
  }
}
</style>