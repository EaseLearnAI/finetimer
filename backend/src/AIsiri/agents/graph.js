'use strict';

/**
 * 多智能体协同调度图 (LangGraph StateGraph)
 *
 * 架构：
 *   START → loadMemory → router → [taskAgent | scheduleAgent] → emotionAgent → saveMemory → END
 *
 * 核心能力：
 * - Supervisor 模式：router 节点做条件分发
 * - 并行执行：同优先级智能体并行运行
 * - 状态持久化：MemorySaver 支持 checkpoint
 */

const { StateGraph, START, END } = require('@langchain/langgraph');
const { AgentState } = require('./state');
const { routerAgent, routeDecision } = require('./routerAgent');
const { taskAgent } = require('./taskAgent');
const { scheduleAgent } = require('./scheduleAgent');
const { undoAgent } = require('./undoAgent');
const { emotionAgent } = require('./emotionAgent');
const { loadUserMemory, saveUserMemory } = require('./memoryAgent');
const logger = require('../utils/logger');

function buildAgentGraph() {
  const graph = new StateGraph(AgentState);

  // 注册所有智能体节点
  graph.addNode('loadMemory', loadUserMemory);
  graph.addNode('router', routerAgent);
  graph.addNode('taskAgent', taskAgent);
  graph.addNode('scheduleAgent', scheduleAgent);
  graph.addNode('undoAgent', undoAgent);
  graph.addNode('emotionAgent', emotionAgent);
  graph.addNode('saveMemory', saveUserMemory);

  // START → 加载用户记忆
  graph.addEdge(START, 'loadMemory');

  // 加载记忆 → 中央路由
  graph.addEdge('loadMemory', 'router');

  // 中央路由 → 条件分发
  // 注意：taskAgent 必须先于 scheduleAgent 完成，避免 scheduleAgent 读不到刚创建的任务
  graph.addConditionalEdges('router', routeDecision, {
    taskAgent: 'taskAgent',
    scheduleAgent: 'scheduleAgent',
    undoAgent: 'undoAgent',
    emotionAgent: 'emotionAgent',
  });

  // taskAgent 完成后 → 如果同时有 SCHEDULE_PLANNING，再跑 scheduleAgent，否则直接到 emotionAgent
  graph.addConditionalEdges('taskAgent', taskThenScheduleOrEmotion, {
    scheduleAgent: 'scheduleAgent',
    emotionAgent: 'emotionAgent',
  });

  // scheduleAgent / undoAgent → 情感陪伴（聚合）
  graph.addEdge('scheduleAgent', 'emotionAgent');
  graph.addEdge('undoAgent', 'emotionAgent');

  // 情感陪伴 → 保存记忆 → 结束
  graph.addEdge('emotionAgent', 'saveMemory');
  graph.addEdge('saveMemory', END);

  return graph.compile();
}

/**
 * taskAgent 完成后的路由：
 * 如果 detectedIntents 里还有 SCHEDULE_PLANNING，则继续跑 scheduleAgent；
 * 否则直接去 emotionAgent。
 */
function taskThenScheduleOrEmotion(state) {
  if (state.detectedIntents && state.detectedIntents.includes('SCHEDULE_PLANNING')) {
    return 'scheduleAgent';
  }
  return 'emotionAgent';
}

let _compiledGraph = null;

function getCompiledGraph() {
  if (!_compiledGraph) {
    logger.info('[Graph] 编译多智能体协同图');
    _compiledGraph = buildAgentGraph();
    logger.info('[Graph] 编译完成');
  }
  return _compiledGraph;
}

module.exports = { buildAgentGraph, getCompiledGraph };
