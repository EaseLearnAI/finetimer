<template>
  <form @submit.prevent="handleSubmit" class="auth-form">
    <!-- 手机号输入 -->
    <div class="form-group">
      <label class="form-label">手机号</label>
      <div class="input-wrapper">
        <font-awesome-icon icon="phone" class="input-icon" />
        <input
          v-model="formData.phoneNumber"
          type="tel"
          class="form-input"
          :class="{ 'error': errors.phoneNumber }"
          placeholder="请输入手机号"
          maxlength="11"
          required
          @input="validatePhoneNumber"
          @blur="validatePhoneNumber"
        />
      </div>
      <div v-if="errors.phoneNumber" class="error-message">
        {{ errors.phoneNumber }}
      </div>
    </div>

    <!-- 密码输入 -->
    <div class="form-group">
      <label class="form-label">密码</label>
      <div class="input-wrapper">
        <font-awesome-icon icon="lock" class="input-icon" />
        <input
          v-model="formData.password"
          :type="showPassword ? 'text' : 'password'"
          class="form-input"
          :class="{ 'error': errors.password }"
          placeholder="请输入密码"
          minlength="6"
          required
          @blur="validatePassword"
        />
        <button
          type="button"
          class="password-toggle"
          @click="showPassword = !showPassword"
        >
          <font-awesome-icon :icon="showPassword ? 'eye-slash' : 'eye'" />
        </button>
      </div>
      <div v-if="errors.password" class="error-message">
        {{ errors.password }}
      </div>
    </div>

    <!-- 提交按钮 -->
    <button
      type="submit"
      class="auth-btn"
      :disabled="isLoading || !isFormValid"
      :class="{ 'loading': isLoading }"
    >
      <font-awesome-icon v-if="isLoading" icon="spinner" spin class="btn-icon" />
      <font-awesome-icon v-else icon="sign-in-alt" class="btn-icon" />
      {{ isLoading ? '登录中...' : '登录' }}
    </button>

    <!-- 错误/成功消息 -->
    <div v-if="message.text" :class="['message', message.type]">
      <font-awesome-icon 
        :icon="message.type === 'error' ? 'exclamation-circle' : 'check-circle'" 
        class="message-icon" 
      />
      {{ message.text }}
    </div>

    <!-- 切换到注册 -->
    <div class="switch-mode">
      还没有账号？
      <button type="button" class="switch-link" @click="$emit('switch-mode', 'register')">
        立即注册
      </button>
    </div>
  </form>
</template>

<script>
import { ref, computed, reactive } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

export default {
  name: 'LoginForm',
  components: {
    FontAwesomeIcon
  },
  props: {
    onSubmit: {
      type: Function,
      required: true
    }
  },
  emits: ['switch-mode'],
  setup(props) {
    // 表单数据
    const formData = reactive({
      phoneNumber: '',
      password: ''
    })

    // 表单状态
    const isLoading = ref(false)
    const showPassword = ref(false)
    const errors = reactive({
      phoneNumber: '',
      password: ''
    })
    const message = reactive({
      text: '',
      type: ''
    })

    // 验证手机号
    const validatePhoneNumber = () => {
      const phoneRegex = /^1[3-9]\d{9}$/
      if (!formData.phoneNumber) {
        errors.phoneNumber = '请输入手机号'
      } else if (!phoneRegex.test(formData.phoneNumber)) {
        errors.phoneNumber = '请输入正确的11位手机号'
      } else {
        errors.phoneNumber = ''
      }
    }

    // 验证密码
    const validatePassword = () => {
      if (!formData.password) {
        errors.password = '请输入密码'
      } else if (formData.password.length < 6) {
        errors.password = '密码长度至少6位'
      } else {
        errors.password = ''
      }
    }

    // 表单是否有效
    const isFormValid = computed(() => {
      return formData.phoneNumber && 
             formData.password && 
             !errors.phoneNumber && 
             !errors.password
    })

    // 显示消息
    const showMessage = (text, type = 'error') => {
      console.log(`${type === 'error' ? '❌' : '✅'} ${text}`)
      message.text = text
      message.type = type
      setTimeout(() => {
        message.text = ''
        message.type = ''
      }, 3000)
    }

    // 表单提交
    const handleSubmit = async () => {
      console.log('🔄 登录表单提交')
      
      // 验证表单
      validatePhoneNumber()
      validatePassword()

      if (!isFormValid.value) {
        showMessage('请正确填写所有字段')
        return
      }

      isLoading.value = true

      try {
        console.log('📤 提交登录数据:', { 
          phoneNumber: formData.phoneNumber,
          password: '***'
        })
        
        await props.onSubmit({ ...formData })
        // 成功消息由父组件 toast 提示，这里仅在确认为成功时显示
        // showMessage('登录成功！', 'success')
        
      } catch (error) {
        console.error('❌ 登录失败:', error)
        const errorMessage = error?.response?.data?.message || error?.message || '登录失败，请重试'
        showMessage(errorMessage)
      } finally {
        isLoading.value = false
      }
    }

    return {
      formData,
      errors,
      message,
      isLoading,
      showPassword,
      isFormValid,
      validatePhoneNumber,
      validatePassword,
      handleSubmit,
      showMessage
    }
  }
}
</script>

<style scoped>
.auth-form {
  width: 100%;
}

.form-group {
  margin-bottom: 24px;
  text-align: left;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #445166;
  margin-bottom: 10px;
  letter-spacing: 0.01em;
}

.input-wrapper {
  position: relative;
}

.form-input {
  width: 100%;
  min-height: 56px;
  padding: 16px 18px 16px 48px;
  border: 1px solid #d9e1ec;
  border-radius: 16px;
  font-size: 16px;
  color: #162033;
  transition: border-color 0.24s ease, box-shadow 0.24s ease, background-color 0.24s ease;
  background: #f8fafc;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #4c97ff;
  background: #ffffff;
  box-shadow: 0 0 0 4px rgba(76, 151, 255, 0.14);
}

.form-input.error {
  border-color: #ef6b6b;
  background: #fff7f7;
}

.input-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #8ca0b8;
  font-size: 15px;
  z-index: 1;
}

.password-toggle {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #8ca0b8;
  cursor: pointer;
  padding: 4px;
  font-size: 16px;
  transition: color 0.2s ease;
}

.password-toggle:hover {
  color: #2f7cf6;
}

.auth-btn {
  width: 100%;
  min-height: 54px;
  padding: 15px 18px;
  background: linear-gradient(180deg, #4c97ff 0%, #2f7cf6 100%);
  color: white;
  border: none;
  border-radius: 16px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  letter-spacing: 0.01em;
  transition: transform 0.24s ease, box-shadow 0.24s ease, opacity 0.24s ease;
  margin-top: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 14px 24px rgba(47, 124, 246, 0.22);
}

.auth-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 18px 32px rgba(47, 124, 246, 0.26);
}

.auth-btn:active {
  transform: translateY(0);
}

.auth-btn:disabled {
  opacity: 0.58;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.auth-btn.loading {
  opacity: 0.9;
}

.btn-icon {
  font-size: 14px;
}

.message {
  margin-top: 18px;
  padding: 12px 14px;
  border-radius: 14px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  animation: slideIn 0.3s ease;
}

.message.error {
  background: #fff5f5;
  color: #cf4545;
  border: 1px solid #ffd9d9;
}

.message.success {
  background: #f2fbf6;
  color: #248a58;
  border: 1px solid #ccefd9;
}

.message-icon {
  font-size: 16px;
}

.error-message {
  color: #d95d5d;
  font-size: 13px;
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.switch-mode {
  margin-top: 26px;
  font-size: 14px;
  color: #7b8798;
  text-align: center;
}

.switch-link {
  color: #2f7cf6;
  background: none;
  border: none;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  padding: 0;
  margin-left: 4px;
}

.switch-link:hover {
  color: #1969ea;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 移动端适配 */
@media (max-width: 480px) {
  .form-input {
    padding: 14px 18px 14px 44px;
    font-size: 16px; /* 防止iOS缩放 */
  }
  
  .input-icon {
    left: 14px;
    font-size: 14px;
  }
  
  .password-toggle {
    right: 14px;
    font-size: 14px;
  }
  
  .auth-btn {
    padding: 14px;
    font-size: 15px;
  }
}
</style>