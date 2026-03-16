'use strict';

/**
 * 任务识别 Prompt 模板
 * 用于从用户输入中提取任务相关信息
 */

/**
 * 任务识别系统提示词
 */
const TASK_RECOGNITION_SYSTEM_PROMPT = `你是一个专业的任务信息提取助手，负责从用户输入中提取任务相关的关键信息。

当用户表达一个任务创建意图时，请提取以下信息：

1. **task** - 任务内容
   - 任务的具体描述
   - 例如："取快递"、"买菜"、"开会"

2. **time** - 时间信息（如果有）
   - 具体的时间点或时间段
   - 优先提取具体时间："10:00"、"下午3点"、"明天早上10点"
   - 模糊时间段："今天下午"、"明天上午"、"晚上"
   - 相对时间："明天"、"后天"、"下周"
   - 注意：如果有具体时间（如10:00），请完整保留包括上下文（如"明天早上10:00"）

3. **location** - 地点信息（如果有）
   - 任务发生的地点
   - 例如："公司"、"家里"、"超市"

4. **priority** - 优先级（如果有）
   - 任务的紧急程度
   - 可选值：high（高）、medium（中）、low（低）

请仔细分析用户输入的语义和上下文，提取尽可能多的有效信息。`;

/**
 * 任务识别用户提示词模板
 */
const TASK_RECOGNITION_USER_PROMPT = `请从以下用户输入中提取任务相关信息：

用户输入："{user_input}"

请返回JSON格式的结果：
{
  "task": "任务内容（必须）",
  "time": "时间信息（如果有）",
  "location": "地点信息（如果有）",
  "priority": "优先级（如果有，high/medium/low）"
}

只返回JSON格式，不要包含其他内容。`;

/**
 * 构建完整的任务识别提示词
 * @param {string} userInput 用户输入
 * @returns {Object} 包含系统提示词和用户提示词的对象
 */
function buildTaskRecognitionPrompt(userInput) {
  const userPrompt = TASK_RECOGNITION_USER_PROMPT.replace('{user_input}', userInput);
  
  return {
    systemPrompt: TASK_RECOGNITION_SYSTEM_PROMPT,
    userPrompt: userPrompt,
    messages: [
      { role: 'system', content: TASK_RECOGNITION_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt }
    ]
  };
}

/**
 * 任务信息验证
 * @param {Object} result 任务信息提取结果
 * @returns {boolean} 是否为有效结果
 */
function validateTaskResult(result) {
  if (!result || typeof result !== 'object') return false;
  
  // 检查必要字段
  if (!result.task || typeof result.task !== 'string') return false;
  
  return true;
}

module.exports = {
  TASK_RECOGNITION_SYSTEM_PROMPT,
  TASK_RECOGNITION_USER_PROMPT,
  buildTaskRecognitionPrompt,
  validateTaskResult
};