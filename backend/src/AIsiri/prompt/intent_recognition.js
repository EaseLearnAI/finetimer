/**
 * 意图识别 Prompt 模板
 * 用于识别用户输入的四种意图类型
 */

/**
 * 意图识别系统提示词
 */
const INTENT_RECOGNITION_SYSTEM_PROMPT = `你是一个专业的意图识别助手，负责分析用户输入并准确识别用户的意图类型。

请根据用户的输入，判断其属于以下四种意图类型中的哪一种：

1. **CONVERSATION** - 正常对话
   - 包含情绪安慰、日常聊天、问候、感情表达等
   - 例如："今天天气真好"、"我感觉有点累"、"你好吗"、"谢谢你的帮助"

2. **TASK_CREATION** - 任务新增  
   - 包含创建新任务、添加待办事项、习惯养成等
   - 包含提到未来需要完成的事情，即使表达方式不是直接的任务创建
   - **重要**：当用户提到未来的事件、活动或需要准备的事情时，即使伴随情绪表达，也应识别为任务创建
   - 例如："我要去取快递"、"提醒我明天开会"、"我想养成早起的习惯"、"帮我记录一下买菜"
   - 也包括："明天有个重要的考试"、"下周要交作业"、"今晚要加班"、"周末要去看电影"
   - 情绪+任务："我压力好大，明天还有个考试"、"担心明天的面试"、"紧张下周的演讲"

3. **SCHEDULE_PLANNING** - 时间调度
   - 包含时间安排、日程规划、任务时间调整等
   - 例如："帮我安排明天的日程"、"我明天几点有空"、"重新规划一下今天的时间"、"调整一下会议时间"

4. **EXTERNAL_TOOL** - 外部工具调用
   - 需要调用外部API或工具获取信息
   - 例如："今天天气怎么样"、"从公司到家要多久"、"附近有什么餐厅"、"现在几点了"

请仔细分析用户输入的语义和上下文，返回最准确的意图类型。如果一句话包含多个意图，请返回主要意图。`;

/**
 * 意图识别用户提示词模板
 */
const INTENT_RECOGNITION_USER_PROMPT = `请分析以下用户输入，并识别其意图类型：

用户输入："{user_input}"

请返回JSON格式的结果：
{
  "intent": "CONVERSATION|TASK_CREATION|SCHEDULE_PLANNING|EXTERNAL_TOOL",
  "confidence": 0.95,
  "reasoning": "判断理由的简要说明",
  "extracted_info": {
    "keywords": ["关键词1", "关键词2"],
    "entities": {
      "time": "时间实体（如果有）",
      "location": "地点实体（如果有）",
      "task": "任务内容（如果有）"
    }
  }
}

只返回JSON格式，不要包含其他内容。`;

/**
 * 意图类型枚举
 */
const INTENT_TYPES = {
  CONVERSATION: 'CONVERSATION',
  TASK_CREATION: 'TASK_CREATION', 
  SCHEDULE_PLANNING: 'SCHEDULE_PLANNING',
  EXTERNAL_TOOL: 'EXTERNAL_TOOL'
};

/**
 * 意图类型中文描述
 */
const INTENT_DESCRIPTIONS = {
  [INTENT_TYPES.CONVERSATION]: '正常对话（情绪安慰、聊天）',
  [INTENT_TYPES.TASK_CREATION]: '任务新增（待办事项、习惯养成）',
  [INTENT_TYPES.SCHEDULE_PLANNING]: '时间调度（日程安排、时间规划）',
  [INTENT_TYPES.EXTERNAL_TOOL]: '外部工具调用（地图、天气等）'
};

/**
 * 构建完整的意图识别提示词
 * @param {string} userInput 用户输入
 * @returns {Object} 包含系统提示词和用户提示词的对象
 */
function buildIntentRecognitionPrompt(userInput) {
  const userPrompt = INTENT_RECOGNITION_USER_PROMPT.replace('{user_input}', userInput);
  
  return {
    systemPrompt: INTENT_RECOGNITION_SYSTEM_PROMPT,
    userPrompt: userPrompt,
    messages: [
      { role: 'system', content: INTENT_RECOGNITION_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt }
    ]
  };
}

/**
 * 意图识别结果验证
 * @param {Object} result 意图识别结果
 * @returns {boolean} 是否为有效结果
 */
function validateIntentResult(result) {
  if (!result || typeof result !== 'object') return false;
  
  // 检查必要字段
  if (!result.intent || !Object.values(INTENT_TYPES).includes(result.intent)) return false;
  if (typeof result.confidence !== 'number' || result.confidence < 0 || result.confidence > 1) return false;
  if (!result.reasoning || typeof result.reasoning !== 'string') return false;
  
  return true;
}

module.exports = {
  INTENT_RECOGNITION_SYSTEM_PROMPT,
  INTENT_RECOGNITION_USER_PROMPT,
  INTENT_TYPES,
  INTENT_DESCRIPTIONS,
  buildIntentRecognitionPrompt,
  validateIntentResult
};

