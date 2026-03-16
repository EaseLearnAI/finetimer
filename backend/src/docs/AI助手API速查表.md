# AI助手API速查表

## 快速参考

| 功能 | 方法 | 路径 | 参数 | 说明 |
|------|------|------|------|------|
| 获取/创建助手 | GET | `/api/ai-assistant` | 无 | 自动创建默认助手 |
| 查看助手信息 | GET | `/api/ai-assistant/info` | 无 | 获取详细信息 |
| 更新助手名称 | PUT | `/api/ai-assistant/name` | `{name: "新名称"}` | 限制50字符 |
| 增加心动值 | POST | `/api/ai-assistant/heart` | 无 | 每次对话调用 |

## 请求头格式

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

## 响应格式

### 成功响应
```json
{
  "success": true,
  "data": {
    "id": "助手ID",
    "name": "助手名称",
    "heartValue": 心动值,
    "createdAt": "创建时间",
    "updatedAt": "更新时间"
  },
  "message": "操作成功提示"
}
```

### 错误响应
```json
{
  "success": false,
  "message": "错误描述",
  "error": "详细错误"
}
```

## 状态码

- `200` - 成功
- `400` - 参数错误
- `401` - 未认证
- `500` - 服务器错误

## 使用示例

### 获取助手信息
```javascript
fetch('/api/ai-assistant/info', {
  headers: { 'Authorization': `Bearer ${token}` }
})
```

### 更新名称
```javascript
fetch('/api/ai-assistant/name', {
  method: 'PUT',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({ name: '新名称' })
})
```

### 增加心动值
```javascript
fetch('/api/ai-assistant/heart', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
})
```

## 注意事项

- 所有接口都需要JWT认证
- 名称长度限制50字符
- 心动值每次对话+1
- 自动创建默认助手（名称：AI智能助手）
