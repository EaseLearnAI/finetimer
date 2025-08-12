# AIsiri 任务集 API 文档

## 概述

本文档描述了 AIsiri 应用中任务集（Collections）和子任务（Subtasks）相关的 REST API 接口。任务集功能允许用户创建、管理和组织相关的任务，提供了完整的 CRUD 操作和进度跟踪功能。

## 基础信息

- **基础URL**: `http://localhost:3000/api`
- **内容类型**: `application/json`
- **字符编码**: UTF-8

## 任务集 API 接口

### 1. 获取任务集列表

获取用户的任务集列表，支持筛选和分页。

**接口地址**: `GET /collections`

**请求参数**:
| 参数名 | 类型 | 必需 | 默认值 | 说明 |
|--------|------|------|--------|------|
| userId | String | 否 | - | 用户ID，用于多用户场景 |
| archived | Boolean | 否 | false | 是否获取已归档的任务集 |
| completed | Boolean | 否 | - | 是否获取已完成的任务集 |
| limit | Number | 否 | 50 | 每页返回数量 |
| offset | Number | 否 | 0 | 偏移量（分页） |

**请求示例**:
```bash
GET /api/collections?userId=test-user-001&limit=10&offset=0
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "6895b01d186e8c72264a5aee",
      "name": "考研英语复习",
      "description": "英语复习计划相关任务",
      "userId": "test-user-001",
      "color": "#007aff",
      "icon": "folder",
      "completed": false,
      "archived": false,
      "sortOrder": 0,
      "createdAt": "2025-08-08T08:06:53.388Z",
      "updatedAt": "2025-08-08T08:06:53.388Z",
      "subtasks": [
        {
          "_id": "6895b01d186e8c72264a5af9",
          "title": "英语单词背诵",
          "completed": true,
          "priority": "high",
          "estimatedTime": 30
        }
      ],
      "totalSubtasks": 1,
      "completedSubtasks": 1,
      "progressPercentage": 100,
      "isOverdue": false
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

### 2. 获取单个任务集详情

根据任务集ID获取详细信息，包含所有子任务。

**接口地址**: `GET /collections/{id}`

**路径参数**:
| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| id | String | 是 | 任务集ID |

**请求示例**:
```bash
GET /api/collections/6895b01d186e8c72264a5aee
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "_id": "6895b01d186e8c72264a5aee",
    "name": "考研英语复习",
    "description": "英语复习计划相关任务",
    "userId": "test-user-001",
    "color": "#007aff",
    "icon": "folder",
    "completed": false,
    "archived": false,
    "sortOrder": 0,
    "createdAt": "2025-08-08T08:06:53.388Z",
    "updatedAt": "2025-08-08T08:06:53.388Z",
    "subtasks": [...],
    "totalSubtasks": 5,
    "completedSubtasks": 3,
    "progressPercentage": 60,
    "isOverdue": false
  }
}
```

### 3. 创建新任务集

创建一个新的任务集。

**接口地址**: `POST /collections`

**请求体**:
```json
{
  "name": "考研英语复习",
  "description": "英语复习计划相关任务",
  "userId": "test-user-001",
  "color": "#007aff",
  "icon": "folder"
}
```

**字段说明**:
| 字段名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| name | String | 是 | 任务集名称（最大50字符） |
| description | String | 否 | 任务集描述（最大200字符） |
| userId | String | 否 | 用户ID |
| color | String | 否 | 颜色标识，默认 "#007aff" |
| icon | String | 否 | 图标名称，默认 "folder" |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "_id": "6895b01d186e8c72264a5aee",
    "name": "考研英语复习",
    "description": "英语复习计划相关任务",
    "userId": "test-user-001",
    "color": "#007aff",
    "icon": "folder",
    "completed": false,
    "archived": false,
    "sortOrder": 0,
    "createdAt": "2025-08-08T08:06:53.388Z",
    "updatedAt": "2025-08-08T08:06:53.388Z",
    "subtasks": [],
    "totalSubtasks": 0,
    "completedSubtasks": 0,
    "progressPercentage": 0,
    "isOverdue": false
  }
}
```

### 4. 更新任务集

更新现有任务集的信息。

**接口地址**: `PUT /collections/{id}`

**路径参数**:
| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| id | String | 是 | 任务集ID |

**请求体**:
```json
{
  "name": "更新后的任务集名称",
  "description": "更新后的描述",
  "completed": true
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "_id": "6895b01d186e8c72264a5aee",
    "name": "更新后的任务集名称",
    "description": "更新后的描述",
    "completed": true,
    "updatedAt": "2025-08-08T08:10:53.388Z"
  }
}
```

### 5. 删除任务集

删除指定的任务集。如果任务集包含子任务，需要使用强制删除。

**接口地址**: `DELETE /collections/{id}`

**路径参数**:
| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| id | String | 是 | 任务集ID |

**查询参数**:
| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| force | Boolean | 否 | 是否强制删除（同时删除所有子任务） |

**请求示例**:
```bash
DELETE /api/collections/6895b01d186e8c72264a5aee?force=true
```

**响应示例**:
```json
{
  "success": true,
  "message": "任务集删除成功",
  "data": {
    "deletedSubtasks": 5
  }
}
```

### 6. 归档/取消归档任务集

将任务集标记为已归档或取消归档。

**接口地址**: `PUT /collections/{id}/archive`

**路径参数**:
| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| id | String | 是 | 任务集ID |

**请求体**:
```json
{
  "archived": true
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "任务集归档成功",
  "data": {
    "_id": "6895b01d186e8c72264a5aee",
    "archived": true,
    "updatedAt": "2025-08-08T08:15:53.388Z"
  }
}
```

### 7. 获取统计信息

获取任务集和子任务的统计信息。

**接口地址**: `GET /collections/stats`

**请求参数**:
| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| userId | String | 否 | 用户ID |

**请求示例**:
```bash
GET /api/collections/stats?userId=test-user-001
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "collections": {
      "total": 5,
      "completed": 2,
      "archived": 1,
      "active": 3
    },
    "subtasks": {
      "total": 25,
      "completed": 15,
      "pending": 10
    },
    "progress": {
      "collectionsProgress": 40,
      "subtasksProgress": 60
    }
  }
}
```

## 子任务 API 接口

子任务使用现有的 `/tasks` 接口，但增加了对任务集的支持。

### 1. 创建子任务

**接口地址**: `POST /tasks`

**请求体**:
```json
{
  "title": "英语单词背诵",
  "description": "每天背诵50个新单词",
  "priority": "high",
  "estimatedTime": 30,
  "collectionId": "6895b01d186e8c72264a5aee",
  "userId": "test-user-001",
  "dueDate": "2025-08-15T10:00:00.000Z"
}
```

**字段说明**:
| 字段名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| title | String | 是 | 子任务标题 |
| description | String | 否 | 子任务描述 |
| priority | String | 否 | 优先级: low, medium, high |
| estimatedTime | Number | 否 | 预计时间（分钟） |
| collectionId | String | 是 | 所属任务集ID |
| userId | String | 否 | 用户ID |
| dueDate | Date | 否 | 截止日期 |

### 2. 获取任务集的子任务

**接口地址**: `GET /tasks?collectionId={collectionId}`

**请求示例**:
```bash
GET /api/tasks?collectionId=6895b01d186e8c72264a5aee
```

### 3. 更新子任务

**接口地址**: `PUT /tasks/{id}`

**常用场景 - 切换完成状态**:
```json
{
  "completed": true
}
```

## 错误处理

所有API接口都遵循统一的错误响应格式：

**错误响应格式**:
```json
{
  "success": false,
  "message": "错误描述信息",
  "error": "具体错误详情"
}
```

**常见错误状态码**:
- `400 Bad Request`: 请求参数错误
- `404 Not Found`: 资源不存在
- `500 Internal Server Error`: 服务器内部错误

## 数据模型

### Collection 模型

```javascript
{
  _id: ObjectId,
  name: String,           // 任务集名称
  description: String,    // 描述
  userId: String,         // 用户ID
  color: String,          // 颜色标识
  icon: String,           // 图标
  completed: Boolean,     // 是否完成
  archived: Boolean,      // 是否归档
  sortOrder: Number,      // 排序权重
  createdAt: Date,        // 创建时间
  updatedAt: Date,        // 更新时间
  
  // 虚拟字段
  subtasks: [Task],       // 关联的子任务
  totalSubtasks: Number,  // 子任务总数
  completedSubtasks: Number, // 已完成子任务数
  progressPercentage: Number, // 完成百分比
  isOverdue: Boolean      // 是否逾期
}
```

### Task 模型（子任务）

```javascript
{
  _id: ObjectId,
  title: String,          // 标题
  description: String,    // 描述
  priority: String,       // 优先级: low/medium/high
  completed: Boolean,     // 是否完成
  estimatedTime: Number,  // 预计时间（分钟）
  dueDate: Date,          // 截止日期
  collectionId: ObjectId, // 所属任务集ID
  userId: String,         // 用户ID
  createdAt: Date,        // 创建时间
  updatedAt: Date         // 更新时间
}
```

## 使用示例

### 创建一个完整的任务集

```javascript
// 1. 创建任务集
const collection = await fetch('/api/collections', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: '考研英语复习',
    description: '英语复习计划',
    userId: 'user-001'
  })
});

// 2. 添加子任务
const subtask = await fetch('/api/tasks', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: '英语单词背诵',
    priority: 'high',
    estimatedTime: 30,
    collectionId: collection.data._id,
    userId: 'user-001'
  })
});

// 3. 标记子任务完成
await fetch(`/api/tasks/${subtask.data._id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ completed: true })
});
```

## 前端集成说明

### Vue.js 组件使用

在前端 Vue 组件中，可以这样使用：

```javascript
// 获取任务集列表
async loadCollections() {
  const response = await api.get('/collections');
  this.collections = response.data.data;
}

// 创建任务集
async createCollection(collectionData) {
  const response = await api.post('/collections', collectionData);
  return response.data.data;
}

// 切换子任务状态
async toggleSubtask(subtaskId) {
  const response = await api.put(`/tasks/${subtaskId}`, {
    completed: !this.subtask.completed
  });
  return response.data.data;
}
```

## 注意事项

1. **进度计算**: 任务集的进度百分比是根据已完成子任务数量自动计算的
2. **级联删除**: 使用 `force=true` 删除任务集时，会同时删除所有关联的子任务
3. **虚拟字段**: Collection 模型的 `subtasks`、`progressPercentage` 等是虚拟字段，由数据库自动计算
4. **用户隔离**: 建议在所有请求中携带 `userId` 参数以支持多用户场景
5. **错误处理**: 前端应当处理所有可能的错误状态码，提供友好的用户提示

---

**版本**: v1.0.0  
**更新时间**: 2025-08-08  
**维护者**: AIsiri 开发团队