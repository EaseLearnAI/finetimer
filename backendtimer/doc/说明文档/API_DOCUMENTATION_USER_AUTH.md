# AIsiri 用户认证与数据隔离 API 文档

## 概述

本文档描述了 AIsiri 应用的用户认证系统和数据隔离功能的 API 接口。系统支持基于手机号和密码的用户注册登录，使用 JWT 进行身份认证，确保每个用户的数据完全隔离。

## 基础信息

- **Base URL**: `http://localhost:3000/api`
- **认证方式**: Bearer Token (JWT)
- **数据格式**: JSON
- **字符编码**: UTF-8

## 通用响应格式

### 成功响应
```json
{
  "success": true,
  "message": "操作成功的描述信息",
  "data": {}  // 具体的返回数据
}
```

### 错误响应
```json
{
  "success": false,
  "message": "错误描述信息",
  "error": "详细错误信息（仅开发环境）"
}
```

## 1. 用户认证接口

### 1.1 用户注册

**接口地址**: `POST /api/users/register`

**请求参数**:
```json
{
  "phoneNumber": "13800138001",  // 必填，11位手机号
  "password": "123456",          // 必填，最少6位密码
  "nickname": "用户昵称"         // 可选，最多50个字符
}
```

**成功响应**:
```json
{
  "success": true,
  "message": "注册成功",
  "data": {
    "user": {
      "id": "用户ID",
      "phoneNumber": "13800138001",
      "maskedPhoneNumber": "138****8001",
      "nickname": "用户昵称",
      "avatar": "",
      "createdAt": "2025-08-09T10:00:00.000Z"
    },
    "token": "JWT令牌"
  }
}
```

**可能的错误**:
- `400`: 参数缺失或格式错误
- `409`: 手机号已存在
- `500`: 服务器错误

### 1.2 用户登录

**接口地址**: `POST /api/users/login`

**请求参数**:
```json
{
  "phoneNumber": "13800138001",  // 必填，手机号
  "password": "123456"           // 必填，密码
}
```

**成功响应**:
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "user": {
      "id": "用户ID",
      "phoneNumber": "13800138001",
      "maskedPhoneNumber": "138****8001",
      "nickname": "用户昵称",
      "avatar": "",
      "lastLoginAt": "2025-08-09T10:00:00.000Z"
    },
    "token": "JWT令牌"
  }
}
```

**可能的错误**:
- `400`: 参数缺失
- `401`: 手机号或密码错误
- `500`: 服务器错误

### 1.3 获取用户信息

**接口地址**: `GET /api/users/profile`

**请求头**: `Authorization: Bearer {token}`

**成功响应**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "用户ID",
      "phoneNumber": "13800138001",
      "maskedPhoneNumber": "138****8001",
      "nickname": "用户昵称",
      "avatar": "",
      "createdAt": "2025-08-09T10:00:00.000Z",
      "lastLoginAt": "2025-08-09T10:00:00.000Z"
    }
  }
}
```

### 1.4 更新用户信息

**接口地址**: `PUT /api/users/profile`

**请求头**: `Authorization: Bearer {token}`

**请求参数**:
```json
{
  "nickname": "新昵称",                           // 可选，最多50个字符
  "avatar": "https://example.com/avatar.jpg"     // 可选，头像URL
}
```

**成功响应**:
```json
{
  "success": true,
  "message": "更新成功",
  "data": {
    "user": {
      "id": "用户ID",
      "phoneNumber": "13800138001",
      "maskedPhoneNumber": "138****8001",
      "nickname": "新昵称",
      "avatar": "https://example.com/avatar.jpg",
      "updatedAt": "2025-08-09T10:00:00.000Z"
    }
  }
}
```

## 2. 任务集接口

所有任务集接口都需要认证，只能操作当前用户的数据。

**请求头**: `Authorization: Bearer {token}`

### 2.1 获取任务集列表

**接口地址**: `GET /api/collections`

**查询参数**:
- `archived`: `true|false` - 是否已归档（默认false）
- `completed`: `true|false` - 是否已完成
- `limit`: 数字 - 限制数量（默认50）
- `offset`: 数字 - 偏移量（默认0）

**成功响应**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "任务集ID",
      "name": "工作任务",
      "description": "工作相关的任务",
      "color": "#007aff",
      "icon": "folder",
      "completed": false,
      "archived": false,
      "sortOrder": 0,
      "subtasks": [],
      "totalSubtasks": 0,
      "completedSubtasks": 0,
      "progressPercentage": 0,
      "createdAt": "2025-08-09T10:00:00.000Z",
      "updatedAt": "2025-08-09T10:00:00.000Z"
    }
  ]
}
```

### 2.2 创建任务集

**接口地址**: `POST /api/collections`

**请求参数**:
```json
{
  "name": "任务集名称",        // 必填，最多50个字符
  "description": "描述信息",   // 可选，最多200个字符
  "color": "#007aff",         // 可选，默认蓝色
  "icon": "folder"            // 可选，默认文件夹图标
}
```

### 2.3 获取单个任务集

**接口地址**: `GET /api/collections/{id}`

### 2.4 更新任务集

**接口地址**: `PUT /api/collections/{id}`

### 2.5 删除任务集

**接口地址**: `DELETE /api/collections/{id}`

### 2.6 归档/取消归档任务集

**接口地址**: `PUT /api/collections/{id}/archive`

## 3. 任务接口

所有任务接口都需要认证，只能操作当前用户的数据。

**请求头**: `Authorization: Bearer {token}`

### 3.1 获取任务列表

**接口地址**: `GET /api/tasks`

**查询参数**:
- `completed`: `true|false` - 是否已完成
- `collectionId`: 字符串 - 任务集ID
- `date`: 字符串 - 日期（YYYY-MM-DD格式）
- `limit`: 数字 - 限制数量（默认50）
- `offset`: 数字 - 偏移量（默认0）

**成功响应**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "任务ID",
      "title": "任务标题",
      "description": "任务描述",
      "priority": "high",
      "quadrant": 1,
      "completed": false,
      "date": "2025-08-09",
      "time": "09:00",
      "estimatedTime": 60,
      "collectionId": {
        "_id": "任务集ID",
        "name": "任务集名称"
      },
      "timeBlock": {
        "startTime": "09:00",
        "endTime": "10:00",
        "timeBlockType": "morning"
      },
      "isScheduled": true,
      "createdAt": "2025-08-09T10:00:00.000Z",
      "updatedAt": "2025-08-09T10:00:00.000Z"
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

### 3.2 创建任务

**接口地址**: `POST /api/tasks`

**请求参数**:
```json
{
  "title": "任务标题",                     // 必填
  "description": "任务描述",               // 可选
  "priority": "high",                     // 可选：low|medium|high，默认medium
  "quadrant": 1,                          // 可选：1|2|3|4
  "date": "2025-08-09",                   // 可选，YYYY-MM-DD格式
  "time": "09:00",                        // 可选，HH:MM格式
  "estimatedTime": 60,                    // 可选，预计时间（分钟）
  "collectionId": "任务集ID",             // 可选
  "timeBlock": {                          // 可选，时间块信息
    "startTime": "09:00",
    "endTime": "10:00",
    "timeBlockType": "morning"
  }
}
```

### 3.3 获取单个任务

**接口地址**: `GET /api/tasks/{id}`

### 3.4 更新任务

**接口地址**: `PUT /api/tasks/{id}`

### 3.5 删除任务

**接口地址**: `DELETE /api/tasks/{id}`

### 3.6 切换任务完成状态

**接口地址**: `PATCH /api/tasks/{id}/toggle`

**成功响应**:
```json
{
  "success": true,
  "message": "任务已完成",
  "data": {
    // 更新后的任务信息
  }
}
```

### 3.7 获取未安排时间的任务

**接口地址**: `GET /api/tasks/unscheduled`

### 3.8 根据时间块获取任务

**接口地址**: `GET /api/tasks/timeblock/{timeBlockType}`

时间块类型：`morning|forenoon|afternoon|evening`

## 4. 番茄钟接口

所有番茄钟接口都需要认证，只能操作当前用户的数据。

**请求头**: `Authorization: Bearer {token}`

### 4.1 获取番茄钟记录列表

**接口地址**: `GET /api/pomodoro`

**查询参数**:
- `limit`: 数字 - 限制数量（默认50）
- `offset`: 数字 - 偏移量（默认0）
- `startDate`: 字符串 - 开始日期（ISO格式）
- `endDate`: 字符串 - 结束日期（ISO格式）
- `taskName`: 字符串 - 任务名称

**成功响应**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "番茄钟ID",
      "taskName": "任务名称",
      "mode": "pomodoro",
      "startTime": "2025-08-09T10:00:00.000Z",
      "endTime": "2025-08-09T10:25:00.000Z",
      "date": "2025-08-09",
      "timeBlockType": "morning",
      "duration": 1500,
      "completed": true,
      "completionStatus": "normal",
      "actualFocusTime": 1500,
      "taskId": null,
      "sourceRoute": "/pomodoro",
      "createdAt": "2025-08-09T10:00:00.000Z"
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

### 4.2 创建番茄钟记录

**接口地址**: `POST /api/pomodoro`

**请求参数**:
```json
{
  "taskName": "任务名称",                           // 必填
  "mode": "pomodoro",                              // 必填：pomodoro|shortBreak|longBreak
  "startTime": "2025-08-09T10:00:00.000Z",        // 必填，ISO格式
  "endTime": "2025-08-09T10:25:00.000Z",          // 必填，ISO格式
  "duration": 1500,                               // 必填，持续时间（秒）
  "completed": true,                               // 可选，是否完成（默认true）
  "completionStatus": "normal",                    // 可选：normal|early|abandoned
  "actualFocusTime": 1500,                         // 可选，实际专注时间（秒）
  "taskId": "关联任务ID",                         // 可选
  "sourceRoute": "/pomodoro"                       // 可选，来源页面
}
```

### 4.3 获取单个番茄钟记录

**接口地址**: `GET /api/pomodoro/{id}`

### 4.4 更新番茄钟记录

**接口地址**: `PUT /api/pomodoro/{id}`

### 4.5 删除番茄钟记录

**接口地址**: `DELETE /api/pomodoro/{id}`

## 5. AI助手接口

AI助手接口同样需要认证，确保AI服务与用户数据的关联。

**请求头**: `Authorization: Bearer {token}`

### 5.1 发送消息给AI助手

**接口地址**: `POST /api/ai/chat`

**请求参数**:
```json
{
  "message": "用户消息内容",
  "context": {
    // 可选的上下文信息
  }
}
```

## 认证说明

### JWT Token 使用

1. **获取Token**: 通过注册或登录接口获取JWT token
2. **使用Token**: 在需要认证的接口请求头中添加：
   ```
   Authorization: Bearer {your_jwt_token}
   ```
3. **Token过期**: Token默认7天有效期，过期后需重新登录
4. **Token验证失败**: 返回401状态码，需重新登录

### 数据隔离保证

- 所有数据操作都会自动添加用户ID过滤
- 用户只能访问和操作自己的数据
- 跨用户访问将返回404（未找到）而不是403（禁止访问），增强安全性

## 错误码说明

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未授权，需要登录 |
| 403 | 禁止访问 |
| 404 | 资源未找到 |
| 409 | 资源冲突（如重复注册） |
| 500 | 服务器内部错误 |

## 开发环境配置

### 环境变量

```env
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

### 数据库连接

```javascript
mongodb://localhost:27017/aisiri
```

### 测试数据库

```javascript
mongodb://localhost:27017/aisiri_test
```

## 前端集成示例

### JavaScript/Axios 示例

```javascript
// 设置基础配置
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 10000
});

// 请求拦截器，自动添加token
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// 响应拦截器，处理错误
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Token过期，清除本地存储并跳转到登录页
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 使用示例
async function login(phoneNumber, password) {
  try {
    const response = await api.post('/users/login', {
      phoneNumber,
      password
    });
    
    const { user, token } = response.data.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    return user;
  } catch (error) {
    throw new Error(error.response?.data?.message || '登录失败');
  }
}

async function getTasks() {
  try {
    const response = await api.get('/tasks');
    return response.data.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || '获取任务失败');
  }
}
```

### Vue.js 集成示例

```javascript
// store/auth.js
import { defineStore } from 'pinia';
import api from '@/api';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('token')
  }),
  
  getters: {
    isAuthenticated: (state) => !!state.token,
    userInfo: (state) => state.user
  },
  
  actions: {
    async login(phoneNumber, password) {
      try {
        const response = await api.post('/users/login', {
          phoneNumber,
          password
        });
        
        const { user, token } = response.data.data;
        this.user = user;
        this.token = token;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        return user;
      } catch (error) {
        throw new Error(error.response?.data?.message || '登录失败');
      }
    },
    
    logout() {
      this.user = null;
      this.token = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }
});
```

## 注意事项

1. **密码安全**: 密码在传输前建议进行哈希处理
2. **Token存储**: 推荐使用httpOnly Cookie存储token，增强安全性
3. **API限流**: 生产环境建议添加API调用频率限制
4. **日志记录**: 所有API调用都有详细的日志记录，便于调试和监控
5. **数据备份**: 定期备份用户数据，确保数据安全

## 更新日志

### v1.0.0 (2025-08-09)
- 实现基础的用户注册登录功能
- 添加JWT身份认证
- 实现完整的数据隔离
- 支持任务、任务集、番茄钟的用户级别管理
- 添加完整的API测试套件