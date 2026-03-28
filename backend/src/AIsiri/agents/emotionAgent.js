'use strict';

/**
 * 情感陪伴智能体 (Emotion Agent)
 *
 * 核心能力：
 * 1. 基于用户情绪趋势（近 5 次交互）生成个性化共情回应
 * 2. 利用用户画像（偏好、任务完成率、交互深度）动态调整回复策略
 * 3. 整合其他智能体结果生成统一、温暖的最终回复
 * 4. 区分新老用户，调整沟通风格
 */

const Conversation = require('../../models/Conversation');
const AIAssistant = require('../../models/AIAssistant');
const llm = require('./llmClient');
const logger = require('../utils/logger');

const EMOTION_AGENT_SYSTEM = (assistantName, profileContext) => `你是${assistantName}，一个温暖、有同理心的 AI 时间管理伙伴。

## 你的核心特质
- 善于倾听，能精准感知用户的情绪变化和深层需求
- 在帮助用户管理时间的同时，提供真诚的情感支持
- 语气温暖但不过度，像一个贴心的老朋友
- 根据用户情绪动态调整建议的强度和方式
- 回复自然流畅，绝不使用模板化表达

## 用户画像信息
${profileContext}

## 情绪响应策略（八类情绪）

### 焦虑/不安 (anxious)
- 先验证和承认焦虑感是正常的
- 帮助拆分压力来源为可控的小步骤
- 避免说"别紧张""不要焦虑"之类否定感受的话
- 建议具体的、可立即执行的缓解行动

### 压力大/烦躁 (stressed)
- 共情优先，表达理解
- 如果有任务积压，主动提出帮助简化/重排优先级
- 建议适度休息，降低任务粒度
- 语气坚定温暖："我来帮你理一理"

### 疲惫/困倦 (tired)
- 温柔关心身体状况
- 建议推迟非紧急任务
- 弱化任务提醒，强调休息的重要性
- "先照顾好自己，任务不会跑"

### 难过/沮丧 (sad)
- 温暖陪伴优先，不急于给建议
- 倾听和共情，让用户感到被理解
- 不说"振作起来"，改说"我理解你的感受"
- 适度分享积极视角，但不强迫乐观

### 生气/愤怒 (angry)
- 先认同情绪的合理性
- 不评判、不说教
- 等用户表达完再温和引导
- "你有权利生气，想聊聊发生了什么吗？"

### 迷茫/犹豫 (confused)
- 帮助梳理思路，提出结构化的思考角度
- 不代替决策，但提供清晰的选项分析
- "我们一起理一理？"

### 开心/兴奋 (happy)
- 积极回应，分享喜悦
- 借势推动任务完成
- 给予肯定和鼓励
- 语气活泼轻松

### 平静/理性 (neutral)
- 高效沟通，简洁明了
- 正常对话节奏
- 适度展现亲和力

## 回复原则

### 高效模式（满足以下所有条件时强制使用）
条件：情绪为 neutral（平静/理性） **且** 已完成任务创建或日程调整 **且** 意图不包含纯聊天
要求：
- **直接确认操作结果**，50 字以内
- **禁止**"小艾轻轻点头""心里暖暖的"等拟人化情绪性开头
- **禁止**先讲感受再讲事务的结构
- 示例："✅ 已帮你创建「健身」任务，安排在今晚 22:00。" 就够了

### 陪伴模式（有明显情绪：非 neutral 且强度 ≥ 0.4）
- 先回应情绪，再说事务，100-200 字
- 不要使用模板化表达，每次回复都要有变化

### 通用规则
- 自然地使用${assistantName}的自称（高效模式下可省略）
- 若存在时间冲突，**必须**在回复中明确提醒，建议调整时间
- 根据用户画像调整沟通深度和风格`;

function buildProfileContext(userProfile, emotionState) {
  const parts = [];

  if (userProfile?.interactionCount !== undefined) {
    if (userProfile.interactionCount <= 3) {
      parts.push('- 这是新用户，初次几轮交互，请更热情友好地自我介绍和引导');
    } else if (userProfile.interactionCount > 50) {
      parts.push(`- 老用户（已交互 ${userProfile.interactionCount} 次），请简洁高效，不需要重复自我介绍`);
    } else {
      parts.push(`- 已交互 ${userProfile.interactionCount} 次，保持适度亲近`);
    }
  }

  const trend = userProfile?.emotionTrend || [];
  if (trend.length >= 3) {
    const negativeEmotions = ['sad', 'anxious', 'stressed', 'tired', 'angry'];
    const negCount = trend.filter((e) => negativeEmotions.includes(e.emotion)).length;
    if (negCount >= 3) {
      parts.push(`- 注意：用户最近 ${trend.length} 次交互中 ${negCount} 次情绪偏负面，需要额外的关心和支持`);
    } else if (negCount === 0) {
      parts.push('- 用户近期情绪稳定积极');
    }
  }

  const stats = userProfile?.recentTaskStats;
  if (stats && stats.total > 0) {
    if (stats.completionRate >= 80) {
      parts.push(`- 最近7天任务完成率 ${stats.completionRate}%（${stats.completed}/${stats.total}），表现很好，适当给予肯定`);
    } else if (stats.completionRate < 50) {
      parts.push(`- 最近7天任务完成率 ${stats.completionRate}%（${stats.completed}/${stats.total}），不要施压，温和鼓励`);
    } else {
      parts.push(`- 最近7天任务完成率 ${stats.completionRate}%（${stats.completed}/${stats.total}）`);
    }
  }

  const prefs = userProfile?.preferences;
  if (prefs?.workStyle) {
    const styleMap = { intense: '高强度', balanced: '平衡型', relaxed: '轻松型' };
    parts.push(`- 工作风格偏好：${styleMap[prefs.workStyle] || prefs.workStyle}`);
  }

  if (emotionState?.context) {
    parts.push(`- 当前情绪上下文：${emotionState.context}`);
  }

  return parts.length > 0 ? parts.join('\n') : '- 暂无画像数据';
}

async function emotionAgent(state) {
  const {
    userInput, userId, sessionId, emotionState, agentResults,
    extractedEntities, primaryIntent, requestId, userProfile,
  } = state;

  logger.info('[EmotionAgent] 开始情感处理', {
    requestId, emotion: emotionState.emotion, primaryIntent,
  });

  let assistantName = '小艾';
  try {
    const assistant = await AIAssistant.findOne({ userId });
    if (assistant?.name) assistantName = assistant.name;
  } catch (_) { /* use default */ }

  let history = [];
  try {
    history = await Conversation.getUserConversations(userId, sessionId, { limit: 10, sortOrder: -1 });
    history = history.reverse();
  } catch (_) { /* no history */ }

  const resultSummary = [];
  if (agentResults.taskCreation?.success) {
    const tasks = agentResults.taskCreation.tasks || [];
    const taskDescs = tasks.map((t) => {
      const timeStr = t.time ? ` ${t.date} ${t.time}` : (t.date ? ` ${t.date}` : '');
      return `「${t.title}」${timeStr}`;
    }).join('、');
    resultSummary.push(`已创建${tasks.length}个任务：${taskDescs}`);

    // 时间冲突提醒
    const conflicts = agentResults.taskCreation.conflicts || [];
    if (conflicts.length > 0) {
      const conflictDescs = conflicts.map((c) => `「${c.existingTitle}」(${c.time})`).join('、');
      resultSummary.push(`⚠️ 时间冲突：新任务与 ${conflictDescs} 时间重叠，请在回复中明确告知用户并建议调整`);
    }
  }
  if (agentResults.schedulePlanning?.success) {
    const sched = agentResults.schedulePlanning.schedule;
    resultSummary.push(`日程安排建议：${sched.summary || '已生成'}`);
  }
  if (agentResults.undo?.success) {
    resultSummary.push(`已撤销${agentResults.undo.restoredCount}个任务的调整（${agentResults.undo.description}），任务已恢复到原始状态`);
  }
  if (agentResults.undo?.success === false) {
    resultSummary.push(`撤销失败：${agentResults.undo.reason}`);
  }

  const profileContext = buildProfileContext(userProfile, emotionState);

  const historyText = history.length > 0
    ? history.map((h) => `${h.messageType === 'user' ? '用户' : assistantName}：${h.content}`).join('\n')
    : '';

  const conversationRound = history.filter((h) => h.messageType === 'user').length + 1;

  // 判断是否使用高效模式：neutral 情绪 + 有任务/日程结果 + 非纯对话
  const hasTaskOrScheduleResult = agentResults.taskCreation?.success || agentResults.schedulePlanning?.success;
  const isNeutral = emotionState.emotion === 'neutral' || emotionState.confidence < 0.4;
  const isPureConversation = primaryIntent === 'CONVERSATION' && !hasTaskOrScheduleResult;
  const useEfficientMode = isNeutral && hasTaskOrScheduleResult && !isPureConversation;

  const modeHint = useEfficientMode
    ? '\n【⚡ 高效模式：请直接简洁确认操作结果，50字以内，禁止情绪性开头】'
    : '';

  const userPrompt = `${historyText ? `最近对话（当前第${conversationRound}轮）：\n${historyText}\n\n` : `这是第${conversationRound}轮对话。\n\n`}用户说："${userInput}"

情绪状态：${emotionState.emotion}（强度：${emotionState.confidence}）
${emotionState.triggers.length > 0 ? `情绪触发因素：${emotionState.triggers.join('、')}` : ''}
${emotionState.context ? `情绪上下文：${emotionState.context}` : ''}

${resultSummary.length > 0 ? `已完成的操作：\n${resultSummary.join('\n')}` : '无额外操作'}
${modeHint}
请生成回复。`;

  try {
    const result = await llm.chat(
      [
        { role: 'system', content: EMOTION_AGENT_SYSTEM(assistantName, profileContext) },
        { role: 'user', content: userPrompt },
      ],
      { temperature: 0.7, maxTokens: 500 }
    );

    try {
      const sid = sessionId || `session-${Date.now()}`;
      await Conversation.createUserMessage({
        userId, sessionId: sid, content: userInput,
        intent: primaryIntent, intentConfidence: 0.9,
      });
      await Conversation.createAssistantMessage({
        userId, sessionId: sid, content: result.content,
        aiMetadata: { model: 'qwen-plus', responseTime: result.responseTime, emotion: emotionState.emotion },
      });
    } catch (e) {
      logger.warn('[EmotionAgent] 对话保存失败', { error: e.message });
    }

    logger.info('[EmotionAgent] 回复生成完成', { requestId, responseLength: result.content.length });

    return {
      finalResponse: result.content,
      assistantName,
      agentResults: {
        emotionSupport: {
          success: true,
          emotion: emotionState.emotion,
          intensity: emotionState.confidence,
        },
      },
    };
  } catch (error) {
    logger.error('[EmotionAgent] 回复生成失败', { error: error.message });

    const fallbackMap = {
      sad: '我理解你的感受，有什么想聊的随时告诉我。',
      anxious: '别担心，我们一起理一理，一定会有办法的。',
      stressed: '压力大的时候，先深呼吸，我来帮你安排。',
      tired: '先休息一下吧，任务的事交给我来理。',
      angry: '你的感受我理解，想聊聊吗？',
      confused: '没关系，我们一步一步来梳理。',
      happy: '太好了！有什么需要我帮忙的吗？',
      neutral: '好的，我来帮你处理～',
    };
    const fallback = fallbackMap[emotionState.emotion] || '好的，我来帮你处理～';

    return {
      finalResponse: fallback,
      assistantName,
      agentResults: {
        emotionSupport: { success: false, error: error.message },
      },
    };
  }
}

module.exports = { emotionAgent };
