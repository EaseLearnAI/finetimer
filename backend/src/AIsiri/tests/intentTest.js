'use strict';

/**
 * 意图识别准确率自动化测试脚本
 *
 * 用法：
 *   DASHSCOPE_API_KEY=xxx node src/AIsiri/tests/intentTest.js
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const llm = require('../agents/llmClient');

const ROUTER_SYSTEM_PROMPT = `你是一个智能路由系统，负责分析用户输入并完成三项任务：
1. 意图识别 2. 情绪检测 3. 实体提取

意图类型：TASK_CREATION / SCHEDULE_PLANNING / CONVERSATION
情绪类型：happy / sad / anxious / stressed / tired / angry / confused / neutral

输出严格 JSON：
{
  "primaryIntent": "...",
  "allIntents": [...],
  "confidence": 0.95,
  "emotion": { "type": "...", "intensity": 0.7, "triggers": [] },
  "entities": {}
}`;

const TEST_CASES = [
  { id: 'T01', input: '帮我创建一个明天下午开会的任务', expectedIntent: 'TASK_CREATION' },
  { id: 'T02', input: '重新安排一下今天的日程', expectedIntent: 'SCHEDULE_PLANNING' },
  { id: 'T03', input: '最近好迷茫不知道该做什么', expectedIntent: 'CONVERSATION' },
  { id: 'T04', input: '我今天好累啊，什么都不想做', expectedIntent: 'CONVERSATION' },
  { id: 'T05', input: '明天上午要开会，帮我安排一下时间', expectedIntent: 'TASK_CREATION' },
  { id: 'T06', input: '取快递，然后去买菜', expectedIntent: 'TASK_CREATION' },
  { id: 'T07', input: '后天下午3点约了牙医', expectedIntent: 'TASK_CREATION' },
  { id: 'T08', input: '能陪我聊聊天吗', expectedIntent: 'CONVERSATION' },
  { id: 'T09', input: '你好啊，今天过得怎么样', expectedIntent: 'CONVERSATION' },
  { id: 'T10', input: '压力好大，明天还有三个deadline', expectedIntent: 'CONVERSATION' },
  { id: 'T11', input: '提醒我晚上8点吃药', expectedIntent: 'TASK_CREATION' },
  { id: 'T12', input: '这周的任务能不能调整一下顺序', expectedIntent: 'SCHEDULE_PLANNING' },
  { id: 'T13', input: '我需要完成论文、做PPT、准备答辩', expectedIntent: 'TASK_CREATION' },
  { id: 'T14', input: '今天心情不错，有什么推荐做的', expectedIntent: 'CONVERSATION' },
  { id: 'T15', input: '帮我把过期的任务清理一下', expectedIntent: 'SCHEDULE_PLANNING' },
  { id: 'T16', input: '下周一上午有什么安排', expectedIntent: 'SCHEDULE_PLANNING' },
  { id: 'T17', input: '记一下，周五要交作业', expectedIntent: 'TASK_CREATION' },
  { id: 'T18', input: '好焦虑，考试要来了', expectedIntent: 'CONVERSATION' },
  { id: 'T19', input: '帮我安排一下明天的学习计划', expectedIntent: 'SCHEDULE_PLANNING' },
  { id: 'T20', input: '买生日礼物，预算500以内', expectedIntent: 'TASK_CREATION' },
  { id: 'T21', input: '谢谢你，你真的帮了我很多', expectedIntent: 'CONVERSATION' },
  { id: 'T22', input: '后天要出差，帮我记一下', expectedIntent: 'TASK_CREATION' },
  { id: 'T23', input: '把明天的会议推迟到下午', expectedIntent: 'SCHEDULE_PLANNING' },
  { id: 'T24', input: '我失眠了，好难受', expectedIntent: 'CONVERSATION' },
  { id: 'T25', input: '今天要去健身房，帮我安排个时间', expectedIntent: 'TASK_CREATION' },
  { id: 'T26', input: '删掉昨天创建的那个任务', expectedIntent: 'TASK_CREATION' },
  { id: 'T27', input: '跟你聊天真开心', expectedIntent: 'CONVERSATION' },
  { id: 'T28', input: '明天早上6点起床跑步', expectedIntent: 'TASK_CREATION' },
  { id: 'T29', input: '工作好多做不完怎么办', expectedIntent: 'CONVERSATION' },
  { id: 'T30', input: '今天过得还行吧', expectedIntent: 'CONVERSATION' },
];

async function runTest() {
  console.log('=== 意图识别准确率测试 ===\n');
  console.log(`总用例数: ${TEST_CASES.length}\n`);

  const results = [];
  let correct = 0;

  const intentCounts = {
    TASK_CREATION: { tp: 0, fp: 0, fn: 0 },
    SCHEDULE_PLANNING: { tp: 0, fp: 0, fn: 0 },
    CONVERSATION: { tp: 0, fp: 0, fn: 0 },
  };

  for (const tc of TEST_CASES) {
    try {
      const res = await llm.chatJSON(
        [
          { role: 'system', content: ROUTER_SYSTEM_PROMPT },
          { role: 'user', content: `用户输入："${tc.input}"` },
        ],
        { temperature: 0.1, maxTokens: 500 }
      );

      const actual = res.parsed?.primaryIntent || 'UNKNOWN';
      const isCorrect = actual === tc.expectedIntent;
      if (isCorrect) correct++;

      if (isCorrect) {
        intentCounts[tc.expectedIntent].tp++;
      } else {
        intentCounts[tc.expectedIntent].fn++;
        if (intentCounts[actual]) intentCounts[actual].fp++;
      }

      results.push({ ...tc, actualIntent: actual, correct: isCorrect });
      const mark = isCorrect ? '✓' : '✗';
      console.log(`${mark} ${tc.id}: "${tc.input}" → 期望:${tc.expectedIntent} 实际:${actual}`);
    } catch (e) {
      console.log(`✗ ${tc.id}: "${tc.input}" → 错误: ${e.message}`);
      results.push({ ...tc, actualIntent: 'ERROR', correct: false });
      intentCounts[tc.expectedIntent].fn++;
    }

    await new Promise((r) => setTimeout(r, 500));
  }

  console.log('\n=== 测试结果 ===\n');
  console.log(`总准确率: ${correct}/${TEST_CASES.length} = ${((correct / TEST_CASES.length) * 100).toFixed(1)}%\n`);

  console.log('各类意图指标:');
  for (const [intent, counts] of Object.entries(intentCounts)) {
    const precision = counts.tp + counts.fp > 0 ? counts.tp / (counts.tp + counts.fp) : 0;
    const recall = counts.tp + counts.fn > 0 ? counts.tp / (counts.tp + counts.fn) : 0;
    const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
    console.log(`  ${intent}: P=${(precision * 100).toFixed(1)}% R=${(recall * 100).toFixed(1)}% F1=${(f1 * 100).toFixed(1)}%`);
  }

  console.log('\n错误用例:');
  results.filter((r) => !r.correct).forEach((r) => {
    console.log(`  ${r.id}: "${r.input}" → 期望:${r.expectedIntent} 实际:${r.actualIntent}`);
  });
}

runTest().catch(console.error);
