<template>
  <div class="input-area">
    <div class="input-container">
      <button class="voice-btn" @click="toggleVoiceInput">
        <font-awesome-icon :icon="isListening ? 'microphone-slash' : 'microphone'" />
      </button>
      <input 
        v-model="inputText"
        type="text" 
        placeholder="输入你的学习目标或问题..."
        class="message-input"
        @keypress.enter="sendMessage"
      >
      <button 
        class="send-btn"
        @click="sendMessage"
        :disabled="!inputText.trim()"
      >
        <font-awesome-icon icon="paper-plane" />
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MessageInput',
  data() {
    return {
      inputText: '',
      isListening: false
    }
  },
  methods: {
    sendMessage() {
      if (!this.inputText.trim()) return;
      this.$emit('sendMessage', this.inputText);
      this.inputText = '';
    },
    toggleVoiceInput() {
      this.isListening = !this.isListening;
      // Voice input logic here
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
}

.voice-btn:hover {
  background: #e5e5ea;
}

.voice-btn.listening {
  background: #ff3b30;
  color: white;
}

.message-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 16px;
  padding: 12px;
  background: transparent;
  border-radius: 20px;
  background: #f2f2f7;
}

.message-input::placeholder {
  color: #8e8e93;
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
</style>