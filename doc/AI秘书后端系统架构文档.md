# AIsiri — AI 秘书后端系统架构文档

> 版本：v2.0 | 日期：2026-03-23 | 基于 LangGraph.js 多智能体架构（统一通道）

---

## 一、系统总览

AIsiri 是一套基于 **LangGraph.js StateGraph** 的多智能体协同系统，采用 **Supervisor（监督者）模式** 编排多个专项智能体，实现自然语言驱动的任务管理、日程规划和情感陪伴。系统已完成架构统一，所有请求通过单一 LangGraph 通道处理。

### 核心技术栈

| 层次 | 技术 |
|------|------|
| 运行时 | Node.js + Express |
| 智能体编排 | LangGraph.js (`@langchain/langgraph`) |
| LLM 模型 | 通义千问 `qwen-plus`（阿里云 DashScope） |
| 图片分析 | 通义千问 VL 多模态模型（`qwen-vl-max`） |
| 数据库 | MongoDB（Mongoose ODM） |
| 日志 | Winston + daily-rotate-file |

---

## 二、整体架构图

```mermaid
graph TB
    subgraph 客户端
        FE[前端 Vue App]
    end

    subgraph Express 应用层
        APP[app.js<br/>路由注册 & 中间件]
        AUTH[authenticateToken<br/>JWT 认证中间件]
    end

    subgraph 路由层 Routes
        R1[intelligentDispatchRoutes<br/>POST /api/aisiri/dispatch]
    end

    subgraph 控制器层 Controllers
        C1[intelligentDispatchController]
    end

    subgraph 服务层 Services
        S1[intelligentDispatchService<br/>LangGraph 入口]
    end

    subgraph LangGraph 多智能体图
        GRAPH[StateGraph 编排引擎]
    end

    FE -->|HTTP| APP
    APP --> AUTH
    AUTH --> R1
    R1 --> C1 --> S1
    S1 -->|graph.invoke| GRAPH

    style GRAPH fill:#4A90D9,stroke:#2C5F8A,color:#fff
    style S1 fill:#5BA85B,stroke:#3D7A3D,color:#fff
```

---

## 三、LangGraph 多智能体协同图（核心）

这是整个系统最关键的部分。用户输入通过 `intelligentDispatchService` 进入 LangGraph StateGraph，由以下节点按顺序 / 条件执行：

```mermaid
graph LR
    START((START)) --> LM[loadMemory<br/>记忆加载]
    LM --> RT[router<br/>中央路由]

    RT -->|TASK_CREATION| TA[taskAgent<br/>任务创建]
    RT -->|SCHEDULE_PLANNING| SA[scheduleAgent<br/>日程规划]
    RT -->|CONVERSATION| EA[emotionAgent<br/>情感陪伴]

    TA --> EA
    SA --> EA

    EA --> SM[saveMemory<br/>记忆保存]
    SM --> END_NODE((END))

    style RT fill:#E8A838,stroke:#B87C1E,color:#fff
    style EA fill:#D94A7A,stroke:#A8325A,color:#fff
    style TA fill:#4A90D9,stroke:#2C5F8A,color:#fff
    style SA fill:#5BA85B,stroke:#3D7A3D,color:#fff
    style LM fill:#7F8C8D,stroke:#5D6D7E,color:#fff
    style SM fill:#7F8C8D,stroke:#5D6D7E,color:#fff
```

### 路由决策逻辑

```mermaid
flowchart TD
    INPUT[用户输入] --> ROUTER{routerAgent<br/>单次 LLM 调用}

    ROUTER -->|解析结果| INTENTS[detectedIntents 数组]

    INTENTS -->|包含 TASK_CREATION| T1[→ taskAgent]
    INTENTS -->|包含 SCHEDULE_PLANNING| T2[→ scheduleAgent]
    INTENTS -->|仅 CONVERSATION 或 fallback| T4[→ emotionAgent]

    T1 & T2 -->|执行完毕| MERGE[→ emotionAgent 汇总]
    T4 --> MERGE

    MERGE --> RESP[最终回复 finalResponse]
```

> **关键设计**：Router 支持多意图并行分发。例如"帮我创建明天下午3点开会的任务，再帮我规划一下今天的安排"会同时触发 `taskAgent` + `scheduleAgent`。

---

## 四、各智能体详细说明

### 4.1 共享状态 `AgentState`

所有智能体通过 LangGraph `Annotation.Root` 共享以下状态：

```mermaid
classDiagram
    class AgentState {
        +String userInput
        +String userId
        +String sessionId
        +String primaryIntent
        +String[] detectedIntents
        +Object emotionState
        +Object extractedEntities
        +String imageContext
        +Object agentResults
        +Object userProfile
        +Array conversationHistory
        +String finalResponse
        +String assistantName
        +String requestId
        +Number startTime
    }
```

| 字段 | reducer | 说明 |
|------|---------|------|
| `userInput` | 覆盖 | 当前用户输入文本 |
| `primaryIntent` | 覆盖 | 主意图 |
| `detectedIntents` | 覆盖 | 所有检测到的意图数组 |
| `emotionState` | 覆盖 | `{emotion, confidence, triggers}` |
| `extractedEntities` | 覆盖 | `{tasks[], time, location, date}` |
| `agentResults` | **合并** | 各 agent 按 key 写入结果 |
| `userProfile` | 覆盖 | 用户画像（从 MongoDB 加载） |
| `finalResponse` | 覆盖 | 最终回复文本 |

---

### 4.2 RouterAgent — 中央路由

```mermaid
flowchart TD
    subgraph RouterAgent
        A[接收 userInput] --> B{检测图片?}
        B -->|是| C[调用 qwen-vl-max<br/>图片分析]
        B -->|否| D[增强输入 = 原始输入]
        C --> D
        D --> E[构造 Prompt<br/>+ 当前时间信息]
        E --> F[llmClient.chatJSON<br/>qwen-plus / temp=0.1]
        F --> G[解析 JSON 结果]
        G --> H[输出: primaryIntent<br/>detectedIntents<br/>emotionState<br/>extractedEntities]
    end
```

| 属性 | 值 |
|------|-----|
| **使用模型** | `qwen-plus`（通过 llmClient） |
| **Temperature** | 0.1 |
| **Max Tokens** | 800 |
| **输出格式** | 结构化 JSON |
| **核心能力** | 意图识别 + 情绪检测 + 实体提取（一次调用完成） |
| **图片处理** | 检测到图片 URL 时调用 `qwen-vl-max` 获取图片描述 |

**支持的意图类型（3 类）：**

| 意图 | 描述 | 触发示例 |
|------|------|----------|
| `TASK_CREATION` | 创建新任务 | "帮我记一下明天开会" |
| `SCHEDULE_PLANNING` | 日程规划/整理 | "帮我规划今天的安排" |
| `CONVERSATION` | 闲聊/情感交流 | "好累啊，不想上班" |

**支持的情绪类型（8 类）：**

| 情绪 | 描述 |
|------|------|
| `happy` | 开心、愉悦 |
| `sad` | 悲伤、低落 |
| `angry` | 愤怒、烦躁 |
| `anxious` | 焦虑、紧张 |
| `neutral` | 平静、无明显情绪 |
| `excited` | 兴奋、激动 |
| `tired` | 疲惫、倦怠 |
| `confused` | 困惑、迷茫 |

---

### 4.3 TaskAgent — 任务创建

```mermaid
flowchart TD
    subgraph TaskAgent
        A[读取 extractedEntities] --> B{entities.tasks 非空?}
        B -->|是| C[解析任务列表]
        B -->|否| D[从 userInput 提取任务名]
        C --> E[parseDate 解析日期<br/>parseTimeBlock 解析时间块<br/>parseSpecificTime 解析具体时间]
        D --> E
        E --> F[通过 Task 模型写入 MongoDB]
        F --> G[输出 agentResults.taskCreation<br/>success / tasks / count]
    end
```

| 属性 | 值 |
|------|-----|
| **使用模型** | 无（纯规则引擎） |
| **数据库模型** | `Task`, `Collection` |
| **时间块** | morning / forenoon / afternoon / evening |
| **优先级** | 四象限分配 |

---

### 4.4 ScheduleAgent — 日程规划

```mermaid
flowchart TD
    subgraph ScheduleAgent
        A[查询目标日期的已有任务] --> B[构造 Prompt<br/>含任务列表 + 情绪]
        B --> C[llmClient.chatJSON<br/>qwen-plus / temp=0.3]
        C --> D[解析 recommendations]
        D --> E[autoDeduplicateTasks<br/>自动去重]
        E --> F[executeRecommendations<br/>执行 update/create/delete]
        F --> G[输出 agentResults.schedulePlanning]
    end
```

| 属性 | 值 |
|------|-----|
| **使用模型** | `qwen-plus`（通过 llmClient） |
| **Temperature** | 0.3 |
| **Max Tokens** | 1500 |
| **Timeout** | 45000ms |
| **操作类型** | update / reschedule / create / delete |
| **特殊功能** | 按标题+日期+时间自动去重 |

---

### 4.5 EmotionAgent — 情感陪伴

```mermaid
flowchart TD
    subgraph EmotionAgent
        A[获取 assistantName<br/>从 AIAssistant 模型] --> B[获取最近对话历史<br/>从 Conversation 模型]
        B --> P[加载用户画像<br/>UserProfile 偏好 & 情绪趋势]
        P --> C[汇总 agentResults<br/>taskCreation + schedulePlanning]
        C --> D[构造情感回复 Prompt<br/>含情绪 + 用户画像 + 已完成操作]
        D --> E[llmClient.chat<br/>qwen-plus / temp=0.7]
        E --> F[保存对话到 Conversation]
        F --> G[输出 finalResponse<br/>+ assistantName]
    end
```

| 属性 | 值 |
|------|-----|
| **使用模型** | `qwen-plus`（通过 llmClient） |
| **Temperature** | 0.7（更有创造性） |
| **Max Tokens** | 500 |
| **核心职责** | 汇总所有 agent 结果，生成温暖、人格化的最终回复 |
| **数据持久化** | 用户消息 + AI 回复写入 `Conversation` 集合 |

**v2.0 新增能力：**

| 能力 | 说明 |
|------|------|
| **用户画像利用** | 从 `UserProfile` 读取用户偏好（如称呼习惯、语气偏好），个性化回复风格 |
| **情绪趋势感知** | 分析 `emotionHistory` 近期趋势，当连续负面情绪时主动增强关怀表达 |
| **交互深度意识** | 根据 `interactionCount` 区分新用户与老用户，调整回复的亲密度和引导方式 |

---

### 4.6 MemoryAgent — 记忆管理

```mermaid
flowchart LR
    subgraph loadUserMemory
        A[按 userId 查询 UserProfile] --> B{存在?}
        B -->|是| C[加载 userProfile]
        B -->|否| D[创建新 UserProfile]
        C --> E[加载任务完成率统计]
        D --> E
        E --> F[返回 userProfile + 完成率 + 初始 agentResults]
    end

    subgraph saveUserMemory
        G[读取 emotionState] --> H[追加到 emotionHistory]
        H --> I[更新 interactionCount / lastActiveAt]
        I --> J[自适应偏好调整]
        J --> K[保存到 MongoDB]
    end
```

| 属性 | 值 |
|------|-----|
| **使用模型** | 无 |
| **数据库模型** | `UserProfile` |
| **保存内容** | 情绪历史、交互次数、最后活跃时间、用户偏好 |

**v2.0 新增能力：**

| 能力 | 说明 |
|------|------|
| **任务完成率加载** | `loadUserMemory` 阶段统计用户近期任务完成率，供下游 agent 参考（如日程建议强度） |
| **自适应偏好调整** | `saveUserMemory` 阶段根据交互模式自动更新用户偏好（如常用时间块、偏好的回复风格） |

---

## 五、LLM 调用链路

```mermaid
sequenceDiagram
    participant U as 用户
    participant S as intelligentDispatchService
    participant G as StateGraph
    participant R as routerAgent
    participant TA as taskAgent
    participant SA as scheduleAgent
    participant EA as emotionAgent
    participant LLM as qwen-plus<br/>(DashScope API)
    participant DB as MongoDB

    U->>S: processUserInput(userInput)
    S->>G: graph.invoke(initialState)

    G->>DB: loadUserMemory → 查询 UserProfile + 任务完成率
    DB-->>G: userProfile

    G->>R: routerAgent(state)
    R->>LLM: chatJSON(意图+情绪+实体提取)<br/>temp=0.1, maxTokens=800
    LLM-->>R: JSON{primaryIntent, emotion, entities}

    alt TASK_CREATION
        G->>TA: taskAgent(state)
        TA->>DB: Task.create(任务数据)
        DB-->>TA: 创建结果
    end

    alt SCHEDULE_PLANNING
        G->>SA: scheduleAgent(state)
        SA->>DB: Task.find(目标日期任务)
        SA->>LLM: chatJSON(日程建议)<br/>temp=0.3, maxTokens=1500
        LLM-->>SA: recommendations
        SA->>DB: 执行 CRUD 操作
    end

    G->>EA: emotionAgent(state)
    EA->>DB: 加载用户画像 & 情绪趋势
    EA->>LLM: chat(情感回复生成)<br/>temp=0.7, maxTokens=500
    LLM-->>EA: 温暖回复文本
    EA->>DB: Conversation.create(对话记录)

    G->>DB: saveUserMemory → 更新 UserProfile + 自适应偏好

    G-->>S: {finalResponse, agentResults}
    S-->>U: 统一响应
```

---

## 六、目录结构 & 文件职责

```
backend/src/AIsiri/
├── agents/                          # 🧠 LangGraph 多智能体核心
│   ├── state.js                     # 共享状态定义 (Annotation.Root)
│   ├── graph.js                     # StateGraph 编排 (Supervisor 模式)
│   ├── llmClient.js                 # 统一 LLM 客户端 (qwen-plus)
│   ├── routerAgent.js               # 中央路由 (意图+情绪+实体 一次提取)
│   ├── taskAgent.js                 # 任务创建 (规则引擎，无 LLM)
│   ├── scheduleAgent.js             # 日程规划 (LLM 生成建议 + DB 执行)
│   ├── emotionAgent.js              # 情感陪伴 (LLM 生成温暖回复 + 画像感知)
│   └── memoryAgent.js               # 记忆管理 (UserProfile 读写 + 自适应偏好)
│
├── services/                        # 📦 业务服务层（仅保留统一入口）
│   └── intelligentDispatchService.js # ★ LangGraph 入口，调用 graph.invoke()
│
├── controllers/                     # 🎮 请求处理器（仅保留统一入口）
│   └── intelligentDispatchController.js
│
├── routes/                          # 🛤️ API 路由
│   └── intelligentDispatchRoutes.js # POST /api/aisiri/dispatch
│
├── utils/                           # 🛠️ 工具
│   └── logger.js                    # Winston 日志 (按日轮转)
│
├── tests/                           # 🧪 测试
│   ├── latencyTest.js               # 多场景延迟测试
│   ├── intentTest.js                # 意图识别准确率测试
│   ├── emotionTest.js               # 情绪识别准确率测试
│   ├── userBehaviorTest.js          # 端到端用户行为模拟
│   ├── e2e-verify.sh               # 端到端验证脚本
│   └── testPlan.md                  # 测试方案文档
│
├── docs/                            # 📄 技术文档
│   └── 技术选型对比报告.md
│
└── logs/                            # 📋 运行日志 (运行时生成)
```

---

## 七、架构统一说明

系统已完成从"双通道并行"到"单一 LangGraph 通道"的架构统一。原有的旧架构（通道 B）中的独立服务已全部移除，所有请求统一经由 LangGraph StateGraph 处理。

```mermaid
graph TB
    subgraph "统一架构 — LangGraph 多智能体"
        A1[POST /api/aisiri/dispatch] --> A2[intelligentDispatchService]
        A2 --> A3[graph.invoke → StateGraph]
        A3 --> A4[routerAgent → 意图分发]
        A4 --> A5[taskAgent / scheduleAgent]
        A5 --> A6[emotionAgent → 最终回复]
        A3 --> A7[memoryAgent<br/>记忆加载 & 保存]
    end

    subgraph "已移除的旧架构组件"
        B1[conversationService ❌]
        B2[intentRecognitionService ❌]
        B3[taskRecognitionService ❌]
        B4[gaodeMcpClient ❌]
    end

    style A1 fill:#5BA85B,stroke:#3D7A3D,color:#fff
    style A3 fill:#4A90D9,stroke:#2C5F8A,color:#fff
    style B1 fill:#BDC3C7,stroke:#95A5A6,color:#7F8C8D
    style B2 fill:#BDC3C7,stroke:#95A5A6,color:#7F8C8D
    style B3 fill:#BDC3C7,stroke:#95A5A6,color:#7F8C8D
    style B4 fill:#BDC3C7,stroke:#95A5A6,color:#7F8C8D
```

### 统一前后对比

| 能力 | 统一前（双通道） | 统一后（单通道） |
|------|------------------|------------------|
| 意图识别 | `routerAgent` + `intentRecognitionService` 冗余 | `routerAgent` 统一处理 |
| 情绪检测 | `routerAgent` + `conversationService.detectEmotion` 冗余 | `routerAgent` 统一处理 |
| 任务创建 | `taskAgent` + `taskRecognitionService` 冗余 | `taskAgent` 统一处理 |
| 对话生成 | `emotionAgent` + `conversationService` 冗余 | `emotionAgent` 统一处理 |
| 日程规划 | 仅通道 A | `scheduleAgent` |
| 用户记忆 | 仅通道 A | `memoryAgent` |

### 统一带来的收益

- **消除冗余**：移除 5 个旧服务文件，LLM 调用点从 5 处减少到 3 处
- **统一入口**：前端仅需对接 `/api/aisiri/dispatch` 单一端点
- **一致性**：所有用户输入经过相同的意图识别 → 任务处理 → 情感回复流程
- **可维护性**：代码量减少，调试链路清晰，Prompt 管理集中化

---

## 八、模型调用全景

```mermaid
graph LR
    subgraph "模型: qwen-plus（通义千问）"
        M1[DashScope API<br/>https://dashscope.aliyuncs.com/compatible-mode/v1]
    end

    subgraph "LangGraph 调用点"
        CA1[routerAgent<br/>temp=0.1 / 800 tokens<br/>chatJSON]
        CA2[scheduleAgent<br/>temp=0.3 / 1500 tokens<br/>chatJSON]
        CA3[emotionAgent<br/>temp=0.7 / 500 tokens<br/>chat]
    end

    subgraph "多模态调用"
        IMG[imageAnalysisService<br/>模型: qwen-vl-max<br/>图片→文字描述]
    end

    CA1 & CA2 & CA3 -->|llmClient 统一封装| M1
    IMG -->|独立调用| M1

    style M1 fill:#E8A838,stroke:#B87C1E,color:#fff
    style IMG fill:#9B59B6,stroke:#7D3E98,color:#fff
```

### LLM 调用汇总表

| 调用位置 | 模型 | 温度 | Max Tokens | 调用方式 | 输出格式 | 目的 |
|----------|------|------|------------|----------|----------|------|
| routerAgent | qwen-plus | 0.1 | 800 | llmClient.chatJSON | JSON | 意图+情绪+实体提取 |
| scheduleAgent | qwen-plus | 0.3 | 1500 | llmClient.chatJSON | JSON | 日程建议生成 |
| emotionAgent | qwen-plus | 0.7 | 500 | llmClient.chat | 自然语言 | 最终回复生成 |
| imageAnalysisService | qwen-vl-max | — | — | 独立调用 | 文字描述 | 图片内容分析 |

---

## 九、数据模型

```mermaid
erDiagram
    User ||--o{ Task : creates
    User ||--o{ Collection : owns
    User ||--o| UserProfile : has
    User ||--o{ Conversation : participates
    User ||--o| AIAssistant : customizes

    Task {
        ObjectId _id
        ObjectId userId
        String title
        String date
        String timeBlock
        String specificTime
        Number priority
        Boolean completed
    }

    Collection {
        ObjectId _id
        ObjectId userId
        String name
        ObjectId[] tasks
    }

    UserProfile {
        ObjectId _id
        ObjectId userId
        Array emotionHistory
        Number interactionCount
        Date lastActiveAt
    }

    Conversation {
        ObjectId _id
        ObjectId userId
        String sessionId
        String role
        String content
        Date timestamp
    }

    AIAssistant {
        ObjectId _id
        ObjectId userId
        String name
        Object personality
    }
```

---

## 十、API 端点总览

| 路径 | 方法 | 认证 | 功能 |
|------|------|------|------|
| `/api/aisiri/dispatch` | POST | ✅ | 智能调度主入口（LangGraph 统一入口） |
| `/api/aisiri/dispatch/status` | GET | ❌ | 服务状态检查 |
| `/api/aisiri/dispatch/test` | POST | 可选 | 内置测试用例 |

---

## 十一、环境变量依赖

| 变量名 | 用途 | 使用位置 |
|--------|------|----------|
| `DASHSCOPE_API_KEY` | 通义千问 API 密钥 | llmClient（统一封装） |
| `MONGODB_URI` | MongoDB 连接串 | 全局数据库连接 |
| `JWT_SECRET` | JWT 签名密钥 | auth 中间件 |
| `OSS_REGION` | 阿里云 OSS 区域 | routerAgent（图片 URL） |
| `OSS_BUCKET` | 阿里云 OSS 存储桶 | routerAgent（图片 URL） |

---

## 十二、总结

AIsiri 的核心架构是基于 LangGraph.js 的 **Supervisor 多智能体协同系统**。系统已完成架构统一，原有的旧独立服务（通道 B）已全部移除，所有请求通过单一 LangGraph StateGraph 通道处理。当前架构包含 5 个核心智能体（routerAgent、taskAgent、scheduleAgent、emotionAgent、memoryAgent），通过 3 次 LLM 调用完成从意图识别到情感回复的全流程，具备良好的可扩展性和可维护性。
