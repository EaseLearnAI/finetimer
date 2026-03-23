# AIsiri 系统更新日志

> 本文档记录系统架构优化与功能更新的完整变更历史。

---

## [v3.0.1] - 2026-03-23 — 清理残留的 EXTERNAL_TOOL 引用

### 修复 Bug

| 编号 | 问题 | 根因 | 修复方式 | 涉及文件 |
|---|---|---|---|---|
| B-13 | dispatch status 端点仍返回 EXTERNAL_TOOL 意图和 gaodeMap 服务 | v3.0.0 重构时遗漏了 controller 层的硬编码 | 移除 EXTERNAL_TOOL 意图、更新 availableServices 列表 | `backend/src/AIsiri/controllers/intelligentDispatchController.js` |
| B-14 | intelligentDispatchService 日志和 healthCheck 仍包含 tool agent | 重构时遗漏了 service 层的硬编码列表 | 清理 services 数组和注释，删除 externalToolResult 构建逻辑 | `backend/src/AIsiri/services/intelligentDispatchService.js` |
| B-15 | Conversation 模型 intent enum 仍包含 EXTERNAL_TOOL | 重构时遗漏了数据模型 | 从 enum 中移除 EXTERNAL_TOOL | `backend/src/models/Conversation.js` |
| B-16 | 前端 types/index.js DISPATCH_RESPONSE_TYPES 仍有 EXTERNAL_TOOL | 重构时遗漏了前端类型定义 | 移除 EXTERNAL_TOOL 枚举 | `timer/src/AIsiri/types/index.js` |

### 修改文件

| 文件 | 变更说明 |
|---|---|
| `backend/src/AIsiri/controllers/intelligentDispatchController.js` | 移除 EXTERNAL_TOOL 意图、mcpServices 字段，更新 availableServices 为实际 agent 列表，修复测试用例 |
| `backend/src/AIsiri/services/intelligentDispatchService.js` | 清理注释、services 列表、agents 列表，删除 externalToolResult 构建逻辑 |
| `backend/src/models/Conversation.js` | 从 intent enum 中移除 EXTERNAL_TOOL |
| `timer/src/AIsiri/types/index.js` | 从 DISPATCH_RESPONSE_TYPES 中移除 EXTERNAL_TOOL |
| `.cursor/skills/aisiri-user-testing/SKILL.md` | 更新测试用例 7 的 expectedIntent 为 CONVERSATION |

### 验证结果

- 后端 app.js 加载零错误
- dispatch/status 端点返回正确的 3 个意图类型和 5 个 agent 服务
- 前端编译零错误
- 浏览器端到端测试通过：登录 → AI秘书对话 → 任务创建 → 任务页面同步 全部正常
- AI 响应延迟约 2-3 秒，时间提取准确（"明天下午3点" → 2026-03-24 15:00）

---

## [v3.0.0] - 2026-03-23 — 架构精简重构 & 情绪陪伴深化

### 架构重构（删除 17 个文件，修改 11 个文件）

**删除旧通道 B 全部死代码（前端完全未调用）：**

| 文件 | 说明 |
|---|---|
| `backend/src/AIsiri/services/conversationService.js` | 旧对话服务 |
| `backend/src/AIsiri/services/intentRecognitionService.js` | 旧意图识别服务 |
| `backend/src/AIsiri/services/taskRecognitionService.js` | 旧任务识别服务 |
| `backend/src/AIsiri/controllers/conversationController.js` | 旧对话控制器 |
| `backend/src/AIsiri/controllers/intentRecognitionController.js` | 旧意图控制器 |
| `backend/src/AIsiri/controllers/taskRecognitionController.js` | 旧任务控制器 |
| `backend/src/AIsiri/routes/conversationRoutes.js` | 旧对话路由 |
| `backend/src/AIsiri/routes/intentRecognition.js` | 旧意图路由 |
| `backend/src/AIsiri/routes/taskRecognitionRoutes.js` | 旧任务识别路由 |
| `backend/src/AIsiri/prompt/intent_recognition.js` | 旧意图 Prompt |
| `backend/src/AIsiri/prompt/task_recognition.js` | 旧任务 Prompt |
| `backend/src/routes/ai_routes.js` | 旧 AI 路由聚合 |

**删除外部工具模块（与论文核心无关）：**

| 文件 | 说明 |
|---|---|
| `backend/src/AIsiri/agents/toolAgent.js` | 外部工具智能体 |
| `backend/src/AIsiri/services/gaodeMcpClient.js` | 高德 MCP 客户端 |
| `backend/src/AIsiri/MCP/mcp.js` | MCP 协议实现 |
| `backend/src/AIsiri/MCP/mongodb.json` | MCP 配置 |
| `backend/src/AIsiri/MCP/test_route.js` | 路线测试脚本 |

### 修改文件

| 文件 | 变更说明 |
|---|---|
| `backend/src/app.js` | 清理旧路由注册，AIsiri 仅保留 `/api/aisiri/dispatch` 单一入口 |
| `backend/src/AIsiri/agents/graph.js` | 移除 toolAgent 节点和边，LangGraph 图精简为 4 节点 |
| `backend/src/AIsiri/agents/routerAgent.js` | 意图从 4 类精简为 3 类（移除 EXTERNAL_TOOL），情绪增加 context 字段和 confused 类型 |
| `backend/src/AIsiri/agents/emotionAgent.js` | 引入情绪趋势感知、用户画像利用、交互深度意识，丰富 8 类情绪响应策略，增强 Prompt |
| `backend/src/AIsiri/agents/memoryAgent.js` | 新增任务完成率加载（近 7 天），自适应调整偏好（持续负面情绪自动降低通知强度） |
| `backend/src/AIsiri/tests/intentTest.js` | 替换 EXTERNAL_TOOL 用例为 CONVERSATION/SCHEDULE_PLANNING |
| `backend/src/AIsiri/tests/latencyTest.js` | 替换天气查询场景为情绪陪伴场景 |
| `backend/src/AIsiri/tests/userBehaviorTest.js` | 替换天气查询用例为日程整理用例 |
| `doc/AI秘书后端系统架构文档.md` | 全面更新反映精简后的单通道架构 |
| `doc/AI秘书Benchmark评估体系.md` | BM 从 9 项精简为 7 项，更新用例和评估维度 |

### 验证结果

前端代码审计确认：仅 `POST /api/aisiri/dispatch` 被前端调用，删除的 12 个旧通道文件均为死代码。所有交叉依赖已核实为闭合链。

---

## [v2.7.0] - 2026-03-23 — Benchmark 评估体系 v1.1 精简重构

### 修改文件

| 文件 | 变更说明 |
|---|---|
| `doc/AI秘书Benchmark评估体系.md` | 评估体系从 9 项精简为 7 项：删除 BM-5（外部工具可靠性）和 BM-9（架构冗余度审计），重编号 BM-1~BM-7；BM-1 意图类型精简为 3 类（移除 EXTERNAL_TOOL），替换 7 条用例为 CONVERSATION/SCHEDULE_PLANNING；BM-2 新增 confused 情绪类型（8 类共 40 条）；BM-6 情感回复质量新增"情绪趋势个性化"和"用户画像利用"两个评估维度；组件映射图移除 toolAgent 节点；更新 Gantt 执行计划和汇总模板 |

---

## [v2.6.0] - 2026-03-23 — 系统架构文档 v2.0 更新（架构统一）

### 修改文件

| 文件 | 变更说明 |
|---|---|
| `doc/AI秘书后端系统架构文档.md` | 全面更新至 v2.0：反映架构统一完成（移除双通道）、删除 toolAgent/EXTERNAL_TOOL/高德 API 相关内容、routerAgent 意图精简为 3 类并新增 confused 情绪类型、emotionAgent 新增用户画像利用/情绪趋势感知/交互深度意识、memoryAgent 新增任务完成率加载和自适应偏好调整、API 端点精简至 dispatch 3 个、目录结构同步更新 |

---

## [v2.5.0] - 2026-03-21 — AI秘书系统架构文档 & Benchmark 评估体系

### 新增文件

| 文件 | 说明 |
|---|---|
| `doc/AI秘书后端系统架构文档.md` | 基于全目录代码分析产出的完整系统架构文档，包含 Mermaid 架构图、LangGraph 多智能体协同图、LLM 调用全景、数据模型 ER 图、双通道冗余分析等 |
| `doc/AI秘书Benchmark评估体系.md` | 9 项 Benchmark 评估体系（BM-1 ~ BM-9），覆盖意图识别、情绪识别、任务创建、日程规划、外部工具、端到端延迟、情感回复、记忆一致性、架构冗余度审计，含详细用例、评估标准和执行计划 |

---

## [v2.4.0] - 2026-03-21 — 认证首页极简风格重塑

### 修改文件

| 文件 | 变更说明 |
|---|---|
| `timer/src/views/Auth.vue` | 将认证页背景从紫色渐变改为白底浅蓝点缀，强化弹性布局下的居中弹窗与卡片留白 |
| `timer/src/components/login/AuthLogo.vue` | 将 Logo 区改为蓝白主色、简化阴影和标题表现，统一首页视觉语言，并切换为 `public/tempo_icon_white.png` 图片资源 |
| `timer/src/components/login/LoginForm.vue` | 优化登录表单输入框、按钮、错误提示和切换链接样式，改为极简蓝白风格 |
| `timer/src/components/login/RegisterForm.vue` | 同步注册表单的输入区与按钮样式，保持登录/注册视觉一致性 |
| `timer/src/views/Task.vue` | 将任务页右下角 AI 助手入口从字体图标切换为 `public/ai_time_manager_logo_v1.png` 图片资源 |
| `timer/src/views/AiSecretary.vue` | 将 AI 秘书加载态头像切换为 `public/ai_time_manager_logo_v1.png` 图片资源，并取消圆形裁切以同步入口图标视觉 |
| `timer/src/components/AIsecretary/MessageCard.vue` | 将 AI 消息头像切换为 `public/ai_time_manager_logo_v1.png` 图片资源，并取消圆形裁切以统一助手视觉形象 |

### 验证结果

前端样式已完成替换，保留原有布局结构、文案内容与交互逻辑；后续通过 `npm run lint` 进行静态检查。

---

## [v2.3.1] - 2026-03-18 — scheduleAgent 自动去重 & Prompt 强化

### 改进

| 编号 | 内容 | 说明 |
|------|------|------|
| E-07 | scheduleAgent 自动去重预处理 | 在 LLM 生成建议之前，先按 `title+date+time` 自动检测并删除重复任务，不依赖 LLM 判断 |
| E-08 | Prompt 规则强化 | 新增规则：每次整理时必须先检查重复/语义相同任务，每个 delete 指令只删一个，需生成 N-1 条 |
| E-09 | Router Prompt 区分任务管理 vs 创建 | 整理/清理/重排等操作路由到 SCHEDULE_PLANNING 而非 TASK_CREATION |

### 涉及文件

- `root/backend/src/AIsiri/agents/scheduleAgent.js`：新增 `autoDeduplicateTasks()` 函数、Prompt 规则 #2 和 #5
- `root/backend/src/AIsiri/agents/routerAgent.js`：细化意图区分规则

---

## [v2.3.0] - 2026-03-18 — 快捷按钮 UX 优化 & 日程 Agent CRUD 操作能力

### 问题现象

1. 用户点击快捷操作按钮（如"安排日程"），消息和加载动画同时出现，用户看不到自己发出的消息
2. AI 秘书只会"建议"日程调整，但不会真正修改数据库中的任务（增删改排序）
3. 用户说"帮我整理一下重复任务"会被错误识别为 TASK_CREATION

### 根本原因

- **R-04**: `sendMessage()` 调用 `processUserInput()` 后一次性更新 UI，导致用户消息与 AI 回复同时渲染
- **R-05**: `scheduleAgent` 仅调用 LLM 生成文字建议，未将 recommendations 映射为数据库操作
- **R-06**: Router Prompt 未明确区分"任务管理/整理"与"任务创建"

### Bug 修复

| 编号 | 修复内容 | 涉及文件 |
|------|----------|----------|
| B-18 | 拆分 `processUserInput` 为 `addUserMessage` + `dispatchAndRespond`，用户消息先展示再调度 | `messageService.js`, `AiSecretary.vue` |
| B-19 | scheduleAgent 新增 `executeRecommendations()` 函数，支持 update/reschedule/create/delete 四种数据库操作 | `scheduleAgent.js` |
| B-20 | `findTaskByTitle` 匹配后从 existingTasks 中移除，避免同名重复任务只能删一个 | `scheduleAgent.js` |
| B-21 | 优化 Router Prompt 区分"任务管理/清理/整理"(→ SCHEDULE_PLANNING) vs "新增具体事项"(→ TASK_CREATION) | `routerAgent.js` |
| B-22 | `_buildResponse` 将 `executed` 执行结果一并返回前端 | `intelligentDispatchService.js` |
| B-23 | `addScheduleAdjustedMessage` 展示实际操作摘要（更新/新增/清理数量） | `messageService.js` |

### 功能增强

| 编号 | 增强内容 | 说明 |
|------|----------|------|
| E-04 | scheduleAgent 支持四种任务操作 | update（修改时间/优先级/象限）、reschedule（移动日期/时间块）、create（新建）、delete（删除重复） |
| E-05 | LLM Prompt 增加操作指令格式 | 输出包含 suggestedPriority、suggestedQuadrant、suggestedDate 等可执行字段 |
| E-06 | 快捷按钮点击体验优化 | 消息先展示 → 加载动画 → AI 回复，三步有序呈现 |

### 验证结果

| 测试场景 | 预期 | 结果 |
|----------|------|------|
| "帮我看看今天有哪些任务，按优先级帮我安排一下" | SCHEDULE_PLANNING，查看并排序 | ✅ 正确识别，无误创建任务 |
| "帮我把复习英语的优先级调高" | SCHEDULE_PLANNING，数据库更新 priority=high | ✅ 实际修改数据库，priority: medium→high |
| "明天下午2点和同学去自习室学习" | TASK_CREATION，创建新任务 | ✅ 创建成功，time=14:00 |
| "帮我整理重复任务" | SCHEDULE_PLANNING，删除重复 | ✅ 正确识别为管理操作（Router 修复后） |
| 快捷按钮点击 | 先显示用户消息 → 加载 → 结果 | ✅ 三步有序 |

---

## [v2.2.0] - 2026-03-18 — 状态隔离 & 核心体验优化

### 问题现象

用户在 AI 秘书中连续对话时，出现以下严重体验问题：
1. 说"我今天感觉有点累，需要一些鼓励"（纯情绪对话），但回复中附带了"任务已创建：上班"
2. 说"帮我安排一下今天的日程"，但回复中仍然显示上一轮的"任务已创建：上班"
3. 快捷卡片发送的 query 过于模板化，回复与用户预期不匹配

### 根因分析

| 编号 | 问题 | 根因 |
|------|------|------|
| R-01 | 上一轮的 `taskCreation` 结果在下一轮仍然存在 | `agentResults` 使用 merge reducer `(prev, next) => ({...prev, ...next})`，配合 `MemorySaver` checkpointer，导致 `agentResults` 跨轮累积而不是重置 |
| R-02 | CONVERSATION 意图的回复中出现"任务已创建"卡片 | `_buildResponse` 不区分意图，只要 `agentResults.taskCreation.success` 为 true 就返回 `taskCreated` |
| R-03 | 前端无条件展示 taskCreated / scheduleAdjusted 卡片 | `messageService.js` 只检查 `data.taskCreated` 是否存在，不检查当前意图 |

### 修复 Bug

| 编号 | 问题 | 修复方式 | 涉及文件 |
|------|------|---------|---------|
| B-13 | MemorySaver 导致 agentResults 跨轮泄漏 | 移除 MemorySaver checkpointer（用户记忆已由 MongoDB UserProfile 和 Conversation 持久化） | `agents/graph.js` |
| B-14 | loadMemory 不重置 agentResults | 在每轮开始时显式将 taskCreation/schedulePlanning/emotionSupport/externalTool 设为 null | `agents/memoryAgent.js` |
| B-15 | _buildResponse 不区分意图返回结果 | 增加意图感知：只有 intents 包含 TASK_CREATION 时才返回 taskCreated，包含 SCHEDULE_PLANNING 时才返回 scheduleAdjusted | `services/intelligentDispatchService.js` |
| B-16 | 前端 handleDispatchResponse 无条件展示任务/日程卡片 | 增加 `intents.includes()` 前置检查 | `timer/src/AIsiri/services/messageService.js` |
| B-17 | 前端 handleVoiceDispatchResponse 同样无条件展示 | 同 B-16 修复方式 | `timer/src/AIsiri/services/messageService.js` |

### 功能增强

| 编号 | 变更 | 说明 | 涉及文件 |
|------|------|------|---------|
| E-01 | scheduleAgent 任务信息增强 | 区分今日任务/其他任务，展示 time/priority/quadrant 详细信息 | `agents/scheduleAgent.js` |
| E-02 | 快捷卡片 query 优化 | 从模板化短句改为具体可执行的自然语言（如"帮我记录一个任务：明天下午3点开项目进度会"） | `timer/src/AIsiri/types/index.js` |
| E-03 | _buildResponse servicesExecuted 精简 | 只返回实际成功执行的服务（过滤 null 和 failed） | `services/intelligentDispatchService.js` |

### 修改文件

| 文件 | 变更说明 |
|------|---------|
| `backend/src/AIsiri/agents/graph.js` | 移除 MemorySaver import 和 checkpointer 编译参数 |
| `backend/src/AIsiri/agents/memoryAgent.js` | loadMemory 增加 agentResults 重置逻辑 |
| `backend/src/AIsiri/services/intelligentDispatchService.js` | _buildResponse 增加意图感知、移除 thread_id |
| `backend/src/AIsiri/agents/scheduleAgent.js` | 任务查询增加 time 排序、区分今日/其他、详细格式化 |
| `timer/src/AIsiri/types/index.js` | 5 个快捷卡片 query 文案优化 |
| `timer/src/AIsiri/services/messageService.js` | 文字和语音两个 handler 都增加意图前置检查 |

### 验证结果

**状态隔离测试（关键）：**

| 轮次 | 输入 | 期望 | 实际 |
|------|------|------|------|
| 1 | 今天下午2点开会 | taskCreated=开会 | ✅ taskCreated=开会 |
| 2 | 我今天感觉有点累，需要一些鼓励 | taskCreated=None, emotionSupport=tired | ✅ taskCreated=None, 服务=[emotionSupport] |
| 3 | 帮我看看今天有哪些任务，按优先级帮我安排一下 | taskCreated=None, 展示已有任务 | ✅ taskCreated=None, 展示4个已有任务按时间排列 |

**用户行为模拟测试：** 7/7 通过（100%）

---

## [v2.0.0] - 2026-03-18 — LangGraph 多智能体架构重构

### 架构变更

| 编号 | 变更项 | 变更前 | 变更后 | 涉及文件 |
|------|--------|--------|--------|---------|
| A-01 | 多智能体框架 | 无框架（if-else 调度） | LangGraph.js v1.2.2 StateGraph | `agents/*.js` |
| A-02 | 智能体调度模式 | 串行关键词匹配 | Supervisor + 条件路由 + 并行执行 | `agents/graph.js` |
| A-03 | 意图识别 | 多次 LLM 调用 + 关键词辅助 | 单次 LLM 调用一体化分析（意图+情绪+实体） | `agents/routerAgent.js` |
| A-04 | 情绪检测 | 关键词字典匹配 | LLM Prompt 内置情绪分析（7种情绪+强度+触发因素） | `agents/routerAgent.js` |
| A-05 | 回复生成 | 模板拼接 + 通用 LLM 回复 | 情感陪伴智能体共情策略 Prompt | `agents/emotionAgent.js` |
| A-06 | 用户记忆 | 最近 10 条对话 | LangGraph State Checkpoint + MongoDB UserProfile | `agents/memoryAgent.js`, `models/UserProfile.js` |

### 新增文件

| 编号 | 文件路径 | 说明 |
|------|---------|------|
| N-01 | `backend/src/AIsiri/agents/state.js` | LangGraph State 定义（AgentState Annotation），智能体间通信协议 |
| N-02 | `backend/src/AIsiri/agents/llmClient.js` | 统一 LLM 调用客户端，支持 chat/chatJSON 双模式 |
| N-03 | `backend/src/AIsiri/agents/routerAgent.js` | 中央路由与协调智能体（Supervisor），单次 LLM 完成意图+情绪+实体分析 |
| N-04 | `backend/src/AIsiri/agents/taskAgent.js` | 任务管理与优化智能体，含自然语言时间解析、四象限分类 |
| N-05 | `backend/src/AIsiri/agents/scheduleAgent.js` | 动态调度智能体，LLM 驱动日程规划与时间冲突检测 |
| N-06 | `backend/src/AIsiri/agents/emotionAgent.js` | 情感陪伴智能体，共情回应生成 + 结果聚合 + 统一回复 |
| N-07 | `backend/src/AIsiri/agents/toolAgent.js` | 外部工具智能体（天气/路线查询，封装高德 API） |
| N-08 | `backend/src/AIsiri/agents/memoryAgent.js` | 用户记忆智能体，加载/保存用户画像与情绪历史 |
| N-09 | `backend/src/AIsiri/agents/graph.js` | LangGraph StateGraph 图定义与编译，智能体注册与连接 |
| N-10 | `backend/src/models/UserProfile.js` | 用户画像 MongoDB 模型（偏好、情绪历史、行为模式） |
| N-11 | `backend/src/AIsiri/docs/技术选型对比报告.md` | AutoGen / CrewAI / LangGraph.js 框架对比文档 |
| N-12 | `论文大纲_基于多智能体协同架构的AI时间管家系统.md` | 完整论文大纲（符合西电撰写规范，七章结构） |
| N-13 | `backend/src/AIsiri/tests/testPlan.md` | 完整测试方案（意图识别/协同效率/情感交互/用户体验） |
| N-14 | `backend/src/AIsiri/tests/intentTest.js` | 意图识别自动化测试脚本（30 条用例） |
| N-15 | `backend/src/AIsiri/tests/emotionTest.js` | 情绪识别自动化测试脚本（40 条用例 + 混淆矩阵） |
| N-16 | `backend/src/AIsiri/tests/latencyTest.js` | 多智能体协同延迟测试脚本（6 场景 × 重复执行） |

### 修改文件

| 编号 | 文件路径 | 变更说明 |
|------|---------|---------|
| M-01 | `backend/src/AIsiri/services/intelligentDispatchService.js` | **重写**：从 1115 行 if-else 调度改为 ~130 行 LangGraph 图调用 |
| M-02 | `backend/src/app.js` | 调整路由注册顺序，dispatch 路由移到 `/api/aisiri` 之前避免认证拦截 |
| M-03 | `timer/src/views/Task.vue` | 事件名修复：`ai-plan-generated` → `ai-dispatch-completed` |
| M-04 | `backend/package.json` | 新增依赖：`@langchain/langgraph@1.2.2` |

### 修复 Bug

| 编号 | 问题描述 | 修复方式 |
|------|---------|---------|
| B-01 | Task.vue 监听事件名 `ai-plan-generated` 与 messageService.js 派发事件名 `ai-dispatch-completed` 不一致，导致 AI 创建任务后任务列表不刷新 | 统一为 `ai-dispatch-completed` |
| B-02 | `/api/aisiri/dispatch/status` 被 `/api/aisiri` 路由的全局 authMiddleware 拦截，无法无认证访问 | 将 dispatch 路由注册移到 `/api/aisiri` 之前 |
| B-03 | 时间解析"下午3点"被解析为 `03:00` 而非 `15:00` | taskAgent 中 `parseSpecificTime` 增加 AM/PM 推断与 timeBlock 校正 |

### 接口兼容性

| 接口 | 路径 | 前端调用位置 | 兼容状态 |
|------|------|-------------|---------|
| 智能调度 | `POST /api/aisiri/dispatch` | `aiApi.js → dispatch()` | ✅ 兼容（返回字段一致） |
| 健康检查 | `GET /api/aisiri/dispatch/status` | `aiApi.js → healthCheck()` | ✅ 兼容 |
| 任务 CRUD | `GET/POST/PUT/DELETE /api/tasks` | `task.js API` | ✅ 未变动 |
| 用户认证 | `POST /api/users/register, /login` | `auth.js API` | ✅ 未变动 |
| 对话 | `POST /api/ai/conversation/send` | `conversationRoutes` | ✅ 未变动 |
| 语音识别 | `POST /api/speech-recognition/*` | `speechRecognitionRoutes` | ✅ 未变动 |
| 图片分析 | `POST /api/image-analysis/*` | `imageAnalysisRoutes` | ✅ 未变动 |
| AI 助手 | `GET/PUT /api/ai-assistant` | `aiAssistantRoutes` | ✅ 未变动 |
| 番茄钟 | `GET/POST/PUT/DELETE /api/pomodoro` | `pomodoroRoutes` | ✅ 未变动 |
| 任务集 | `GET/POST/PUT/DELETE /api/collections` | `collectionRoutes` | ✅ 未变动 |

### 新架构拓扑

```
用户输入 → START
  → loadMemory（加载用户画像）
  → router（中央路由：意图+情绪+实体 一次性分析）
  → 条件路由分发：
      ├── taskAgent（任务创建）
      ├── scheduleAgent（日程规划）
      ├── toolAgent（天气/路线）
      └── emotionAgent（情感陪伴 + 结果聚合 + 统一回复）
  → saveMemory（保存用户画像）
  → END
```

### 端到端验证结果（2026-03-18 执行）

| 测试项 | 结果 | 备注 |
|--------|------|------|
| 所有模块加载 | ✅ 通过 | 11 个模块全部正确 require |
| Graph 编译 | ✅ 通过 | StateGraph compile 成功 |
| 健康检查 API | ✅ 通过 | 返回 healthy + 6 个智能体 |
| 对话意图调度 | ✅ 通过 | 识别 CONVERSATION + happy 情绪 |
| 任务创建调度 | ✅ 通过 | 创建任务 + 正确时间解析 |
| 前端事件同步 | ✅ 修复 | 事件名统一为 ai-dispatch-completed |
| 时间解析 "下午3点" | ✅ 修复 | 正确解析为 15:00 |
| 所有原有 API | ✅ 未变动 | 40+ CRUD 接口完全保留 |
| /api/tasks (GET) | ✅ 通过 | 正常返回任务列表 |
| /api/users/profile (GET) | ✅ 通过 | 正常返回用户信息 |
| /api/collections (GET) | ✅ 通过 | 正常返回任务集数据 |
| /api/pomodoro (GET) | ✅ 通过 | 正常返回番茄钟数据 |
| /api/ai-assistant (GET) | ✅ 通过 | 正常返回 AI 助手配置 |
| 前端 (port 8080) | ✅ 运行中 | Vue 3 页面正常加载 |

---

## [v2.1.0] - 2026-03-18 — 意图路由修复 & 时间解析增强 & 用户行为测试

### 修复 Bug

| 编号 | 问题 | 根因 | 修复方式 | 涉及文件 |
|------|------|------|---------|---------|
| B-07 | "今天早上11点上班"只触发 SCHEDULE_PLANNING，不创建任务 | Router Prompt 未规定「具体活动+具体时间」应同时包含 TASK_CREATION | Prompt 新增多意图识别规则：带时间的具体活动必须包含 TASK_CREATION + SCHEDULE_PLANNING | `agents/routerAgent.js` |
| B-08 | "今晚8点复习英语"时间解析失败，任务无 time 字段 | `parseSpecificTime` 不识别"今晚"（只匹配"晚上"），`parseTimeBlock` 同理 | 增加标准化预处理：`今晚→晚上`、`今早→早上` | `agents/taskAgent.js` |
| B-09 | LLM 猜错日期（如返回 2026-03-17 而实际是 03-18） | Router Prompt 未向 LLM 注入当前日期 | 在 LLM 调用时注入 `当前时间：YYYY-MM-DD 星期X HH:MM` | `agents/routerAgent.js` |
| B-10 | `parseDate` 被 LLM 错误的 date 字段覆盖 | `parseDate` 优先使用 LLM 返回的 `entities.date`，即使用户说"今天" | 优先匹配"今天/明天/后天"关键词，再回退到 LLM 提取的日期 | `agents/taskAgent.js` |
| B-11 | timeBlock.endTime < startTime（如 startTime=11:00 但 endTime=09:00） | specificTime 覆盖 startTime 后 endTime 未联动修正 | 当 startTime >= endTime 时自动修正 endTime = startTime + 1h | `agents/taskAgent.js` |
| B-12 | `taskAgent` 返回的 `taskCreated` 对象缺少 `time` 字段 | `createdTasks.push()` 未包含 `task.time` | 返回结构增加 `time` 字段 | `agents/taskAgent.js` |

### 修改文件

| 文件 | 变更说明 |
|------|---------|
| `agents/routerAgent.js` | ① Prompt 增加多意图识别规则 ② LLM 调用注入当前日期和星期 |
| `agents/taskAgent.js` | ① `parseSpecificTime` 增加今晚/今早标准化 ② `parseTimeBlock` 同步标准化 ③ `parseDate` 优先处理相对日期词 ④ endTime 联动修正 ⑤ 返回结构补 time 字段 |

### 新增文件

| 文件 | 说明 |
|------|------|
| `tests/userBehaviorTest.js` | 用户行为模拟测试脚本（7 条用例，涵盖任务创建/情绪/天气/时间解析） |

### Skill 文件变更

| 变更 | 说明 |
|------|------|
| `SKILL.md` 合并 `test-cases.md` | 将两个文件合并为一个完整的 Skill，包含测试用例表格、评估标准、自动化脚本路径、失败排查指南 |
| 删除 `test-cases.md` | 内容已并入 `SKILL.md` |

### 用户行为模拟测试结果（7/7 通过）

| # | 输入 | 意图 | 时间 | 日期 | 结果 |
|---|------|------|------|------|------|
| 1 | 今天早上11点上班 | TASK_CREATION + SCHEDULE_PLANNING | 11:00 ✔ | 2026-03-18 ✔ | ✅ |
| 2 | 我明天下午3:00有个会议 | TASK_CREATION + SCHEDULE_PLANNING | 15:00 ✔ | 2026-03-19 ✔ | ✅ |
| 3 | 帮我创建一个明天下午3点开会的任务 | TASK_CREATION + SCHEDULE_PLANNING | 15:00 ✔ | 2026-03-19 ✔ | ✅ |
| 4 | 提醒我今晚8点复习英语 | TASK_CREATION | 20:00 ✔ | 2026-03-18 ✔ | ✅ |
| 5 | 我后天下午两点要和导师讨论论文 | TASK_CREATION + SCHEDULE_PLANNING | 14:00 ✔ | 2026-03-20 ✔ | ✅ |
| 6 | 我今天好累啊（情绪表达） | CONVERSATION (tired) | — | — | ✅ |
| 7 | 今天西安天气 | EXTERNAL_TOOL | — | — | ✅ |

### 浏览器端到端测试

| 步骤 | 结果 |
|------|------|
| 登录 15691887650 | ✅ 成功跳转 `/task` |
| 进入 AI秘书 `/ai-secretary` | ✅ 页面加载正常 |
| 输入"我明天下午3:00有个会议" | ✅ 消息发送成功 |
| AI 回复（~15秒） | ✅ 确认任务创建，时间 15:00 |
| 任务页面 `/task` 同步 | ✅ 会议任务出现在下午时段 |

### AIsiri 表现评估

| 维度 | 评分 |
|------|------|
| 理解能力 (Understanding) | good (100%) |
| 时间解析 (Time Resolution) | good |
| 动作执行 (Action Execution) | good (5/5 任务创建成功) |
| 响应速度 (Response Speed) | acceptable (平均 18.7s) |
| 端到端一致性 (E2E) | good |

---

## [v2.0.1] - 2026-03-18 — 代码清理与 Bug 修复

### 删除的废弃文件

| 文件 | 说明 |
|------|------|
| `AIsiri/app.js` | AIsiri 独立服务入口（已集成到主 backend） |
| `AIsiri/package.json`, `package-lock.json` | 子模块配置（依赖已统一到根 backend） |
| `AIsiri/node_modules/` (~247MB) | 冗余依赖（根 backend 已有全部依赖） |
| `AIsiri/chains/`, `AIsiri/config/` | 空目录 |
| `services/schedulePlanningService.js` (711行) | 调度逻辑已迁移到 scheduleAgent |
| `controllers/schedulePlanningController.js` (391行) | 仅被未挂载路由使用 |
| `routes/schedulePlanningRoutes.js` (404行) | 主 app.js 未挂载 |
| `prompt/schedule_planning.js` (352行) | 仅被 schedulePlanningService 使用 |
| `prompt/intelligent_dispatch.js` (239行) | 无任何文件引用 |
| `controllers/gaodeController.js` (92行) | 仅被未挂载路由使用 |
| `routes/gaodeRoutes.js` (14行) | 主 app.js 未挂载 |
| `AIsiri/README.md`, `README-对话服务.md` | 旧文档（新文档已在 root/doc） |
| 17 个旧测试文件 | 针对旧架构的测试脚本 |

### 新增依赖

| 包名 | 说明 |
|------|------|
| `winston-daily-rotate-file` | 原在 AIsiri/node_modules 中，移到根 backend |

### 修复 Bug

| 编号 | 问题 | 修复 |
|------|------|------|
| B-04 | `messageService.js` 的 `addTaskCreatedMessage` 用 `task.scheduledTime` 取时间，但后端返回 `task.timeBlock.startTime` | 改为 `task.scheduledTime \|\| task.timeBlock?.startTime \|\| task.time` |
| B-05 | `speechRecognitionService.js` 的 `validateAudioFile` 限制 100MB 但提示"不能超过10MB" | 统一为 `10 * 1024 * 1024` |
| B-06 | `messageService.js` 调用 `handleVoiceDispatchResponse(response, voiceData)` 传了多余参数 | 移除多余的 `voiceData` 参数 |

### 新增文件

| 文件 | 说明 |
|------|------|
| `tests/e2e-verify.sh` | 端到端验证测试脚本（35 项检查） |
| `doc/架构变更说明_LangChain到LangGraph.md` | 完整架构变更技术文档 |

### 验证结果（35/35 通过）

基础连通性 ✅ | 用户认证 ✅ | CRUD 接口 ✅ | LangGraph 调度 ✅ | 废弃文件清理 ✅ | Agent 完整性 ✅

---

## [v1.0.0] - 初始版本

- 基于 if-else 的智能调度服务
- 关键词匹配情绪检测
- 独立的意图识别/对话/任务/调度/MCP 服务
- Vue 3 + Express + MongoDB 全栈实现


框架选型文档 — 创建了 docs/技术选型对比报告.md，对比 AutoGen、CrewAI、LangGraph.js，论证了选择 LangGraph.js 的决策依据。

LangGraph 多智能体架构重构 — 核心改动：

agents/state.js — 定义了 AgentState（LangGraph Annotation），作为智能体间的统一通信协议
agents/llmClient.js — 统一 LLM 调用客户端，支持 chat/chatJSON 双模式
agents/routerAgent.js — 中央路由与协调智能体（Supervisor），单次 LLM 调用完成意图+情绪+实体一体化分析
agents/taskAgent.js — 任务管理与优化智能体
agents/scheduleAgent.js — 动态调度智能体
agents/emotionAgent.js — 情感陪伴智能体（结果聚合+共情回复）
agents/toolAgent.js — 外部工具智能体（天气/路线）
agents/graph.js — LangGraph StateGraph 图定义与编译
重写了 intelligentDispatchService.js，改为调用 LangGraph 图
情感检测升级 — 从关键词匹配改为 Router Agent 内置 LLM 情绪分析（7 种情绪 + 强度 + 触发因素）；Emotion Agent 使用情绪响应策略矩阵生成共情回应。

用户记忆智能体 — 创建了 models/UserProfile.js（MongoDB 用户画像模型）和 agents/memoryAgent.js（加载/保存用户记忆），集成 LangGraph MemorySaver 进行 Checkpoint。

前端事件名修复 — 将 Task.vue 中的 ai-plan-generated 修正为 ai-dispatch-completed，与 messageService.js 中的派发事件名统一。修复了 app.js 路由注册顺序避免认证拦截。

论文大纲文档 — 生成了 论文大纲_基于多智能体协同架构的AI时间管家系统.md，包含完整的七章结构、摘要、图表规划、参考文献和附录。

测试方案 — 创建了 tests/testPlan.md（完整测试方案文档）和三个自动化测试脚本：

intentTest.js — 30 条意图识别测试用例
emotionTest.js — 40 条情绪识别测试用例（含混淆矩阵）
latencyTest.js — 6 个场景的多智能体协同延迟测试


修复 1：快捷按钮 UX 优化
问题：点击快捷按钮后，用户消息和 AI 回复同时出现，看不到自己发出的 query
方案：拆分 processUserInput 为 addUserMessage（立即展示）+ dispatchAndRespond（异步调度），在 AiSecretary.vue 中先更新 UI 显示用户消息，再显示加载动画，最后渲染 AI 回复
修改文件：messageService.js, AiSecretary.vue
修复 2：scheduleAgent 任务操控能力
问题：AI 秘书只会"建议"日程调整，不会真正操作数据库
方案：新增 executeRecommendations() 函数，支持四种数据库操作：
update：修改任务的时间/优先级/象限
reschedule：移动任务到新日期/时间块
create：创建全新任务
delete：删除重复或无用任务
验证结果：
"把复习英语优先级调高" → 数据库 priority: medium→high ✅
"帮我整理重复任务" → 识别为 SCHEDULE_PLANNING 并删除重复 ✅
"明天下午2点和同学自习" → 创建新任务 ✅
修改文件：scheduleAgent.js, routerAgent.js, intelligentDispatchService.js, messageService.js
变更已记录到 root/doc/CHANGELOG.md (v2.3.0)。