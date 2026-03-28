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

  // 中央路由 → 条件分发到各智能体
  graph.addConditionalEdges('router', routeDecision, {
    taskAgent: 'taskAgent',
    scheduleAgent: 'scheduleAgent',
    undoAgent: 'undoAgent',
    emotionAgent: 'emotionAgent',
  });

  // 各专项智能体 → 情感陪伴（聚合）
  graph.addEdge('taskAgent', 'emotionAgent');
  graph.addEdge('scheduleAgent', 'emotionAgent');
  graph.addEdge('undoAgent', 'emotionAgent');

  // 情感陪伴 → 保存记忆 → 结束
  graph.addEdge('emotionAgent', 'saveMemory');
  graph.addEdge('saveMemory', END);

  return graph.compile();
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
