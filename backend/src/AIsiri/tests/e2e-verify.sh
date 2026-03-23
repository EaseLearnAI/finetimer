#!/bin/bash
# ===================================================================
# AIsiri 端到端验证测试脚本
# 用法：bash src/AIsiri/tests/e2e-verify.sh
# 前提：后端(3000) 和前端(8080) 均已启动，MongoDB 已连接
# ===================================================================

set -e

BASE_URL="http://localhost:3000"
PASS=0
FAIL=0
RESULTS=""

log_pass() { PASS=$((PASS+1)); RESULTS="${RESULTS}\n  ✅ $1"; echo "  ✅ $1"; }
log_fail() { FAIL=$((FAIL+1)); RESULTS="${RESULTS}\n  ❌ $1"; echo "  ❌ $1"; }

check_json() {
  echo "$1" | python3 -c "import sys,json; json.load(sys.stdin)" 2>/dev/null
}

echo "╔══════════════════════════════════════════════════╗"
echo "║   AIsiri v2.0 端到端验证测试                      ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# ============================
echo "【1】基础连通性"
# ============================

# 1.1 后端健康检查
STATUS=$(curl -s "$BASE_URL/api/aisiri/dispatch/status")
if echo "$STATUS" | python3 -c "import sys,json; d=json.load(sys.stdin); exit(0 if d.get('success') and d['data']['status']=='healthy' else 1)" 2>/dev/null; then
  log_pass "dispatch/status → healthy"
else
  log_fail "dispatch/status 异常: $STATUS"
fi

# 1.2 前端页面
FRONTEND=$(curl -s http://localhost:8080 2>/dev/null)
if echo "$FRONTEND" | grep -q "timer"; then
  log_pass "前端(8080) → Vue 页面正常加载"
else
  log_fail "前端(8080) 无响应"
fi

# 1.3 根路由
ROOT=$(curl -s "$BASE_URL/")
if echo "$ROOT" | python3 -c "import sys,json; d=json.load(sys.stdin); exit(0 if 'AIsiri' in d.get('message','') else 1)" 2>/dev/null; then
  log_pass "根路由 / → 正常"
else
  log_fail "根路由异常: $ROOT"
fi

echo ""

# ============================
echo "【2】用户认证接口"
# ============================

# 登录获取 Token
PHONE="13800000001"
PASS_W="123456"

LOGIN=$(curl -s -X POST "$BASE_URL/api/users/login" \
  -H 'Content-Type: application/json' \
  -d "{\"phoneNumber\":\"$PHONE\",\"password\":\"$PASS_W\"}")

TOKEN=$(echo "$LOGIN" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',{}).get('token',''))" 2>/dev/null)

if [ -n "$TOKEN" ] && [ ${#TOKEN} -gt 50 ]; then
  log_pass "用户登录 → Token获取成功 (${#TOKEN}字符)"
else
  # 尝试注册
  REG=$(curl -s -X POST "$BASE_URL/api/users/register" \
    -H 'Content-Type: application/json' \
    -d "{\"phoneNumber\":\"$PHONE\",\"password\":\"$PASS_W\",\"nickname\":\"测试用户\"}")
  TOKEN=$(echo "$REG" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',{}).get('token',''))" 2>/dev/null)
  if [ -n "$TOKEN" ] && [ ${#TOKEN} -gt 50 ]; then
    log_pass "用户注册+登录 → Token获取成功"
  else
    log_fail "用户认证失败"
    echo "无法继续测试（需要有效 Token）"
    exit 1
  fi
fi

AUTH="Authorization: Bearer $TOKEN"

# 用户资料
PROFILE=$(curl -s "$BASE_URL/api/users/profile" -H "$AUTH")
if echo "$PROFILE" | python3 -c "import sys,json; d=json.load(sys.stdin); exit(0 if d.get('success') else 1)" 2>/dev/null; then
  log_pass "/api/users/profile → 正常"
else
  log_fail "/api/users/profile 异常"
fi

echo ""

# ============================
echo "【3】核心 CRUD 接口"
# ============================

for endpoint in "/api/tasks" "/api/collections" "/api/pomodoro"; do
  RESP=$(curl -s "$BASE_URL$endpoint" -H "$AUTH")
  if check_json "$RESP" >/dev/null 2>&1; then
    log_pass "$endpoint → 正常返回"
  else
    log_fail "$endpoint 异常"
  fi
done

# AI助手
AI_RESP=$(curl -s "$BASE_URL/api/ai-assistant" -H "$AUTH")
if check_json "$AI_RESP" >/dev/null 2>&1; then
  log_pass "/api/ai-assistant → 正常返回"
else
  log_fail "/api/ai-assistant 异常"
fi

echo ""

# ============================
echo "【4】LangGraph 多智能体调度"
# ============================

# 4.1 对话意图
CONV=$(curl -s -X POST "$BASE_URL/api/aisiri/dispatch" \
  -H 'Content-Type: application/json' -H "$AUTH" \
  -d '{"userInput":"你好啊","sessionId":"e2e-test-conv"}')

CONV_INTENT=$(echo "$CONV" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',{}).get('intents',[''])[0])" 2>/dev/null)
CONV_ARCH=$(echo "$CONV" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',{}).get('architecture',''))" 2>/dev/null)

if [ "$CONV_ARCH" = "langgraph-multi-agent" ]; then
  log_pass "LangGraph 架构标识 → langgraph-multi-agent"
else
  log_fail "架构标识不正确: $CONV_ARCH"
fi

if echo "$CONV_INTENT" | grep -qi "CONVERSATION"; then
  log_pass "对话意图识别 → CONVERSATION"
else
  log_fail "对话意图识别失败: $CONV_INTENT"
fi

CONV_RESP=$(echo "$CONV" | python3 -c "import sys,json; d=json.load(sys.stdin); r=d.get('data',{}).get('response',''); print(len(r))" 2>/dev/null)
if [ "$CONV_RESP" -gt 10 ] 2>/dev/null; then
  log_pass "Emotion Agent 回复生成 → ${CONV_RESP}字符"
else
  log_fail "回复为空或过短"
fi

# 4.2 任务创建意图
echo "  (等待任务创建测试...)"
TASK=$(curl -s -X POST "$BASE_URL/api/aisiri/dispatch" \
  -H 'Content-Type: application/json' -H "$AUTH" \
  -d '{"userInput":"帮我创建一个明天下午3点开会的任务","sessionId":"e2e-test-task"}')

TASK_CREATED=$(echo "$TASK" | python3 -c "import sys,json; d=json.load(sys.stdin); t=d.get('data',{}).get('taskCreated'); print(t.get('title','') if t else '')" 2>/dev/null)
TASK_TIME=$(echo "$TASK" | python3 -c "import sys,json; d=json.load(sys.stdin); t=d.get('data',{}).get('taskCreated',{}); tb=t.get('timeBlock',{}); print(tb.get('startTime',''))" 2>/dev/null)

if [ -n "$TASK_CREATED" ]; then
  log_pass "Task Agent 任务创建 → $TASK_CREATED"
else
  log_fail "Task Agent 任务创建失败"
fi

if [ "$TASK_TIME" = "15:00" ]; then
  log_pass "时间解析 → 下午3点 = 15:00"
else
  log_fail "时间解析错误: 期望15:00 实际$TASK_TIME"
fi

echo ""

# ============================
echo "【5】废弃文件检查"
# ============================

AISIRI_DIR="/Users/mac/Desktop/tmp/毕业论文/root/backend/src/AIsiri"

for f in "app.js" "package.json" "chains" "config" "services/schedulePlanningService.js" "controllers/schedulePlanningController.js" "routes/schedulePlanningRoutes.js" "prompt/schedule_planning.js" "prompt/intelligent_dispatch.js" "controllers/gaodeController.js" "routes/gaodeRoutes.js"; do
  if [ -e "$AISIRI_DIR/$f" ]; then
    log_fail "废弃文件仍存在: $f"
  else
    log_pass "废弃文件已清理: $f"
  fi
done

# node_modules
if [ -d "$AISIRI_DIR/node_modules" ]; then
  log_fail "AIsiri 内部 node_modules 仍存在"
else
  log_pass "AIsiri 内部 node_modules 已清理"
fi

echo ""

# ============================
echo "【6】Agent 文件完整性"
# ============================

for f in "agents/state.js" "agents/llmClient.js" "agents/routerAgent.js" "agents/taskAgent.js" "agents/scheduleAgent.js" "agents/emotionAgent.js" "agents/toolAgent.js" "agents/memoryAgent.js" "agents/graph.js"; do
  if [ -f "$AISIRI_DIR/$f" ]; then
    log_pass "Agent 文件存在: $f"
  else
    log_fail "Agent 文件缺失: $f"
  fi
done

echo ""

# ============================
echo "╔══════════════════════════════════════════════════╗"
echo "║   测试结果汇总                                    ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""
echo -e "$RESULTS"
echo ""
echo "  总计: $((PASS+FAIL)) 项"
echo "  通过: $PASS 项"
echo "  失败: $FAIL 项"
echo ""

if [ $FAIL -eq 0 ]; then
  echo "  🎉 全部通过！"
else
  echo "  ⚠️  有 $FAIL 项失败，请检查。"
fi
