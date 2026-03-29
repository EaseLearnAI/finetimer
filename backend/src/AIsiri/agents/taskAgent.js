'use strict';

/**
 * 任务管理与优化智能体 (Task Agent)
 *
 * 职责：
 * 1. 基于 Router Agent 提取的实体创建任务
 * 2. 四象限优先级分类
 * 3. 时间块分配
 */

const Task = require('../../models/Task');
const logger = require('../utils/logger');

function parseTimeBlock(entities) {
  const time = (entities.time || '').replace(/今晚/g, '晚上').replace(/今早/g, '早上');
  if (/早上|早晨|清晨/.test(time)) return { timeBlockType: 'morning', startTime: '06:00', endTime: '09:00' };
  if (/上午/.test(time)) return { timeBlockType: 'forenoon', startTime: '09:00', endTime: '12:00' };
  if (/下午/.test(time)) return { timeBlockType: 'afternoon', startTime: '14:00', endTime: '18:00' };
  if (/晚上|晚间/.test(time)) return { timeBlockType: 'evening', startTime: '19:00', endTime: '22:00' };
  return null;
}

function parseSpecificTime(timeStr) {
  if (!timeStr) return null;
  const normalized = timeStr.replace(/今晚/g, '晚上').replace(/今早/g, '早上');
  const match = normalized.match(/(早上|早晨|清晨|上午|下午|晚上|傍晚)?(\d{1,2})[点时:：](\d{0,2})/);
  if (match) {
    let hour = parseInt(match[2]);
    const minute = match[3] ? parseInt(match[3]) : 0;
    const period = match[1];
    if ((period === '下午' || period === '晚上' || period === '傍晚') && hour < 12) {
      hour += 12;
    }
    if (!period && hour <= 6) {
      hour += 12;
    }
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  }
  return null;
}

function parseDate(entities) {
  const time = entities.time || '';
  const now = new Date();

  if (/今天|今日/.test(time)) return now.toISOString().split('T')[0];
  if (/明天|明日/.test(time)) {
    now.setDate(now.getDate() + 1);
    return now.toISOString().split('T')[0];
  }
  if (/后天/.test(time)) {
    now.setDate(now.getDate() + 2);
    return now.toISOString().split('T')[0];
  }

  const dateStr = entities.date;
  if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;

  return now.toISOString().split('T')[0];
}

async function taskAgent(state) {
  const { userId, userInput, extractedEntities, requestId } = state;

  logger.info('[TaskAgent] 开始创建任务', { requestId, entities: extractedEntities });

  const tasks = extractedEntities.tasks || [];
  if (tasks.length === 0) {
    const title = userInput
      .replace(/^(帮我|请|我想|我要|需要|麻烦)/, '')
      .replace(/(吧|啊|呢|哦|了)$/, '')
      .trim()
      .substring(0, 50);
    tasks.push(title || '新任务');
  }

  const createdTasks = [];

  for (const taskEntry of tasks) {
    // 兼容旧格式（字符串）和新格式（对象含 priority/quadrant）
    const taskTitle = typeof taskEntry === 'string' ? taskEntry : (taskEntry.title || '新任务');
    const taskPriority = (typeof taskEntry === 'object' && taskEntry.priority) || 'medium';
    const taskQuadrant = (typeof taskEntry === 'object' && Number.isInteger(taskEntry.quadrant)) ? taskEntry.quadrant : 2;

    try {
      const date = parseDate(extractedEntities);
      const timeBlock = parseTimeBlock(extractedEntities);
      const specificTime = parseSpecificTime(extractedEntities.time);

      const taskData = {
        title: taskTitle,
        userId,
        date,
        priority: taskPriority,
        quadrant: taskQuadrant,
        completed: false,
      };

      if (timeBlock) {
        taskData.timeBlock = timeBlock;
        taskData.isScheduled = true;
      }

      if (specificTime) {
        let correctedTime = specificTime;
        const parsedHour = parseInt(specificTime.split(':')[0]);
        if (parsedHour < 12 && timeBlock && (timeBlock.timeBlockType === 'afternoon' || timeBlock.timeBlockType === 'evening')) {
          correctedTime = `${String(parsedHour + 12).padStart(2, '0')}:${specificTime.split(':')[1]}`;
        }
        taskData.time = correctedTime;
        if (taskData.timeBlock) {
          taskData.timeBlock.startTime = correctedTime;
          const endHour = parseInt(correctedTime.split(':')[0]) + 1;
          const currentEnd = taskData.timeBlock.endTime;
          if (currentEnd && correctedTime >= currentEnd) {
            taskData.timeBlock.endTime = `${String(Math.min(endHour, 23)).padStart(2, '0')}:${correctedTime.split(':')[1]}`;
          }
        }
      }

      if (extractedEntities.location) {
        taskData.description = `地点：${extractedEntities.location}`;
      }

      // 时间冲突检测：同一用户同日期同时间是否已有任务
      const timeConflicts = [];
      if (taskData.time && taskData.date) {
        try {
          const conflicting = await Task.find({
            userId,
            date: taskData.date,
            time: taskData.time,
            completed: false,
          }).select('title time').lean();
          for (const c of conflicting) {
            timeConflicts.push({ existingTitle: c.title, time: c.time });
          }
        } catch (_) { /* 冲突检测失败不阻断创建 */ }
      }

      const task = await Task.create(taskData);
      createdTasks.push({
        id: task._id,
        title: task.title,
        date: task.date,
        time: task.time,
        timeBlock: task.timeBlock,
        priority: task.priority,
        quadrant: task.quadrant,
        conflicts: timeConflicts,
      });

      if (timeConflicts.length > 0) {
        logger.warn('[TaskAgent] 时间冲突', { taskId: task._id, title: task.title, conflicts: timeConflicts });
      } else {
        logger.info('[TaskAgent] 任务创建成功', { taskId: task._id, title: task.title });
      }
    } catch (error) {
      logger.error('[TaskAgent] 任务创建失败', { task: taskTitle, error: error.message });
    }
  }

  // 汇总所有任务的冲突列表
  const allConflicts = createdTasks.flatMap((t) => t.conflicts || []);

  return {
    agentResults: {
      taskCreation: {
        success: createdTasks.length > 0,
        tasks: createdTasks,
        task: createdTasks[0] || null,
        count: createdTasks.length,
        conflicts: allConflicts,
      },
    },
  };
}

module.exports = { taskAgent };
