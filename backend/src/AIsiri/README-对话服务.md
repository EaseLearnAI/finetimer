# AI Siri 对话服务 - 快速开始指南

本指南将帮助您快速启动和使用AI Siri对话服务。

## 🚀 快速开始

### 1. 环境要求

- Node.js 16+ 
- MongoDB 4.4+
- 通义千问API密钥

### 2. 安装与配置

```bash
# 1. 克隆项目（如果尚未克隆）
git clone <repository_url>
cd timer3/backend

# 2. 安装依赖
npm install

# 3. 配置环境变量
# 在backend/.env文件中添加：
DASHSCOPE_API_KEY=sk-2904b4f09f5f4a29b2cdcc748e27da9e
MONGODB_URI=mongodb://localhost:27017/aisiri
JWT_SECRET=your-secret-key-change-in-production
NODE_ENV=development
PORT=3000

# 4. 启动MongoDB服务
# macOS: brew services start mongodb-community
# Linux: sudo systemctl start mongod
# Windows: net start MongoDB

# 5. 启动服务
npm start
```

### 3. 验证安装

访问以下URL验证服务是否正常运行：

- 主服务健康检查: http://localhost:3000/
- 对话服务健康检查: http://localhost:3000/api/ai/conversation/health

## 💬 基本使用

### 1. 用户注册和登录

```bash
# 注册新用户
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "13800138001",
    "password": "123456",
    "nickname": "测试用户"
  }'

# 登录获取令牌
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "13800138001",
    "password": "123456"
  }'
```

### 2. 发送对话消息

```bash
# 使用获取到的token发送对话消息
curl -X POST http://localhost:3000/api/ai/conversation/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "message": "你好，我今天心情不太好，能陪我聊聊吗？"
  }'
```

### 3. 获取对话历史

```bash
# 获取对话历史
curl -X GET "http://localhost:3000/api/ai/conversation/history?limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 📋 功能特性

### ✅ 已实现功能

1. **智能对话**：
   - 基于通义千问的自然对话
   - 情绪检测与个性化回应
   - 上下文感知的连续对话

2. **意图识别**：
   - 四种意图类型准确识别
   - 非对话类型智能拒绝
   - 详细的推理过程说明

3. **对话管理**：
   - 完整的对话历史记录
   - 会话级别的上下文管理
   - 灵活的历史查询和管理

4. **用户系统**：
   - JWT认证机制
   - 用户数据隔离
   - 安全的API访问控制

### 🎯 支持的意图类型

| 意图类型 | 代码 | 描述 | 处理方式 |
|---------|-----|------|----------|
| 正常对话 | `CONVERSATION` | 情绪表达、聊天、寻求安慰 | ✅ 提供智能对话 |
| 任务新增 | `TASK_CREATION` | 创建待办、习惯养成 | ❌ 拒绝并建议使用任务管理 |
| 时间调度 | `SCHEDULE_PLANNING` | 日程安排、时间规划 | ❌ 拒绝并建议使用日程功能 |
| 外部工具 | `EXTERNAL_TOOL` | 天气查询、地图导航 | ❌ 拒绝并建议使用工具功能 |

### 😊 情绪检测支持

系统能够识别以下情绪状态并给出相应回应：

- **happy** - 开心、兴奋时的积极回应
- **sad** - 难过、沮丧时的安慰支持  
- **tired** - 疲惫、压力大时的关怀建议
- **stressed** - 焦虑、紧张时的缓解指导
- **frustrated** - 挫败、烦躁时的理解鼓励
- **confused** - 困惑、迷茫时的耐心解答
- **neutral** - 中性状态的友好交流

## 🔧 开发和测试

### 运行测试

```bash
# 进入AI服务目录
cd src/AIsiri

# 运行意图识别测试
node tests/manual-test.js

# 运行对话功能手动测试
node tests/conversation-manual-test.js

# 运行完整API测试（需要先启动服务）
node tests/api-test.js
```

### 调试模式

```bash
# 设置详细日志级别
export LOG_LEVEL=debug

# 启动服务（会输出详细的调试信息）
npm start
```

### 查看日志

```bash
# 查看实时日志
tail -f src/AIsiri/logs/application-$(date +%Y-%m-%d).log

# 查看错误日志
tail -f src/AIsiri/logs/error-$(date +%Y-%m-%d).log
```

## 🌟 使用示例

### JavaScript 示例

```javascript
// 完整的对话示例
class ConversationClient {
  constructor(baseURL = 'http://localhost:3000/api') {
    this.baseURL = baseURL;
    this.token = null;
  }

  async login(phoneNumber, password) {
    const response = await fetch(`${this.baseURL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber, password })
    });
    
    const result = await response.json();
    this.token = result.data.token;
    return result;
  }

  async sendMessage(message, sessionId = null) {
    const response = await fetch(`${this.baseURL}/ai/conversation/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify({ message, sessionId })
    });
    
    return await response.json();
  }

  async getHistory(sessionId = null, limit = 10) {
    const params = new URLSearchParams({ limit });
    if (sessionId) params.append('sessionId', sessionId);
    
    const response = await fetch(
      `${this.baseURL}/ai/conversation/history?${params}`,
      {
        headers: { 'Authorization': `Bearer ${this.token}` }
      }
    );
    
    return await response.json();
  }
}

// 使用示例
async function example() {
  const client = new ConversationClient();
  
  // 登录
  await client.login('13800138001', '123456');
  console.log('登录成功');
  
  // 开始对话
  let result = await client.sendMessage('你好，我今天工作压力很大');
  console.log('AI:', result.data.assistantMessage.content);
  
  // 继续对话
  const sessionId = result.data.sessionId;
  result = await client.sendMessage('有什么建议可以缓解压力吗？', sessionId);
  console.log('AI:', result.data.assistantMessage.content);
  
  // 查看对话历史
  const history = await client.getHistory(sessionId);
  console.log('对话数量:', history.data.conversations.length);
}
```

### Python 示例

```python
import requests

class ConversationClient:
    def __init__(self, base_url='http://localhost:3000/api'):
        self.base_url = base_url
        self.session = requests.Session()
        
    def login(self, phone_number, password):
        response = self.session.post(
            f'{self.base_url}/users/login',
            json={'phoneNumber': phone_number, 'password': password}
        )
        response.raise_for_status()
        
        result = response.json()
        token = result['data']['token']
        self.session.headers.update({
            'Authorization': f'Bearer {token}'
        })
        return result
    
    def send_message(self, message, session_id=None):
        data = {'message': message}
        if session_id:
            data['sessionId'] = session_id
            
        response = self.session.post(
            f'{self.base_url}/ai/conversation/send',
            json=data
        )
        response.raise_for_status()
        return response.json()
    
    def get_history(self, session_id=None, limit=10):
        params = {'limit': limit}
        if session_id:
            params['sessionId'] = session_id
            
        response = self.session.get(
            f'{self.base_url}/ai/conversation/history',
            params=params
        )
        response.raise_for_status()
        return response.json()

# 使用示例
def main():
    client = ConversationClient()
    
    # 登录
    client.login('13800138001', '123456')
    print('登录成功')
    
    # 发送消息
    result = client.send_message('我最近感到很焦虑，不知道怎么办')
    print('AI回应:', result['data']['assistantMessage']['content'])
    
    # 继续对话
    session_id = result['data']['sessionId']
    result = client.send_message('能给我一些缓解焦虑的建议吗？', session_id)
    print('AI回应:', result['data']['assistantMessage']['content'])

if __name__ == '__main__':
    main()
```

## 📚 相关文档

- **API文档**: `docs/对话服务API文档.md`
- **项目总结**: `docs/对话服务项目总结.md`
- **意图识别文档**: `docs/API文档.md`
- **架构设计**: `docs/整体文档/`

## ❓ 常见问题

### Q: 为什么对话响应时间较长？
A: AI模型推理需要时间，正常响应时间为2-3秒。可以通过缓存和优化prompt来改善。

### Q: 如何处理非对话类型的消息？
A: 系统会自动识别并拒绝非对话类型消息，同时提供相应的功能建议。

### Q: 对话历史会保存多久？
A: 目前对话历史会永久保存，用户可以主动删除不需要的对话记录。

### Q: 如何个性化AI的回应风格？
A: 当前版本AI具有固定的温暖友善风格，后续版本将支持个性化设置。

### Q: 系统支持多少并发用户？
A: 当前版本经过基础测试，具体并发限制取决于服务器配置和数据库性能。

## 🆘 故障排除

### 常见错误及解决方案

1. **"API密钥无效"**
   - 检查环境变量DASHSCOPE_API_KEY是否正确设置
   - 确认API密钥是否有效且未过期

2. **"数据库连接失败"**
   - 确认MongoDB服务是否启动
   - 检查MONGODB_URI配置是否正确

3. **"认证失败"**
   - 检查JWT_SECRET是否配置
   - 确认请求头中包含正确的Authorization

4. **"服务启动失败"**
   - 检查端口3000是否被占用
   - 查看错误日志获取详细信息

### 获取帮助

如果遇到其他问题，请：

1. 查看服务日志文件
2. 检查API文档中的错误码说明
3. 运行健康检查接口确认服务状态
4. 联系开发团队获取技术支持

---

**文档版本**: v1.0.0  
**最后更新**: 2025-08-17  
**维护团队**: AI开发团队

