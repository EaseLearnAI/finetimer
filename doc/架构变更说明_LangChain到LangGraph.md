# AIsiri 架构变更说明：从 LangChain 到 LangGraph 多智能体架构

> 版本：v2.0.0  
> 日期：2026-03-18  
> 作者：周闽隆  

---

## 一、变更背景

### 1.1 原架构问题

原系统虽然引入了 `langchain`、`@langchain/core` 等依赖，但实际上并未真正使用 LangChain 的 Chain/Agent 能力。核心调度逻辑 `intelligentDispatchService.js`（1115 行）本质上是一个 **if-else 分发器**：

```
用户输入 → 关键词检测 → 多次独立 LLM 调用 → 串行执行各 Service → 模板拼接回复
```

存在以下问题：

| 问题 | 具体表现 |
|------|---------|
| 伪多智能体 | 各 Service 独立运行，无协同通信，无共享状态 |
| 冗余 LLM 调用 | 意图识别和各 Service 分别调用 LLM，一次用户输入可能触发 3-5 次 API 调用 |
| 关键词硬编码 | 情绪检测基于关键词字典（`if (input.includes('累'))` → `'tired'`），无法理解语义 |
| 无状态持久化 | 仅保留最近 10 条对话历史，无用户画像和长期记忆 |
| 无并行执行 | 同优先级的智能体也串行执行，延迟叠加 |

### 1.2 变更目标

1. 构建真正的多智能体协同架构，各智能体通过统一 State 通信
2. Router Agent 单次 LLM 调用完成意图+情绪+实体一体化分析
3. 支持智能体并行执行和条件路由
4. 实现用户记忆的长短期持久化
5. 保持所有原有 40+ CRUD API 不变，仅重构 AI 调度层

---

## 二、技术选型

### 2.1 框架对比

| 维度 | AutoGen (Microsoft) | CrewAI | LangGraph.js (LangChain) |
|------|---------------------|--------|--------------------------|
| 语言支持 | Python only | Python only | **JavaScript / TypeScript** |
| 核心范式 | 对话式多智能体 | 角色扮演式 | **图状态机** |
| 与 Express 集成 | 需 Python 微服务桥接 | 需 Python 微服务桥接 | **原生 require 使用** |
| 状态持久化 | 无内置 | 无内置 | **MemorySaver / PostgresSaver** |
| Supervisor 模式 | ❌ | ❌ | **✅ 原生支持** |
| 条件路由 | ❌ | ❌ | **✅ addConditionalEdges** |

### 2.2 选型结论

**选择 LangGraph.js v1.2.2**。核心原因：

1. 本系统后端为 Node.js/Express，LangGraph.js 是唯一原生支持 Node.js 的成熟多智能体框架
2. `@langchain/core` 已存在于项目依赖中，增量改动最小
3. Supervisor 模式天然对应"中央路由与协调智能体"设计
4. 距论文截止 2.5 个月，AutoGen/CrewAI 方案需重写后端或搭建微服务，风险过高

### 2.3 与开题报告的衔接

开题报告中提出使用 AutoGen 框架。论文中的解释：

> "经过深入技术调研与原型验证，AutoGen 框架仅支持 Python 生态，与本系统已有的 Node.js/Express 后端和 Vue 3 前端存在技术栈不兼容问题。综合考虑系统稳定性与开发效率，最终选择 LangChain 团队推出的 LangGraph.js 框架作为多智能体协同的核心编排引擎。"

---

## 三、新架构设计

### 3.1 架构拓扑

```
                         ┌─────────────┐
    用户输入 ────────────▶│   START     │
    (文本/语音/图片)      └──────┬──────┘
                                │
                         ┌──────▼──────┐
                         │ loadMemory  │  加载用户画像 (MongoDB UserProfile)
                         └──────┬──────┘
                                │
                         ┌──────▼──────┐
                         │   router    │  中央路由与协调智能体 (Supervisor)
                         │             │  单次 LLM 调用：意图 + 情绪 + 实体
                         └──────┬──────┘
                                │ 条件路由 (routeDecision)
                 ┌──────────────┼──────────────┐
                 │              │              │
          ┌──────▼──────┐ ┌────▼────┐ ┌───────▼───────┐
          │  taskAgent  │ │schedule │ │   toolAgent   │
          │  任务创建    │ │ Agent   │ │  天气/路线查询  │
          └──────┬──────┘ │日程规划  │ └───────┬───────┘
                 │        └────┬────┘         │
                 │             │              │
                 └──────────────┼──────────────┘
                                │ 所有结果汇入
                         ┌──────▼──────┐
                         │emotionAgent │  情感陪伴智能体
                         │  结果聚合    │  共情回应 + 统一回复生成
                         └──────┬──────┘
                                │
                         ┌──────▼──────┐
                         │ saveMemory  │  保存用户画像 + 情绪历史
                         └──────┬──────┘
                                │
                         ┌──────▼──────┐
                         │    END      │
                         └─────────────┘
```

### 3.2 智能体角色定义

| 智能体 | LangGraph 角色 | 核心职责 | 对应文件 |
|--------|---------------|---------|---------|
| 中央路由与协调智能体 | Supervisor (条件路由) | 单次 LLM 完成意图+情绪+实体分析，条件分发 | `agents/routerAgent.js` |
| 任务管理与优化智能体 | Worker Node | 任务自动创建、时间解析、四象限分类 | `agents/taskAgent.js` |
| 动态调度智能体 | Worker Node | LLM 驱动日程优化、时间冲突检测 | `agents/scheduleAgent.js` |
| 情感陪伴智能体 | Worker Node + 聚合器 | 共情回应、结果整合、统一回复生成 | `agents/emotionAgent.js` |
| 外部工具智能体 | Worker Node | 天气查询、路线规划（高德 API） | `agents/toolAgent.js` |
| 用户记忆智能体 | State 节点 | 画像加载/保存、情绪历史追踪 | `agents/memoryAgent.js` |

### 3.3 State 通信协议

智能体间通过 LangGraph `Annotation` 定义的结构化 State 通信：

```javascript
AgentState = {
  userInput,           // 原始用户输入
  userId, sessionId,   // 用户与会话标识
  primaryIntent,       // 主意图 (TASK_CREATION / SCHEDULE_PLANNING / EXTERNAL_TOOL / CONVERSATION)
  detectedIntents,     // 所有检测到的意图（支持多意图）
  emotionState,        // { emotion, confidence, triggers }
  extractedEntities,   // { tasks, time, location, date }
  agentResults,        // 各智能体执行结果（reducer 自动累加）
  userProfile,         // 用户画像（偏好、情绪历史）
  finalResponse,       // 最终统一回复
}
```

关键设计：`agentResults` 使用 LangGraph 的 **reducer 机制**（`(prev, next) => ({ ...prev, ...next })`），各智能体写入自己的结果时自动与其他智能体的结果合并，无需手动聚合。

---

## 四、变更对照表

### 4.1 核心代码变更

| 变更前（v1.0） | 变更后（v2.0） | 说明 |
|----------------|---------------|------|
| `intelligentDispatchService.js` (1115行) | `intelligentDispatchService.js` (136行) + `agents/*.js` (9文件) | if-else 调度改为 LangGraph 图调用 |
| `detectEmotionalState()` 关键词匹配 | Router Agent LLM 内置情绪分析 | 7种情绪+强度+触发因素 |
| 多次 LLM 调用（意图→各Service分别调） | Router Agent 单次调用一体化分析 | 减少 API 调用次数 |
| 无用户记忆 | `UserProfile` 模型 + `memoryAgent` | 长短期记忆 + LangGraph Checkpoint |
| 串行执行 | LangGraph 并行节点 | 同级智能体并行处理 |

### 4.2 与旧代码的映射

| 旧 Service | 新 Agent | 状态 |
|------------|----------|------|
| `intelligentDispatchService.js` (旧) | `agents/graph.js` + `routerAgent.js` | **已重写** |
| `intentRecognitionService.js` | `routerAgent.js` 内置意图识别 | 保留（conversationController 仍引用） |
| `taskRecognitionService.js` | `agents/taskAgent.js` | 保留（taskRecognitionRoutes 仍引用） |
| `schedulePlanningService.js` | `agents/scheduleAgent.js` | **废弃**（未被任何挂载路由使用） |
| `conversationService.js` | `agents/emotionAgent.js` | 保留（conversationController 仍引用） |
| `gaodeMcpClient.js` | `agents/toolAgent.js` 调用 | **保留** |

### 4.3 新增文件清单

| 文件 | 行数 | 职责 |
|------|------|------|
| `agents/state.js` | 86 | LangGraph State 定义 |
| `agents/llmClient.js` | 104 | 统一 LLM 调用客户端 |
| `agents/routerAgent.js` | 149 | 中央路由智能体 |
| `agents/taskAgent.js` | 140 | 任务管理智能体 |
| `agents/scheduleAgent.js` | 120 | 动态调度智能体 |
| `agents/emotionAgent.js` | 141 | 情感陪伴智能体 |
| `agents/toolAgent.js` | 94 | 外部工具智能体 |
| `agents/memoryAgent.js` | 80 | 用户记忆智能体 |
| `agents/graph.js` | 75 | StateGraph 图定义与编译 |
| `models/UserProfile.js` | 40 | 用户画像 MongoDB 模型 |

---

## 五、废弃文件清单

以下文件在 LangGraph 重构后不再被使用：

### 5.1 明确废弃（可安全删除）

| 文件 | 行数 | 废弃原因 |
|------|------|---------|
| `services/schedulePlanningService.js` | 711 | 调度逻辑已迁移到 `scheduleAgent.js`，且旧路由未挂载 |
| `controllers/schedulePlanningController.js` | 391 | 仅被未挂载的 schedulePlanningRoutes 使用 |
| `routes/schedulePlanningRoutes.js` | 404 | 主 app.js 未挂载此路由 |
| `prompt/schedule_planning.js` | 352 | 仅被 schedulePlanningService 使用 |
| `prompt/intelligent_dispatch.js` | 239 | 无任何文件 require 引用 |
| `controllers/gaodeController.js` | 92 | 仅被未挂载的 gaodeRoutes 使用 |
| `routes/gaodeRoutes.js` | 14 | 主 app.js 未挂载此路由 |
| `chains/` | — | 空目录 |
| `config/` | — | 空目录 |
| `app.js` (AIsiri 内部) | 211 | AIsiri 独立服务入口，实际已集成到主 backend |
| `package.json` (AIsiri 内部) | 78 | 子模块配置，依赖已统一到根 backend |
| `package-lock.json` (AIsiri 内部) | — | 同上 |
| `node_modules/` (AIsiri 内部) | ~247MB | 冗余，根 backend 已有全部依赖 |
| 旧版测试文件 | — | 针对旧架构的测试脚本 |

### 5.2 保留但需关注的文件

| 文件 | 保留原因 |
|------|---------|
| `services/conversationService.js` | `conversationController` 仍通过独立对话路由使用 |
| `services/intentRecognitionService.js` | `conversationService` 和 `taskRecognitionService` 内部调用 |
| `services/taskRecognitionService.js` | `taskRecognitionRoutes` 仍在主 app.js 中挂载 |
| `services/gaodeMcpClient.js` | `toolAgent` 直接引用 |

---

## 六、接口兼容性

### 6.1 API 接口对照

| 接口 | 路径 | 变更状态 | 前端调用位置 |
|------|------|---------|-------------|
| 智能调度 | `POST /api/aisiri/dispatch` | **内部重构**，输入输出格式不变 | `aiApi.js → dispatch()` |
| 健康检查 | `GET /api/aisiri/dispatch/status` | 不变 | `aiApi.js → healthCheck()` |
| 任务 CRUD | `/api/tasks/*` | 不变 | `task API` |
| 用户认证 | `/api/users/*` | 不变 | `auth API` |
| 对话 | `/api/ai/conversation/*` | 不变 | `conversationRoutes` |
| 语音识别 | `/api/speech-recognition/*` | 不变 | `speechRecognitionService.js` |
| 图片分析 | `/api/image-analysis/*` | 不变 | `imageAnalysisService.js` |
| AI 助手 | `/api/ai-assistant/*` | 不变 | `aiAssistantService.js` |
| 番茄钟 | `/api/pomodoro/*` | 不变 | `pomodoroRoutes` |
| 任务集 | `/api/collections/*` | 不变 | `collectionRoutes` |

### 6.2 Dispatch 响应格式对比

```javascript
// v1.0 (旧)
{
  response: "...",
  intents: ["TASK_CREATION"],
  servicesExecuted: ["taskCreation"],
  taskCreated: { title, date, timeBlock },
  scheduleAdjusted: false,
  emotionalSupport: "提供情绪安慰",
  processingTime: 3000
}

// v2.0 (新) — 完全兼容
{
  response: "...",
  intents: ["TASK_CREATION"],
  servicesExecuted: ["taskCreation", "emotionSupport"],
  taskCreated: { id, title, date, timeBlock },
  scheduleAdjusted: false,
  emotionalSupport: "情绪支持（happy）",
  processingTime: 5000,
  architecture: "langgraph-multi-agent"  // 新增字段，前端忽略即可
}
```

---

## 七、性能对比

| 指标 | v1.0 (if-else) | v2.0 (LangGraph) | 说明 |
|------|----------------|-------------------|------|
| LLM 调用次数（对话） | 2-3 次 | 2 次 | Router + Emotion |
| LLM 调用次数（任务+日程） | 4-5 次 | 3 次 | Router + Schedule + Emotion |
| 情绪识别方式 | 关键词匹配 | LLM 语义分析 | 准确率显著提升 |
| 用户记忆 | 最近 10 条对话 | 50 条情绪历史 + 用户画像 | 长期个性化 |
| 状态持久化 | 无 | LangGraph MemorySaver | 支持会话恢复 |
| 代码行数（调度核心） | 1115 行 | 136 + 985 = 1121 行 | 分散到 9 个模块，可维护性大幅提升 |
