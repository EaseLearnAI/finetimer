# AIsiri 后端 API 文档

## 基础信息

- **基础URL**: `http://localhost:3001/api`
- **Content-Type**: `application/json`

## 状态码

| 状态码 | 说明             |
| ------ | ---------------- |
| 200    | 请求成功         |
| 201    | 创建成功         |
| 400    | 请求参数错误     |
| 404    | 资源未找到       |
| 500    | 服务器内部错误   |

## 番茄钟 API

### 获取所有番茄钟记录

- **URL**: `/api/pomodoro`
- **方法**: `GET`
- **URL参数**: 无
- **请求体**: 无
- **成功响应**:
  ```json
  {
    "success": true,
    "data": [
      {
        "_id": "string",
        "taskName": "string",
        "mode": "string",
        "startTime": "date",
        "endTime": "date",
        "duration": "number",
        "completed": "boolean",
        "userId": "string",
        "createdAt": "date",
        "updatedAt": "date"
      }
    ]
  }
  ```

### 创建番茄钟记录

- **URL**: `/api/pomodoro`
- **方法**: `POST`
- **URL参数**: 无
- **请求体**:
  ```json
  {
    "taskName": "string",
    "mode": "string",
    "startTime": "date",
    "endTime": "date",
    "duration": "number",
    "completed": "boolean",
    "userId": "string"
  }
  ```
- **成功响应**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "string",
      "taskName": "string",
      "mode": "string",
      "startTime": "date",
      "endTime": "date",
      "duration": "number",
      "completed": "boolean",
      "userId": "string",
      "createdAt": "date",
      "updatedAt": "date"
    }
  }
  ```

### 获取单个番茄钟记录

- **URL**: `/api/pomodoro/:id`
- **方法**: `GET`
- **URL参数**: 
  - `id` (必需): 番茄钟记录的ID
- **请求体**: 无
- **成功响应**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "string",
      "taskName": "string",
      "mode": "string",
      "startTime": "date",
      "endTime": "date",
      "duration": "number",
      "completed": "boolean",
      "userId": "string",
      "createdAt": "date",
      "updatedAt": "date"
    }
  }
  ```

### 更新番茄钟记录

- **URL**: `/api/pomodoro/:id`
- **方法**: `PUT`
- **URL参数**: 
  - `id` (必需): 番茄钟记录的ID
- **请求体**:
  ```json
  {
    "taskName": "string",
    "mode": "string",
    "startTime": "date",
    "endTime": "date",
    "duration": "number",
    "completed": "boolean",
    "userId": "string"
  }
  ```
- **成功响应**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "string",
      "taskName": "string",
      "mode": "string",
      "startTime": "date",
      "endTime": "date",
      "duration": "number",
      "completed": "boolean",
      "userId": "string",
      "createdAt": "date",
      "updatedAt": "date"
    }
  }
  ```

### 删除番茄钟记录

- **URL**: `/api/pomodoro/:id`
- **方法**: `DELETE`
- **URL参数**: 
  - `id` (必需): 番茄钟记录的ID
- **请求体**: 无
- **成功响应**:
  ```json
  {
    "success": true,
    "data": {}
  }
  ```

## 任务 API

### 获取所有任务

- **URL**: `/api/tasks`
- **方法**: `GET`
- **URL参数**: 无
- **请求体**: 无
- **成功响应**:
  ```json
  {
    "success": true,
    "data": [
      {
        "_id": "string",
        "title": "string",
        "description": "string",
        "priority": "string",
        "completed": "boolean",
        "dueDate": "date",
        "collectionId": "string",
        "userId": "string",
        "timeBlocks": [
          {
            "date": "date",
            "duration": "number"
          }
        ],
        "quadrant": "string",
        "createdAt": "date",
        "updatedAt": "date"
      }
    ]
  }
  ```

### 创建任务

- **URL**: `/api/tasks`
- **方法**: `POST`
- **URL参数**: 无
- **请求体**:
  ```json
  {
    "title": "string",
    "description": "string",
    "priority": "string",
    "completed": "boolean",
    "dueDate": "date",
    "collectionId": "string",
    "userId": "string",
    "timeBlocks": [
      {
        "date": "date",
        "duration": "number"
      }
    ],
    "quadrant": "string"
  }
  ```
- **成功响应**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "string",
      "title": "string",
      "description": "string",
      "priority": "string",
      "completed": "boolean",
      "dueDate": "date",
      "collectionId": "string",
      "userId": "string",
      "timeBlocks": [
        {
          "date": "date",
          "duration": "number"
        }
      ],
      "quadrant": "string",
      "createdAt": "date",
      "updatedAt": "date"
    }
  }
  ```

### 获取单个任务

- **URL**: `/api/tasks/:id`
- **方法**: `GET`
- **URL参数**: 
  - `id` (必需): 任务的ID
- **请求体**: 无
- **成功响应**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "string",
      "title": "string",
      "description": "string",
      "priority": "string",
      "completed": "boolean",
      "dueDate": "date",
      "collectionId": "string",
      "userId": "string",
      "timeBlocks": [
        {
          "date": "date",
          "duration": "number"
        }
      ],
      "quadrant": "string",
      "createdAt": "date",
      "updatedAt": "date"
    }
  }
  ```

### 更新任务

- **URL**: `/api/tasks/:id`
- **方法**: `PUT`
- **URL参数**: 
  - `id` (必需): 任务的ID
- **请求体**:
  ```json
  {
    "title": "string",
    "description": "string",
    "priority": "string",
    "completed": "boolean",
    "dueDate": "date",
    "collectionId": "string",
    "userId": "string",
    "timeBlocks": [
      {
        "date": "date",
        "duration": "number"
      }
    ],
    "quadrant": "string"
  }
  ```
- **成功响应**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "string",
      "title": "string",
      "description": "string",
      "priority": "string",
      "completed": "boolean",
      "dueDate": "date",
      "collectionId": "string",
      "userId": "string",
      "timeBlocks": [
        {
          "date": "date",
          "duration": "number"
        }
      ],
      "quadrant": "string",
      "createdAt": "date",
      "updatedAt": "date"
    }
  }
  ```

### 删除任务

- **URL**: `/api/tasks/:id`
- **方法**: `DELETE`
- **URL参数**: 
  - `id` (必需): 任务的ID
- **请求体**: 无
- **成功响应**:
  ```json
  {
    "success": true,
    "data": {}
  }
  ```

### 切换任务完成状态

- **URL**: `/api/tasks/:id/toggle`
- **方法**: `PUT`
- **URL参数**: 
  - `id` (必需): 任务的ID
- **请求体**: 无
- **成功响应**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "string",
      "title": "string",
      "description": "string",
      "priority": "string",
      "completed": "boolean",
      "dueDate": "date",
      "collectionId": "string",
      "userId": "string",
      "timeBlocks": [
        {
          "date": "date",
          "duration": "number"
        }
      ],
      "quadrant": "string",
      "createdAt": "date",
      "updatedAt": "date"
    }
  }
  ```

## 任务集 API

### 获取所有任务集

- **URL**: `/api/collections`
- **方法**: `GET`
- **URL参数**: 无
- **请求体**: 无
- **成功响应**:
  ```json
  {
    "success": true,
    "data": [
      {
        "_id": "string",
        "name": "string",
        "description": "string",
        "expanded": "boolean",
        "userId": "string",
        "createdAt": "date",
        "updatedAt": "date"
      }
    ]
  }
  ```

### 创建任务集

- **URL**: `/api/collections`
- **方法**: `POST`
- **URL参数**: 无
- **请求体**:
  ```json
  {
    "name": "string",
    "description": "string",
    "expanded": "boolean",
    "userId": "string"
  }
  ```
- **成功响应**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "string",
      "name": "string",
      "description": "string",
      "expanded": "boolean",
      "userId": "string",
      "createdAt": "date",
      "updatedAt": "date"
    }
  }
  ```

### 获取单个任务集

- **URL**: `/api/collections/:id`
- **方法**: `GET`
- **URL参数**: 
  - `id` (必需): 任务集的ID
- **请求体**: 无
- **成功响应**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "string",
      "name": "string",
      "description": "string",
      "expanded": "boolean",
      "userId": "string",
      "createdAt": "date",
      "updatedAt": "date"
    }
  }
  ```

### 更新任务集

- **URL**: `/api/collections/:id`
- **方法**: `PUT`
- **URL参数**: 
  - `id` (必需): 任务集的ID
- **请求体**:
  ```json
  {
    "name": "string",
    "description": "string",
    "expanded": "boolean",
    "userId": "string"
  }
  ```
- **成功响应**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "string",
      "name": "string",
      "description": "string",
      "expanded": "boolean",
      "userId": "string",
      "createdAt": "date",
      "updatedAt": "date"
    }
  }
  ```

### 删除任务集

- **URL**: `/api/collections/:id`
- **方法**: `DELETE`
- **URL参数**: 
  - `id` (必需): 任务集的ID
- **请求体**: 无
- **成功响应**:
  ```json
  {
    "success": true,
    "data": {}
  }
  ```

### 切换任务集展开状态

- **URL**: `/api/collections/:id/expand`
- **方法**: `PUT`
- **URL参数**: 
  - `id` (必需): 任务集的ID
- **请求体**: 无
- **成功响应**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "string",
      "name": "string",
      "description": "string",
      "expanded": "boolean",
      "userId": "string",
      "createdAt": "date",
      "updatedAt": "date"
    }
  }
  ```