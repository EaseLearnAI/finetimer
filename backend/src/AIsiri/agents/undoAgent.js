'use strict';

/**
 * 撤销智能体 (Undo Agent)
 *
 * 职责：
 * 当用户说"回退/撤销/恢复原来"时，读取 UserProfile.lastScheduleSnapshot，
 * 将任务恢复到调度前的状态，然后清除快照。
 */

const Task = require('../../models/Task');
const UserProfile = require('../../models/UserProfile');
const logger = require('../utils/logger');

async function undoAgent(state) {
  const { userId, requestId } = state;

  logger.info('[UndoAgent] 开始执行撤销', { requestId, userId });

  try {
    const profile = await UserProfile.findOne({ userId });
    const snapshot = profile?.lastScheduleSnapshot;

    if (!snapshot || !snapshot.tasks || snapshot.tasks.length === 0) {
      logger.info('[UndoAgent] 无可回退快照', { requestId });
      return {
        agentResults: {
          undo: {
            success: false,
            reason: '没有可回退的操作记录',
          },
        },
      };
    }

    let restoredCount = 0;
    const restoredTitles = [];

    for (const snap of snapshot.tasks) {
      try {
        await Task.findByIdAndUpdate(snap.taskId, {
          $set: {
            date: snap.date,
            time: snap.time,
            timeBlock: snap.timeBlock,
            priority: snap.priority,
            quadrant: snap.quadrant,
          },
        });
        restoredCount++;
        restoredTitles.push(snap.title);
        logger.info('[UndoAgent] 任务已恢复', { requestId, taskId: snap.taskId, title: snap.title });
      } catch (taskErr) {
        logger.warn('[UndoAgent] 单个任务恢复失败', { taskId: snap.taskId, error: taskErr.message });
      }
    }

    // 清除快照（只回退一次）
    await UserProfile.findOneAndUpdate(
      { userId },
      { $unset: { lastScheduleSnapshot: '' } }
    );

    logger.info('[UndoAgent] 撤销完成', { requestId, restoredCount });

    return {
      agentResults: {
        undo: {
          success: true,
          restoredCount,
          restoredTitles,
          description: snapshot.description || '上次日程调整',
        },
      },
    };
  } catch (error) {
    logger.error('[UndoAgent] 撤销失败', { error: error.message });
    return {
      agentResults: {
        undo: {
          success: false,
          reason: `撤销操作出错：${error.message}`,
        },
      },
    };
  }
}

module.exports = { undoAgent };
