/**
 * 智能调度服务（基于 LangGraph 多智能体协同架构）
 *
 * 架构：
 *   用户输入 → LangGraph StateGraph → 多智能体协同处理 → 统一回复
 *
 * 智能体：
 *   1. 中央路由与协调智能体 (Router Agent)
 *   2. 任务管理与优化智能体 (Task Agent)
 *   3. 动态调度智能体 (Schedule Agent)
 *   4. 情感陪伴智能体 (Emotion Agent)
 *   5. 用户记忆智能体 (Memory Agent)
 */

'use strict';

const { getCompiledGraph } = require('../agents/graph');
const logger = require('../utils/logger');

class IntelligentDispatchService {
  constructor() {
    this.graph = null;
    logger.info('智能调度服务初始化完成（LangGraph 多智能体架构）', {
      services: ['router', 'task', 'schedule', 'emotion', 'memory'],
    });
  }

  _getGraph() {
    if (!this.graph) {
      this.graph = getCompiledGraph();
    }
    return this.graph;
  }

  /**
   * 处理用户输入的智能调度
   * @param {string} userInput 用户输入
   * @param {string} userId 用户ID
   * @param {string} sessionId 会话ID
   * @param {Object} deviceInfo 设备信息
   * @returns {Promise<Object>} 调度结果
   */
  async processUserInput(userInput, userId, sessionId = null, deviceInfo = {}) {
    const startTime = Date.now();
    const requestId = `dispatch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    logger.info('开始多智能体协同调度', {
      requestId,
      userInput: userInput.substring(0, 100),
      userId,
      sessionId,
    });

    try {
      const graph = this._getGraph();

      const result = await graph.invoke({
        userInput,
        userId,
        sessionId: sessionId || `session-${Date.now()}`,
        requestId,
        startTime,
      });

      const processingTime = Date.now() - startTime;

      logger.info('多智能体协同调度完成', {
        requestId,
        userId,
        processingTime: processingTime + 'ms',
        intents: result.detectedIntents,
        emotion: result.emotionState?.emotion,
        agentResults: Object.keys(result.agentResults || {}),
      });

      return this._buildResponse(result, processingTime, requestId, result.detectedIntents);
    } catch (error) {
      const processingTime = Date.now() - startTime;
      logger.error('多智能体协同调度失败', {
        requestId,
        error: error.message,
        stack: error.stack,
        userId,
        processingTime: processingTime + 'ms',
      });
      throw error;
    }
  }

  _buildResponse(graphResult, processingTime, requestId, intents = []) {
    const agentResults = graphResult.agentResults || {};

    const executedServices = Object.keys(agentResults).filter(
      (k) => agentResults[k] && agentResults[k].success
    );

    const hasTaskIntent = intents.includes('TASK_CREATION');
    const hasScheduleIntent = intents.includes('SCHEDULE_PLANNING');

    return {
      response: graphResult.finalResponse || '我来帮你处理～',
      intents,
      servicesExecuted: executedServices,
      taskCreated: hasTaskIntent && agentResults.taskCreation?.success
        ? agentResults.taskCreation.task
        : null,
      scheduleAdjusted: hasScheduleIntent && agentResults.schedulePlanning?.success
        ? {
            ...agentResults.schedulePlanning.schedule,
            executed: agentResults.schedulePlanning.executed || null,
          }
        : null,
      emotionalSupport: agentResults.emotionSupport?.success
        ? `情绪支持（${agentResults.emotionSupport.emotion}）`
        : null,
      processingTime,
      requestId,
      architecture: 'langgraph-multi-agent',
    };
  }

  async healthCheck() {
    try {
      const graph = this._getGraph();
      return {
        status: 'healthy',
        architecture: 'langgraph-multi-agent',
        agents: ['router', 'task', 'schedule', 'emotion', 'memory'],
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

module.exports = IntelligentDispatchService;
