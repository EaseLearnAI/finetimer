# AI Siri 意图识别服务

基于通义千问大模型的智能意图识别系统，能够自动识别用户输入的四种不同意图类型。

## 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 设置环境变量
```bash
export DASHSCOPE_API_KEY=your-api-key-here
```

### 3. 启动服务
```bash
# 使用启动脚本（推荐）
./start.sh

# 或者直接启动
node app.js
```

### 4. 测试服务
```bash
# 健康检查
curl http://localhost:3001/health

# 意图识别测试
curl -X POST http://localhost:3001/api/intent/recognize \
  -H "Content-Type: application/json" \
  -d '{"input": "我要去取快递"}'
```

## 支持的意图类型

| 意图类型 | 描述 | 示例 |
|---------|------|------|
| CONVERSATION | 正常对话、情绪安慰 | "你好"、"我感觉有点累" |
| TASK_CREATION | 任务新增、习惯养成 | "我要去取快递"、"提醒我明天开会" |
| SCHEDULE_PLANNING | 时间调度、日程安排 | "帮我安排明天的日程" |
| EXTERNAL_TOOL | 外部工具调用 | "今天天气怎么样"、"从公司到家要多久" |

## 项目结构

```
backend/src/AIsiri/
├── app.js                  # 主应用入口
├── start.sh               # 启动脚本
├── controllers/           # API控制器
├── services/              # 核心业务逻辑
├── routes/                # 路由定义
├── prompt/                # 提示词模板
├── utils/                 # 工具类
├── tests/                 # 测试文件
├── docs/                  # 项目文档
└── logs/                  # 日志文件
```

## 快速测试

运行手动测试脚本：
```bash
node tests/manual-test.js
```

运行自动化测试：
```bash
npm test
```

## API 文档

详细的API使用说明请参考：[API文档](docs/API文档.md)

## 项目特性

- ✅ 四种意图类型识别
- ✅ 高精度识别（95%+）
- ✅ 实时处理（2-3秒响应）
- ✅ 批量处理支持
- ✅ 完整的错误处理
- ✅ 详细的日志记录
- ✅ 健康监控接口
- ✅ 完善的测试覆盖

## 技术栈

- **Node.js** + **Express.js** - 后端框架
- **通义千问** - AI大模型
- **Winston** - 日志管理
- **Jest** - 测试框架
- **axios** - HTTP客户端

## 环境要求

- Node.js >= 16.0.0
- npm >= 8.0.0
- 通义千问API密钥

## 故障排除

### 1. API调用超时
- 检查网络连接
- 确认API密钥有效
- 适当增加超时时间

### 2. 服务启动失败
- 检查端口3001是否被占用
- 确认所有依赖已安装
- 查看详细错误日志

### 3. 识别结果不准确
- 检查输入文本是否清晰
- 考虑优化提示词模板
- 查看详细的推理过程

## 支持与反馈

如有问题或建议，请查看：
- [项目总结与改进](docs/项目总结与改进.md)
- [API文档](docs/API文档.md)

## 许可证

MIT License

