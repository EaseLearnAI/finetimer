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

## 意图类型（四类）
- TASK_CREATION：用户明确要**新增**一个具体事项（如"帮我记一个明天开会的任务"）
- SCHEDULE_PLANNING：查看/整理/安排/调整/重排/清理已有任务和日程
- CONVERSATION：闲聊、情绪表达、寻求安慰鼓励、提问、感谢
- UNDO_SCHEDULE：用户明确要求回退/撤销/恢复之前的日程调整（如"回退""撤销""不用了""恢复原来""取消刚才的调整"）

## 意图区分规则（非常重要）

### UNDO_SCHEDULE（最高优先级）
- 一旦识别到撤销/回退意图，allIntents 只包含 ["UNDO_SCHEDULE"]，不并发其他意图

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
  "primaryIntent": "TASK_CREATION|SCHEDULE_PLANNING|CONVERSATION|UNDO_SCHEDULE",
  "allIntents": ["TASK_CREATION", "SCHEDULE_PLANNING"],
  "confidence": 0.95,
  "emotion": {
    "type": "stressed",
    "intensity": 0.7,
    "triggers": ["工作压力", "时间紧迫"],
    "context": "用户因为多个deadline临近感到焦虑和压力，情绪偏向消极"
  },
  "entities": {
    "tasks": [
      { "title": "取快递", "priority": "medium", "quadrant": 3 },
      { "title": "开会", "priority": "high", "quadrant": 1 }
    ],
    "time": "明天下午3点",
    "location": "公司",
    "date": "2026-03-18"
  },
  "reasoning": "用户提到要完成多个任务并安排时间，同时表现出一定压力"
}

## 任务优先级与象限判断规则（每个任务都必须填写）

priority（三选一）：
- high：有明确截止时间/考试/面试/汇报/紧急字眼（"紧急""今天必须""ddl""截止""deadline"）
- low：娱乐/休闲/随时可推迟（"看电影""聊天""逛街""休息""玩"）
- medium：其余一般情况

quadrant（1-4）：
- 1（重要且紧急）：有截止时间且影响重大（考试/面试/汇报/客户/合同）
- 2（重要不紧急）：长期目标、学习、健身、项目规划、技能提升
- 3（紧急不重要）：杂事、回复消息、取快递、行政事务
- 4（不重要不紧急）：娱乐、刷视频、随手记录、无明确目的的事项`;

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

  let detectedIntents = parsed.allIntents && parsed.allIntents.length > 0
    ? parsed.allIntents
    : [parsed.primaryIntent || 'CONVERSATION'];

  // 情绪自动注入：负面情绪（tired/stressed/sad/anxious）强度 ≥ 0.5 且没有调度/撤销意图 → 自动追加 SCHEDULE_PLANNING
  // 但若用户是在陈述偏好/要求记忆，则跳过注入（避免"记住我10点起床"触发日程调整）
  const NEGATIVE_EMOTIONS = ['tired', 'stressed', 'sad', 'anxious'];
  const MEMORY_KEYWORDS = ['记住', '记一下', '我每天', '我一般', '我习惯', '我平时', '我通常', '帮我记', '我喜欢'];
  const isMemoryRequest = MEMORY_KEYWORDS.some((kw) => userInput.includes(kw));

  let emotionTriggeredSchedule = false;
  if (
    NEGATIVE_EMOTIONS.includes(emotionState.emotion) &&
    emotionState.confidence >= 0.5 &&
    !detectedIntents.includes('SCHEDULE_PLANNING') &&
    !detectedIntents.includes('UNDO_SCHEDULE') &&
    !isMemoryRequest
  ) {
    detectedIntents = [...detectedIntents, 'SCHEDULE_PLANNING'];
    emotionTriggeredSchedule = true;
    logger.info('[RouterAgent] 情绪触发自动追加 SCHEDULE_PLANNING', {
      requestId, emotion: emotionState.emotion, intensity: emotionState.confidence,
    });
  }

  logger.info('[RouterAgent] 路由分析完成', {
    requestId,
    primaryIntent: parsed.primaryIntent,
    allIntents: detectedIntents,
    emotion: emotionState.emotion,
    emotionTriggeredSchedule,
  });

  return {
    primaryIntent: parsed.primaryIntent || 'CONVERSATION',
    detectedIntents,
    emotionState,
    extractedEntities: parsed.entities || {},
    imageContext,
    emotionTriggeredSchedule,
  };
}

function routeDecision(state) {
  const intents = state.detectedIntents || [];
  const targets = [];

  // UNDO_SCHEDULE 最高优先级，独占路由
  if (intents.includes('UNDO_SCHEDULE')) {
    logger.info('[RouterAgent] 路由决策', { intents, targets: ['undoAgent'] });
    return ['undoAgent'];
  }

  if (intents.includes('TASK_CREATION')) {
    // taskAgent 先跑；若同时有 SCHEDULE_PLANNING，graph.js 的 taskThenScheduleOrEmotion 会在 taskAgent 完成后接着跑 scheduleAgent
    targets.push('taskAgent');
  } else if (intents.includes('SCHEDULE_PLANNING')) {
    // 无 TASK_CREATION 时直接路由到 scheduleAgent
    targets.push('scheduleAgent');
  }

  // 只有纯 CONVERSATION（无任务/日程智能体）时才直接路由到 emotionAgent。
  // TASK_CREATION / SCHEDULE_PLANNING 的情况下，graph.js 已硬编码
  // taskAgent → emotionAgent 和 scheduleAgent → emotionAgent 两条边，
  // 若此处再 push 'emotionAgent' 会导致 emotionAgent 在任务结果就绪前
  // 被额外调用一次（空结果 + 浪费 LLM + 污染对话历史）。
  if (targets.length === 0) {
    targets.push('emotionAgent');
  }

  logger.info('[RouterAgent] 路由决策', { intents, targets });
  return targets;
}

module.exports = { routerAgent, routeDecision };
