<template>
  <div class="modal-overlay vm-overlay" @click.self="close">
    <div class="modal-container vm-content" style="max-width: 560px;">
      <header class="modal-header">
        <h2 class="modal-title">我的语音</h2>
        <div class="header-actions">
          <button class="icon-button" title="刷新" @click="refresh" :disabled="loading">⟳</button>
          <button class="icon-button" title="关闭" @click="close">✕</button>
        </div>
      </header>
      <main class="modal-body list-body">
        <div v-if="error" class="error-state">
          <i class="fa-regular fa-circle-xmark" style="font-style: normal; font-size: 32px; color: #ef4444;">!</i>
          <p>{{ error }}</p>
          <button class="btn btn-secondary" @click="refresh" :disabled="loading">重试</button>
        </div>
        <div v-else-if="!voiceGroups.length && !loading" class="empty-state">
          <i class="fa-regular fa-folder-open" style="font-style: normal; font-size: 48px; color: #E5E7EB;">📁</i>
          <p>暂无历史语音</p>
          <span>去创建一个新的语音陪伴吧</span>
        </div>
        <div v-else class="vm-list">
          <div v-for="(g, idx) in voiceGroups" :key="idx" class="list-card">
            <div class="card-header">
              <h3>第 {{ voiceGroups.length - idx }} 组</h3>
              <span>创建于: {{ formatTime(g.createdAt) }}</span>
            </div>
            <div class="card-content">
              <div class="audio-row">
                <span>鼓励</span>
                <div class="audio-player">
                  <audio v-if="g.encourage_url" :src="withBuster(toHttps(g.encourage_url))" controls @error="onAudioError('encourage')" />
                  <span v-else class="no-audio">无音频</span>
                </div>
              </div>
              <div class="audio-row">
                <span>批评</span>
                <div class="audio-player">
                  <audio v-if="g.criticize_url" :src="withBuster(toHttps(g.criticize_url))" controls @error="onAudioError('criticize')" />
                  <span v-else class="no-audio">无音频</span>
                </div>
              </div>
            </div>
            <div class="card-footer">
              <button class="btn-delete" @click="onDelete(idx)">删除这一组</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
/* global defineEmits, defineProps */
import { ref, onMounted } from 'vue'
import aivoiceAPI from '@/api/aivoice.js'
const emit = defineEmits(['close'])
const props = defineProps({
  userId: { type: String, required: true }
})
const loading = ref(false)
const error = ref('')
const voiceGroups = ref([])
const cacheBuster = ref(0)
const retryCount = ref({ encourage: 0, criticize: 0 })

function close() { emit('close') }
function toHttps(url) { if (!url) return url; return url.startsWith('http://') ? 'https://' + url.slice('http://'.length) : url }
function withBuster(url) { if (!url) return url; const sep = url.includes('?') ? '&' : '?'; return `${url}${sep}v=${cacheBuster.value}` }
function onAudioError(kind) {
  if (!retryCount.value[kind]) retryCount.value[kind] = 0
  if (retryCount.value[kind] >= 3) return
  retryCount.value[kind] += 1
  cacheBuster.value = Date.now()
}
function formatTime(value) { try { return new Date(value).toLocaleString() } catch (_) { return String(value || '') } }

async function refresh() {
  loading.value = true
  error.value = ''
  try {
    const res = await aivoiceAPI.getBindStatus(props.userId)
    if (res?.binded === false) {
      voiceGroups.value = []
    } else {
      voiceGroups.value = Array.isArray(res?.voice_groups) ? res.voice_groups : []
    }
    cacheBuster.value = Date.now()
  } catch (e) {
    error.value = e?.message || '加载失败'
  } finally {
    loading.value = false
  }
}

async function onDelete(idx) {
  if (loading.value) return
  const ok = window.confirm('确定要删除这一组语音吗？此操作不可撤销。')
  if (!ok) return
  loading.value = true
  error.value = ''
  try {
    // 接口约定按索引删除为 0 基索引
    await aivoiceAPI.deleteVoiceGroupByIndex(props.userId, idx)
    await refresh()
  } catch (e) {
    error.value = e?.message || '删除失败'
  } finally {
    loading.value = false
  }
}

onMounted(refresh)
</script>

<style scoped>
:root { --color-primary: #4F46E5; --color-bg: #F8F9FA; --color-surface: #FFFFFF; --color-text-primary: #111827; --color-text-secondary: #374151; --color-text-tertiary: #6B7280; --color-border: #E5E7EB; --radius-lg: 16px; --radius-md: 12px; --radius-full: 999px; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 2100; padding: 16px; }
.modal-container { background: #ffffff; border-radius: 18px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05); width: 100%; display: flex; flex-direction: column; position: relative; overflow: hidden; max-height: 90vh; }
.modal-header { padding: 16px 24px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--color-border); }
.modal-title { font-size: 20px; font-weight: 800; color: var(--color-text-primary); margin: 0; display: flex; align-items: center; gap: 8px; }
.header-actions { display: flex; gap: 12px; }
.icon-button { background: #F3F4F6; border: none; font-size: 16px; color: #6b7280; cursor: pointer; padding: 8px; border-radius: 10px; width: 36px; height: 36px; display: inline-flex; align-items: center; justify-content: center; }
.icon-button:hover { background-color: #E5E7EB; }
.modal-body { padding: 16px; overflow-y: auto; background: #ffffff; }
.list-body { background-color: #ffffff; }

/* 列表卡片 */
.vm-list { display: flex; flex-direction: column; gap: 16px; max-height: 60vh; overflow-y: auto; }
.list-card { background: #fff; border-radius: 16px; box-shadow: 0 2px 6px rgba(0,0,0,0.06); overflow: hidden; }
.card-header { padding: 16px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--color-border); }
.card-header h3 { margin: 0; font-size: 18px; color: var(--color-text-primary); font-weight: 800; }
.card-header span { font-size: 12px; color: var(--color-text-tertiary); }
.card-content { padding: 16px; display: flex; flex-direction: column; gap: 16px; }
.audio-row { display: flex; align-items: center; justify-content: space-between; }
.audio-row > span { font-weight: 700; color: var(--color-text-secondary); }
.audio-player { display: flex; align-items: center; gap: 12px; min-width: 200px; }
.audio-player audio { width: 260px; height: 36px; }
.no-audio { color: var(--color-text-tertiary); font-style: italic; font-size: 13px; }
.card-footer { padding: 10px 16px; text-align: right; border-top: 1px solid var(--color-border); }
.btn-delete { background: none; border: none; color: #ef4444; font-size: 14px; font-weight: 700; cursor: pointer; padding: 6px 10px; border-radius: 8px; }
.btn-delete:hover { background: #fee2e2; }

/* 空与错误状态 */
.empty-state, .error-state { text-align: center; padding: 48px 24px; }
.empty-state p, .error-state p { font-size: 16px; font-weight: 700; color: var(--color-text-primary); margin: 8px 0; }
.empty-state span, .error-state span { font-size: 14px; color: var(--color-text-tertiary); }

/* 通用按钮 */
.btn { height: 44px; padding: 0 18px; border: none; border-radius: 12px; font-size: 15px; font-weight: 700; cursor: pointer; }
.btn-secondary { background: #E9EEF5; color: var(--color-text-primary); }
.btn-secondary:hover { background: #E2E8F0; }
</style> 