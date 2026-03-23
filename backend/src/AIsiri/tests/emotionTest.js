'use strict';

/**
 * 情绪识别准确率自动化测试脚本
 *
 * 用法：
 *   DASHSCOPE_API_KEY=xxx node src/AIsiri/tests/emotionTest.js
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const llm = require('../agents/llmClient');

const EMOTION_PROMPT = `分析以下用户输入的情绪状态，输出 JSON：
{
  "emotion": "happy|sad|anxious|stressed|tired|angry|neutral",
  "intensity": 0.0-1.0,
  "triggers": ["触发因素"]
}`;

const TEST_CASES = [
  { id: 'E01', input: '今天升职了，太开心了！', expected: 'happy' },
  { id: 'E02', input: '考试没考好，好失落', expected: 'sad' },
  { id: 'E03', input: '明天要答辩，好紧张', expected: 'anxious' },
  { id: 'E04', input: '工作一堆，头都大了', expected: 'stressed' },
  { id: 'E05', input: '加班到凌晨，困死了', expected: 'tired' },
  { id: 'E06', input: '被室友气死了', expected: 'angry' },
  { id: 'E07', input: '今天就这样吧', expected: 'neutral' },
  { id: 'E08', input: '刚跑完步，感觉很舒服', expected: 'happy' },
  { id: 'E09', input: '分手了，心好痛', expected: 'sad' },
  { id: 'E10', input: '马上要截止了还没写完', expected: 'anxious' },
  { id: 'E11', input: '周末和朋友出去玩了', expected: 'happy' },
  { id: 'E12', input: '被老板批评了，好难过', expected: 'sad' },
  { id: 'E13', input: '下周要面试，心里没底', expected: 'anxious' },
  { id: 'E14', input: '项目要延期了，急死了', expected: 'stressed' },
  { id: 'E15', input: '熬夜写论文，眼睛都睁不开', expected: 'tired' },
  { id: 'E16', input: '快递被别人拿走了，太气人了', expected: 'angry' },
  { id: 'E17', input: '帮我查一下天气', expected: 'neutral' },
  { id: 'E18', input: '终于完成了所有任务！爽！', expected: 'happy' },
  { id: 'E19', input: '最好的朋友要出国了，好舍不得', expected: 'sad' },
  { id: 'E20', input: '论文初稿还没写，下周就要交了', expected: 'anxious' },
  { id: 'E21', input: '同时处理三件事，忙不过来', expected: 'stressed' },
  { id: 'E22', input: '今天跑了10公里，累瘫了', expected: 'tired' },
  { id: 'E23', input: '你说什么呢，完全不对', expected: 'angry' },
  { id: 'E24', input: '创建一个新任务', expected: 'neutral' },
  { id: 'E25', input: '比赛赢了！我是第一名！', expected: 'happy' },
  { id: 'E26', input: '养了两年的花枯萎了', expected: 'sad' },
  { id: 'E27', input: '成绩还没出来，好焦虑', expected: 'anxious' },
  { id: 'E28', input: '每天都在加班，受不了了', expected: 'stressed' },
  { id: 'E29', input: '坐了一天飞机，浑身难受', expected: 'tired' },
  { id: 'E30', input: '又迟到了，对不起', expected: 'sad' },
  { id: 'E31', input: '终于放假啦！太棒了', expected: 'happy' },
  { id: 'E32', input: '没有人记得我的生日', expected: 'sad' },
  { id: 'E33', input: '体检报告有个指标异常', expected: 'anxious' },
  { id: 'E34', input: '三个项目并行，压力山大', expected: 'stressed' },
  { id: 'E35', input: '凌晨3点还在改bug', expected: 'tired' },
  { id: 'E36', input: '电脑突然蓝屏了，数据没保存', expected: 'angry' },
  { id: 'E37', input: '帮我安排一下明天的行程', expected: 'neutral' },
  { id: 'E38', input: '收到录取通知书了！！！', expected: 'happy' },
  { id: 'E39', input: '宠物生病了，好担心', expected: 'anxious' },
  { id: 'E40', input: '又要搬家了，烦死了', expected: 'stressed' },
];

async function runTest() {
  console.log('=== 情绪识别准确率测试 ===\n');
  console.log(`总用例数: ${TEST_CASES.length}\n`);

  const confusionMatrix = {};
  const emotions = ['happy', 'sad', 'anxious', 'stressed', 'tired', 'angry', 'neutral'];
  emotions.forEach((e) => { confusionMatrix[e] = {}; emotions.forEach((f) => { confusionMatrix[e][f] = 0; }); });

  let correct = 0;
  const errors = [];

  for (const tc of TEST_CASES) {
    try {
      const res = await llm.chatJSON(
        [
          { role: 'system', content: EMOTION_PROMPT },
          { role: 'user', content: `用户输入："${tc.input}"` },
        ],
        { temperature: 0.1, maxTokens: 200 }
      );

      const actual = res.parsed?.emotion || 'neutral';
      const isCorrect = actual === tc.expected;
      if (isCorrect) correct++;
      else errors.push({ ...tc, actual });

      if (confusionMatrix[tc.expected]) {
        confusionMatrix[tc.expected][actual] = (confusionMatrix[tc.expected][actual] || 0) + 1;
      }

      const mark = isCorrect ? '✓' : '✗';
      console.log(`${mark} ${tc.id}: "${tc.input}" → 期望:${tc.expected} 实际:${actual}`);
    } catch (e) {
      console.log(`✗ ${tc.id}: ERROR ${e.message}`);
      errors.push({ ...tc, actual: 'ERROR' });
    }

    await new Promise((r) => setTimeout(r, 300));
  }

  console.log('\n=== 测试结果 ===\n');
  console.log(`总准确率: ${correct}/${TEST_CASES.length} = ${((correct / TEST_CASES.length) * 100).toFixed(1)}%\n`);

  console.log('混淆矩阵（行=实际，列=预测）:');
  const header = '         ' + emotions.map((e) => e.slice(0, 7).padEnd(8)).join('');
  console.log(header);
  for (const actual of emotions) {
    const row = actual.padEnd(9) + emotions.map((pred) => String(confusionMatrix[actual]?.[pred] || 0).padEnd(8)).join('');
    console.log(row);
  }

  if (errors.length > 0) {
    console.log('\n错误用例:');
    errors.forEach((e) => console.log(`  ${e.id}: "${e.input}" → 期望:${e.expected} 实际:${e.actual}`));
  }
}

runTest().catch(console.error);
