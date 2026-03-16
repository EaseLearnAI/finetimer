<template>
  <div class="modal-overlay voice-clone-modal-overlay" @click.self="close">
    <div class="modal-container voice-clone-modal-content" style="max-width: 400px;">
      <header class="modal-header">
        <h2 class="modal-title">声音复刻</h2>
        <button class="icon-button" @click="close">✕</button>
      </header>
      <template v-if="!cloned">
        <main class="modal-body">
          <div class="upload-area" @click="$refs.fileInput && $refs.fileInput.click()">
            <i class="fa-solid fa-cloud-arrow-up" style="font-style: normal; color: #4F46E5;">☁</i>
            <p>拖拽或点击上传音频</p>
            <span>支持 mp3/wav 格式，大小 ≤ 15MB</span>
            <input ref="fileInput" type="file" accept="audio/*" @change="onFileChange" style="display:none" />
          </div>
          <div class="file-info" v-if="fileName">
            <span>📄 {{ fileName }}</span>
            <button class="icon-button" @click="() => { file=null; fileName=''; }">✕</button>
          </div>
          <div class="form-error" v-if="errorMsg">{{ errorMsg }}</div>
        </main>
        <footer class="modal-footer">
          <button class="btn btn-secondary" @click="close">关闭</button>
          <button class="btn btn-primary" :disabled="!file || loading" @click="handleNext">{{ loading ? '请等待...' : '下一步' }}</button>
        </footer>
        
        <!-- 试用声音按钮 -->
        <button 
          v-if="!cloned" 
          class="try-voice-btn" 
          @click="tryDemoVoice" 
          :disabled="loading"
          title="使用示例声音进行复刻"
        >
          🎵 试用声音
        </button>
      </template>
      <template v-else>
        <header class="modal-header" style="border-top: 1px solid var(--color-border); border-bottom: none;">
          <h2 class="modal-title">声音已复刻</h2>
          <button class="btn-link" @click="showUpload=!showUpload">{{ showUpload ? '取消更新' : '更新声音' }}</button>
        </header>
        <main class="modal-body">
          <div class="success-feedback" v-if="!showUpload">
            <i class="fa-regular fa-circle-check" style="font-style: normal; color: #10B981;">✔</i>
            <p>你的专属音色已就绪！</p>
          </div>
          <div v-show="showUpload" style="margin-top: 16px;">
            <div class="upload-area" @click="$refs.updateInput && $refs.updateInput.click()">
              <i class="fa-solid fa-cloud-arrow-up" style="font-style: normal; color: #4F46E5;">☁</i>
              <p>上传新的音频文件</p>
              <span>支持 mp3/wav 格式，大小 ≤ 15MB</span>
              <input ref="updateInput" type="file" accept="audio/*" @change="onFileChange" style="display:none" />
            </div>
            <div class="file-info" v-if="fileName">
              <span>📄 {{ fileName }}</span>
              <button class="icon-button" @click="() => { file=null; fileName=''; }">✕</button>
            </div>
            <div class="form-error" v-if="errorMsg">{{ errorMsg }}</div>
          </div>
        </main>
        <footer class="modal-footer" id="cloned-footer">
          <template v-if="showUpload">
            <button class="btn btn-secondary" @click="close" :disabled="loading">关闭</button>
            <button class="btn btn-primary" :disabled="!file || loading" @click="handleNext">{{ loading ? '请等待...' : '提交更新' }}</button>
          </template>
          <template v-else>
            <button class="btn btn-primary" @click="handleNext" :disabled="loading">进入声音合成</button>
          </template>
        </footer>
      </template>

      <div v-if="loading" class="loading-overlay">
        <div class="spinner"></div>
        <p>请等待片刻，正在处理...</p>
      </div>

      <p v-if="successMsg" class="success-msg">{{ successMsg }}</p>
    </div>
  </div>
</template>

<script setup>
/* global defineEmits, defineProps */
import { ref, onMounted, watch } from 'vue';
import aivoiceAPI from '@/api/aivoice.js'
const emit = defineEmits(['close', 'clone-success']);
const props = defineProps({
  hasCloned: { type: Boolean, default: false },
  userId: { type: String, default: '' }
});

// 试用声音的URL
const DEMO_VOICE_URL = 'https://vitebucket.oss-cn-hangzhou.aliyuncs.com/voice/685660fc1fc9dcbdaea1a51d/1750861142930_huangquan1.mp3';
const file = ref(null);
const fileName = ref('');
const errorMsg = ref('');
const successMsg = ref('');
const showUpload = ref(false);
const loading = ref(false);
const cloned = ref(props.hasCloned);

watch(() => props.hasCloned, (v) => { cloned.value = !!v })

function close() {
  if (loading.value) return;
  emit('close');
}
function onFileChange(e) {
  const f = e.target.files[0];
  if (!f) return;
  if (!['audio/mp3', 'audio/wav', 'audio/mpeg', 'audio/x-wav'].includes(f.type)) {
    errorMsg.value = '仅支持mp3或wav格式';
    file.value = null;
    fileName.value = '';
    return;
  }
  if (f.size > 15 * 1024 * 1024) {
    errorMsg.value = '文件不能超过15MB';
    file.value = null;
    fileName.value = '';
    return;
  }
  errorMsg.value = '';
  file.value = f;
  fileName.value = f.name;
}

function resolveUserId() {
  if (props.userId) return props.userId
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null')
    return user?._id || user?.id || localStorage.getItem('userId') || ''
  } catch (_) {
    return localStorage.getItem('userId') || ''
  }
}

onMounted(async () => {
  const userId = resolveUserId()
  if (!userId) return
  try {
    const res = await aivoiceAPI.getBindStatus(userId)
    // http 返回的已是 data 对象
    const has = !!(res?.binded ?? res?.has_voice ?? res?.bound)
    cloned.value = has
  } catch (e) {
    // 忽略状态查询失败，保持默认
  }
})

async function handleNext() {
  // 已复刻且未点"更新声音"时，直接进入合成
  if (cloned.value && !showUpload.value) {
    emit('clone-success');
    return;
  }
  if (!file.value) {
    errorMsg.value = '请先选择音频文件';
    return;
  }

  const userId = resolveUserId()
  if (!userId) {
    errorMsg.value = '未登录或缺少用户标识，请先登录';
    return;
  }

  loading.value = true;
  successMsg.value = '';
  errorMsg.value = '';

  try {
    // 1) 上传语音（可选 user_id，用于归档）
    const uploadRes = await aivoiceAPI.uploadVoice(file.value, userId)
    const ossUrl = uploadRes.url

    // 2) 复刻或更新（必需 user_id + oss_url）
    const enrollRes = await aivoiceAPI.enrollVoice(userId, ossUrl)

    successMsg.value = enrollRes.action === 'update_voice' ? '音色已更新！' : '复刻成功！'
    cloned.value = true
    loading.value = false;
    setTimeout(() => {
      successMsg.value = '';
      emit('clone-success');
    }, 800);
  } catch (err) {
    loading.value = false;
    errorMsg.value = err?.message || '处理失败，请稍后重试';
  }
}

// 试用声音功能
async function tryDemoVoice() {
  const userId = resolveUserId()
  if (!userId) {
    errorMsg.value = '未登录或缺少用户标识，请先登录';
    return;
  }

  loading.value = true;
  successMsg.value = '';
  errorMsg.value = '';

  try {
    // 直接使用示例声音URL进行复刻
    await aivoiceAPI.enrollVoice(userId, DEMO_VOICE_URL)
    
    successMsg.value = '试用声音复刻成功！';
    cloned.value = true;
    loading.value = false;
    
    setTimeout(() => {
      successMsg.value = '';
      emit('clone-success');
    }, 800);
  } catch (err) {
    loading.value = false;
    errorMsg.value = err?.message || '试用声音失败，请稍后重试';
  }
}
</script>

<style scoped>
:root { --color-primary: #4F46E5; --color-bg: #F8F9FA; --color-surface: #FFFFFF; --color-text-primary: #111827; --color-text-secondary: #374151; --color-text-tertiary: #6B7280; --color-border: #E5E7EB; --radius-lg: 16px; --radius-md: 12px; --radius-full: 999px; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 2100; padding: 16px; }
.modal-container { background: #ffffff; border-radius: 18px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05); width: 100%; display: flex; flex-direction: column; position: relative; overflow: hidden; max-height: 90vh; }
.modal-header { padding: 16px 24px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--color-border); }
.modal-title { font-size: 20px; font-weight: 800; color: var(--color-text-primary); margin: 0; display: flex; align-items: center; gap: 8px; }
.icon-button { background: #F3F4F6; border: none; font-size: 16px; color: #6b7280; cursor: pointer; padding: 8px; border-radius: 10px; width: 36px; height: 36px; display: inline-flex; align-items: center; justify-content: center; }
.icon-button:hover { background-color: #E5E7EB; }
.btn-link { background: none; border: none; color: #6C4FE5; font-weight: 700; cursor: pointer; }
.modal-body { padding: 24px; overflow-y: auto; background: #ffffff; }
.modal-footer { padding: 16px 24px; display: flex; justify-content: flex-end; gap: 12px; border-top: 1px solid var(--color-border); }

/* 上传区域 */
.upload-area { border: 2px dashed #D6DAE1; border-radius: 14px; padding: 32px; text-align: center; cursor: pointer; transition: border-color 0.2s; background: #fff; }
.upload-area:hover { border-color: #BFC6D3; }
.upload-area i { font-size: 32px; color: #6C4FE5; }
.upload-area p { font-weight: 800; color: var(--color-text-primary); margin: 12px 0 4px 0; font-size: 18px; }
.upload-area span { font-size: 13px; color: var(--color-text-tertiary); }
.file-info { display: flex; justify-content: space-between; align-items: center; padding: 12px; background: #F5F7FB; border-radius: 12px; margin-top: 16px; }
.file-info span { font-weight: 700; color: var(--color-text-secondary); }

/* 成功提示 & 错误提示 */
.success-feedback { text-align: center; padding: 24px; }
.success-feedback i { font-size: 42px; }
.success-feedback p { font-size: 18px; font-weight: 800; margin-top: 16px; color: #374151; }
.form-error { color: #EF4444; font-size: 13px; margin-top: 8px; }
.success-msg { color: #22c55e; font-size: 16px; text-align: center; margin-top: 16px; font-weight: 700; }

/* 按钮 */
.btn { height: 44px; padding: 0 24px; border: none; border-radius: 12px; font-size: 16px; font-weight: 800; cursor: pointer; }
.btn-primary { background: linear-gradient(90deg,#6C4FE5,#8A8FF8); color: #fff; box-shadow: 0 6px 18px rgba(108,79,229,0.28); }
.btn-primary:disabled { background: #C7C9FF; color: #fff; cursor: not-allowed; box-shadow: none; }
.btn-secondary { background: #E9EEF5; color: var(--color-text-primary); }
.btn-secondary:hover { background: #E2E8F0; }

/* 试用声音按钮 */
.try-voice-btn {
  position: absolute;
  bottom: 24px;
  left: 24px;
  background: #4F46E5;
  color: #fff;
  padding: 10px 20px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  border: none;
  box-shadow: 0 6px 18px rgba(79, 70, 229, 0.28);
  z-index: 10;
}
.try-voice-btn:hover {
  background: #6C4FE5;
}
.try-voice-btn:disabled {
  background: #C7C9FF;
  color: #fff;
  cursor: not-allowed;
  box-shadow: none;
}

/* 加载遮罩 */
.loading-overlay { position: absolute; inset: 0; background: rgba(255,255,255,0.85); display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 10; }
.spinner { width: 40px; height: 40px; border: 4px solid var(--color-border); border-top-color: var(--color-primary); border-radius: 50%; animation: spin 1s linear infinite; }
.loading-overlay p { margin-top: 16px; font-weight: 700; }
@keyframes spin { to { transform: rotate(360deg); } }
</style> 