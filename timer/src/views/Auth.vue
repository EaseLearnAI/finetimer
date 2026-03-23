<template>
  <div class="auth-page">
    <div class="auth-container">
      <!-- Logo部分 -->
      <AuthLogo />

      <!-- 登录表单 -->
      <LoginForm
        v-if="currentMode === 'login'"
        @switch-mode="switchMode"
        :on-submit="handleLogin"
      />

      <!-- 注册表单 -->
      <RegisterForm
        v-else
        @switch-mode="switchMode"
        :on-submit="handleRegister"
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
        if (error.response?.status === 409) {
          currentMode.value = 'login'
          router.replace('/auth/login')
        }
        throw error
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
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at top left, rgba(84, 147, 255, 0.12), transparent 30%),
    radial-gradient(circle at bottom right, rgba(84, 147, 255, 0.1), transparent 28%),
    linear-gradient(180deg, #f7f9fc 0%, #eef3f9 100%);
}

.auth-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(22px);
  -webkit-backdrop-filter: blur(22px);
  border: 1px solid rgba(214, 223, 235, 0.9);
  border-radius: 32px;
  box-shadow:
    0 28px 60px rgba(31, 58, 95, 0.08),
    0 8px 24px rgba(84, 147, 255, 0.06);
  padding: 44px 40px;
  width: 100%;
  max-width: 420px;
  position: relative;
  z-index: 10;
  transition: box-shadow 0.28s ease, transform 0.28s ease;
}

.auth-container:hover {
  transform: translateY(-1px);
  box-shadow:
    0 34px 72px rgba(31, 58, 95, 0.1),
    0 10px 28px rgba(84, 147, 255, 0.08);
}

.bg-decoration {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
}

.bg-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(84, 147, 255, 0.12);
  filter: blur(2px);
  animation: float 12s ease-in-out infinite;
}

.bg-circle-1 {
  width: 180px;
  height: 180px;
  top: 9%;
  left: 8%;
  animation-delay: 0s;
}

.bg-circle-2 {
  width: 150px;
  height: 150px;
  right: 10%;
  bottom: 9%;
  animation-delay: 2s;
}

.bg-circle-3 {
  width: 96px;
  height: 96px;
  top: 22%;
  right: 18%;
  animation-delay: 4s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
    opacity: 0.55;
  }
  50% {
    transform: translateY(-12px) rotate(6deg);
    opacity: 0.8;
  }
}

@media (max-width: 480px) {
  .auth-page {
    padding: 16px;
  }
  
  .auth-container {
    min-height: auto;
    padding: 34px 24px;
    max-width: 100%;
    border-radius: 28px;
  }
  
  .bg-circle-2,
  .bg-circle-3 {
    display: none;
  }
}

@media (min-width: 481px) and (max-width: 768px) {
  .auth-container {
    max-width: 440px;
    padding: 40px 34px;
  }
}

@media (min-width: 1200px) {
  .auth-container {
    max-width: 430px;
    padding: 48px 42px;
  }
}

@media (max-height: 700px) {
  .auth-page {
    padding: 14px;
  }
  
  .auth-container {
    padding: 30px 28px;
  }
}

@media (prefers-color-scheme: dark) {
  .auth-page {
    background:
      radial-gradient(circle at top left, rgba(84, 147, 255, 0.18), transparent 30%),
      linear-gradient(180deg, #0f1723 0%, #152033 100%);
  }

  .auth-container {
    background: rgba(15, 23, 35, 0.82);
    border-color: rgba(125, 145, 175, 0.2);
    color: #f8fbff;
  }
}

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