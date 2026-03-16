/**
 * 智能调度 Prompt 模板
 * 用于多意图识别和智能响应生成
 */

/**
 * 多意图分析系统提示词
 */
const MULTI_INTENT_ANALYSIS_SYSTEM_PROMPT = `你是一个专业的多重意图分析助手，负责从用户的一句话中识别可能包含的多种意图。

用户的一句话可能同时包含以下多种意图：
1. **任务创建** - 想要添加新的待办事项或任务
2. **时间调度** - 希望安排或调整时间
3. **情绪表达** - 表达了某种情感状态，需要安慰或支持
4. **外部工具** - 需要查询外部信息（天气、路线等）

请分析用户输入，识别所有可能的意图类型。`;

/**
 * 统一响应生成系统提示词
 */
const UNIFIED_RESPONSE_SYSTEM_PROMPT = (assistantName = '小艾') => `你是一个智能AI助手${assistantName}，负责将多个服务模块的执行结果整合成一个自然、友好的统一回复。

用户信息：
- 用户当前位置：上海漕河泾B栋
- 当用户询问天气或需要外出建议时，默认基于上海地区的天气情况
- 当用户询问路线时，默认起点为上海漕河泾B栋

你的任务：
1. 分析各个模块的执行结果
2. 按照逻辑顺序组织信息
3. 生成自然流畅的对话回复
4. 体现对用户的关心和帮助
5. 当用户情绪不佳时，结合天气情况给出外出建议

回复原则：
- 语调温暖友善，像朋友一样
- 先处理任务，再给予情感支持
- 信息要准确完整
- 避免机械化的模板回复
- 长度控制在150字以内
- 当检测到负面情绪时，主动关心并结合天气给出外出建议
- 在回复中自然地提到自己的名字${assistantName}，让用户感受到个性化服务`;

/**
 * 构建多意图分析提示词
 * @param {string} userInput 用户输入
 * @param {Object} primaryIntent 主要意图识别结果
 * @returns {Object} 包含系统提示词和用户提示词的对象
 */
function buildMultiIntentAnalysisPrompt(userInput, primaryIntent) {
  const userPrompt = `请分析以下用户输入中包含的所有意图：

用户输入："${userInput}"
主要意图：${primaryIntent.intent} (置信度: ${primaryIntent.confidence})

请返回JSON格式的结果：
{
  "intents": [
    {
      "intent": "TASK_CREATION|SCHEDULE_PLANNING|CONVERSATION|EXTERNAL_TOOL",
      "confidence": 0.95,
      "reasoning": "识别理由",
      "keywords": ["相关关键词"]
    }
  ],
  "emotionalState": "normal|tired|stressed|happy|anxious",
  "urgencyLevel": "low|medium|high",
  "contextualInfo": {
    "timeReference": "时间相关信息",
    "locationReference": "地点相关信息",
    "taskReference": "任务相关信息"
  }
}

只返回JSON格式，不要包含其他内容。`;

  return {
    systemPrompt: MULTI_INTENT_ANALYSIS_SYSTEM_PROMPT,
    userPrompt: userPrompt,
    messages: [
      { role: 'system', content: MULTI_INTENT_ANALYSIS_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt }
    ]
  };
}

/**
 * 构建统一响应生成提示词
 * @param {string} userInput 用户输入
 * @param {Object} intentResult 意图识别结果
 * @param {Array} multipleIntents 多重意图
 * @param {Object} executionResults 各服务执行结果
 * @returns {Object} 包含系统提示词和用户提示词的对象
 */
function buildUnifiedResponsePrompt(userInput, intentResult, multipleIntents, executionResults) {
  // 构建执行结果摘要
  const resultsSummary = Object.keys(executionResults).map(service => {
    const result = executionResults[service];
    if (!result.success) return `${service}: 执行失败`;
    
    switch (service) {
      case 'taskCreation':
        return `任务创建: 成功创建任务"${result.task?.title || '新任务'}"`;
      case 'schedulePlanning':
        return `时间调度: 重新安排了日程`;
      case 'conversation':
        return `情绪支持: 提供了情感安慰`;
      case 'externalTool':
        return `外部工具: ${result.type === 'weather' ? '查询了天气信息' : '获取了路线信息'}`;
      default:
        return `${service}: 执行成功`;
    }
  }).join('\n');

  const userPrompt = `请基于以下信息生成一个自然、友好的统一回复：

用户原始输入："${userInput}"

识别到的意图：
${multipleIntents.map(intent => `- ${intent.intent} (置信度: ${intent.confidence})`).join('\n')}

各服务执行结果：
${resultsSummary}

请生成一个温暖、自然的回复，体现出：
1. 对用户请求的准确理解
2. 已完成的任务或安排
3. 对用户情绪的关心
4. 积极正面的态度

直接返回回复内容，不需要额外说明。`;

  return {
    systemPrompt: UNIFIED_RESPONSE_SYSTEM_PROMPT,
    userPrompt: userPrompt,
    messages: [
      { role: 'system', content: UNIFIED_RESPONSE_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt }
    ]
  };
}

/**
 * 情绪状态映射
 */
const EMOTION_STATES = {
  TIRED: 'tired',
  STRESSED: 'stressed', 
  HAPPY: 'happy',
  ANXIOUS: 'anxious',
  NORMAL: 'normal',
  FRUSTRATED: 'frustrated'
};

/**
 * 紧急程度映射
 */
const URGENCY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
};

/**
 * 意图权重配置
 * 用于确定执行优先级
 */
const INTENT_WEIGHTS = {
  EXTERNAL_TOOL: 1,     // 外部工具调用优先级最高
  TASK_CREATION: 2,     // 任务创建次之
  SCHEDULE_PLANNING: 3, // 时间调度
  CONVERSATION: 4       // 对话安慰最后
};

/**
 * 验证多意图分析结果
 * @param {Object} result 分析结果
 * @returns {boolean} 是否有效
 */
function validateMultiIntentResult(result) {
  if (!result || typeof result !== 'object') return false;
  if (!Array.isArray(result.intents)) return false;
  if (!result.emotionalState || !result.urgencyLevel) return false;
  
  return result.intents.every(intent => 
    intent.intent && intent.confidence >= 0 && intent.confidence <= 1
  );
}

/**
 * 根据情绪状态获取安慰模板
 * @param {string} emotionalState 情绪状态
 * @returns {Array} 安慰话语数组
 */
function getEmotionalSupportTemplates(emotionalState) {
  const templates = {
    tired: [
      "你今天辛苦了，记得多休息哦",
      "感觉累了就停下来歇歇，我会帮你安排得轻松一些",
      "工作很重要，但身体更重要呢"
    ],
    stressed: [
      "感受到你的压力了，我们一步步来解决",
      "压力大的时候深呼吸，一切都会好起来的",
      "有什么困难我们一起面对"
    ],
    anxious: [
      "别担心，我们一起规划一下就好了",
      "焦虑的时候可以把事情列出来，会清晰很多",
      "一切都在掌控中，放心吧"
    ],
    frustrated: [
      "理解你的挫折感，换个角度也许会好一些",
      "遇到困难很正常，我们想想解决办法",
      "有时候退一步会有新的发现"
    ],
    happy: [
      "看到你开心我也很高兴呢",
      "保持这个好心情哦",
      "你的快乐很有感染力"
    ]
  };
  
  return templates[emotionalState] || ["我在这里陪着你"];
}

module.exports = {
  MULTI_INTENT_ANALYSIS_SYSTEM_PROMPT,
  UNIFIED_RESPONSE_SYSTEM_PROMPT,
  buildMultiIntentAnalysisPrompt,
  buildUnifiedResponsePrompt,
  EMOTION_STATES,
  URGENCY_LEVELS,
  INTENT_WEIGHTS,
  validateMultiIntentResult,
  getEmotionalSupportTemplates
};

