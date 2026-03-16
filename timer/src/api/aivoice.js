import { API_CONFIG } from '../config/api.js'

// 使用 fetch 处理表单上传，避免手动设置 Content-Type
const BASE_URL = API_CONFIG.baseURL.replace('/api', '')

function getToken() {
  try {
    return localStorage.getItem('token') || ''
  } catch (_) {
    return ''
  }
}

async function uploadVoice(file, userId) {
  const form = new FormData()
  form.append('file', file)
  if (userId) form.append('user_id', userId)

  const resp = await fetch(`${BASE_URL}/api/aivoice/upload-voice`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getToken()}`
    },
    body: form
  })

  const data = await resp.json().catch(() => ({}))
  if (!resp.ok || !data?.success) {
    throw new Error(data?.error || data?.message || resp.statusText || '上传失败')
  }
  return data
}

// 其余 JSON 请求复用 http 实例
import http from './http.js'

async function enrollVoice(userId, ossUrl) {
  const res = await http.post('/aivoice/enroll-voice', {
    user_id: userId,
    oss_url: ossUrl
  })
  if (!res?.success) {
    throw new Error(res?.error || res?.message || '复刻失败')
  }
  return res
}

async function getBindStatus(userId) {
  try {
    // 优先使用查询参数
    return await http.get('/aivoice/bind-status', { params: { user_id: userId } })
  } catch (err) {
    // 若后端只注册了路径参数路由或返回路由未找到，回退到 /:user_id 形式
    const code = err?.response?.status
    const msg = err?.response?.data || err?.message
    if (code === 404 || (typeof msg === 'string' && msg.includes('路由未找到'))) {
      return await http.get(`/aivoice/bind-status/${encodeURIComponent(userId)}`)
    }
    throw err
  }
}

async function synthesizeVoice(userId, encourageText, criticizeText) {
  const res = await http.post('/aivoice/synthesize-voice', {
    user_id: userId,
    encourage_text: encourageText,
    criticize_text: criticizeText
  }, {
    timeout: 30000 // 30秒超时，合成可能较慢
  })
  if (!res?.success) {
    throw new Error(res?.error || res?.message || '合成失败')
  }
  return res
}

async function imitateText(name, encourageTone, criticizeTone) {
  const payload = {
    encourage_tone: encourageTone,
    criticize_tone: criticizeTone
  }
  if (name && String(name).trim()) {
    payload.name = String(name).trim()
  }
  const res = await http.post('/aivoice/imitate-text', payload, { timeout: 20000 })
  if (!res?.success) {
    throw new Error(res?.error || res?.message || 'AI文本生成失败')
  }
  return res
}

// 新增：删除语音组（按索引）
async function deleteVoiceGroupByIndex(userId, groupIndex) {
  const res = await http.delete('/aivoice/voice-group', {
    data: { user_id: userId, group_index: groupIndex }
  })
  if (!res?.success) {
    throw new Error(res?.error || res?.message || '删除失败')
  }
  return res
}

// 新增：删除语音组（按URL匹配）
async function deleteVoiceGroupByUrl(userId, encourageUrl, criticizeUrl) {
  const payload = { user_id: userId }
  if (encourageUrl) payload.encourage_url = encourageUrl
  if (criticizeUrl) payload.criticize_url = criticizeUrl
  const res = await http.delete('/aivoice/voice-group', { data: payload })
  if (!res?.success) {
    throw new Error(res?.error || res?.message || '删除失败')
  }
  return res
}

const aivoiceAPI = {
  uploadVoice,
  enrollVoice,
  getBindStatus,
  synthesizeVoice,
  imitateText,
  deleteVoiceGroupByIndex,
  deleteVoiceGroupByUrl
}

export default aivoiceAPI 