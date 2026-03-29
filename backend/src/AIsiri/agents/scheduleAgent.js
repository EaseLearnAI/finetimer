'use strict';

/**
 * 动态调度智能体 (Schedule Agent)
 *
 * 职责：
 * 1. 获取用户现有任务并分析时间安排
 * 2. 调用 LLM 生成优化建议
 * 3. 将建议落地为数据库操作（增删改排序）
 */

const Task = require('../../models/Task');
const Collection = require('../../models/Collection');
const UserProfile = require('../../models/UserProfile');
const llm = require('./llmClient');
const logger = require('../utils/logger');

const TIME_BLOCK_MAP = {
  morning:   { startTime: '06:00', endTime: '09:00' },
  forenoon:  { startTime: '09:00', endTime: '12:00' },
  afternoon: { startTime: '14:00', endTime: '18:00' },
  evening:   { startTime: '19:00', endTime: '22:00' },
};

const SCHEDULE_SYSTEM_PROMPT = `你是一个专业的时间管理调度助手。根据用户的现有任务和请求，生成可直接执行的日程操作指令。

## 时间块定义
- morning: 06:00-09:00（晨间）
- forenoon: 09:00-12:00（上午）
- afternoon: 14:00-18:00（下午）
- evening: 19:00-22:00（晚间）

## 四象限优先级
- Q1: 重要且紧急 → 立即处理
- Q2: 重要不紧急 → 安排固定时间
- Q3: 紧急不重要 → 委托或快速处理
- Q4: 不重要不紧急 → 减少或取消

## 可执行的操作类型
- update：修改已有任务的时间、优先级、象限（用 taskTitle 精确匹配已有任务标题）
- reschedule：将任务移到新的时间块或日期
- create：创建全新的任务（仅当用户明确要求添加新事项时才用）
- delete：删除重复或已不需要的任务（用 taskTitle 精确匹配）

## 重要规则
1. 已有任务优先用 update/reschedule，不要重复 create
2. **每次整理时必须先检查重复任务**：标题相同或语义相同（如"开会"和"会议"指同一事件）的同日期任务视为重复，只保留一个，其余用 delete
3. taskTitle 必须与现有任务标题精确匹配（delete 时用任务列表中显示的完整标题）
4. 只在用户明确要求"添加/创建/新建"时才使用 create
5. 每个 delete 指令只删除一个任务，若有 N 个重复需生成 N-1 条 delete 指令

## 输出 JSON 格式
{
  "analysis": "当前任务分析摘要",
  "recommendations": [
    {
      "action": "update|reschedule|create|delete",
      "taskTitle": "任务名（必须与已有任务精确匹配）",
      "suggestedTimeBlock": "morning|forenoon|afternoon|evening",
      "suggestedTime": "09:00",
      "suggestedPriority": "low|medium|high",
      "suggestedQuadrant": 1,
      "suggestedDate": "2026-03-18",
      "reason": "调整原因"
    }
  ],
  "summary": "给用户的日程安排总结（口语化）"
}`;

async function scheduleAgent(state) {
  const { userId, userInput, extractedEntities, emotionState, emotionTriggeredSchedule, userProfile, requestId } = state;

  logger.info('[ScheduleAgent] 开始日程规划', { requestId, userId });

  try {
    const targetDate = extractedEntities.date || new Date().toISOString().split('T')[0];

    const tasks = await Task.find({ userId, completed: false }).sort({ date: 1, time: 1 }).limit(30).lean();
    const collections = await Collection.find({ userId, archived: false }).lean();

    const todayTasks = tasks.filter((t) => t.date === targetDate);
    const otherTasks = tasks.filter((t) => t.date !== targetDate);

    const formatTask = (t, i) => {
      const parts = [`${i + 1}. 「${t.title}」`];
      if (t._id) parts.push(`ID: ${t._id}`);
      if (t.date) parts.push(`日期: ${t.date}`);
      if (t.time) parts.push(`时间: ${t.time}`);
      else if (t.timeBlock?.startTime) parts.push(`时间: ${t.timeBlock.startTime}-${t.timeBlock.endTime}`);
      if (t.timeBlock?.timeBlockType) parts.push(`时段: ${t.timeBlock.timeBlockType}`);
      if (t.priority) parts.push(`优先级: ${t.priority}`);
      if (t.quadrant) parts.push(`象限: Q${t.quadrant}`);
      return parts.join(' | ');
    };

    const todayTaskSummary = todayTasks.length > 0
      ? todayTasks.map(formatTask).join('\n')
      : '今天暂无任务';

    const otherTaskSummary = otherTasks.length > 0
      ? otherTasks.slice(0, 10).map(formatTask).join('\n')
      : '无其他未完成任务';

    const collectionSummary = collections.length > 0
      ? collections.map((c) => `- ${c.name}（${c.completed ? '已完成' : '进行中'}）`).join('\n')
      : '暂无任务集';

    // 情绪触发模式：要求"减轻负担"而不是通用调度
    const emotionNote = emotionTriggeredSchedule
      ? `\n【情绪触发调度】用户当前情绪：${emotionState.emotion}（强度 ${emotionState.confidence}）。
请自动帮用户减轻今日任务负担：
- 将今日非紧急任务（Q3/Q4 或 priority=low）推迟到明天或后天，或降低优先级
- 降低不重要任务的优先级（调整为 low）
- 不要创建任何新任务
- 只使用 reschedule 或 update 操作`
      : (emotionState.emotion !== 'neutral'
        ? `\n注意：用户当前情绪为"${emotionState.emotion}"，请适当调整任务强度。`
        : '');

    // 在情绪触发模式下，同时加入用户的自定义习惯偏好
    const customNotes = userProfile?.customNotes;
    const customNotesContext = customNotes && customNotes.trim()
      ? `\n=== 用户个人习惯（请遵守，如调整时间不要冲突）===\n${customNotes}\n`
      : '';

    const now = new Date();
    const currentHH = String(now.getHours()).padStart(2, '0');
    const currentMM = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${currentHH}:${currentMM}`;
    const currentTimeNote = `当前时间：${currentTimeStr}（今日 ${currentTimeStr} 之前的时段已过，不要在今天已过去的时间点安排任务）`;

    const userContent = emotionTriggeredSchedule
      ? `用户情绪："${emotionState.emotion}"，请自动减轻今日负担（无需理会用户原始输入的字面意思）
目标日期：${targetDate}
${currentTimeNote}

=== 今日任务（${targetDate}）===
${todayTaskSummary}

=== 其他未完成任务 ===
${otherTaskSummary}

=== 任务集 ===
${collectionSummary}
${customNotesContext}
${emotionNote}

请帮用户推迟或降级今日非紧急任务，不要创建新任务。`
      : `用户请求："${userInput}"
目标日期：${targetDate}
${currentTimeNote}

=== 今日任务（${targetDate}）===
${todayTaskSummary}

=== 其他未完成任务 ===
${otherTaskSummary}

=== 任务集 ===
${collectionSummary}
${emotionNote}

请根据以上信息生成可执行的日程调度指令。`;

    const result = await llm.chatJSON(
      [
        { role: 'system', content: SCHEDULE_SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ],
      { temperature: 0.3, maxTokens: 1500, timeout: 45000 }
    );

    const schedule = result.parsed || { analysis: '日程分析完成', recommendations: [], summary: result.content };

    // 收集 taskAgent 刚创建的任务 ID，防止被误删
    const newlyCreatedTasks = state.agentResults?.taskCreation?.tasks || [];
    const protectedIds = new Set(newlyCreatedTasks.map((t) => String(t.taskId || t.id || t._id)).filter(Boolean));
    if (protectedIds.size > 0) {
      logger.info('[ScheduleAgent] 受保护的新创建任务ID', { requestId, protectedIds: [...protectedIds] });
    }

    const dedupeResults = await autoDeduplicateTasks(tasks, userId, requestId, protectedIds);

    // 保存快照（仅在有实际推荐操作时，供撤销回退使用）
    const recommendations = schedule.recommendations || [];
    if (recommendations.length > 0) {
      try {
        const titlesToModify = new Set(
          recommendations
            .filter((r) => r.action === 'update' || r.action === 'reschedule')
            .map((r) => r.taskTitle)
        );
        const tasksToSnapshot = tasks.filter(
          (t) => titlesToModify.has(t.title) || Array.from(titlesToModify).some((title) => t.title.includes(title) || title.includes(t.title))
        );
        if (tasksToSnapshot.length > 0) {
          const snapshot = tasksToSnapshot.map((t) => ({
            taskId: String(t._id),
            title: t.title,
            date: t.date,
            time: t.time,
            timeBlock: t.timeBlock,
            priority: t.priority,
            quadrant: t.quadrant,
          }));
          await UserProfile.findOneAndUpdate(
            { userId },
            {
              $set: {
                lastScheduleSnapshot: {
                  tasks: snapshot,
                  savedAt: new Date(),
                  description: emotionTriggeredSchedule
                    ? `情绪调度：${emotionState.emotion}`
                    : '用户主动调度',
                },
              },
            },
            { upsert: true }
          );
          logger.info('[ScheduleAgent] 快照已保存', { requestId, count: snapshot.length });
        }
      } catch (snapErr) {
        logger.warn('[ScheduleAgent] 快照保存失败', { error: snapErr.message });
      }
    }

    const executionResults = await executeRecommendations(
      recommendations,
      userId,
      targetDate,
      tasks,
      requestId,
      protectedIds
    );

    executionResults.deleted.push(...dedupeResults.deleted);
    if (dedupeResults.deleted.length) {
      const parts = [];
      if (executionResults.updated.length) parts.push(`更新${executionResults.updated.length}个`);
      if (executionResults.created.length) parts.push(`创建${executionResults.created.length}个`);
      const totalDeleted = executionResults.deleted.length;
      if (totalDeleted) parts.push(`删除${totalDeleted}个`);
      if (executionResults.failed.length) parts.push(`失败${executionResults.failed.length}个`);
      executionResults.summary = parts.join('，') || '无操作';
    }

    logger.info('[ScheduleAgent] 日程规划完成', {
      requestId,
      recommendationCount: schedule.recommendations?.length || 0,
      executed: executionResults.summary,
    });

    return {
      agentResults: {
        schedulePlanning: {
          success: true,
          schedule,
          existingTaskCount: tasks.length,
          todayTaskCount: todayTasks.length,
          targetDate,
          executed: executionResults,
        },
      },
    };
  } catch (error) {
    logger.error('[ScheduleAgent] 日程规划失败', { error: error.message });
    return {
      agentResults: {
        schedulePlanning: {
          success: false,
          error: error.message,
        },
      },
    };
  }
}

async function executeRecommendations(recommendations, userId, targetDate, existingTasks, requestId, protectedIds = new Set()) {
  const results = { updated: [], created: [], deleted: [], failed: [], summary: '' };

  for (const rec of recommendations) {
    try {
      switch (rec.action) {
        case 'update':
        case 'reschedule': {
          const task = findTaskByTitle(existingTasks, rec.taskTitle);
          if (!task) {
            results.failed.push({ title: rec.taskTitle, reason: '未找到匹配任务' });
            break;
          }

          const update = {};
          if (rec.suggestedTime) {
            update.time = rec.suggestedTime;
            update.isScheduled = true;
          }
          if (rec.suggestedTimeBlock && TIME_BLOCK_MAP[rec.suggestedTimeBlock]) {
            const block = TIME_BLOCK_MAP[rec.suggestedTimeBlock];
            update.timeBlock = {
              timeBlockType: rec.suggestedTimeBlock,
              startTime: rec.suggestedTime || block.startTime,
              endTime: block.endTime,
            };
            if (update.timeBlock.startTime >= update.timeBlock.endTime) {
              const h = parseInt(update.timeBlock.startTime.split(':')[0]) + 1;
              update.timeBlock.endTime = `${String(Math.min(h, 23)).padStart(2, '0')}:${update.timeBlock.startTime.split(':')[1]}`;
            }
          }
          if (rec.suggestedPriority) update.priority = rec.suggestedPriority;
          if (rec.suggestedQuadrant) update.quadrant = rec.suggestedQuadrant;
          if (rec.suggestedDate) update.date = rec.suggestedDate;

          if (Object.keys(update).length > 0) {
            await Task.findByIdAndUpdate(task._id, { $set: update });
            results.updated.push({ id: task._id, title: task.title, changes: update });
            const idx = existingTasks.findIndex((t) => String(t._id) === String(task._id));
            if (idx >= 0) existingTasks.splice(idx, 1);
            logger.info('[ScheduleAgent] 任务已更新', { requestId, taskId: task._id, title: task.title, changes: update });
          }
          break;
        }

        case 'create': {
          const newTask = {
            title: rec.taskTitle,
            userId,
            date: rec.suggestedDate || targetDate,
            priority: rec.suggestedPriority || 'medium',
            quadrant: rec.suggestedQuadrant || 2,
            completed: false,
          };
          if (rec.suggestedTime) {
            newTask.time = rec.suggestedTime;
            newTask.isScheduled = true;
          }
          if (rec.suggestedTimeBlock && TIME_BLOCK_MAP[rec.suggestedTimeBlock]) {
            const block = TIME_BLOCK_MAP[rec.suggestedTimeBlock];
            newTask.timeBlock = {
              timeBlockType: rec.suggestedTimeBlock,
              startTime: rec.suggestedTime || block.startTime,
              endTime: block.endTime,
            };
          }
          const created = await Task.create(newTask);
          results.created.push({ id: created._id, title: created.title });
          logger.info('[ScheduleAgent] 任务已创建', { requestId, taskId: created._id, title: created.title });
          break;
        }

        case 'delete': {
          const task = findTaskByTitle(existingTasks, rec.taskTitle);
          if (!task) {
            results.failed.push({ title: rec.taskTitle, reason: '未找到匹配任务' });
            break;
          }
          if (protectedIds.has(String(task._id))) {
            logger.info('[ScheduleAgent] 跳过删除受保护的新任务', { requestId, taskId: task._id, title: task.title });
            break;
          }
          await Task.findByIdAndDelete(task._id);
          results.deleted.push({ id: task._id, title: task.title });
          const idx = existingTasks.findIndex((t) => String(t._id) === String(task._id));
          if (idx >= 0) existingTasks.splice(idx, 1);
          logger.info('[ScheduleAgent] 任务已删除', { requestId, taskId: task._id, title: task.title });
          break;
        }

        default:
          results.failed.push({ title: rec.taskTitle, reason: `未知操作: ${rec.action}` });
      }
    } catch (err) {
      results.failed.push({ title: rec.taskTitle, reason: err.message });
      logger.warn('[ScheduleAgent] 操作执行失败', { action: rec.action, title: rec.taskTitle, error: err.message });
    }
  }

  const parts = [];
  if (results.updated.length) parts.push(`更新${results.updated.length}个`);
  if (results.created.length) parts.push(`创建${results.created.length}个`);
  if (results.deleted.length) parts.push(`删除${results.deleted.length}个`);
  if (results.failed.length) parts.push(`失败${results.failed.length}个`);
  results.summary = parts.join('，') || '无操作';

  return results;
}

function findTaskByTitle(tasks, title) {
  if (!title) return null;
  const exact = tasks.find((t) => t.title === title);
  if (exact) return exact;
  const partial = tasks.find((t) => t.title.includes(title) || title.includes(t.title));
  return partial || null;
}

async function autoDeduplicateTasks(existingTasks, userId, requestId, protectedIds = new Set()) {
  const deleted = [];
  const groups = {};

  for (const task of existingTasks) {
    const key = `${task.title}|${task.date || ''}|${task.time || ''}`;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(task);
  }

  for (const [, group] of Object.entries(groups)) {
    if (group.length <= 1) continue;
    // 受保护的任务（刚由 taskAgent 创建）永远保留，删除其他重复项
    const toRemove = group.slice(1).filter((t) => !protectedIds.has(String(t._id)));
    for (const dup of toRemove) {
      try {
        await Task.findByIdAndDelete(dup._id);
        deleted.push({ id: dup._id, title: dup.title });
        const idx = existingTasks.findIndex((t) => String(t._id) === String(dup._id));
        if (idx >= 0) existingTasks.splice(idx, 1);
        logger.info('[ScheduleAgent] 自动去重删除', { requestId, taskId: dup._id, title: dup.title });
      } catch (err) {
        logger.warn('[ScheduleAgent] 自动去重失败', { taskId: dup._id, error: err.message });
      }
    }
  }

  return { deleted };
}

module.exports = { scheduleAgent };
