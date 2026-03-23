'use strict';

/**
 * 多智能体协同调度延迟测试脚本
 *
 * 用法：需要先启动 MongoDB 和后端服务
 *   DASHSCOPE_API_KEY=xxx node src/AIsiri/tests/latencyTest.js
 *
 * 注意：此测试需要数据库连接
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const mongoose = require('mongoose');
const IntelligentDispatchService = require('../services/intelligentDispatchService');

const SCENARIOS = [
  { id: 'S01', name: '简单对话', input: '你好啊，今天过得怎么样' },
  { id: 'S02', name: '创建单个任务', input: '帮我创建一个明天开会的任务' },
  { id: 'S03', name: '日程规划', input: '帮我重新安排今天的日程' },
  { id: 'S04', name: '情绪陪伴', input: '好累啊，压力好大，什么都不想做' },
  { id: 'S05', name: '任务+日程', input: '明天上午要面试，帮我安排好时间' },
  { id: 'S06', name: '多任务创建', input: '明天要开会、取快递，帮我都记一下' },
];

const REPEAT_COUNT = 3;
const TEST_USER_ID = 'latency-test-user';

async function runTest() {
  console.log('=== 多智能体协同调度延迟测试 ===\n');

  const dbUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/aisiri';
  await mongoose.connect(dbUrl);
  console.log('MongoDB 已连接\n');

  const service = new IntelligentDispatchService();

  for (const scenario of SCENARIOS) {
    const times = [];
    console.log(`--- ${scenario.id}: ${scenario.name} ---`);
    console.log(`  输入: "${scenario.input}"`);

    for (let i = 0; i < REPEAT_COUNT; i++) {
      try {
        const start = Date.now();
        const result = await service.processUserInput(scenario.input, TEST_USER_ID, `test-session-${i}`);
        const elapsed = Date.now() - start;
        times.push(elapsed);
        console.log(`  第${i + 1}次: ${elapsed}ms | 意图: ${result.intents?.join(', ')} | 智能体: ${result.servicesExecuted?.join(', ')}`);
      } catch (e) {
        console.log(`  第${i + 1}次: 错误 - ${e.message}`);
        times.push(-1);
      }
      await new Promise((r) => setTimeout(r, 1000));
    }

    const validTimes = times.filter((t) => t > 0);
    if (validTimes.length > 0) {
      const avg = (validTimes.reduce((a, b) => a + b, 0) / validTimes.length).toFixed(0);
      const min = Math.min(...validTimes);
      const max = Math.max(...validTimes);
      console.log(`  结果: avg=${avg}ms min=${min}ms max=${max}ms (${validTimes.length}/${REPEAT_COUNT} 成功)\n`);
    } else {
      console.log(`  结果: 全部失败\n`);
    }
  }

  await mongoose.disconnect();
  console.log('测试完成。');
}

runTest().catch(console.error);
