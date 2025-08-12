'use strict';

const LLMConfig = require('../config/llm_config');
const PromptLoader = require('../utils/prompt_loader');

class BaseChain {
  constructor() {
    this.llmConfig = new LLMConfig();
    this.promptLoader = new PromptLoader();
    this.client = this.llmConfig.getClient();
    this.model = this.llmConfig.getModel();
  }

  async callLLM(prompt, options = {}) {
    try {
      console.log('🤖 调用LLM...');
      console.log('📤 输入prompt长度:', prompt.length);
      
      const requestOptions = {
        model: this.model,
        messages: [
          { role: "user", content: prompt }
        ],
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 2000,
        ...options
      };

      if (process.env.MOCK_LLM === 'true' || process.env.NODE_ENV === 'test') {
        // 根据调用者功能简易生成可解析的JSON
        const fallback = options.mock_type || 'generic';
        let content = '{}';
        if (fallback === 'classify') {
          content = '{"category":"simple_todo","confidence":0.9,"reason":"mock"}';
        } else if (fallback === 'questions') {
          content = '{"questions":["问题1","问题2","问题3"],"greeting":"你好，我来帮你规划。"}';
        } else if (fallback === 'plan') {
          content = '{"plan_overview":"mock","collections":[{"name":"主要任务","description":"mock","tasks":[]}],"suggestions":"按计划执行"}';
        } else if (fallback === 'adjust') {
          content = '{"adjustment_summary":"mock","mood_analysis":"中性","changes":[],"updated_plan":{},"encouragement":"加油"}';
        } else if (fallback === 'habit') {
          content = '{"habit_analysis":{"core_behavior":"mock","benefits":[],"challenges":[]},"implementation_strategy":{},"schedule":{},"phased_plan":{},"task_template":{"title":"mock","description":"mock","priority":"medium","timeBlock":{"timeBlockType":"morning","startTime":"","endTime":""},"recurrence":"daily","tags":["habit"]}}';
        }
        // 模拟响应结构
        return content;
      }

      const response = await this.client.chat.completions.create(requestOptions);
      
      const result = response.choices[0].message.content;
      console.log('📥 LLM响应长度:', result.length);
      console.log('💰 Token使用:', response.usage);
      
      return result;
    } catch (error) {
      console.error('❌ LLM调用失败:', error.message);
      throw error;
    }
  }

  async parseJSONResponse(response) {
    try {
      // 清理响应，移除markdown代码块标记
      let cleanResponse = response.trim();
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      // 尝试直接解析清理后的响应
      try {
        const parsed = JSON.parse(cleanResponse);
        console.log('✅ JSON解析成功');
        return parsed;
      } catch (directParseError) {
        console.log('⚠️ 直接解析失败，尝试修复JSON...');
        
        // 如果直接解析失败，尝试提取和修复JSON对象
        const jsonMatch = this.extractCompleteJSON(cleanResponse);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch);
            console.log('✅ JSON解析成功（提取后）');
            return parsed;
          } catch (extractParseError) {
            console.log('⚠️ 提取的JSON仍有问题，尝试进一步修复...');
            
            // 尝试修复常见的JSON格式问题
            const repairedJson = this.repairCommonJSONIssues(jsonMatch);
            if (repairedJson) {
              try {
                const parsed = JSON.parse(repairedJson);
                console.log('✅ JSON解析成功（修复后）');
                return parsed;
              } catch (repairParseError) {
                console.log('❌ 修复后仍无法解析:', repairParseError.message);
              }
            }
          }
        }
        
        throw directParseError;
      }
    } catch (error) {
      console.error('❌ JSON解析失败:', error.message);
      console.log('📄 原始响应:', response.substring(0, 1000) + (response.length > 1000 ? '...(truncated)' : ''));
      return { error: 'JSON解析失败', raw_response: response };
    }
  }

  extractCompleteJSON(text) {
    let braceCount = 0;
    let startIndex = -1;
    let inString = false;
    let escapeNext = false;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      
      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      
      if (char === '\\') {
        escapeNext = true;
        continue;
      }
      
      if (char === '"' && !escapeNext) {
        inString = !inString;
        continue;
      }
      
      if (!inString) {
        if (char === '{') {
          if (startIndex === -1) {
            startIndex = i;
          }
          braceCount++;
        } else if (char === '}') {
          braceCount--;
          if (braceCount === 0 && startIndex !== -1) {
            return text.substring(startIndex, i + 1);
          }
        }
      }
    }
    
    // 如果没有找到完整的JSON，尝试修复不完整的JSON
    if (startIndex !== -1 && braceCount > 0) {
      console.log('🔧 尝试修复不完整的JSON...');
      let partialJson = text.substring(startIndex);
      
      // 尝试添加缺失的闭合括号
      for (let i = 0; i < braceCount; i++) {
        partialJson += '}';
      }
      
      // 验证修复后的JSON是否有效
      try {
        JSON.parse(partialJson);
        console.log('✅ JSON修复成功');
        return partialJson;
      } catch (e) {
        console.log('❌ JSON修复失败:', e.message);
      }
    }
    
    return null;
  }

  repairCommonJSONIssues(jsonString) {
    try {
      let repaired = jsonString;
      
      // 修复缺少逗号的问题（在对象属性之间）
      repaired = repaired.replace(/}\s*{/g, '},{');
      repaired = repaired.replace(/]\s*{/g, '],{');
      repaired = repaired.replace(/}\s*\[/g, '},[');
      
      // 修复数组中缺少逗号的问题
      repaired = repaired.replace(/}\s*"[^"]*"\s*:/g, (match) => {
        return match.replace(/}\s*"/, '},"');
      });
      
      // 修复字符串中的换行符问题
      repaired = repaired.replace(/"([^"]*?)\n([^"]*?)"/g, '"$1\\n$2"');
      
      // 修复尾随逗号问题
      repaired = repaired.replace(/,\s*}/g, '}');
      repaired = repaired.replace(/,\s*]/g, ']');
      
      // 修复缺少引号的属性名
      repaired = repaired.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
      
      // 尝试修复不完整的数组
      const arrayMatches = repaired.match(/"tags"\s*:\s*\[([^\]]*?)$/m);
      if (arrayMatches) {
        const incompleteArray = arrayMatches[1];
        if (incompleteArray && !incompleteArray.trim().endsWith('"')) {
          // 如果数组没有正确结束，尝试补全
          repaired = repaired.replace(/"tags"\s*:\s*\[([^\]]*?)$/m, '"tags": []');
        }
      }
      
      console.log('🔧 JSON修复尝试完成');
      return repaired;
    } catch (error) {
      console.log('❌ JSON修复过程出错:', error.message);
      return null;
    }
  }

  formatPrompt(promptName, variables) {
    return this.promptLoader.formatPrompt(promptName, variables);
  }

  logChainStart(chainName, input) {
    console.log(`\n🔗 === ${chainName} 链条开始 ===`);
    console.log('📥 输入数据:', input);
  }

  logChainEnd(chainName, output) {
    console.log('📤 输出结果:', output);
    console.log(`🔗 === ${chainName} 链条结束 ===\n`);
  }
}

module.exports = BaseChain;