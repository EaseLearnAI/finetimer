<template>
  <div class="modal-overlay ai-voice-modal-overlay" @click.self="close">
    <div class="modal-container ai-voice-modal-content" style="max-width: 420px; border-radius: 36px; overflow: hidden;">
      <header class="modal-header">
        <a href="#" class="header-link" @click.prevent="openManager">管理已有语音</a>
        <h2 class="modal-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style="vertical-align: middle"><path d="M12 3a3 3 0 0 1 3 3v5a3 3 0 1 1-6 0V6a3 3 0 0 1 3-3z" fill="#4F46E5"/><path d="M5 11a1 1 0 0 1 2 0v1a5 5 0 1 0 10 0v-1a1 1 0 1 1 2 0v1a7 7 0 0 1-6 6.93V21a1 1 0 1 1-2 0v-2.07A7 7 0 0 1 5 12v-1z" fill="#818CF8"/></svg>
          AI语音陪伴设置
        </h2>
        <button class="icon-button" @click="close" title="关闭">✕</button>
      </header>
      <main class="modal-body">
        <div class="segmented-control">
          <button :class="{ active: mode==='ai' }" @click="mode='ai'">AI生成文本</button>
          <button :class="{ active: mode==='custom' }" @click="mode='custom'">自定义文本</button>
        </div>

        <div class="form-section" v-if="mode==='ai'">
          <template v-if="!aiGenerated">
          <div class="form-group">
            <label>模仿对象</label>
              <input v-model="mimicTarget" type="text" placeholder="例如：一位严厉的健身教练" />
          </div>
          <div class="form-group">
            <label>鼓励风格</label>
              <div class="chip-group">
                <button v-for="style in encourageStyles" :key="style" class="chip" :class="{ active: encourageStyle===style }" @click="encourageStyle=style">{{ style }}</button>
              </div>
            </div>
            <div class="form-group">
              <label>批评风格</label>
              <div class="chip-group">
                <button v-for="style in criticizeStyles" :key="style" class="chip" :class="{ active: criticizeStyle===style }" @click="criticizeStyle=style">{{ style }}</button>
              </div>
            </div>
          </template>
          <template v-else>
            <div class="form-group">
              <label>鼓励文本</label>
              <textarea v-model="encourageText" rows="3" placeholder="AI生成的鼓励语音内容"></textarea>
              <span class="ai-tag">AI智能生成，可修改</span>
          </div>
          <div class="form-group">
              <label>批评文本</label>
              <textarea v-model="criticizeText" rows="3" placeholder="AI生成的批评语音内容"></textarea>
              <span class="ai-tag">AI智能生成，可修改</span>
            </div>
          </template>
        </div>

        <div class="form-section" v-else>
          <div class="form-group">
            <label>鼓励文本</label>
            <textarea v-model="encourageText" rows="3" placeholder="请输入鼓励语音内容"></textarea>
          </div>
          <div class="form-group">
            <label>批评文本</label>
            <textarea v-model="criticizeText" rows="3" placeholder="请输入批评语音内容"></textarea>
          </div>
        </div>

        <div v-if="audioUrls.encourage || audioUrls.criticize" class="result-section">
          <div v-if="audioUrls.encourage" class="audio-card">
            <span class="audio-label">鼓励音频</span>
            <div class="audio-player">
              <audio :src="withBuster(audioUrls.encourage)" controls @error="onAudioError('encourage')" />
            </div>
          </div>
          <div v-if="audioUrls.criticize" class="audio-card">
            <span class="audio-label">批评音频</span>
            <div class="audio-player">
              <audio :src="withBuster(audioUrls.criticize)" controls @error="onAudioError('criticize')" />
            </div>
        </div>
        </div>

        <p v-if="errorMsg" class="form-error">{{ errorMsg }}</p>
      </main>
      <footer class="modal-footer">
        <button class="btn btn-secondary" @click="close">关闭</button>
        <button
          v-if="audioUrls.encourage || audioUrls.criticize"
          class="btn btn-primary"
          @click="applyVoice"
          :disabled="loading"
        >应用语音</button>
        <button
          v-else
          class="btn btn-primary"
          @click="synthesizeVoice"
          :disabled="loading || (mode==='custom' && (!encourageText || !criticizeText)) || (mode==='ai' && loading)"
        >{{
            mode === 'ai'
              ? (aiGenerated ? (loading ? '合成中...' : '合成语音') : (loading ? '生成中...' : '生成文本'))
              : (loading ? '合成中...' : '合成语音')
        }}</button>
      </footer>

      <div v-if="loading" class="loading-overlay">
        <div class="spinner"></div>
        <p>请等待片刻，正在处理...</p>
      </div>

      <VoiceManagerModal v-if="showVoiceManager" :userId="resolveUserId()" @close="showVoiceManager=false" />
    </div>
  </div>
</template>

<script setup>
/* global defineEmits, defineProps */
import { ref, watch } from 'vue';
import aivoiceAPI from '@/api/aivoice.js'
import VoiceManagerModal from './VoiceManagerModal.vue'
const emit = defineEmits(['close', 'apply-voice']);
const props = defineProps({
  userId: { type: String, default: '' }
});
// 避免未使用告警
void props.userId;
const mode = ref('ai');
const mimicTarget = ref('');
const encourageStyles = ['温柔', '热情', '专业', '调侃'];
const criticizeStyles = ['委婉', '严厉', '专业', '调侃'];
const encourageStyle = ref(encourageStyles[0]);
const criticizeStyle = ref(criticizeStyles[0]);
const encourageText = ref('');
const criticizeText = ref('');
const loading = ref(false);
const errorMsg = ref('');
const audioUrls = ref({ encourage: '', criticize: '' });
const aiGenerated = ref(false);
const cacheBuster = ref(0);
const retryCount = ref({ encourage: 0, criticize: 0 });
const showVoiceManager = ref(false);

function close() {
  if (loading.value) return;
  emit('close');
}
function openManager() { showVoiceManager.value = true }
function resolveUserId() {
  if (props.userId) return props.userId
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null')
    return user?._id || user?.id || localStorage.getItem('userId') || ''
  } catch (_) {
    return localStorage.getItem('userId') || ''
  }
}
function toHttps(url) {
  if (!url) return url
  if (url.startsWith('http://')) return 'https://' + url.slice('http://'.length)
  return url
}
function withBuster(url) {
  if (!url) return url
  const sep = url.includes('?') ? '&' : '?'
  return `${url}${sep}v=${cacheBuster.value}`
}
function onAudioError(kind) {
  if (!retryCount.value[kind]) retryCount.value[kind] = 0
  if (retryCount.value[kind] >= 3) return
  retryCount.value[kind] += 1
  cacheBuster.value = Date.now()
}
// 已移除跨域可用性轮询，避免触发 CORS 报错
async function synthesizeVoice() {
  if (mode.value === 'custom' && (!encourageText.value || !criticizeText.value)) {
    errorMsg.value = '请填写完整文本';
    return;
  }
  if (mode.value === 'ai' && !aiGenerated.value) {
    // 改为真实调用 imitate-text
    loading.value = true;
    errorMsg.value = '';
    try {
      const res = await aivoiceAPI.imitateText(mimicTarget.value || '默认', encourageStyle.value, criticizeStyle.value)
      encourageText.value = res?.data?.encourage || res?.encourage || ''
      criticizeText.value = res?.data?.criticize || res?.criticize || ''
      if (!encourageText.value || !criticizeText.value) throw new Error('AI文本生成失败')
      aiGenerated.value = true;
      loading.value = false;
    } catch (err) {
      loading.value = false;
      errorMsg.value = err?.message || 'AI文本生成失败';
    }
    return;
  }
  // 第二次点击或自定义模式：调用后端合成
  if (!encourageText.value || !criticizeText.value) {
    errorMsg.value = '请填写完整文本';
    return;
  }
  const userId = resolveUserId()
  if (!userId) {
    errorMsg.value = '未登录或缺少用户标识，请先登录';
    return;
  }
  loading.value = true;
  errorMsg.value = '';
  audioUrls.value = { encourage: '', criticize: '' };
  retryCount.value = { encourage: 0, criticize: 0 }
  try {
    const res = await aivoiceAPI.synthesizeVoice(userId, encourageText.value, criticizeText.value)
    const encUrl = toHttps(res?.data?.encourage_url || res?.encourage_url || '')
    const criUrl = toHttps(res?.data?.criticize_url || res?.criticize_url || '')
    audioUrls.value.encourage = encUrl
    audioUrls.value.criticize = criUrl
    cacheBuster.value = Date.now()
    aiGenerated.value = false;
    loading.value = false;
    if (!audioUrls.value.encourage && !audioUrls.value.criticize) {
      throw new Error('未返回音频链接');
    }
  } catch (err) {
    loading.value = false;
    errorMsg.value = err?.message || '合成失败，请稍后重试';
  }
}
function applyVoice() {
  emit('apply-voice');
  close();
}
watch(() => mode.value, () => {
  aiGenerated.value = false;
  errorMsg.value = '';
  encourageText.value = '';
  criticizeText.value = '';
  audioUrls.value = { encourage: '', criticize: '' };
});
</script>

<style scoped>
/* 设计色板与基础变量（局部作用域） */
:root { --color-primary: #4F46E5; --color-bg: #F8F9FA; --color-surface: #FFFFFF; --color-text-primary: #111827; --color-text-secondary: #374151; --color-text-tertiary: #6B7280; --color-border: #E5E7EB; --radius-lg: 36px; --radius-md: 12px; --radius-full: 999px; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 16px; }
.modal-container { background: #ffffff; border-radius: var(--radius-lg); box-shadow: 0 16px 40px rgba(17,24,39,0.18); width: 100%; display: flex; flex-direction: column; position: relative; overflow: hidden; animation: fadeIn 0.3s ease; max-height: 90vh; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

.modal-header { padding: 16px 24px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--color-border); }
.modal-title { font-size: 18px; font-weight: 600; color: var(--color-text-primary); margin: 0; display: flex; align-items: center; gap: 8px; }
.header-link { font-size: 14px; color: var(--color-primary); text-decoration: none; font-weight: 500; }
.icon-button { background: none; border: none; font-size: 18px; color: var(--color-text-tertiary); cursor: pointer; padding: 6px; border-radius: var(--radius-full); width: 32px; height: 32px; display: inline-flex; align-items: center; justify-content: center; }
.icon-button:hover { background-color: var(--color-bg); }

.modal-body { padding: 24px; overflow-y: auto; background: #ffffff; }
.modal-footer { padding: 16px 24px; display: flex; justify-content: flex-end; gap: 12px; border-top: 1px solid var(--color-border); }

/* 按钮样式（按截图） */
.btn { height: 46px; padding: 0 26px; border: none; border-radius: 14px; font-size: 16px; font-weight: 800; cursor: pointer; transition: transform .12s ease, box-shadow .12s ease, background .2s ease; display: inline-flex; align-items: center; justify-content: center; gap: 8px; }
.btn:active { transform: translateY(0); }
.btn-primary { background: linear-gradient(90deg,#6C4FE5,#8A8FF8); color: #fff; box-shadow: 0 12px 30px rgba(108,79,229,0.35); }
.btn-primary:hover { background: linear-gradient(90deg,#5d45d1,#7f87ff); box-shadow: 0 14px 36px rgba(108,79,229,0.42); }
.btn-primary:disabled { background: #C7C9FF; color: #fff; cursor: not-allowed; box-shadow: none; }
.btn-secondary { background: #E9EEF5; color: var(--color-text-primary); box-shadow: inset 0 -1px 0 rgba(0,0,0,0.02); }
.btn-secondary:hover { background: #E2E8F0; }
.btn.fluid { width: 100%; }

/* 分段控制 */
.segmented-control { display: flex; background-color: var(--color-bg); border-radius: var(--radius-md); padding: 4px; margin-bottom: 24px; }
.segmented-control button { flex: 1; padding: 10px 12px; border: none; background: transparent; border-radius: 12px; font-size: 15px; font-weight: 800; color: var(--color-text-secondary); cursor: pointer; transition: all 0.2s ease; }
.segmented-control button.active { background: #fff; color: var(--color-text-primary); box-shadow: 0 6px 16px rgba(0,0,0,0.06); }

/* 表单 */
.form-group { margin-bottom: 20px; }
.form-group label { display: block; font-size: 14px; font-weight: 800; margin-bottom: 8px; color: var(--color-text-primary); }
.form-group input[type="text"], .form-group textarea { width: 100%; padding: 12px 14px; border: 1px solid #D1D5DB; border-radius: 12px; font-size: 14px; box-sizing: border-box; }
.form-group input[type="text"]:focus, .form-group textarea:focus { outline: none; border-color: var(--color-primary); box-shadow: 0 0 0 2px rgba(79,70,229,0.18); }
.ai-tag { font-size: 12px; color: var(--color-text-tertiary); margin-top: 6px; display: inline-block; }
.form-error { color: #EF4444; font-size: 13px; margin-top: 8px; }

/* 选项按钮 */
.chip-group { display: flex; flex-wrap: wrap; gap: 12px; }
.chip { padding: 8px 18px; border: 1px solid var(--color-border); border-radius: 999px; background: #fff; color: var(--color-text-secondary); font-size: 15px; font-weight: 800; cursor: pointer; transition: all 0.18s ease; }
.chip.active { background: linear-gradient(90deg,#6C4FE5,#8A8FF8); color: #fff; border-color: transparent; box-shadow: 0 8px 22px rgba(108,79,229,0.18); transform: none; }

/* 结果音频 */
.result-section { margin-top: 24px; }
.audio-card { background-color: #F5F7FB; border-radius: 16px; padding: 16px; margin-bottom: 12px; box-shadow: inset 0 1px 0 rgba(255,255,255,0.6); }
.audio-label { font-weight: 800; color: var(--color-text-primary); font-size: 14px; margin-bottom: 12px; display: block; }
.audio-player audio { width: 100%; height: 36px; border-radius: 10px; }
/* 尝试将系统播放按钮改为紫白风格（Chromium/WebKit 有效） */
.audio-player audio::-webkit-media-controls-play-button { background-color: #6C4FE5; border-radius: 50%; }
.audio-player audio::-webkit-media-controls-play-button:hover { background-color: #5d45d1; }
.audio-player audio::-webkit-media-controls-enclosure { border-radius: 10px; overflow: hidden; }

/* 加载遮罩 */
.loading-overlay { position: absolute; inset: 0; background: rgba(255,255,255,0.85); display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 10; }
.spinner { width: 40px; height: 40px; border: 4px solid var(--color-border); border-top-color: var(--color-primary); border-radius: 50%; animation: spin 1s linear infinite; }
.loading-overlay p { margin-top: 16px; font-weight: 500; }
@keyframes spin { to { transform: rotate(360deg); } }
</style> 