import aivoiceAPI from '@/api/aivoice.js'

function resolveUserId() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null')
    return user?._id || user?.id || localStorage.getItem('userId') || ''
  } catch (_) {
    return localStorage.getItem('userId') || ''
  }
}

function toHttps(url) {
  if (!url) return url
  return url.startsWith('http://') ? 'https://' + url.slice('http://'.length) : url
}

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)]
}

function withBuster(url) {
  const sep = url.includes('?') ? '&' : '?'
  return `${url}${sep}t=${Date.now()}`
}

async function getVoiceUrls(kind) {
  const userId = resolveUserId()
  if (!userId) return []
  try {
    const res = await aivoiceAPI.getBindStatus(userId)
    if (res?.binded === false) return []
    const urls = []
    if (kind === 'encourage') {
      if (res?.encourage_url) urls.push(toHttps(res.encourage_url))
    } else {
      if (res?.criticize_url) urls.push(toHttps(res.criticize_url))
    }
    const groups = Array.isArray(res?.voice_groups) ? res.voice_groups : []
    for (const g of groups) {
      const u = kind === 'encourage' ? g?.encourage_url : g?.criticize_url
      if (u) urls.push(toHttps(u))
    }
    return urls.filter(Boolean)
  } catch (_) {
    return []
  }
}

function playWithRetry(url, maxAttempts = 3) {
  return new Promise((resolve) => {
    let attempts = 0
    const tryPlay = () => {
      attempts += 1
      const audio = new Audio(withBuster(url))
      audio.preload = 'auto'
      const cleanup = () => {
        audio.oncanplaythrough = null
        audio.onerror = null
      }
      audio.oncanplaythrough = async () => {
        cleanup()
        try { await audio.play() } catch (_) { /* ignore */ }
        resolve()
      }
      audio.onerror = () => {
        cleanup()
        if (attempts < maxAttempts) {
          setTimeout(tryPlay, attempts * 600)
        } else {
          resolve()
        }
      }
      // 立即触发加载
      audio.load()
    }
    tryPlay()
  })
}

export async function playRandomVoice(kind) {
  try {
    const urls = await getVoiceUrls(kind)
    if (!urls.length) return
    const url = pickRandom(urls)
    await playWithRetry(url, 3)
  } catch (_) { void 0 }
} 