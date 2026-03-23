/**
 * 语音识别服务
 * 提供音频文件转文字的功能
 */

import { getSpeechRecognitionApiUrl } from '../../config/api.js'
import { log } from '../utils/logger.js'

// API端点配置
const API_ENDPOINTS = {
  RECOGNIZE: '/speech-recognition/recognize',        // 完整识别流程
  UPLOAD_ONLY: '/speech-recognition/upload',        // 仅上传文件
  RECOGNIZE_URL: '/speech-recognition/recognize-url' // 从URL识别
}

// 获取token
function getToken() {
  return localStorage.getItem('token') || localStorage.getItem('userToken') || ''
}

// 获取用户ID
function getCurrentUserId() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null')
    return user?._id || user?.id || null
  } catch (_) {
    return null
  }
}

/**
 * 语音识别服务类
 */
class SpeechRecognitionService {
  constructor() {
    this.userId = getCurrentUserId()
    this.isProcessing = false
    log.info('语音识别服务初始化', { userId: this.userId })
  }

  /**
   * 检查认证状态
   */
  checkAuth() {
    const token = getToken()
    if (!token) {
      throw new Error('未登录，请先登录')
    }
    return token
  }

  /**
   * 完整语音识别流程
   * @param {File} audioFile - 音频文件对象
   * @returns {Promise<Object>} 识别结果
   */
  async recognizeVoice(audioFile) {
    try {
      this.isProcessing = true
      log.info('开始语音识别', { fileName: audioFile.name, fileSize: audioFile.size })

      // 检查文件类型
      const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/aac', 'audio/flac', 'audio/ogg', 'audio/webm']
      if (!allowedTypes.includes(audioFile.type)) {
        throw new Error('不支持的音频格式，请使用 MP3, WAV, M4A, AAC, FLAC, OGG, WEBM 格式')
      }

      // 检查文件大小（10MB限制）
      if (audioFile.size > 10 * 1024 * 1024) {
        throw new Error('文件大小不能超过10MB')
      }

      const token = this.checkAuth()

      // 创建FormData
      const formData = new FormData()
      formData.append('audio', audioFile)

      // 发送请求
      const response = await fetch(getSpeechRecognitionApiUrl(API_ENDPOINTS.RECOGNIZE), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (result.success) {
        log.success('语音识别成功', { 
          transcription: result.data.transcription,
          audioUrl: result.data.audioUrl 
        })
        return {
          success: true,
          transcription: result.data.transcription,  // 识别文本
          audioUrl: result.data.audioUrl,           // 音频文件URL
          ossKey: result.data.ossKey               // OSS存储路径
        }
      } else {
        throw new Error(result.error || result.message || '识别失败')
      }
    } catch (error) {
      log.error('语音识别失败', error)
      throw error
    } finally {
      this.isProcessing = false
    }
  }

  /**
   * 仅上传音频文件
   * @param {File} audioFile - 音频文件对象
   * @returns {Promise<Object>} 上传结果
   */
  async uploadAudioOnly(audioFile) {
    try {
      this.isProcessing = true
      log.info('开始上传音频文件', { fileName: audioFile.name, fileSize: audioFile.size })

      const token = this.checkAuth()

      const formData = new FormData()
      formData.append('audio', audioFile)

      const response = await fetch(getSpeechRecognitionApiUrl(API_ENDPOINTS.UPLOAD_ONLY), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (result.success) {
        log.success('音频文件上传成功', { 
          audioUrl: result.data.audioUrl,
          ossKey: result.data.ossKey 
        })
        return {
          success: true,
          audioUrl: result.data.audioUrl,
          ossKey: result.data.ossKey
        }
      } else {
        throw new Error(result.error || result.message || '上传失败')
      }
    } catch (error) {
      log.error('音频文件上传失败', error)
      throw error
    } finally {
      this.isProcessing = false
    }
  }

  /**
   * 从URL识别音频
   * @param {string} audioUrl - 音频文件URL
   * @returns {Promise<Object>} 识别结果
   */
  async recognizeFromUrl(audioUrl) {
    try {
      this.isProcessing = true
      log.info('从URL识别音频', { audioUrl })

      const token = this.checkAuth()

      const response = await fetch(getSpeechRecognitionApiUrl(API_ENDPOINTS.RECOGNIZE_URL), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ audioUrl })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (result.success) {
        log.success('URL识别成功', { 
          transcription: result.data.transcription 
        })
        return {
          success: true,
          transcription: result.data.transcription,
          audioUrl: result.data.audioUrl
        }
      } else {
        throw new Error(result.error || result.message || '识别失败')
      }
    } catch (error) {
      log.error('URL识别失败', error)
      throw error
    } finally {
      this.isProcessing = false
    }
  }

  /**
   * 检查音频文件是否有效
   * @param {File} file - 音频文件
   * @returns {Object} 检查结果
   */
  validateAudioFile(file) {
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/aac', 'audio/flac', 'audio/ogg', 'audio/webm']
    const maxSize = 10 * 1024 * 1024 // 10MB

    const validation = {
      isValid: true,
      errors: []
    }

    if (!file) {
      validation.isValid = false
      validation.errors.push('请选择音频文件')
      return validation
    }

    if (!allowedTypes.includes(file.type)) {
      validation.isValid = false
      validation.errors.push('不支持的音频格式，请使用 MP3, WAV, M4A, AAC, FLAC, OGG 格式')
    }

    if (file.size > maxSize) {
      validation.isValid = false
      validation.errors.push('文件大小不能超过10MB')
    }

    return validation
  }

  /**
   * 获取处理状态
   */
  getProcessingStatus() {
    return this.isProcessing
  }

  /**
   * 重置处理状态
   */
  resetProcessingStatus() {
    this.isProcessing = false
  }
}

// 创建单例实例
const speechRecognitionService = new SpeechRecognitionService()

export default speechRecognitionService

// 同时导出类，用于需要多实例的场景
export { SpeechRecognitionService }
