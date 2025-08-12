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

    <!-- 昵称输入 -->
    <div class="form-group">
      <label class="form-label">昵称 <span class="optional">(可选)</span></label>
      <div class="input-wrapper">
        <font-awesome-icon icon="user" class="input-icon" />
        <input
          v-model="formData.nickname"
          type="text"
          class="form-input"
          :class="{ 'error': errors.nickname }"
          placeholder="请输入昵称"
          maxlength="50"
          @blur="validateNickname"
        />
      </div>
      <div v-if="errors.nickname" class="error-message">
        {{ errors.nickname }}
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
          placeholder="请设置密码（至少6位）"
          minlength="6"
          required
          @input="validatePassword"
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

    <!-- 确认密码输入 -->
    <div class="form-group">
      <label class="form-label">确认密码</label>
      <div class="input-wrapper">
        <font-awesome-icon icon="lock" class="input-icon" />
        <input
          v-model="formData.confirmPassword"
          :type="showConfirmPassword ? 'text' : 'password'"
          class="form-input"
          :class="{ 'error': errors.confirmPassword }"
          placeholder="请再次输入密码"
          minlength="6"
          required
          @blur="validateConfirmPassword"
        />
        <button
          type="button"
          class="password-toggle"
          @click="showConfirmPassword = !showConfirmPassword"
        >
          <font-awesome-icon :icon="showConfirmPassword ? 'eye-slash' : 'eye'" />
        </button>
      </div>
      <div v-if="errors.confirmPassword" class="error-message">
        {{ errors.confirmPassword }}
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
      <font-awesome-icon v-else icon="user-plus" class="btn-icon" />
      {{ isLoading ? '注册中...' : '注册' }}
    </button>

    <!-- 错误/成功消息 -->
    <div v-if="message.text" :class="['message', message.type]">
      <font-awesome-icon 
        :icon="message.type === 'error' ? 'exclamation-circle' : 'check-circle'" 
        class="message-icon" 
      />
      {{ message.text }}
    </div>

    <!-- 切换到登录 -->
    <div class="switch-mode">
      已有账号？
      <button type="button" class="switch-link" @click="$emit('switch-mode', 'login')">
        立即登录
      </button>
    </div>
  </form>
</template>

<script>
import { ref, computed, reactive } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

export default {
  name: 'RegisterForm',
  components: {
    FontAwesomeIcon
  },
  emits: ['switch-mode', 'submit'],
  setup(props, { emit }) {
    // 表单数据
    const formData = reactive({
      phoneNumber: '',
      nickname: '',
      password: '',
      confirmPassword: ''
    })

    // 表单状态
    const isLoading = ref(false)
    const showPassword = ref(false)
    const showConfirmPassword = ref(false)
    const errors = reactive({
      phoneNumber: '',
      nickname: '',
      password: '',
      confirmPassword: ''
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

    // 验证昵称
    const validateNickname = () => {
      if (formData.nickname && formData.nickname.length > 50) {
        errors.nickname = '昵称长度不能超过50个字符'
      } else {
        errors.nickname = ''
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
      // 如果确认密码已填写，重新验证确认密码
      if (formData.confirmPassword) {
        validateConfirmPassword()
      }
    }

    // 验证确认密码
    const validateConfirmPassword = () => {
      if (!formData.confirmPassword) {
        errors.confirmPassword = '请确认密码'
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = '两次输入的密码不一致'
      } else {
        errors.confirmPassword = ''
      }
    }

    // 表单是否有效
    const isFormValid = computed(() => {
      return formData.phoneNumber && 
             formData.password && 
             formData.confirmPassword &&
             !errors.phoneNumber && 
             !errors.nickname &&
             !errors.password && 
             !errors.confirmPassword
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
      console.log('🔄 注册表单提交')
      
      // 验证表单
      validatePhoneNumber()
      validateNickname()
      validatePassword()
      validateConfirmPassword()

      if (!isFormValid.value) {
        showMessage('请正确填写所有字段')
        return
      }

      isLoading.value = true

      try {
        const submitData = {
          phoneNumber: formData.phoneNumber,
          password: formData.password
        }
        
        // 如果填写了昵称，添加到提交数据中
        if (formData.nickname.trim()) {
          submitData.nickname = formData.nickname.trim()
        }

        console.log('📤 提交注册数据:', { 
          ...submitData,
          password: '***'
        })
        
        await emit('submit', submitData)
        showMessage('注册成功！', 'success')
        
      } catch (error) {
        console.error('❌ 注册失败:', error)
        const errorMessage = error.response?.data?.message || error.message || '注册失败，请重试'
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
      showConfirmPassword,
      isFormValid,
      validatePhoneNumber,
      validateNickname,
      validatePassword,
      validateConfirmPassword,
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
  margin-bottom: 20px;
  text-align: left;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
}

.optional {
  font-weight: 400;
  color: #888;
  font-size: 12px;
}

.input-wrapper {
  position: relative;
}

.form-input {
  width: 100%;
  padding: 16px 20px 16px 48px;
  border: 2px solid #e1e5e9;
  border-radius: 12px;
  font-size: 16px;
  transition: all 0.3s ease;
  background: #fafbfc;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  background: white;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
}

.form-input.error {
  border-color: #e74c3c;
  background: #fdf2f2;
}

.input-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #8e9196;
  font-size: 16px;
  z-index: 1;
}

.password-toggle {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #8e9196;
  cursor: pointer;
  padding: 4px;
  font-size: 16px;
  transition: color 0.2s ease;
}

.password-toggle:hover {
  color: #667eea;
}

.auth-btn {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.auth-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
}

.auth-btn:active {
  transform: translateY(0);
}

.auth-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.auth-btn.loading {
  background: linear-gradient(135deg, #667eea, #764ba2);
  opacity: 0.8;
}

.btn-icon {
  font-size: 14px;
}

.message {
  margin-top: 16px;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  animation: slideIn 0.3s ease;
}

.message.error {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.message.success {
  background: #f0fdf4;
  color: #16a34a;
  border: 1px solid #bbf7d0;
}

.message-icon {
  font-size: 16px;
}

.error-message {
  color: #e74c3c;
  font-size: 13px;
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.switch-mode {
  margin-top: 24px;
  font-size: 14px;
  color: #666;
  text-align: center;
}

.switch-link {
  color: #667eea;
  background: none;
  border: none;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  padding: 0;
  margin-left: 4px;
}

.switch-link:hover {
  text-decoration: underline;
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
  .form-group {
    margin-bottom: 18px;
  }
  
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