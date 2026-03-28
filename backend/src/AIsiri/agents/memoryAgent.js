'use strict';

/**
 * 用户记忆智能体 (Memory Agent)
 *
 * 职责：
 * 1. 加载用户画像（长期记忆）
 * 2. 更新用户偏好与行为模式
 * 3. 对话历史上下文管理
 */

const UserProfile = require('../../models/UserProfile');
const Task = require('../../models/Task');
const logger = require('../utils/logger');

async function loadUserMemory(state) {
  const { userId, requestId } = state;

  logger.info('[MemoryAgent] 加载用户记忆', { requestId, userId });

  try {
    let profile = await UserProfile.findOne({ userId });

    if (!profile) {
      profile = await UserProfile.create({
        userId,
        preferences: {
          workStyle: 'balanced',
          preferredTimeBlocks: ['forenoon', 'afternoon'],
          notificationLevel: 'normal',
        },
        emotionHistory: [],
        interactionCount: 0,
      });
      logger.info('[MemoryAgent] 创建新用户画像', { userId });
    }

    let recentTaskStats = { total: 0, completed: 0, completionRate: 0 };
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentTasks = await Task.find({
        userId,
        createdAt: { $gte: sevenDaysAgo },
      }).select('completed');
      const total = recentTasks.length;
      const completed = recentTasks.filter((t) => t.completed).length;
      recentTaskStats = {
        total,
        completed,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      };
    } catch (_) { /* task stats optional */ }

    return {
      userProfile: {
        preferences: profile.preferences,
        customNotes: profile.preferences?.customNotes || '',
        emotionTrend: profile.emotionHistory?.slice(-5) || [],
        interactionCount: profile.interactionCount,
        lastActiveAt: profile.lastActiveAt,
        recentTaskStats,
      },
      agentResults: {
        taskCreation: null,
        schedulePlanning: null,
        emotionSupport: null,
      },
    };
  } catch (error) {
    logger.warn('[MemoryAgent] 加载记忆失败', { error: error.message });
    return {
      userProfile: { preferences: {}, emotionTrend: [], interactionCount: 0, recentTaskStats: { total: 0, completed: 0, completionRate: 0 } },
      agentResults: {
        taskCreation: null,
        schedulePlanning: null,
        emotionSupport: null,
      },
    };
  }
}

// 从用户输入中提取并追加个人偏好到 customNotes
function extractCustomPreferences(userInput, existingNotes) {
  const MEMORY_KEYWORDS = ['记住', '记一下', '我每天', '我一般', '我习惯', '我平时', '我通常', '帮我记', '我喜欢'];
  const isMemoryStatement = MEMORY_KEYWORDS.some((kw) => userInput.includes(kw));
  if (!isMemoryStatement || userInput.length > 200) return null; // 太长的输入跳过（防止误存普通对话）

  // 清理已有的重复条目（简单去重：如果已有相似内容就覆盖）
  const timestamp = new Date().toLocaleDateString('zh-CN');
  const newEntry = `[${timestamp}] ${userInput.replace(/\n/g, ' ').trim()}`;

  // 保持最近 5 条偏好记录，超出则丢弃最早的
  const existing = existingNotes ? existingNotes.split('\n').filter(Boolean) : [];
  const updated = [...existing, newEntry].slice(-5);
  return updated.join('\n');
}

async function saveUserMemory(state) {
  const { userId, emotionState, userInput, requestId } = state;

  logger.info('[MemoryAgent] 保存用户记忆', { requestId, userId });

  try {
    const profile = await UserProfile.findOne({ userId });
    const recentEmotions = profile?.emotionHistory?.slice(-5) || [];
    const negativeEmotions = ['sad', 'anxious', 'stressed', 'tired', 'angry'];
    const negativeCount = recentEmotions.filter((e) => negativeEmotions.includes(e.emotion)).length;

    const updateOps = {
      $inc: { interactionCount: 1 },
      $set: { lastActiveAt: new Date() },
      $push: {
        emotionHistory: {
          $each: [{ emotion: emotionState.emotion, confidence: emotionState.confidence, timestamp: new Date() }],
          $slice: -50,
        },
      },
    };

    if (negativeCount >= 4) {
      updateOps.$set['preferences.notificationLevel'] = 'low';
      updateOps.$set['preferences.taskGranularity'] = 'coarse';
    } else if (negativeCount <= 1) {
      updateOps.$set['preferences.notificationLevel'] = 'normal';
      updateOps.$set['preferences.taskGranularity'] = 'medium';
    }

    // 检测并保存用户偏好陈述（如起床时间、健身时间等）
    if (userInput) {
      const updatedNotes = extractCustomPreferences(userInput, profile?.preferences?.customNotes || '');
      if (updatedNotes !== null) {
        updateOps.$set['preferences.customNotes'] = updatedNotes;
        logger.info('[MemoryAgent] 保存用户个人偏好', { requestId, userId, notesLength: updatedNotes.length });
      }
    }

    await UserProfile.findOneAndUpdate({ userId }, updateOps, { upsert: true });
  } catch (error) {
    logger.warn('[MemoryAgent] 保存记忆失败', { error: error.message });
  }

  return {};
}

module.exports = { loadUserMemory, saveUserMemory };
