# AIsiri AI任务助手 API文档

## 📋 概述

AIsiri AI任务助手基于LangChain架构，提供智能任务管理功能，包括输入分类、问题生成、计划制定和任务调整等能力。

## 🚀 快速开始

### 启动测试服务器
```bash
cd backendtimer
node test_server.js
```

服务器将在 `http://localhost:3001` 启动

### 基本请求格式
所有POST请求都需要设置Content-Type为application/json

```bash
curl -X POST http://localhost:3001/api/ai/[endpoint] \
  -H "Content-Type: application/json" \
  -d '{"参数名": "参数值"}'
```

## 📡 API接口

### 1. 健康检查

#### `GET /api/ai/health`
检查AI服务运行状态

**响应示例:**
```json
{
  "success": true,
  "message": "AI服务运行正常",
  "timestamp": "2025-08-05T17:32:01.794Z",
  "uptime": 123.45
}
```

### 2. 系统状态

#### `GET /api/ai/status`
获取AI系统详细状态信息

**响应示例:**
```json
{
  "success": true,
  "status": {
    "ai_service": "running",
    "available_chains": [
      "input_classifier",
      "question_generator",
      "plan_generator",
      "plan_adjuster",
      "habit_processor"
    ],
    "prompt_templates": ["input_classifier", "question_generator", ...],
    "model_info": {
      "model": "qwen-plus",
      "provider": "Qwen/阿里云"
    }
  }
}
```

### 3. AI连接测试

#### `GET /api/ai/test-connection`
测试与大语言模型的连接状态

**响应示例:**
```json
{
  "success": true,
  "message": "AI服务连接正常",
  "model": "qwen-plus",
  "timestamp": "2025-08-05T17:32:01.794Z"
}
```

### 4. 输入分类

#### `POST /api/ai/classify-input`
对用户输入进行分类识别

**请求参数:**
- `userInput` (string, 必需): 用户输入内容

**请求示例:**
```json
{
  "userInput": "取个外卖"
}
```

**响应示例:**
```json
{
  "success": true,
  "userInput": "取个外卖",
  "classification": {
    "category": "simple_todo",
    "confidence": 0.95,
    "reason": "用户输入的是一个简单、一次性的具体任务，不需要长期规划或重复执行。"
  },
  "timestamp": "2025-08-05T17:32:17.838Z"
}
```

**分类类型:**
- `simple_todo`: 简单待办事项（如取外卖、买菜等）
- `goal_planning`: 目标规划（如学编程、考研等）
- `habit_formation`: 习惯养成（如每天跑步、阅读等）

### 5. 问题生成

#### `POST /api/ai/generate-questions`
根据用户目标生成收集信息的问题

**请求参数:**
- `goal` (string, 必需): 用户目标
- `goalType` (string, 必需): 目标类型 (goal_planning | habit_formation)

**请求示例:**
```json
{
  "goal": "学习Python",
  "goalType": "goal_planning"
}
```

**响应示例:**
```json
{
  "success": true,
  "goal": "学习Python",
  "goalType": "goal_planning",
  "questions": {
    "greeting": "嘿！很高兴你决定开始学习Python，我来帮你规划一下～",
    "questions": [
      "你学习Python的具体目标是什么？比如是想做数据分析、网站开发，还是自动化脚本等等？",
      "你希望在多长时间内达到这个目标呢？比如一个月、三个月，还是更灵活一些？",
      "你现在对Python的了解程度如何？是完全零基础，还是已经了解一些基本语法？",
      "你每天大概能抽出多少时间来学习Python？比如30分钟、1小时，还是更多？",
      "在学习过程中，你遇到过什么困难吗？或者你觉得可能会遇到哪些挑战？"
    ]
  },
  "timestamp": "2025-08-05T17:32:31.198Z"
}
```

### 6. 主要处理流程

#### `POST /api/ai/process-input`
处理用户输入的主要API，包含分类、问题生成等完整流程

**请求参数:**
- `userInput` (string, 必需): 用户输入内容
- `userId` (string, 可选): 用户ID

**请求示例:**
```json
{
  "userInput": "我想学习JavaScript",
  "userId": "test-user-123"
}
```

**响应示例（目标规划类型）:**
```json
{
  "success": true,
  "timestamp": "2025-08-05T17:32:45.143Z",
  "request": {
    "userInput": "我想学习JavaScript",
    "userId": "test-user-123"
  },
  "type": "goal_planning",
  "classification": {
    "category": "goal_planning",
    "confidence": 0.9,
    "reason": "学习JavaScript是一个需要长期规划和分步骤实现的目标，涉及到系统性学习和技能提升。"
  },
  "result": {
    "goal": "我想学习JavaScript",
    "questions": {
      "greeting": "嗨！很高兴你决定学习 JavaScript，我来帮你一起规划一个适合你的学习计划吧～",
      "questions": [
        "你学习 JavaScript 的具体目标是什么？比如是想做网页开发、开发应用，还是只是为了兴趣？",
        "你大概希望在多长时间内掌握 JavaScript 的基础知识呢？比如三个月还是半年？",
        "你现在对编程或 JavaScript 的了解程度如何？有没有相关的基础或者经验？",
        "每天你大概能抽出多少时间来学习 JavaScript？比如是早上、晚上，还是周末有空？",
        "你在学习过程中遇到过哪些困难？或者你觉得在学习 JavaScript 时最大的挑战会是什么？"
      ]
    },
    "next_step": "collect_answers",
    "message": "嗨！很高兴你决定学习 JavaScript，我来帮你一起规划一个适合你的学习计划吧～"
  }
}
```

### 7. 计划生成

#### `POST /api/ai/generate-plan`
根据用户回答生成详细的执行计划

**请求参数:**
- `goal` (string, 必需): 用户目标
- `goalType` (string, 必需): 目标类型
- `userAnswers` (array, 必需): 用户回答数组
- `userId` (string, 可选): 用户ID

**请求示例:**
```json
{
  "goal": "学习JavaScript",
  "goalType": "goal_planning",
  "userAnswers": [
    "网页开发",
    "3个月",
    "有HTML基础",
    "每天2小时",
    "理解复杂概念"
  ],
  "userId": "test-user-123"
}
```

**响应格式:**
```json
{
  "success": true,
  "type": "plan_generated",
  "result": {
    "message": "已为你的目标\"学习JavaScript\"制定了详细计划！",
    "plan": {
      "plan_overview": "计划概述",
      "collections": [
        {
          "name": "任务集名称",
          "description": "任务集描述",
          "tasks": [
            {
              "title": "任务标题",
              "description": "任务描述",
              "priority": "high|medium|low",
              "quadrant": 1-4,
              "timeBlock": {
                "timeBlockType": "morning|forenoon|afternoon|evening",
                "startTime": "09:00",
                "endTime": "11:00"
              },
              "dueDate": "2025-08-10",
              "tags": ["标签1", "标签2"]
            }
          ]
        }
      ],
      "suggestions": "执行建议"
    },
    "summary": {
      "collections_count": 3,
      "tasks_count": 15,
      "estimated_duration": "待计算"
    }
  }
}
```

### 8. 计划调整

#### `POST /api/ai/adjust-plan`
根据用户反馈调整现有计划

**请求参数:**
- `planId` (string, 必需): 计划ID
- `userFeedback` (string, 必需): 用户反馈
- `userId` (string, 可选): 用户ID

**请求示例:**
```json
{
  "planId": "plan-123",
  "userFeedback": "任务太多了，我完成不了",
  "userId": "test-user-123"
}
```

**响应格式:**
```json
{
  "success": true,
  "type": "plan_adjusted",
  "result": {
    "message": "已根据你的反馈调整计划：减少任务量，延长执行时间",
    "adjustment": {
      "adjustment_summary": "调整概述",
      "mood_analysis": "情绪分析结果",
      "changes": [
        {
          "type": "modify",
          "target": "任务ID",
          "description": "变更描述",
          "reason": "变更原因"
        }
      ],
      "encouragement": "鼓励语句"
    }
  }
}
```

## 📊 时间段定义

- `morning`: 06:00-09:00 (早晨)
- `forenoon`: 09:00-12:00 (上午)
- `afternoon`: 12:00-18:00 (下午)
- `evening`: 18:00-23:00 (晚上)
- `unscheduled`: 未安排具体时间

## 🎯 优先级定义

- `high`: 高优先级（重要且紧急）
- `medium`: 中优先级（重要但不紧急）
- `low`: 低优先级（不重要不紧急）

## 📈 四象限分类

- `1`: 重要且紧急
- `2`: 重要不紧急
- `3`: 紧急不重要
- `4`: 不重要不紧急

## ❌ 错误处理

所有API在发生错误时都会返回以下格式：

```json
{
  "success": false,
  "error": "错误描述",
  "details": "详细错误信息",
  "timestamp": "2025-08-05T17:32:01.794Z"
}
```

常见错误码：
- `400`: 请求参数错误
- `500`: 服务器内部错误
- `503`: AI服务连接失败

## 🔧 使用示例

### 完整工作流程示例

1. **用户输入处理**
```bash
curl -X POST http://localhost:3001/api/ai/process-input \
  -H "Content-Type: application/json" \
  -d '{"userInput": "我想学习Python", "userId": "user123"}'
```

2. **收集用户回答后生成计划**
```bash
curl -X POST http://localhost:3001/api/ai/generate-plan \
  -H "Content-Type: application/json" \
  -d '{
    "goal": "学习Python",
    "goalType": "goal_planning",
    "userAnswers": ["数据分析", "3个月", "无基础", "每天1小时", "理解语法"],
    "userId": "user123"
  }'
```

3. **根据反馈调整计划**
```bash
curl -X POST http://localhost:3001/api/ai/adjust-plan \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "plan123",
    "userFeedback": "时间不够",
    "userId": "user123"
  }'
```

## 📝 注意事项

1. 所有时间戳都采用ISO 8601格式
2. 用户ID虽然是可选的，但建议在生产环境中使用以支持多用户
3. AI模型响应时间可能较长（5-15秒），请设置合适的超时时间
4. 建议在生产环境中实现请求限流和缓存机制

## 🛠️ 开发环境

- Node.js版本：v18+
- 依赖的主要包：
  - express: Web框架
  - openai: LLM客户端
  - mongoose: MongoDB数据库
  - cors: 跨域支持

## 📞 支持

如有问题请联系开发团队或查看错误日志。