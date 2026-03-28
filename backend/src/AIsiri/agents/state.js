'use strict';

/**
 * 多智能体协同状态定义
 * 基于 LangGraph Annotation 定义智能体间的共享通信协议
 */

const { Annotation } = require('@langchain/langgraph');

const AgentState = Annotation.Root({
  userInput: Annotation({
    reducer: (_, v) => v,
    default: () => '',
  }),
  userId: Annotation({
    reducer: (_, v) => v,
    default: () => '',
  }),
  sessionId: Annotation({
    reducer: (_, v) => v,
    default: () => '',
  }),

  // 中央路由智能体输出
  primaryIntent: Annotation({
    reducer: (_, v) => v,
    default: () => null,
  }),
  detectedIntents: Annotation({
    reducer: (_, v) => v,
    default: () => [],
  }),
  emotionState: Annotation({
    reducer: (_, v) => v,
    default: () => ({ emotion: 'neutral', confidence: 0, triggers: [] }),
  }),
  extractedEntities: Annotation({
    reducer: (_, v) => v,
    default: () => ({}),
  }),

  // 图片分析结果
  imageContext: Annotation({
    reducer: (_, v) => v,
    default: () => '',
  }),

  // 情绪触发的自动日程调整标志（tired/stressed/sad/anxious 强度 ≥ 0.5 时由 routerAgent 设置）
  emotionTriggeredSchedule: Annotation({
    reducer: (_, v) => v,
    default: () => false,
  }),

  // 各智能体执行结果（累加）
  agentResults: Annotation({
    reducer: (prev, next) => ({ ...prev, ...next }),
    default: () => ({}),
  }),

  // 用户记忆
  userProfile: Annotation({
    reducer: (prev, next) => ({ ...prev, ...next }),
    default: () => ({}),
  }),
  conversationHistory: Annotation({
    reducer: (_, v) => v,
    default: () => [],
  }),

  // 最终输出
  finalResponse: Annotation({
    reducer: (_, v) => v,
    default: () => '',
  }),
  assistantName: Annotation({
    reducer: (_, v) => v,
    default: () => '小艾',
  }),

  // 元数据
  requestId: Annotation({
    reducer: (_, v) => v,
    default: () => '',
  }),
  startTime: Annotation({
    reducer: (_, v) => v,
    default: () => Date.now(),
  }),
});

module.exports = { AgentState };
