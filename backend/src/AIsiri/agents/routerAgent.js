'use strict';

/**
 * 中央路由与协调智能体 (Router Agent / Supervisor)
 *
 * 职责：
 * 1. 单次 LLM 调用完成意图识别 + 情绪检测 + 实体提取
 * 2. 根据识别结果决定分发到哪些下游智能体
 * 3. 支持多意图并行分发
 */

const llm = require('./llmClient');
const logger = require('../utils/logger');
const { analyzeImageWithQwen } = require('../../AIvoice/services/imageAnalysisService');

const ROUTER_SYSTEM_PROMPT = `你是一个智能路由系统，负责分析用户输入并完成三项任务：

1. **意图识别**：判断用户的主要意图和可能的次要意图
2. **深度情绪检测**：精准识别用户当前的情绪状态、强度与来源
3. **实体提取**：提取关键信息（时间、地点、任务名称等）

## 意图类型（三类）
- TASK_CREATION：用户明确要**新增**一个具体事项（如"帮我记一个明天开会的任务"）
- SCHEDULE_PLANNING：查看/整理/安排/调整/重排/清理已有任务和日程
- CONVERSATION：闲聊、情绪表达、寻求安慰鼓励、提问、感谢

## 意图区分规则（非常重要）

### TASK_CREATION + SCHEDULE_PLANNING（同时包含）
仅当用户提到一个**具体新活动**并附带**具体时间**时：
- "今天早上11点上班"、"明天下午3点开会"、"提醒我今晚8点复习英语"

### 仅 SCHEDULE_PLANNING（不包含 TASK_CREATION）
以下情况只用 SCHEDULE_PLANNING：
- 查看现有任务："帮我看看今天有什么任务"
- 整理/清理任务："帮我整理一下任务"、"把重复的任务删掉"
- 重新排序："按优先级重新排一下"
- 调整安排："帮我规划一下今天的日程"

### 仅 TASK_CREATION
当用户只是要添加新任务但不需要日程规划时：
- "帮我创建一个新任务"、"提醒我明天买菜"

## 情绪类型（八类，精确区分）
- happy：开心、兴奋、满足、成就感
- sad：难过、失落、沮丧、心痛
- anxious：焦虑、担心、不安、恐惧
- stressed：压力大、紧张、烦躁、崩溃感
- tired：疲惫、困倦、无力、倦怠
- angry：生气、愤怒、恼火、委屈
- confused：迷茫、犹豫、不知所措
- neutral：平静、正常、理性

## 输出格式（严格 JSON）
{
  "primaryIntent": "TASK_CREATION|SCHEDULE_PLANNING|CONVERSATION",
  "allIntents": ["TASK_CREATION", "SCHEDULE_PLANNING"],
  "confidence": 0.95,
  "emotion": {
    "type": "stressed",
    "intensity": 0.7,
    "triggers": ["工作压力", "时间紧迫"],
    "context": "用户因为多个deadline临近感到焦虑和压力，情绪偏向消极"
  },
  "entities": {
    "tasks": ["取快递", "开会"],
    "time": "明天下午3点",
    "location": "公司",
    "date": "2026-03-18"
  },
  "reasoning": "用户提到要完成多个任务并安排时间，同时表现出一定压力"
}`;

async function routerAgent(state) {
  const { userInput, userId, requestId } = state;

  logger.info('[RouterAgent] 开始路由分析', { requestId, inputLength: userInput.length });

  let imageContext = '';
  const imagePatterns = [
    /\.(jpg|jpeg|png|gif|bmp|webp)$/i,
    /[0-9]{13}-[a-zA-Z]+-[0-9]+\.(jpg|jpeg|png|gif|bmp|webp)/i,
  ];
  const hasImage = imagePatterns.some((p) => p.test(userInput));

  if (hasImage) {
    try {
      const fileNameMatch = userInput.match(
        /([0-9]{13}-[a-zA-Z]+-[0-9]+\.(jpg|jpeg|png|gif|bmp|webp))/i
      );
      if (fileNameMatch) {
        const ossRegion = process.env.OSS_REGION || 'oss-cn-hangzhou';
        const ossBucket = process.env.OSS_BUCKET || 'vitebucket';
        const ossUrl = `https://${ossBucket}.${ossRegion}.aliyuncs.com/images/${fileNameMatch[1]}`;
        const analysis = await analyzeImageWithQwen(ossUrl, '请详细描述这张图片的内容');
        imageContext = `\n[图片内容分析：${analysis.content}]`;
      }
    } catch (e) {
      logger.warn('[RouterAgent] 图片分析失败', { error: e.message });
    }
  }

  const enhancedInput = userInput + imageContext;

  const now = new Date();
  const currentDate = now.toISOString().split('T')[0];
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  const currentWeekday = weekdays[now.getDay()];
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');

  const result = await llm.chatJSON(
    [
      { role: 'system', content: ROUTER_SYSTEM_PROMPT },
      { role: 'user', content: `当前时间：${currentDate} 星期${currentWeekday} ${hours}:${minutes}\n用户输入："${enhancedInput}"` },
    ],
    { temperature: 0.1, maxTokens: 800 }
  );

  if (!result.parsed) {
    logger.warn('[RouterAgent] 解析失败，使用默认 CONVERSATION');
    return {
      primaryIntent: 'CONVERSATION',
      detectedIntents: ['CONVERSATION'],
      emotionState: { emotion: 'neutral', confidence: 0.5, triggers: [], context: '' },
      extractedEntities: {},
      imageContext,
    };
  }

  const parsed = result.parsed;

  const emotionState = {
    emotion: parsed.emotion?.type || 'neutral',
    confidence: parsed.emotion?.intensity || 0.5,
    triggers: parsed.emotion?.triggers || [],
    context: parsed.emotion?.context || '',
  };

  const detectedIntents = parsed.allIntents && parsed.allIntents.length > 0
    ? parsed.allIntents
    : [parsed.primaryIntent || 'CONVERSATION'];

  logger.info('[RouterAgent] 路由分析完成', {
    requestId,
    primaryIntent: parsed.primaryIntent,
    allIntents: detectedIntents,
    emotion: emotionState.emotion,
  });

  return {
    primaryIntent: parsed.primaryIntent || 'CONVERSATION',
    detectedIntents,
    emotionState,
    extractedEntities: parsed.entities || {},
    imageContext,
  };
}

function routeDecision(state) {
  const intents = state.detectedIntents || [];
  const targets = [];

  if (intents.includes('TASK_CREATION')) targets.push('taskAgent');
  if (intents.includes('SCHEDULE_PLANNING')) targets.push('scheduleAgent');

  targets.push('emotionAgent');

  logger.info('[RouterAgent] 路由决策', { intents, targets });
  return targets;
}

module.exports = { routerAgent, routeDecision };
