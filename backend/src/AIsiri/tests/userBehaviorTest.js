'use strict';

const http = require('http');

const BASE_URL = 'http://localhost:3000';
let TOKEN = '';
let USERID = '';

function request(method, path, body, useAuth = true) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const headers = { 'Content-Type': 'application/json' };
    if (useAuth && TOKEN) headers['Authorization'] = `Bearer ${TOKEN}`;
    const data = body ? JSON.stringify(body) : null;

    const req = http.request(
      { hostname: url.hostname, port: url.port, path: url.pathname, method, headers },
      (res) => {
        let buf = '';
        res.on('data', (c) => (buf += c));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(buf) });
          } catch {
            resolve({ status: res.statusCode, data: buf });
          }
        });
      }
    );
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function dispatchAndWait(input) {
  const sessionId = `test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const start = Date.now();
  const res = await request('POST', '/api/aisiri/dispatch', { userInput: input, sessionId });
  const elapsed = Date.now() - start;
  return { ...res, elapsed };
}

const testCases = [
  {
    id: 1,
    name: '修复验证 — 今天上班（之前的 Bug）',
    input: '今天早上11点上班',
    expectIntent: 'TASK_CREATION',
    expectTitle: /上班/,
    expectTime: '11:00',
  },
  {
    id: 2,
    name: '基础任务创建 — 明天下午会议',
    input: '我明天下午3:00有个会议',
    expectIntent: 'TASK_CREATION',
    expectTitle: /会议/,
    expectTime: '15:00',
  },
  {
    id: 3,
    name: '替代表达 — 帮我创建任务',
    input: '帮我创建一个明天下午3点开会的任务',
    expectIntent: 'TASK_CREATION',
    expectTitle: /开会|会议/,
    expectTime: '15:00',
  },
  {
    id: 4,
    name: '晚间提醒 — 复习英语',
    input: '提醒我今晚8点复习英语',
    expectIntent: 'TASK_CREATION',
    expectTitle: /复习|英语/,
    expectTime: '20:00',
  },
  {
    id: 5,
    name: '后天安排 — 导师讨论',
    input: '我后天下午两点要和导师讨论论文',
    expectIntent: 'TASK_CREATION',
    expectTitle: /导师|讨论|论文/,
    expectTime: '14:00',
  },
  {
    id: 6,
    name: '情绪表达 — 焦虑输入',
    input: '我今天好累啊，下午还有好多事没做完',
    expectIntent: 'CONVERSATION',
    expectEmotion: /tired|stressed|anxious/,
  },
  {
    id: 7,
    name: '日程整理 — 规划请求',
    input: '帮我看看今天有什么任务安排',
    expectIntent: 'SCHEDULE_PLANNING',
  },
];

async function runTests() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('   AIsiri 用户行为模拟测试');
  console.log('═══════════════════════════════════════════════════════\n');

  // Step 1: Login
  console.log('▸ 步骤 1: 登录账号 15691887650');
  const loginRes = await request('POST', '/api/users/login', {
    phoneNumber: '15691887650',
    password: '123456',
  }, false);
  if (!loginRes.data.success) {
    console.log('  ✘ 登录失败:', loginRes.data.message);
    process.exit(1);
  }
  TOKEN = loginRes.data.data.token;
  USERID = loginRes.data.data.user.id;
  console.log(`  ✔ 登录成功，用户: ${loginRes.data.data.user.nickname} (${USERID})\n`);

  // Step 2: Check existing tasks
  console.log('▸ 步骤 2: 查看当前任务列表');
  const tasksBeforeRes = await request('GET', '/api/tasks');
  const tasksBefore = tasksBeforeRes.data.data || tasksBeforeRes.data || [];
  console.log(`  当前任务数: ${Array.isArray(tasksBefore) ? tasksBefore.length : '未知'}\n`);

  // Step 3: Run dispatch test cases
  console.log('▸ 步骤 3: 模拟自然语言输入\n');
  const results = [];

  for (const tc of testCases) {
    console.log(`  ─── 测试 ${tc.id}: ${tc.name} ───`);
    console.log(`  输入: "${tc.input}"`);

    try {
      const res = await dispatchAndWait(tc.input);
      const d = res.data.data || res.data;

      const intents = d.intents || [];
      const response = d.response || '';
      const taskCreated = d.taskCreated;
      const emotion = d.emotionalSupport || '';
      const services = d.servicesExecuted || [];

      const intentOk = tc.expectIntent
        ? intents.includes(tc.expectIntent)
        : true;

      let titleOk = true;
      let timeOk = true;
      let emotionOk = true;

      if (tc.expectTitle && taskCreated) {
        titleOk = tc.expectTitle.test(taskCreated.title);
      } else if (tc.expectTitle && !taskCreated) {
        titleOk = false;
      }

      if (tc.expectTime && taskCreated) {
        const createdTime = taskCreated.timeBlock?.startTime || taskCreated.time || '';
        timeOk = createdTime === tc.expectTime;
      } else if (tc.expectTime && !taskCreated) {
        timeOk = false;
      }

      if (tc.expectEmotion) {
        emotionOk = tc.expectEmotion.test(emotion);
      }

      const allPass = intentOk && titleOk && timeOk && emotionOk;

      console.log(`  意图: ${intents.join(', ')} ${intentOk ? '✔' : '✘ (期望: ' + tc.expectIntent + ')'}`);
      if (tc.expectTitle) {
        console.log(`  任务: ${taskCreated ? taskCreated.title : '未创建'} ${titleOk ? '✔' : '✘'}`);
      }
      if (tc.expectTime) {
        const actualTime = taskCreated ? (taskCreated.timeBlock?.startTime || taskCreated.time || '无') : '无';
        console.log(`  时间: ${actualTime} ${timeOk ? '✔' : '✘ (期望: ' + tc.expectTime + ')'}`);
      }
      if (taskCreated) {
        console.log(`  日期: ${taskCreated.date}`);
      }
      if (tc.expectEmotion) {
        console.log(`  情绪: ${emotion} ${emotionOk ? '✔' : '✘'}`);
      }
      console.log(`  回复: ${response.substring(0, 80)}...`);
      console.log(`  服务: ${services.join(', ')}`);
      console.log(`  耗时: ${res.elapsed}ms`);
      console.log(`  结果: ${allPass ? '✅ 通过' : '❌ 未通过'}\n`);

      results.push({ id: tc.id, name: tc.name, pass: allPass, elapsed: res.elapsed });
    } catch (err) {
      console.log(`  ✘ 错误: ${err.message}\n`);
      results.push({ id: tc.id, name: tc.name, pass: false, error: err.message });
    }
  }

  // Step 4: Verify tasks in database
  console.log('▸ 步骤 4: 验证数据库任务持久化');
  const tasksAfterRes = await request('GET', '/api/tasks');
  const tasksAfter = tasksAfterRes.data.data || tasksAfterRes.data || [];
  const newTaskCount = (Array.isArray(tasksAfter) ? tasksAfter.length : 0) - (Array.isArray(tasksBefore) ? tasksBefore.length : 0);
  console.log(`  测试前任务数: ${Array.isArray(tasksBefore) ? tasksBefore.length : '?'}`);
  console.log(`  测试后任务数: ${Array.isArray(tasksAfter) ? tasksAfter.length : '?'}`);
  console.log(`  新增任务数: ${newTaskCount}`);

  if (Array.isArray(tasksAfter)) {
    const recentTasks = tasksAfter.slice(-5);
    console.log('  最近任务:');
    recentTasks.forEach((t) => {
      console.log(`    - [${t.date}] ${t.title} (time: ${t.time || t.timeBlock?.startTime || '无'}, completed: ${t.completed})`);
    });
  }

  // Summary
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('   测试报告');
  console.log('═══════════════════════════════════════════════════════\n');

  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass).length;
  const avgTime = Math.round(results.reduce((a, r) => a + (r.elapsed || 0), 0) / results.length);

  results.forEach((r) => {
    console.log(`  ${r.pass ? '✅' : '❌'} 测试${r.id}: ${r.name} (${r.elapsed || 0}ms)`);
  });

  console.log(`\n  通过: ${passed}/${results.length}  失败: ${failed}/${results.length}`);
  console.log(`  平均响应时间: ${avgTime}ms`);
  console.log(`  新增任务持久化: ${newTaskCount > 0 ? '✔' : '✘'}`);

  // Evaluation
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('   AIsiri 表现评估');
  console.log('═══════════════════════════════════════════════════════\n');

  const intentAccuracy = results.filter((r) => r.pass).length / results.length * 100;
  console.log(`  理解能力 (Understanding):    ${intentAccuracy >= 80 ? 'good' : intentAccuracy >= 60 ? 'acceptable' : 'needs work'} (${intentAccuracy.toFixed(0)}%)`);
  console.log(`  时间解析 (Time Resolution):  ${results.filter(r => [1,2,3,4,5].includes(r.id) && r.pass).length >= 4 ? 'good' : 'needs work'}`);
  console.log(`  动作执行 (Action Execution): ${newTaskCount >= 4 ? 'good' : newTaskCount >= 2 ? 'acceptable' : 'needs work'} (创建了 ${newTaskCount} 个任务)`);
  console.log(`  响应速度 (Response Speed):   ${avgTime < 10000 ? 'good' : avgTime < 20000 ? 'acceptable' : 'needs work'} (平均 ${avgTime}ms)`);
  console.log(`  端到端一致性 (E2E):          ${newTaskCount > 0 && passed > failed ? 'good' : 'needs work'}`);

  console.log('\n═══════════════════════════════════════════════════════\n');

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error('测试运行失败:', err);
  process.exit(1);
});
