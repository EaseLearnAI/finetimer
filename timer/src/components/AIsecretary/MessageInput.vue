<template>
  <div>
    <!-- 输入区域 -->
    <div class="input-area" :class="{ 'expanded': showPlusMenu }">
      <div class="input-container">
        <!-- 语音输入按钮 -->
        <button 
          class="voice-btn" 
          @click="toggleVoiceMode"
          :class="{ 'active': isVoiceMode, 'processing': isProcessing }"
          :disabled="isProcessing"
          :title="isVoiceMode ? '切换到文字输入' : '切换到语音输入'"
        >
          <font-awesome-icon 
            :icon="isVoiceMode ? 'keyboard' : 'microphone'" 
            :class="{ 'pulse': isProcessing }"
          />
        </button>

        <!-- 隐藏的文件输入（保留作为备用） -->
        <input 
          ref="fileInput"
          type="file" 
          accept="audio/*"
          style="display: none"
          @change="handleFileSelect"
        >

        <!-- 隐藏的图片文件输入 -->
        <input 
          ref="imageInput"
          type="file" 
          accept="image/*"
          style="display: none"
          @change="handleImageSelect"
        >

        <!-- 动态输入区域 -->
        <div class="dynamic-input-area">
          <!-- 文字输入模式 -->
          <input 
            v-if="!isVoiceMode"
            v-model="inputText"
            type="text" 
            placeholder="输入你的学习目标或问题..."
            class="message-input"
            @keypress.enter="sendMessage"
            :disabled="isProcessing"
          />
          
          <!-- 语音输入模式 -->
          <div 
            v-else
            class="voice-input-area"
            @touchstart="startVoiceInput"
            @touchend="endVoiceInput"
            @touchmove="handleTouchMove"
            @mousedown="startVoiceInput"
            @mouseup="endVoiceInput"
            @mouseleave="cancelVoiceInput"
            :class="{ 'listening': isListening }"
          >
            <font-awesome-icon icon="microphone" class="voice-area-icon" />
            <span class="voice-placeholder">{{ getVoicePlaceholderText() }}</span>
          </div>
        </div>

        <!-- 发送按钮 -->
        <button 
          class="send-btn"
          @click="sendMessage"
          :disabled="!inputText.trim() || isProcessing"
        >
          <font-awesome-icon icon="paper-plane" />
        </button>

        <!-- 加号按钮 -->
        <button 
          class="plus-btn"
          @click="togglePlusMenu"
          :disabled="isProcessing"
          :class="{ 'active': showPlusMenu }"
          title="更多功能"
        >
          <font-awesome-icon icon="plus" />
        </button>
      </div>

      <!-- 语音识别状态提示 -->
      <div v-if="isProcessing" class="recognition-status">
        <div class="status-content">
          <font-awesome-icon icon="spinner" spin />
          <span>{{ recognitionStatusText }}</span>
        </div>
      </div>

      <!-- 语音识别结果预览 -->
      <div v-if="recognitionResult && !isProcessing" class="recognition-preview">
        <div class="preview-header">
          <font-awesome-icon icon="microphone" />
          <span>语音识别结果</span>
          <button class="preview-close" @click="clearRecognitionResult">
            <font-awesome-icon icon="times" />
          </button>
        </div>
        <div class="preview-content">
          <p class="preview-text">{{ recognitionResult.transcription }}</p>
          <div class="preview-actions">
            <button class="preview-btn preview-btn-edit" @click="editRecognitionResult">
              <font-awesome-icon icon="edit" />
              编辑
            </button>
            <button class="preview-btn preview-btn-send" @click="sendRecognitionResult">
              <font-awesome-icon icon="paper-plane" />
              发送
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 功能按钮面板 - 独立在输入区域外 -->
    <div v-if="showPlusMenu" class="function-panel">
      <div class="function-buttons">
        <div class="function-button" @click="openPhotoLibrary">
          <div class="button-icon">
            <font-awesome-icon icon="images" />
          </div>
          <span class="button-text">相册</span>
        </div>
        <div class="function-button" @click="openCamera">
          <div class="button-icon">
            <font-awesome-icon icon="camera" />
          </div>
          <span class="button-text">拍摄</span>
        </div>
      </div>
    </div>

    <!-- 图片分析模态框 -->
    <ImageAnalysisModal
      :visible="showImageAnalysisModal"
      :preSelectedFile="selectedFile"
      @close="closeImageAnalysisModal"
      @analysisComplete="handleImageAnalysisComplete"
      @showToast="showToast"
    />
  </div>
</template>

<script>
import speechRecognitionService from '../../AIsiri/services/speechRecognitionService.js'
import { log } from '../../AIsiri/utils/logger.js'
import ImageAnalysisModal from './ImageAnalysisModal.vue'

export default {
  name: 'MessageInput',
  components: {
    ImageAnalysisModal
  },
  data() {
    return {
      inputText: '',
      isListening: false,
      isProcessing: false,
      recognitionResult: null,
      recognitionStatusText: '正在识别中...',
      selectedFile: null,
      showImageAnalysisModal: false,
      // 新增录音相关状态
      mediaRecorder: null,
      audioChunks: [],
      recordingTime: 0,
      recordingTimer: null,
      stream: null,
      // 触摸相关状态
      touchStartY: 0,
      touchStartTime: 0,
      shouldCancel: false,
      // 语音模式状态
      isVoiceMode: false,
      // 加号菜单状态
      showPlusMenu: false
    }
  },
  mounted() {
    // 添加全局点击事件监听器
    document.addEventListener('click', this.handleGlobalClick);
  },
  beforeUnmount() {
    // 移除全局点击事件监听器
    document.removeEventListener('click', this.handleGlobalClick);
    // 清理资源
    if (this.isProcessing) {
      speechRecognitionService.resetProcessingStatus();
    }
    // 停止录音流
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
    // 停止计时器
    this.stopRecordingTimer();
  },
  methods: {
    /**
     * 发送文本消息
     */
    sendMessage() {
      if (!this.inputText.trim() || this.isProcessing) return;
      
      log.user('发送文本消息', { message: this.inputText })
      this.$emit('sendMessage', this.inputText);
      this.inputText = '';
    },

    /**
     * 切换语音/文字输入模式
     */
    toggleVoiceMode() {
      if (this.isProcessing) return;
      
      this.isVoiceMode = !this.isVoiceMode;
      
      if (this.isVoiceMode) {
        // 切换到语音模式
        this.showToast('已切换到语音输入模式', 'info');
        // 聚焦到语音输入区域
        this.$nextTick(() => {
          const voiceArea = this.$el.querySelector('.voice-input-area');
          if (voiceArea) voiceArea.focus();
        });
      } else {
        // 切换到文字模式
        this.showToast('已切换到文字输入模式', 'info');
        // 聚焦到文字输入框
        this.$nextTick(() => {
          const textInput = this.$el.querySelector('.message-input');
          if (textInput) textInput.focus();
        });
      }
    },

    /**
     * 开始语音输入（触摸开始）
     */
    async startVoiceInput(event) {
      if (this.isProcessing || !this.isVoiceMode) return;
      
      // 记录触摸开始位置和时间
      if (event.type === 'touchstart') {
        this.touchStartY = event.touches[0].clientY;
        this.touchStartTime = Date.now();
      } else {
        this.touchStartY = event.clientY;
        this.touchStartTime = Date.now();
      }
      
      this.shouldCancel = false;
      
      await this.startRecording();
    },

    /**
     * 结束语音输入（触摸结束）
     */
    endVoiceInput() {
      if (!this.isListening) return;
      
      // 检查是否应该取消
      if (this.shouldCancel) {
        this.cancelRecording();
      } else {
        this.stopVoiceInput();
      }
    },

    /**
     * 处理触摸移动（上滑取消）
     */
    handleTouchMove(event) {
      if (!this.isListening) return;
      
      const currentY = event.touches[0].clientY;
      const deltaY = this.touchStartY - currentY;
      
      // 上滑超过50px标记为取消
      if (deltaY > 50) {
        this.shouldCancel = true;
      } else {
        this.shouldCancel = false;
      }
    },

    /**
     * 取消语音输入（鼠标离开）
     */
    cancelVoiceInput() {
      if (this.isListening) {
        this.cancelRecording();
      }
    },

    /**
     * 开始语音输入（实时录音）
     */
    async startRecording() {
      try {
        log.info('开始实时录音')
        
        // 请求麦克风权限
        this.stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 44100
          } 
        });
        
        // 创建MediaRecorder - 使用后端支持的格式
        let mimeType = 'audio/wav';
        
        // 检查浏览器支持的格式，优先使用后端支持的格式
        if (MediaRecorder.isTypeSupported('audio/wav')) {
          mimeType = 'audio/wav';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
        }
        
        this.mediaRecorder = new MediaRecorder(this.stream, {
          mimeType: mimeType
        });
        
        // 重置录音状态
        this.audioChunks = [];
        this.recordingTime = 0;
        
        // 开始录音
        this.mediaRecorder.start();
        this.isListening = true;
        
        // 开始计时
        this.startRecordingTimer();
        
        // 监听录音数据
        this.mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            this.audioChunks.push(event.data);
          }
        };
        
        // 录音结束处理
        this.mediaRecorder.onstop = () => {
          this.handleRecordingComplete();
        };
        
        log.success('实时录音开始')
        
      } catch (error) {
        log.error('启动录音失败', error);
        this.showToast('无法访问麦克风，请检查权限设置', 'error');
        
        // 如果实时录音失败，回退到文件选择模式
        this.fallbackToFileInput();
      }
    },

    /**
     * 停止语音输入
     */
    stopVoiceInput() {
      if (this.mediaRecorder && this.isListening) {
        log.info('停止实时录音')
        this.mediaRecorder.stop();
        this.isListening = false;
        this.stopRecordingTimer();
        
        // 停止麦克风流
        if (this.stream) {
          this.stream.getTracks().forEach(track => track.stop());
          this.stream = null;
        }
      }
    },

    /**
     * 取消录音
     */
    cancelRecording() {
      if (this.mediaRecorder && this.isListening) {
        log.info('取消录音')
        this.mediaRecorder.stop();
        this.isListening = false;
        this.stopRecordingTimer();
        
        // 停止麦克风流
        if (this.stream) {
          this.stream.getTracks().forEach(track => track.stop());
          this.stream = null;
        }
        
        // 清理录音数据
        this.audioChunks = [];
        this.recordingTime = 0;
        
        // 重置状态
        this.shouldCancel = false;
        
        this.showToast('录音已取消', 'info');
      }
    },

    /**
     * 开始录音计时器
     */
    startRecordingTimer() {
      this.recordingTimer = setInterval(() => {
        this.recordingTime++;
      }, 1000);
    },

    /**
     * 停止录音计时器
     */
    stopRecordingTimer() {
      if (this.recordingTimer) {
        clearInterval(this.recordingTimer);
        this.recordingTimer = null;
      }
    },



    /**
     * 处理录音完成
     */
    async handleRecordingComplete() {
      try {
        if (this.audioChunks.length === 0) {
          this.showToast('录音失败，没有录制到音频', 'error');
          return;
        }

        // 创建音频Blob
        const audioBlob = new Blob(this.audioChunks, { type: this.mediaRecorder.mimeType });
        
        // 转换为后端支持的格式
        const convertedAudioFile = await this.convertAudioFormat(audioBlob);
        
        log.info('录音完成，开始处理', { 
          fileName: convertedAudioFile.name, 
          fileSize: convertedAudioFile.size,
          duration: this.recordingTime,
          originalType: this.mediaRecorder.mimeType,
          convertedType: convertedAudioFile.type
        });

        // 在语音模式下直接发送语音消息，否则显示预览
        if (this.isVoiceMode) {
          await this.sendVoiceMessage(convertedAudioFile);
        } else {
          await this.processAudioFile(convertedAudioFile);
        }
        
      } catch (error) {
        log.error('处理录音失败', error);
        this.showToast(`处理录音失败: ${error.message}`, 'error');
      } finally {
        // 清理状态
        this.audioChunks = [];
        this.recordingTime = 0;
        this.mediaRecorder = null;
      }
    },

    /**
     * 转换音频格式为后端支持的格式
     */
    async convertAudioFormat(audioBlob) {
      try {
        // 如果已经是支持的格式，直接返回
        const supportedTypes = ['audio/wav', 'audio/mpeg', 'audio/mp4', 'audio/aac', 'audio/flac'];
        if (supportedTypes.includes(audioBlob.type)) {
          return new File([audioBlob], `recording_${Date.now()}.wav`, { type: audioBlob.type });
        }

        // 创建音频上下文进行格式转换
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const arrayBuffer = await audioBlob.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // 转换为WAV格式
        const wavBlob = this.audioBufferToWav(audioBuffer);
        
        // 创建新的File对象
        const wavFile = new File([wavBlob], `recording_${Date.now()}.wav`, { 
          type: 'audio/wav' 
        });
        
        log.info('音频格式转换完成', { 
          originalType: audioBlob.type, 
          convertedType: 'audio/wav',
          originalSize: audioBlob.size,
          convertedSize: wavFile.size
        });
        
        return wavFile;
        
      } catch (error) {
        log.error('音频格式转换失败', error);
        // 如果转换失败，尝试使用原始格式
        this.showToast('音频格式转换失败，使用原始格式', 'warning');
        return new File([audioBlob], `recording_${Date.now()}.wav`, { type: 'audio/wav' });
      }
    },

    /**
     * 将AudioBuffer转换为WAV格式
     */
    audioBufferToWav(buffer) {
      const length = buffer.length;
      const numberOfChannels = buffer.numberOfChannels;
      const sampleRate = buffer.sampleRate;
      const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
      const view = new DataView(arrayBuffer);
      
      // WAV文件头
      const writeString = (offset, string) => {
        for (let i = 0; i < string.length; i++) {
          view.setUint8(offset + i, string.charCodeAt(i));
        }
      };
      
      writeString(0, 'RIFF');
      view.setUint32(4, 36 + length * numberOfChannels * 2, true);
      writeString(8, 'WAVE');
      writeString(12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, numberOfChannels, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * numberOfChannels * 2, true);
      view.setUint16(32, numberOfChannels * 2, true);
      view.setUint16(34, 16, true);
      writeString(36, 'data');
      view.setUint32(40, length * numberOfChannels * 2, true);
      
      // 写入音频数据
      let offset = 44;
      for (let i = 0; i < length; i++) {
        for (let channel = 0; channel < numberOfChannels; channel++) {
          const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
          view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
          offset += 2;
        }
      }
      
      return new Blob([arrayBuffer], { type: 'audio/wav' });
    },

    /**
     * 发送语音消息
     */
    async sendVoiceMessage(audioFile) {
      try {
        this.isProcessing = true;
        this.recognitionStatusText = '正在处理语音消息...';
        
        log.info('开始处理语音消息', { fileName: audioFile.name, fileSize: audioFile.size });

        // 验证文件
        const validation = speechRecognitionService.validateAudioFile(audioFile);
        if (!validation.isValid) {
          throw new Error(validation.errors.join(', '));
        }

        // 开始语音识别
        this.recognitionStatusText = '正在识别中，请稍候...';
        const result = await speechRecognitionService.recognizeVoice(audioFile);
        
        if (result.success) {
          // 发送语音消息
          this.$emit('sendVoiceMessage', {
            type: 'voice',
            audioFile: audioFile,
            transcription: result.transcription,
            audioUrl: result.audioUrl,
            duration: this.recordingTime
          });
          
          log.success('语音消息发送成功', { transcription: result.transcription });
          this.showToast('语音消息发送成功！', 'success');
        } else {
          throw new Error('识别失败');
        }
      } catch (error) {
        log.error('语音消息发送失败', error);
        this.recognitionStatusText = '发送失败';
        this.showToast(`语音消息发送失败: ${error.message}`, 'error');
      } finally {
        this.isProcessing = false;
        this.isListening = false;
        this.selectedFile = null;
        
        // 清空文件输入
        if (this.$refs.fileInput) {
          this.$refs.fileInput.value = '';
        }
      }
    },

    /**
     * 处理音频文件（录音或上传）
     */
    async processAudioFile(audioFile) {
      try {
        this.isProcessing = true;
        this.recognitionStatusText = '正在上传音频文件...';
        
        log.info('开始语音识别', { fileName: audioFile.name, fileSize: audioFile.size });

        // 验证文件
        const validation = speechRecognitionService.validateAudioFile(audioFile);
        if (!validation.isValid) {
          throw new Error(validation.errors.join(', '));
        }

        // 开始语音识别
        this.recognitionStatusText = '正在识别中，请稍候...';
        const result = await speechRecognitionService.recognizeVoice(audioFile);
        
        if (result.success) {
          this.recognitionResult = result;
          this.recognitionStatusText = '识别完成';
          log.success('语音识别成功', { transcription: result.transcription });
          
          // 自动填充到输入框
          this.inputText = result.transcription;
          
          // 显示成功提示
          this.showToast('语音识别成功！', 'success');
        } else {
          throw new Error('识别失败');
        }
      } catch (error) {
        log.error('语音识别失败', error);
        this.recognitionStatusText = '识别失败';
        this.showToast(`语音识别失败: ${error.message}`, 'error');
      } finally {
        this.isProcessing = false;
        this.isListening = false;
        this.selectedFile = null;
        
        // 清空文件输入
        if (this.$refs.fileInput) {
          this.$refs.fileInput.value = '';
        }
      }
    },

    /**
     * 回退到文件选择模式
     */
    fallbackToFileInput() {
      log.info('回退到文件选择模式')
      this.$refs.fileInput.click();
    },

    /**
     * 处理文件选择（备用方案）
     */
    async handleFileSelect(event) {
      const file = event.target.files[0];
      if (!file) {
        this.stopVoiceInput();
        return;
      }

      try {
        this.selectedFile = file;
        await this.processAudioFile(file);
      } catch (error) {
        log.error('文件处理失败', error);
        this.showToast(`文件处理失败: ${error.message}`, 'error');
      }
    },

    /**
     * 编辑识别结果
     */
    editRecognitionResult() {
      if (this.recognitionResult) {
        this.inputText = this.recognitionResult.transcription;
        this.clearRecognitionResult();
        // 聚焦到输入框
        this.$nextTick(() => {
          const input = this.$el.querySelector('.message-input');
          if (input) input.focus();
        });
      }
    },

    /**
     * 发送识别结果
     */
    sendRecognitionResult() {
      if (this.recognitionResult) {
        this.inputText = this.recognitionResult.transcription;
        this.sendMessage();
        this.clearRecognitionResult();
      }
    },

    /**
     * 清除识别结果
     */
    clearRecognitionResult() {
      this.recognitionResult = null;
    },

    /**
     * 获取语音按钮图标
     */
    getVoiceButtonIcon() {
      if (this.isProcessing) {
        return 'spinner';
      } else if (this.isListening) {
        return 'microphone-slash';
      } else {
        return 'microphone';
      }
    },

    /**
     * 获取语音按钮标题
     */
    getVoiceButtonTitle() {
      if (this.isProcessing) {
        return '正在识别中...';
      } else if (this.isListening) {
        return '按住说话';
      } else {
        return '按住说话';
      }
    },

    /**
     * 获取语音输入区域占位符文本
     */
    getVoicePlaceholderText() {
      if (this.isListening) {
        return '录音中';
      } else {
        return '按住说话';
      }
    },

    /**
     * 显示提示信息
     */
    showToast(message, type = 'info') {
      // 使用全局toast或console
      if (this.$toast) {
        this.$toast[type]?.(message) || this.$toast(message);
      } else {
        console.log(`[${type.toUpperCase()}] ${message}`);
      }
    },

    /**
     * 处理全局点击事件
     */
    handleGlobalClick(event) {
      // 如果点击的是加号按钮，不处理
      if (event.target.closest('.plus-btn')) {
        return;
      }
      // 如果点击的是功能按钮面板，不处理
      if (event.target.closest('.function-panel')) {
        return;
      }
      // 其他情况关闭加号菜单
      if (this.showPlusMenu) {
        this.showPlusMenu = false;
      }
    },

    /**
     * 切换加号菜单显示状态
     */
    togglePlusMenu() {
      this.showPlusMenu = !this.showPlusMenu;
      log.info('切换加号菜单', { show: this.showPlusMenu });
    },

    /**
     * 打开相册选择图片
     */
    openPhotoLibrary() {
      this.showPlusMenu = false;
      this.$refs.imageInput.click();
      log.info('打开相册选择图片');
    },

    /**
     * 打开相机拍照
     */
    openCamera() {
      this.showPlusMenu = false;
      // 创建相机输入，支持拍照
      const cameraInput = document.createElement('input');
      cameraInput.type = 'file';
      cameraInput.accept = 'image/*';
      cameraInput.capture = 'camera';
      cameraInput.style.display = 'none';
      
      cameraInput.onchange = (event) => {
        const file = event.target.files[0];
        if (file) {
          this.handleImageSelect({ target: { files: [file] } });
        }
        // 清理临时元素
        document.body.removeChild(cameraInput);
      };
      
      document.body.appendChild(cameraInput);
      cameraInput.click();
      log.info('打开相机拍照');
    },

    /**
     * 处理图片选择
     */
    async handleImageSelect(event) {
      const file = event.target.files[0];
      if (!file) return;
      
      log.info('选择图片文件', { fileName: file.name, fileSize: file.size, fileType: file.type });
      
      // 验证图片文件
      if (!file.type.startsWith('image/')) {
        this.showToast('请选择有效的图片文件', 'error');
        return;
      }
      
      try {
        this.isProcessing = true;
        this.recognitionStatusText = '正在上传图片...';
        
        // 第一步：上传图片到OSS获取URL
        const imageUrl = await this.uploadImageToOSS(file);
        
        // 第二步：用URL直接触发图片分析
        this.recognitionStatusText = '正在分析图片...';
        const analysis = await this.analyzeImageByURL(imageUrl, '请分析这张图片的内容');
        
        if (analysis && analysis.content) {
          // 图片分析完成后，先发送用户图片消息，再发送AI助手的回复
          
          // 1. 发送用户图片消息（显示用户上传的图片）
          const userImageMessage = {
            type: 'image',
            fileName: file.name,
            fileSize: file.size,
            imageUrl: imageUrl
          };
          this.$emit('sendMessage', userImageMessage);
          
          // 2. 发送AI助手的分析回复
          this.$emit('aiReply', analysis.content);
          
          this.showToast('图片上传分析完成！', 'success');
          
          // 记录分析结果到日志
          log.info('图片分析完成，已发送用户图片和AI回复', { 
            fileName: file.name,
            imageUrl: imageUrl,
            analysisContent: analysis.content
          });
        } else {
          throw new Error('图片分析失败或返回结果为空');
        }
        
      } catch (error) {
        log.error('图片处理失败', error);
        this.showToast(`图片处理失败: ${error.message}`, 'error');
      } finally {
        this.isProcessing = false;
        this.selectedFile = null;
        
        // 清空文件输入（添加安全检查）
        if (this.$refs.imageInput) {
          this.$refs.imageInput.value = '';
        }
      }
    },

    /**
     * 打开图片分析模态框
     */
    openImageAnalysis() {
      this.showImageAnalysisModal = true;
      log.info('打开图片分析模态框');
    },

    /**
     * 关闭图片分析模态框
     */
    closeImageAnalysisModal() {
      this.showImageAnalysisModal = false;
      log.info('关闭图片分析模态框');
    },

    /**
     * 格式化文件大小
     */
    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    /**
     * 上传图片到OSS
     */
    async uploadImageToOSS(file) {
      try {
        const formData = new FormData();
        formData.append('image', file);
        
        const response = await fetch('/api/image-analysis/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}` // 如果需要认证
          },
          body: formData
        });
        
        if (!response.ok) {
          throw new Error('图片上传失败');
        }
        
        const result = await response.json();
        
        if (result.success && result.imageUrl) {
          log.info('图片上传成功', { imageUrl: result.imageUrl });
          return result.imageUrl;
        } else {
          log.error('图片上传失败，返回结果:', result);
          throw new Error(result.error || '图片上传失败');
        }
      } catch (error) {
        log.error('图片上传失败', error);
        throw new Error(`图片上传失败: ${error.message}`);
      }
    },

    /**
     * 根据URL分析图片
     */
    async analyzeImageByURL(imageUrl, prompt) {
      try {
        const response = await fetch('/api/image-analysis/analyze-url', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            imageUrl: imageUrl,
            prompt: prompt || '请分析这张图片的内容'
          })
        });
        
        if (!response.ok) {
          throw new Error('图片分析失败');
        }
        
        const result = await response.json();
        
        // 添加调试日志，查看实际返回的数据结构
        log.info('图片分析API返回结果', { 
          success: result.success, 
          hasAnalysis: !!result.analysis,
          resultKeys: Object.keys(result),
          result: result
        });
        
        if (result.success && result.analysis) {
          log.info('图片分析成功', { analysis: result.analysis });
          return result.analysis;
        } else if (result.success && result.praise && result.praise.content) {
          // 如果返回的是result.praise.content（照片夸奖格式）
          log.info('图片分析成功（praise格式）', { praise: result.praise });
          return { content: result.praise.content };
        } else if (result.success && result.content) {
          // 如果返回的是result.content而不是result.analysis
          log.info('图片分析成功（content格式）', { content: result.content });
          return { content: result.content };
        } else if (result.success && result.data) {
          // 如果返回的是result.data
          log.info('图片分析成功（data格式）', { data: result.data });
          return result.data;
        } else {
          log.error('图片分析返回数据结构异常', { result });
          throw new Error(result.error || '图片分析返回数据结构异常');
        }
      } catch (error) {
        log.error('图片分析失败', error);
        throw new Error(`图片分析失败: ${error.message}`);
      }
    },

    /**
     * 处理图片分析完成
     */
    handleImageAnalysisComplete(result) {
      log.info('图片分析完成', result);
      
      // 将分析结果作为消息发送
      const analysisMessage = `🖼️ 图片分析结果：\n\n${result.analysis.content}`;
      this.$emit('sendMessage', analysisMessage);
      
      // 关闭模态框
      this.closeImageAnalysisModal();
      
      // 显示成功提示
      this.showToast('图片分析完成，已发送结果！', 'success');
    }
  }
}
</script>

<style scoped>
.input-area {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-top: 1px solid rgba(255, 255, 255, 0.3);
  padding: 8px 16px 8px;
  z-index: 1000;
}

.input-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.voice-btn {
  width: 40px;
  height: 40px;
  border-radius: 20px;
  border: none;
  background: #f2f2f7;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  color: #667eea;
  position: relative;
}

.voice-btn.active {
  background: #ff9500;
  color: white;
}

.voice-btn:hover:not(:disabled) {
  background: #e5e5ea;
  transform: scale(1.05);
}

.voice-btn.listening {
  background: #ff3b30;
  color: white;
  animation: pulse 1.5s infinite;
}

.voice-btn.processing {
  background: #007aff;
  color: white;
  cursor: not-allowed;
}

.voice-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.voice-btn .pulse {
  animation: spin 1s linear infinite;
}

.message-input {
  width: 100%;
  border: none;
  outline: none;
  font-size: 16px;
  padding: 12px;
  background: transparent;
  border-radius: 20px;
  background: #f2f2f7;
  transition: all 0.2s;
  box-sizing: border-box;
}

.message-input:focus {
  background: #ffffff;
  box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.2);
}

.message-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.message-input::placeholder {
  color: #8e8e93;
}

/* 动态输入区域 */
.dynamic-input-area {
  flex: 1;
  position: relative;
  min-width: 0; /* 确保flex子元素可以收缩 */
}

/* 语音输入区域 */
.voice-input-area {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 12px;
  background: #f2f2f7;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 44px;
  user-select: none;
  width: 100%;
  box-sizing: border-box;
}

.voice-input-area:hover {
  background: #e5e5ea;
}

.voice-input-area.listening {
  background: #ff8e8e;
  color: white;
  /* 移除明显的动画效果 */
}

.voice-input-area .voice-area-icon {
  font-size: 18px;
  color: #667eea;
}

.voice-input-area.listening .voice-area-icon {
  color: white;
}

.voice-input-area .voice-placeholder {
  font-size: 16px;
  color: #8e8e93;
  font-weight: 500;
}

.voice-input-area.listening .voice-placeholder {
  color: white;
}

.send-btn {
  width: 40px;
  height: 40px;
  border-radius: 20px;
  border: none;
  background: #007aff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.send-btn:disabled {
  background: #e5e5ea;
  color: #8e8e93;
  cursor: not-allowed;
}

.send-btn:not(:disabled):hover {
  background: #0056d3;
  transform: scale(1.05);
}

/* 加号按钮样式 - 模仿微信风格 */
.plus-btn {
  width: 40px;
  height: 40px;
  border-radius: 20px;
  border: none;
  background: #f2f2f7;
  color: #8e8e93;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.plus-btn:hover:not(:disabled) {
  background: #e5e5ea;
  color: #007aff;
  transform: scale(1.05);
}

.plus-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.plus-btn svg {
  font-size: 16px;
}

/* 输入区域展开状态 */
.input-area.expanded {
  transform: translateY(-120px);
  transition: transform 0.3s ease-out;
}

/* 加号按钮激活状态 */
.plus-btn.active {
  background: #007aff;
  color: white;
  transform: rotate(45deg);
}

/* 功能按钮面板 - 模仿微信样式 */
.function-panel {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #f7f7f7;
  border-top: 1px solid #d0d0d0;
  padding: 16px 20px 20px 20px;
  z-index: 999;
  animation: slideUp 0.3s ease-out;
  height: 120px;
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  align-items: center;
}

.function-buttons {
  display: flex;
  justify-content: center;
  gap: 30px;
  max-width: 300px;
  margin: 0 auto;
}

.function-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 100px;
}

.function-button:hover {
  transform: scale(1.05);
}

.button-icon {
  width: 60px;
  height: 60px;
  border-radius: 16px;
  background: #4285f4;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 19px;
  box-shadow: 0 4px 12px rgba(66, 133, 244, 0.3);
}

.button-text {
  font-size: 14px;
  color: #333;
  font-weight: 600;
  text-align: center;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  color: #333;
  font-size: 14px;
  font-weight: 500;
  min-width: 120px;
}

.menu-item:hover {
  background: #f2f2f7;
  transform: scale(1.02);
}

.menu-item svg {
  font-size: 16px;
  color: #007aff;
  width: 20px;
  text-align: center;
}

/* 录音状态提示相关样式已删除 */

/* 语音识别状态提示 */
.recognition-status {
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 0;
  background: rgba(0, 122, 255, 0.1);
  border-top: 1px solid rgba(0, 122, 255, 0.2);
  padding: 8px 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-content {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #007aff;
  font-size: 14px;
}

.status-content svg {
  font-size: 16px;
}

/* 语音识别结果预览 */
.recognition-preview {
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  border-top: 1px solid rgba(0, 122, 255, 0.2);
  border-radius: 16px 16px 0 0;
  margin: 0 8px;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(0, 122, 255, 0.1);
  border-bottom: 1px solid rgba(0, 122, 255, 0.1);
  color: #007aff;
  font-weight: 600;
  font-size: 14px;
}

.preview-header svg {
  font-size: 16px;
}

.preview-close {
  margin-left: auto;
  background: none;
  border: none;
  color: #007aff;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
}

.preview-close:hover {
  background: rgba(0, 122, 255, 0.1);
}

.preview-content {
  padding: 16px;
}

.preview-text {
  margin: 0 0 16px 0;
  font-size: 16px;
  line-height: 1.5;
  color: #333;
  background: #f8f9fa;
  padding: 12px;
  border-radius: 8px;
  border-left: 4px solid #007aff;
}

.preview-actions {
  display: flex;
  gap: 8px;
}

.preview-btn {
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.preview-btn-edit {
  background: #f2f2f7;
  color: #666;
}

.preview-btn-edit:hover {
  background: #e5e5ea;
}

.preview-btn-send {
  background: #007aff;
  color: white;
}

.preview-btn-send:hover {
  background: #0056d3;
}

/* 动画 */
@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 响应式设计 */
@media (max-width: 430px) {
  .input-area {
    padding: 8px 12px 8px;
  }
  
  .voice-btn,
  .send-btn {
    width: 36px;
    height: 36px;
  }
  
  .message-input {
    font-size: 15px;
    padding: 10px;
  }
  
  .preview-content {
    padding: 12px;
  }
  
  .preview-text {
    font-size: 15px;
    padding: 10px;
  }
  
  .preview-btn {
    padding: 8px 12px;
    font-size: 13px;
  }
}
</style>