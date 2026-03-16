/**
 * 任务调度规划 Prompt 模板
 * 用于智能分析和调整用户的任务时间安排
 */

// 支持的时间块类型
const TIME_BLOCK_TYPES = {
  MORNING: 'morning',     // 早上 06:00-09:00
  FORENOON: 'forenoon',   // 上午 09:00-12:00
  AFTERNOON: 'afternoon', // 下午 12:00-18:00
  EVENING: 'evening',     // 晚上 18:00-22:00
  UNSCHEDULED: 'unscheduled' // 未安排
};

// 任务优先级类型
const PRIORITY_TYPES = {
  HIGH: 'high',     // 高优先级
  MEDIUM: 'medium', // 中优先级
  LOW: 'low'        // 低优先级
};

// 四象限分类
const QUADRANT_TYPES = {
  URGENT_IMPORTANT: 1,    // 重要且紧急
  IMPORTANT_NOT_URGENT: 2, // 重要不紧急
  URGENT_NOT_IMPORTANT: 3, // 紧急不重要
  NOT_URGENT_NOT_IMPORTANT: 4 // 不重要不紧急
};

/**
 * 构建任务调度规划的 Prompt
 * @param {Object} params - 调度参数
 * @param {string} params.userInput - 用户输入的调度请求
 * @param {string} params.currentTime - 当前时间
 * @param {string} params.targetDate - 目标日期 (YYYY-MM-DD)
 * @param {Array} params.existingTasks - 现有任务列表
 * @param {Object} params.userContext - 用户上下文（情绪状态等）
 * @param {Array} params.collections - 任务集信息
 * @returns {Object} 包含messages数组的对象
 */
function buildSchedulePlanningPrompt({
  userInput,
  currentTime,
  targetDate,
  existingTasks = [],
  userContext = {},
  collections = []
}) {
  
  // 分析现有任务的时间分布
  const timeAnalysis = analyzeExistingSchedule(existingTasks, targetDate);
  
  // 构建用户上下文描述
  const contextDescription = buildUserContextDescription(userContext);
  
  const systemPrompt = `你是一个专业的任务调度规划助手，负责帮助用户智能安排和调整任务时间。

你的任务：
1. 分析用户的调度请求和当前任务安排
2. 根据任务优先级（四象限原则）和用户状态进行智能调度
3. 优化时间分配，确保重要紧急任务得到优先处理
4. 考虑用户的情绪状态和身体状况，合理安排休息时间
5. 输出具体的调度建议和操作步骤

四象限优先级原则：
- 象限1（重要且紧急）：最高优先级，必须立即处理
- 象限2（重要不紧急）：高优先级，需要计划性安排
- 象限3（紧急不重要）：中优先级，可以委托或简化处理
- 象限4（不重要不紧急）：低优先级，可以延后或取消

时间块定义：
- 早上(morning)：06:00-09:00，适合精力充沛的重要任务
- 上午(forenoon)：09:00-12:00，适合创造性和复杂任务
- 下午(afternoon)：12:00-18:00，适合会议、外出和执行类任务
- 晚上(evening)：18:00-22:00，适合回顾、学习和轻松任务

当前时间：${currentTime}
目标日期：${targetDate}

用户状态分析：
${contextDescription}

现有任务时间分析：
${JSON.stringify(timeAnalysis, null, 2)}

现有任务列表：
${formatTasksForPrompt(existingTasks)}

任务集信息：
${formatCollectionsForPrompt(collections)}

请按照以下JSON格式输出调度建议：
{
  "analysis": {
    "timeConflicts": ["冲突描述"],
    "priorityInsights": "优先级分析",
    "workloadAssessment": "工作量评估",
    "userStateConsiderations": "用户状态考虑"
  },
  "recommendations": {
    "taskAdjustments": [
      {
        "taskId": "任务ID",
        "action": "create|update|delete|reschedule",
        "changes": {
          "title": "任务标题",
          "date": "YYYY-MM-DD",
          "time": "HH:MM",
          "timeBlock": {
            "startTime": "HH:MM",
            "endTime": "HH:MM",
            "timeBlockType": "morning|forenoon|afternoon|evening"
          },
          "estimatedTime": 30,
          "priority": "high|medium|low",
          "quadrant": 1,
          "reason": "调整原因"
        }
      }
    ],
    "breakSuggestions": [
      {
        "startTime": "HH:MM",
        "endTime": "HH:MM",
        "type": "short|long|meal",
        "activity": "建议的休息活动"
      }
    ],
    "optimizationTips": ["优化建议1", "优化建议2"]
  },
  "schedule": {
    "morning": ["任务ID列表"],
    "forenoon": ["任务ID列表"],
    "afternoon": ["任务ID列表"],
    "evening": ["任务ID列表"]
  },
  "summary": "调度总结说明"
}`;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `请根据我的请求进行任务调度规划：${userInput}` }
  ];

  return { messages };
}

/**
 * 分析现有任务的时间分布
 */
function analyzeExistingSchedule(existingTasks, targetDate) {
  const todayTasks = existingTasks.filter(task => task.date === targetDate);
  
  const analysis = {
    totalTasks: todayTasks.length,
    completedTasks: todayTasks.filter(task => task.completed).length,
    timeBlocks: {
      morning: [],
      forenoon: [],
      afternoon: [],
      evening: [],
      unscheduled: []
    },
    quadrantDistribution: { 1: 0, 2: 0, 3: 0, 4: 0 },
    estimatedTotalTime: 0,
    availableSlots: []
  };

  todayTasks.forEach(task => {
    const timeBlockType = task.timeBlock?.timeBlockType || 'unscheduled';
    analysis.timeBlocks[timeBlockType].push({
      id: task._id,
      title: task.title,
      startTime: task.timeBlock?.startTime,
      endTime: task.timeBlock?.endTime,
      estimatedTime: task.estimatedTime || 30,
      priority: task.priority,
      quadrant: task.quadrant
    });
    
    if (task.quadrant) {
      analysis.quadrantDistribution[task.quadrant]++;
    }
    
    analysis.estimatedTotalTime += task.estimatedTime || 30;
  });

  return analysis;
}

/**
 * 构建用户上下文描述
 */
function buildUserContextDescription(userContext) {
  if (!userContext || Object.keys(userContext).length === 0) {
    return '用户状态：正常';
  }

  let description = '用户状态：';
  const parts = [];

  if (userContext.emotionalState) {
    parts.push(`情绪状态 - ${userContext.emotionalState}`);
  }
  
  if (userContext.energyLevel) {
    parts.push(`精力水平 - ${userContext.energyLevel}`);
  }
  
  if (userContext.workload) {
    parts.push(`工作负荷 - ${userContext.workload}`);
  }
  
  if (userContext.preferences) {
    parts.push(`偏好 - ${userContext.preferences}`);
  }

  return parts.length > 0 ? description + parts.join('；') : description + '正常';
}

/**
 * 格式化任务列表为Prompt格式
 */
function formatTasksForPrompt(tasks) {
  if (!tasks || tasks.length === 0) {
    return '无现有任务';
  }

  return tasks.map((task, index) => {
    const timeInfo = task.timeBlock?.startTime 
      ? `${task.timeBlock.startTime}-${task.timeBlock.endTime}` 
      : '未安排时间';
    
    const quadrantDesc = {
      1: '重要且紧急',
      2: '重要不紧急', 
      3: '紧急不重要',
      4: '不重要不紧急'
    }[task.quadrant] || '未分类';

    return `${index + 1}. [${task._id}] ${task.title}
   时间：${timeInfo} (${task.timeBlock?.timeBlockType || 'unscheduled'})
   预计用时：${task.estimatedTime || 30}分钟
   优先级：${task.priority} | 象限：${quadrantDesc}
   状态：${task.completed ? '已完成' : '待完成'}
   日期：${task.date || '未设定'}`;
  }).join('\n\n');
}

/**
 * 格式化任务集为Prompt格式
 */
function formatCollectionsForPrompt(collections) {
  if (!collections || collections.length === 0) {
    return '无任务集信息';
  }

  return collections.map(collection => 
    `- ${collection.name}: ${collection.description || '无描述'} (${collection.totalSubtasks || 0}个任务)`
  ).join('\n');
}

/**
 * 解析调度建议响应
 * @param {string} response - LLM的响应
 * @returns {Object} 解析后的调度建议
 */
function parseScheduleResponse(response) {
  try {
    // 尝试直接解析JSON
    const parsed = JSON.parse(response);
    return {
      success: true,
      data: parsed
    };
  } catch (error) {
    // 如果直接解析失败，尝试提取JSON部分
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          success: true,
          data: parsed
        };
      } catch (secondError) {
        return {
          success: false,
          error: '无法解析调度建议',
          rawResponse: response
        };
      }
    }
    
    return {
      success: false,
      error: '响应格式不正确',
      rawResponse: response
    };
  }
}

/**
 * 获取时间块的默认时间范围
 */
function getTimeBlockRange(timeBlockType) {
  const ranges = {
    morning: { start: '06:00', end: '09:00' },
    forenoon: { start: '09:00', end: '12:00' },
    afternoon: { start: '12:00', end: '18:00' },
    evening: { start: '18:00', end: '22:00' }
  };
  
  return ranges[timeBlockType] || { start: '09:00', end: '17:00' };
}

/**
 * 验证任务调度的合理性
 */
function validateScheduleAdjustments(adjustments) {
  const errors = [];
  
  adjustments.forEach((adj, index) => {
    if (!adj.taskId && adj.action !== 'create') {
      errors.push(`调整 ${index + 1}: 缺少任务ID`);
    }
    
    if (!['create', 'update', 'delete', 'reschedule'].includes(adj.action)) {
      errors.push(`调整 ${index + 1}: 无效的操作类型`);
    }
    
    if (adj.changes?.timeBlock) {
      const { startTime, endTime } = adj.changes.timeBlock;
      if (startTime && endTime && startTime >= endTime) {
        errors.push(`调整 ${index + 1}: 开始时间不能晚于结束时间`);
      }
    }
  });
  
  return errors;
}

module.exports = {
  buildSchedulePlanningPrompt,
  parseScheduleResponse,
  getTimeBlockRange,
  validateScheduleAdjustments,
  TIME_BLOCK_TYPES,
  PRIORITY_TYPES,
  QUADRANT_TYPES
};

