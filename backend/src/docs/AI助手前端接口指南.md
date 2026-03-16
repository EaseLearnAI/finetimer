# AI助手前端接口指南

## 概述

AI助手功能允许用户自定义AI助手的名称，并记录与AI助手的互动次数（心动值）。每次对话都会增加心动值，体现用户与AI助手的亲密度。

## 基础信息

- **基础URL**: `/api/ai-assistant`
- **认证方式**: 需要在请求头中携带JWT Token
- **数据格式**: JSON
- **字符编码**: UTF-8

## 认证要求

所有API请求都需要在请求头中包含有效的JWT Token：

```http
Authorization: Bearer <your_jwt_token>
```

## API接口详情

### 1. 获取或创建AI助手

**接口地址**: `GET /api/ai-assistant`

**功能描述**: 如果用户没有AI助手，则创建一个默认的；如果已存在，则返回现有信息。

**请求参数**: 无

**请求示例**:
```javascript
const response = await fetch('/api/ai-assistant', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "68a54969b01c063365ec7e3d",
    "name": "AI智能助手",
    "heartValue": 0,
    "createdAt": "2025-08-20T04:04:57.408Z",
    "updatedAt": "2025-08-20T04:04:57.408Z"
  }
}
```

**响应字段说明**:
- `id`: AI助手的唯一标识
- `name`: AI助手的名称
- `heartValue`: 当前心动值
- `createdAt`: 创建时间
- `updatedAt`: 最后更新时间

---

### 2. 获取AI助手信息

**接口地址**: `GET /api/ai-assistant/info`

**功能描述**: 获取用户的AI助手详细信息。

**请求参数**: 无

**请求示例**:
```javascript
const response = await fetch('/api/ai-assistant/info', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "68a54969b01c063365ec7e3d",
    "name": "我的专属AI助手",
    "heartValue": 5,
    "createdAt": "2025-08-20T04:04:57.408Z",
    "updatedAt": "2025-08-20T04:04:57.426Z"
  }
}
```

---

### 3. 更新AI助手名称

**接口地址**: `PUT /api/ai-assistant/name`

**功能描述**: 更新AI助手的名称。

**请求参数**:
```json
{
  "name": "新的AI助手名称"
}
```

**请求示例**:
```javascript
const response = await fetch('/api/ai-assistant/name', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: '我的专属AI助手'
  })
});
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "68a54969b01c063365ec7e3d",
    "name": "我的专属AI助手",
    "heartValue": 5,
    "updatedAt": "2025-08-20T04:04:57.426Z"
  },
  "message": "AI助手名称更新成功"
}
```

**注意事项**:
- 名称不能为空
- 名称长度不能超过50个字符
- 名称会自动去除首尾空格

---

### 4. 增加心动值

**接口地址**: `POST /api/ai-assistant/heart`

**功能描述**: 每次对话后调用，增加AI助手的心动值。

**请求参数**: 无

**请求示例**:
```javascript
const response = await fetch('/api/ai-assistant/heart', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "68a54969b01c063365ec7e3d",
    "name": "我的专属AI助手",
    "heartValue": 6,
    "updatedAt": "2025-08-20T04:04:57.430Z"
  },
  "message": "心动值增加成功"
}
```

**使用场景**:
- 用户发送消息后
- AI回复完成后
- 每次完整的对话交互后

---

## 错误处理

### 常见错误码

| 状态码 | 错误类型 | 说明 |
|--------|----------|------|
| 400 | Bad Request | 请求参数错误（如名称为空或过长） |
| 401 | Unauthorized | 未提供有效的JWT Token |
| 500 | Internal Server Error | 服务器内部错误 |

### 错误响应格式

```json
{
  "success": false,
  "message": "错误描述",
  "error": "详细错误信息"
}
```

---

## 前端集成示例

### React Hook示例

```javascript
import { useState, useEffect } from 'react';

const useAIAssistant = (token) => {
  const [assistant, setAssistant] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 获取AI助手信息
  const getAssistant = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ai-assistant/info', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setAssistant(data.data);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 更新名称
  const updateName = async (newName) => {
    try {
      setLoading(true);
      const response = await fetch('/api/ai-assistant/name', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: newName })
      });
      
      const data = await response.json();
      if (data.success) {
        setAssistant(data.data);
        return true;
      } else {
        setError(data.message);
        return false;
      }
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 增加心动值
  const increaseHeart = async () => {
    try {
      const response = await fetch('/api/ai-assistant/heart', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setAssistant(data.data);
        return true;
      } else {
        setError(data.message);
        return false;
      }
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  useEffect(() => {
    if (token) {
      getAssistant();
    }
  }, [token]);

  return {
    assistant,
    loading,
    error,
    getAssistant,
    updateName,
    increaseHeart
  };
};

export default useAIAssistant;
```

### Vue 3 Composition API示例

```javascript
import { ref, onMounted } from 'vue';

export function useAIAssistant(token) {
  const assistant = ref(null);
  const loading = ref(false);
  const error = ref(null);

  // 获取AI助手信息
  const getAssistant = async () => {
    try {
      loading.value = true;
      const response = await fetch('/api/ai-assistant/info', {
        headers: {
          'Authorization': `Bearer ${token.value}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      if (data.success) {
        assistant.value = data.data;
      } else {
        error.value = data.message;
      }
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  // 更新名称
  const updateName = async (newName) => {
    try {
      loading.value = true;
      const response = await fetch('/api/ai-assistant/name', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token.value}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: newName })
      });
      
      const data = await response.json();
      if (data.success) {
        assistant.value = data.data;
        return true;
      } else {
        error.value = data.message;
        return false;
      }
    } catch (err) {
      error.value = err.message;
      return false;
    } finally {
      loading.value = false;
    }
  };

  // 增加心动值
  const increaseHeart = async () => {
    try {
      const response = await fetch('/api/ai-assistant/heart', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token.value}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      if (data.success) {
        assistant.value = data.data;
        return true;
      } else {
        error.value = data.message;
        return false;
      }
    } catch (err) {
      error.value = err.message;
      return false;
    }
  };

  onMounted(() => {
    if (token.value) {
      getAssistant();
    }
  });

  return {
    assistant,
    loading,
    error,
    getAssistant,
    updateName,
    increaseHeart
  };
}
```

---

## 最佳实践

### 1. 心动值调用时机
- 在每次完整的对话交互后调用
- 避免重复调用（如用户快速发送多条消息）
- 可以在AI回复完成后调用

### 2. 名称更新
- 提供实时验证（长度、空值检查）
- 保存成功后立即更新本地状态
- 提供用户反馈（成功/失败提示）

### 3. 错误处理
- 网络错误时提供重试机制
- 认证失败时引导用户重新登录
- 服务器错误时显示友好的错误信息

### 4. 状态管理
- 使用本地状态缓存AI助手信息
- 在关键操作后及时更新状态
- 考虑使用全局状态管理（如Redux、Pinia等）

---

## 测试建议

1. **功能测试**: 测试所有API接口的正常流程
2. **边界测试**: 测试名称长度限制、空值处理等
3. **错误测试**: 测试网络错误、认证失败等异常情况
4. **性能测试**: 测试频繁调用API的性能表现
5. **用户体验测试**: 测试界面响应、加载状态等

---

## 更新日志

- **v1.0.0** (2025-08-20): 初始版本，包含基础的AI助手功能
  - 支持创建/获取AI助手
  - 支持更新AI助手名称
  - 支持增加心动值
  - 支持查询AI助手信息

---

如有问题，请联系后端开发团队。
