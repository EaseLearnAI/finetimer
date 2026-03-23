# AIsiri 多智能体协同系统测试方案

## 一、测试目标

验证基于 LangGraph.js 的多智能体协同架构在以下维度的表现：

1. **意图识别准确率** ≥ 85%
2. **多智能体协同调度延迟** < 5 秒
3. **情绪识别准确率** ≥ 80%
4. **用户体验满意度** SUS 评分 ≥ 68（"良好"阈值）

---

## 二、意图识别测试

### 2.1 测试用例集（30 条）

| 编号 | 输入文本 | 预期主意图 | 预期多意图 |
|------|---------|-----------|-----------|
| T01 | "帮我创建一个明天下午开会的任务" | TASK_CREATION | [TASK_CREATION] |
| T02 | "重新安排一下今天的日程" | SCHEDULE_PLANNING | [SCHEDULE_PLANNING] |
| T03 | "今天上海天气怎么样" | EXTERNAL_TOOL | [EXTERNAL_TOOL] |
| T04 | "我今天好累啊，什么都不想做" | CONVERSATION | [CONVERSATION] |
| T05 | "明天上午要开会，帮我安排一下时间" | TASK_CREATION | [TASK_CREATION, SCHEDULE_PLANNING] |
| T06 | "取快递，然后去买菜" | TASK_CREATION | [TASK_CREATION] |
| T07 | "后天下午3点约了牙医" | TASK_CREATION | [TASK_CREATION] |
| T08 | "帮我看看从公司到虹桥机场要多久" | EXTERNAL_TOOL | [EXTERNAL_TOOL] |
| T09 | "你好啊，今天过得怎么样" | CONVERSATION | [CONVERSATION] |
| T10 | "压力好大，明天还有三个 deadline" | CONVERSATION | [CONVERSATION, TASK_CREATION] |
| T11 | "提醒我晚上8点吃药" | TASK_CREATION | [TASK_CREATION] |
| T12 | "这周的任务能不能调整一下顺序" | SCHEDULE_PLANNING | [SCHEDULE_PLANNING] |
| T13 | "我需要完成论文、做PPT、准备答辩" | TASK_CREATION | [TASK_CREATION, SCHEDULE_PLANNING] |
| T14 | "今天心情不错，有什么推荐做的" | CONVERSATION | [CONVERSATION, SCHEDULE_PLANNING] |
| T15 | "到南京路怎么走" | EXTERNAL_TOOL | [EXTERNAL_TOOL] |
| T16 | "下周一上午有什么安排" | SCHEDULE_PLANNING | [SCHEDULE_PLANNING] |
| T17 | "记一下，周五要交作业" | TASK_CREATION | [TASK_CREATION] |
| T18 | "好焦虑，考试要来了" | CONVERSATION | [CONVERSATION] |
| T19 | "帮我安排一下明天的学习计划" | SCHEDULE_PLANNING | [SCHEDULE_PLANNING] |
| T20 | "买生日礼物，预算500以内" | TASK_CREATION | [TASK_CREATION] |
| T21 | "谢谢你，你真的帮了我很多" | CONVERSATION | [CONVERSATION] |
| T22 | "北京天气怎么样，我后天要出差" | EXTERNAL_TOOL | [EXTERNAL_TOOL, TASK_CREATION] |
| T23 | "把明天的会议推迟到下午" | SCHEDULE_PLANNING | [SCHEDULE_PLANNING] |
| T24 | "我失眠了，好难受" | CONVERSATION | [CONVERSATION] |
| T25 | "今天要去健身房，帮我安排个时间" | TASK_CREATION | [TASK_CREATION, SCHEDULE_PLANNING] |
| T26 | "删掉昨天创建的那个任务" | TASK_CREATION | [TASK_CREATION] |
| T27 | "跟你聊天真开心" | CONVERSATION | [CONVERSATION] |
| T28 | "明天早上6点起床跑步" | TASK_CREATION | [TASK_CREATION] |
| T29 | "工作好多做不完怎么办" | CONVERSATION | [CONVERSATION, SCHEDULE_PLANNING] |
| T30 | "从上海到杭州开车要多久" | EXTERNAL_TOOL | [EXTERNAL_TOOL] |

### 2.2 评估指标

- **主意图准确率** = 正确识别数 / 总测试数
- **各类意图精确率** = 该类正确数 / 该类预测总数
- **各类意图召回率** = 该类正确数 / 该类实际总数
- **F1 值** = 2 × 精确率 × 召回率 / (精确率 + 召回率)

### 2.3 执行方式

```javascript
// 自动化测试脚本
const testCases = [...]; // 上述30条
for (const tc of testCases) {
  const result = await graph.invoke({ userInput: tc.input, userId: 'test' });
  assert(result.primaryIntent === tc.expectedIntent);
}
```

---

## 三、多智能体协同效率测试

### 3.1 测试场景

| 场景编号 | 场景描述 | 触发的智能体 | 预期响应时间 |
|---------|---------|-------------|------------|
| S01 | 简单对话 | Router → Emotion | < 3s |
| S02 | 创建单个任务 | Router → Task → Emotion | < 4s |
| S03 | 日程规划 | Router → Schedule → Emotion | < 5s |
| S04 | 天气查询 | Router → Tool → Emotion | < 4s |
| S05 | 任务创建+日程规划 | Router → Task + Schedule → Emotion | < 6s |
| S06 | 任务+日程+天气 | Router → Task + Schedule + Tool → Emotion | < 7s |

### 3.2 测试方法

每个场景执行 10 次，记录平均响应时间、最大响应时间、最小响应时间。

### 3.3 指标

- **平均延迟**
- **P95 延迟**
- **智能体并行加速比** = 串行理论时间 / 实际并行时间

---

## 四、情感交互效果测试

### 4.1 情绪识别测试集（50 条）

| 编号 | 输入文本 | 标注情绪 |
|------|---------|---------|
| E01 | "今天升职了，太开心了！" | happy |
| E02 | "考试没考好，好失落" | sad |
| E03 | "明天要答辩，好紧张" | anxious |
| E04 | "工作一堆，头都大了" | stressed |
| E05 | "加班到凌晨，困死了" | tired |
| E06 | "被室友气死了" | angry |
| E07 | "今天就这样吧" | neutral |
| E08 | "刚跑完步，感觉很舒服" | happy |
| E09 | "分手了，心好痛" | sad |
| E10 | "马上要截止了还没写完" | anxious |
| ... | （共 50 条，每类 7-8 条） | ... |

### 4.2 评估方法

- 情绪分类准确率
- 混淆矩阵可视化
- 分类报告（precision/recall/f1 per class）

### 4.3 共情回应质量评估

由 5 名评估者对 20 组"负面情绪输入+AI回复"进行评分：

| 维度 | 评分标准 | 分值 |
|------|---------|------|
| 情绪理解度 | AI 是否准确理解了用户情绪 | 1-5 |
| 回应自然度 | 回复是否自然、不生硬 | 1-5 |
| 温暖感受度 | 是否感受到关心和温暖 | 1-5 |
| 行动建议有效性 | 给出的建议是否实用 | 1-5 |

---

## 五、用户体验测试

### 5.1 测试方案

- **参与者**：5-10 名大学生/职场新人
- **测试周期**：2 周
- **使用要求**：每天至少使用 1 次 AI 助手功能
- **记录数据**：任务完成率、日均交互次数、功能使用分布

### 5.2 SUS 可用性量表

系统可用性量表（System Usability Scale）10 题评估：

1. 我认为我会经常使用这个系统
2. 我觉得这个系统不必要地复杂
3. 我认为这个系统容易使用
4. 我认为我需要技术支持才能使用这个系统
5. 我发现这个系统中的各项功能整合得很好
6. 我认为这个系统中有太多不一致的地方
7. 我想大多数人很快就能学会使用这个系统
8. 我觉得使用这个系统很麻烦
9. 我使用这个系统时感到很有信心
10. 我需要学很多东西才能使用这个系统

评分标准：1（强烈不同意）— 5（强烈同意）

### 5.3 附加问卷

1. 你最常使用的功能是什么？
2. AI 助手的回复是否让你感到被理解？
3. 相比传统时间管理工具，你认为本系统的最大优势是什么？
4. 你对语音克隆功能有什么感受？
5. 你愿意长期使用这个系统吗？

---

## 六、测试执行时间表

| 阶段 | 时间 | 内容 |
|------|------|------|
| 单元测试 | 第 1 周 | 意图识别 30 条 + 情绪识别 50 条 |
| 集成测试 | 第 2 周 | 协同效率 6 场景 × 10 次 |
| 用户测试 | 第 3-4 周 | 5-10 名用户 2 周使用 |
| 数据分析 | 第 5 周 | 汇总结果、绘制图表、撰写论文第六章 |
