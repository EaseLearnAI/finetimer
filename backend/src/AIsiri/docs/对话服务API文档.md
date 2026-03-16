# AI Siri 对话服务 API 文档

本文档详细描述了 AI Siri 对话服务的 RESTful API 接口，包括意图识别和智能对话功能，方便前端或其他服务进行集成调用。

---

## 1. 服务概览

AI Siri 对话服务是一个综合性的AI助手系统，集成了以下核心功能：

### 1.1 意图识别
基于通义千问大模型，能够对用户输入的自然语言进行分析，并将其意图归类为以下四种主要类型：
- **CONVERSATION**: 正常对话（包含情绪安慰、聊天）
- **TASK_CREATION**: 任务新增（包含取快递等短期任务和习惯养成）
- **SCHEDULE_PLANNING**: 时间调度（根据后端数据库返回的任务和具体的时间，进行对应的排列组合）
- **EXTERNAL_TOOL**: 外部工具调用（比如要到哪里去，那这个时候就需要用高德地图、天气查询等）

### 1.2 智能对话
针对CONVERSATION类型的用户输入，提供温暖、智能的对话回应，包括：
- 情绪检测与安慰
- 上下文感知的连续对话
- 个性化的回应风格
- 完整的对话历史管理

**基础 URL**: `http://localhost:3000` (主服务端口)  
**认证方式**: JWT Bearer Token

---

## 2. 认证方式

### 2.1 用户注册
```http
POST /api/users/register
Content-Type: application/json

{
  "phoneNumber": "13800138001",
  "password": "123456",
  "nickname": "用户昵称"
}
```

### 2.2 用户登录
```http
POST /api/users/login
Content-Type: application/json

{
  "phoneNumber": "13800138001",
  "password": "123456"
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "673f1234567890abcdef1234",
      "phoneNumber": "13800138001",
      "nickname": "用户昵称"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2.3 认证方式
所有需要认证的API都需要在请求头中包含JWT令牌：
```http
Authorization: Bearer <your_jwt_token>
```

---

## 3. 对话服务 API

### 3.1 发送对话消息

**接口地址**: `POST /api/ai/conversation/send`  
**描述**: 发送对话消息给AI助手  
**认证**: 需要  

**请求参数**:
```json
{
  "message": "你好，我今天心情不太好",
  "sessionId": "可选的会话ID，用于继续之前的对话"
}
```

**成功响应示例**:
```json
{
  "success": true,
  "data": {
    "sessionId": "conv-1234567890",
    "userMessage": {
      "id": "msg-user-123",
      "content": "你好，我今天心情不太好",
      "timestamp": "2025-08-17T12:00:00Z",
      "intent": "CONVERSATION",
      "confidence": 0.95
    },
    "assistantMessage": {
      "id": "msg-ai-124",
      "content": "我能理解你现在的感受，有什么想聊的吗？我在这里陪着你 🤗",
      "timestamp": "2025-08-17T12:00:03Z",
      "emotion": "sad"
    },
    "metadata": {
      "processingTime": 2850,
      "intentInfo": {
        "intent": "CONVERSATION",
        "confidence": 0.95,
        "reasoning": "用户表达了情绪状态，属于感情表达类的正常对话"
      },
      "conversationStats": {
        "historyCount": 0,
        "emotion": "sad"
      }
    }
  },
  "processingTime": 2850
}
```

**错误响应示例**:
```json
{
  "success": false,
  "error": "该消息不属于对话类型，请使用相应的功能模块处理",
  "code": "WRONG_INTENT_TYPE",
  "intent": "TASK_CREATION",
  "suggestion": "请使用任务管理功能来创建和管理您的待办事项"
}
```

### 3.2 获取对话历史

**接口地址**: `GET /api/ai/conversation/history`  
**描述**: 获取用户的对话历史记录  
**认证**: 需要  

**查询参数**:
- `sessionId` (可选): 特定会话ID
- `limit` (可选): 限制数量，默认20，最大100
- `skip` (可选): 跳过数量，默认0
- `includeStats` (可选): 是否包含统计信息，默认false

**请求示例**:
```http
GET /api/ai/conversation/history?sessionId=conv-1234567890&limit=10&includeStats=true
Authorization: Bearer <your_jwt_token>
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "conversations": [
      {
        "_id": "msg-123",
        "sessionId": "conv-1234567890",
        "messageType": "user",
        "content": "你好，我今天心情不太好",
        "intent": "CONVERSATION",
        "createdAt": "2025-08-17T12:00:00Z"
      },
      {
        "_id": "msg-124",
        "sessionId": "conv-1234567890",
        "messageType": "assistant",
        "content": "我能理解你现在的感受，有什么想聊的吗？",
        "createdAt": "2025-08-17T12:00:03Z"
      }
    ],
    "pagination": {
      "limit": 10,
      "skip": 0,
      "count": 2
    },
    "stats": {
      "user": {
        "count": 1,
        "totalLength": 11,
        "avgLength": 11
      },
      "assistant": {
        "count": 1,
        "totalLength": 24,
        "avgLength": 24
      }
    }
  },
  "processingTime": 15
}
```

### 3.3 获取会话列表

**接口地址**: `GET /api/ai/conversation/sessions`  
**描述**: 获取用户的会话列表  
**认证**: 需要  

**查询参数**:
- `limit` (可选): 限制数量，默认10，最大50

**响应示例**:
```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "sessionId": "conv-1234567890",
        "lastMessage": "我能理解你现在的感受",
        "lastMessageType": "assistant",
        "lastActivity": "2025-08-17T12:00:03Z",
        "messageCount": 2
      }
    ]
  },
  "processingTime": 25
}
```

### 3.4 删除对话历史

**接口地址**: `DELETE /api/ai/conversation/history`  
**描述**: 删除对话历史记录  
**认证**: 需要  

**查询参数**:
- `sessionId` (可选): 删除特定会话，不提供则删除所有对话

**响应示例**:
```json
{
  "success": true,
  "data": {
    "deletedCount": 15,
    "message": "会话已删除"
  },
  "processingTime": 45
}
```

### 3.5 服务健康检查

**接口地址**: `GET /api/ai/conversation/health`  
**描述**: 检查对话服务健康状态  
**认证**: 不需要  

**响应示例**:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "model": "qwen-plus",
    "services": {
      "intentRecognition": "healthy",
      "database": "healthy",
      "aiModel": "healthy"
    },
    "responseTime": 1250,
    "timestamp": "2025-08-17T12:00:00Z"
  },
  "processingTime": 1252
}
```

### 3.6 获取服务统计

**接口地址**: `GET /api/ai/conversation/stats`  
**描述**: 获取对话服务的统计信息  
**认证**: 需要  

**响应示例**:
```json
{
  "success": true,
  "data": {
    "service": "conversation",
    "version": "1.0.0",
    "uptime": 3600.5,
    "memory": {
      "rss": 89234432,
      "heapTotal": 45678912,
      "heapUsed": 32145678,
      "external": 2345678,
      "arrayBuffers": 567890
    },
    "userStats": {
      "hasHistory": true,
      "lastConversation": "2025-08-17T12:00:00Z"
    },
    "timestamp": "2025-08-17T12:00:00Z"
  },
  "processingTime": 5
}
```

---

## 4. 意图识别 API

### 4.1 意图识别

**接口地址**: `POST /api/ai/intent/recognize`  
**描述**: 识别用户输入的意图类型  
**认证**: 需要  

**请求参数**:
```json
{
  "input": "我要去取快递"
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "intent": "TASK_CREATION",
    "confidence": 0.95,
    "reasoning": "用户明确表达了要执行一个具体的任务'去取快递'，符合任务新增的范畴。",
    "extracted_info": {
      "keywords": ["取快递", "我要"],
      "entities": {
        "time": "",
        "location": "",
        "task": "取快递"
      }
    }
  },
  "processingTime": 1850
}
```

### 4.2 获取支持的意图类型

**接口地址**: `GET /api/ai/intent/status`  
**描述**: 获取所有支持的意图类型  
**认证**: 不需要  

**响应示例**:
```json
{
  "success": true,
  "data": {
    "status": "ready",
    "supportedIntents": {
      "CONVERSATION": "正常对话（情绪安慰、聊天）",
      "TASK_CREATION": "任务新增（待办事项、习惯养成）",
      "SCHEDULE_PLANNING": "时间调度（日程安排、时间规划）",
      "EXTERNAL_TOOL": "外部工具调用（地图、天气等）"
    },
    "message": "意图识别服务正常运行"
  }
}
```

---

## 5. 错误码说明

| 错误码 | HTTP状态码 | 描述 | 解决方案 |
|-------|-----------|------|----------|
| `MISSING_MESSAGE` | 400 | 缺少消息内容 | 请提供message参数 |
| `EMPTY_MESSAGE` | 400 | 消息内容为空 | 请提供非空的消息内容 |
| `MESSAGE_TOO_LONG` | 400 | 消息内容过长 | 消息长度不能超过2000字符 |
| `WRONG_INTENT_TYPE` | 400 | 消息不属于对话类型 | 使用相应的功能模块处理 |
| `INVALID_LIMIT` | 400 | limit参数无效 | limit必须是1-100之间的数字 |
| `INVALID_SKIP` | 400 | skip参数无效 | skip必须是非负整数 |
| `CONVERSATION_FAILED` | 500 | 对话处理失败 | 检查网络连接和服务状态 |
| `AI_SERVICE_UNAVAILABLE` | 503 | AI服务不可用 | AI模型服务暂时不可用 |
| `AI_SERVICE_TIMEOUT` | 504 | AI服务超时 | 请稍后重试 |

---

## 6. 使用示例

### 6.1 JavaScript (axios)

```javascript
import axios from 'axios';

// 创建API客户端
const apiClient = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 30000
});

// 设置认证令牌
let authToken = null;

// 登录获取令牌
async function login(phoneNumber, password) {
  try {
    const response = await apiClient.post('/users/login', {
      phoneNumber,
      password
    });
    
    authToken = response.data.data.token;
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
    
    return response.data;
  } catch (error) {
    console.error('登录失败:', error.response?.data);
    throw error;
  }
}

// 发送对话消息
async function sendMessage(message, sessionId = null) {
  try {
    const response = await apiClient.post('/ai/conversation/send', {
      message,
      sessionId
    });
    
    return response.data;
  } catch (error) {
    console.error('发送消息失败:', error.response?.data);
    throw error;
  }
}

// 获取对话历史
async function getHistory(sessionId = null, limit = 20) {
  try {
    const params = { limit };
    if (sessionId) params.sessionId = sessionId;
    
    const response = await apiClient.get('/ai/conversation/history', {
      params
    });
    
    return response.data;
  } catch (error) {
    console.error('获取历史失败:', error.response?.data);
    throw error;
  }
}

// 使用示例
async function example() {
  try {
    // 登录
    await login('13800138001', '123456');
    console.log('登录成功');
    
    // 发送消息
    const result = await sendMessage('你好，我今天心情不太好');
    console.log('AI回应:', result.data.assistantMessage.content);
    
    // 继续对话
    const followUp = await sendMessage('谢谢你的安慰', result.data.sessionId);
    console.log('AI回应:', followUp.data.assistantMessage.content);
    
    // 获取历史
    const history = await getHistory(result.data.sessionId);
    console.log('对话历史:', history.data.conversations);
    
  } catch (error) {
    console.error('示例执行失败:', error);
  }
}
```

### 6.2 Python (requests)

```python
import requests
import json

class AISiriClient:
    def __init__(self, base_url='http://localhost:3000/api'):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.timeout = 30
        
    def login(self, phone_number, password):
        """用户登录"""
        url = f'{self.base_url}/users/login'
        data = {
            'phoneNumber': phone_number,
            'password': password
        }
        
        response = self.session.post(url, json=data)
        response.raise_for_status()
        
        result = response.json()
        token = result['data']['token']
        self.session.headers.update({
            'Authorization': f'Bearer {token}'
        })
        
        return result
    
    def send_message(self, message, session_id=None):
        """发送对话消息"""
        url = f'{self.base_url}/ai/conversation/send'
        data = {'message': message}
        if session_id:
            data['sessionId'] = session_id
            
        response = self.session.post(url, json=data)
        response.raise_for_status()
        return response.json()
    
    def get_history(self, session_id=None, limit=20):
        """获取对话历史"""
        url = f'{self.base_url}/ai/conversation/history'
        params = {'limit': limit}
        if session_id:
            params['sessionId'] = session_id
            
        response = self.session.get(url, params=params)
        response.raise_for_status()
        return response.json()

# 使用示例
def main():
    client = AISiriClient()
    
    try:
        # 登录
        client.login('13800138001', '123456')
        print('登录成功')
        
        # 发送消息
        result = client.send_message('你好，我今天心情不太好')
        print('AI回应:', result['data']['assistantMessage']['content'])
        
        # 继续对话
        session_id = result['data']['sessionId']
        follow_up = client.send_message('谢谢你的安慰', session_id)
        print('AI回应:', follow_up['data']['assistantMessage']['content'])
        
        # 获取历史
        history = client.get_history(session_id)
        print('对话数量:', len(history['data']['conversations']))
        
    except requests.exceptions.RequestException as e:
        print(f'请求失败: {e}')

if __name__ == '__main__':
    main()
```

---

## 7. 最佳实践

### 7.1 错误处理
- 始终检查 `success` 字段
- 根据 `code` 字段进行相应的错误处理
- 实现重试机制处理网络错误

### 7.2 会话管理
- 保存 `sessionId` 以维持对话连续性
- 合理设置对话历史的获取数量
- 定期清理过期的会话数据

### 7.3 性能优化
- 设置合理的请求超时时间（推荐30-60秒）
- 实现结果缓存以提高响应速度
- 避免频繁的API调用

### 7.4 安全性
- 安全存储JWT令牌，避免泄露
- 实现令牌刷新机制
- 验证所有用户输入内容

---

## 8. 技术支持

如有问题请参考：
- 项目文档：`docs/项目总结与改进.md`
- 错误日志：服务会生成详细的错误日志
- 健康检查：定期调用健康检查接口监控服务状态

---

**更新时间**: 2025-08-17  
**文档版本**: v1.0.0  
**服务版本**: v1.0.0

