'use strict';

const fs = require('fs');
const path = require('path');

class PromptLoader {
  constructor() {
    this.promptsPath = path.join(__dirname, '../prompt');
    this.prompts = {};
    this.loadPrompts();
  }

  loadPrompts() {
    try {
      console.log('📁 加载Prompt模板...');
      
      const promptFiles = {
        'input_classifier': 'input_classifier.txt',
        'question_generator': 'question_generator.txt', 
        'plan_generator': 'plan_generator.txt',
        'plan_adjuster': 'plan_adjuster.txt',
        'habit_processor': 'habit_processor.txt'
      };

      for (const [key, filename] of Object.entries(promptFiles)) {
        const filePath = path.join(this.promptsPath, filename);
        if (fs.existsSync(filePath)) {
          this.prompts[key] = fs.readFileSync(filePath, 'utf8');
          console.log(`✅ 加载prompt: ${key}`);
        } else {
          console.warn(`⚠️  Prompt文件不存在: ${filename}`);
        }
      }
      
      console.log(`✅ 总共加载${Object.keys(this.prompts).length}个prompt模板`);
    } catch (error) {
      console.error('❌ 加载prompt模板失败:', error.message);
      throw error;
    }
  }

  getPrompt(promptName) {
    if (!this.prompts[promptName]) {
      throw new Error(`Prompt模板不存在: ${promptName}`);
    }
    return this.prompts[promptName];
  }

  formatPrompt(promptName, variables = {}) {
    let prompt = this.getPrompt(promptName);
    
    // 替换变量
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{${key}}`;
      prompt = prompt.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
    }
    
    console.log(`📝 格式化prompt: ${promptName}`);
    console.log(`🔤 变量:`, variables);
    
    return prompt;
  }

  listPrompts() {
    return Object.keys(this.prompts);
  }

  reloadPrompts() {
    this.prompts = {};
    this.loadPrompts();
    console.log('🔄 Prompt模板重新加载完成');
  }
}

module.exports = PromptLoader;