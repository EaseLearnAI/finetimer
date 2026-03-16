<template>
  <div class="stats-page">
    <div class="content-scroll">
      <!-- 累计专注 -->
      <section class="card overview">
        <div class="card-header">
          <div class="card-title">
            <span class="icon-box"><font-awesome-icon :icon="['far','calendar']" /></span>
            <span>累计专注</span>
          </div>
          <button class="icon-btn" aria-label="share"><font-awesome-icon icon="share-nodes" /></button>
        </div>
        <div class="metrics three">
          <div class="metric">
            <div class="metric-label">次数</div>
            <div class="metric-value"><span class="num">{{ totalTimes }}</span></div>
          </div>
          <div class="metric">
            <div class="metric-label">时长</div>
            <div class="metric-value"><span class="num">{{ totalMinutes }}</span><span class="unit">分钟</span></div>
          </div>
          <div class="metric">
            <div class="metric-label">日均时长</div>
            <div class="metric-value"><span class="num">{{ avgDailyMinutes }}</span><span class="unit">分钟</span></div>
          </div>
        </div>
      </section>

      <!-- 当日专注 -->
      <section class="card today">
        <div class="card-header">
          <div class="card-title">
            <span class="icon-box"><font-awesome-icon :icon="['far','calendar-days']" /></span>
            <span>当日专注</span>
          </div>
          <div class="nav-date">
            <button class="icon-btn" @click="shiftDay(-1)" aria-label="prev"><font-awesome-icon icon="chevron-left" /></button>
            <span class="date-text">{{ formattedDate }}</span>
            <button class="icon-btn" @click="shiftDay(1)" aria-label="next"><font-awesome-icon icon="chevron-right" /></button>
          </div>
        </div>
        <div class="metrics two">
          <div class="metric">
            <div class="metric-label">次数</div>
            <div class="metric-value"><span class="num">{{ todayTimes }}</span></div>
          </div>
          <div class="metric">
            <div class="metric-label">时长</div>
            <div class="metric-value"><span class="num">{{ todayMinutes }}</span><span class="unit">分钟</span></div>
          </div>
        </div>
      </section>

      <!-- 专注时长分布（切换） -->
      <section class="card dist">
        <div class="card-header">
          <div class="card-title">
            <span class="icon-box"><font-awesome-icon icon="chart-column" /></span>
            <span>专注时长分布</span>
          </div>
          <div class="nav-date">
            <button class="icon-btn" @click="shiftDay(-1)" aria-label="prev"><font-awesome-icon icon="chevron-left" /></button>
            <span class="date-text">{{ formattedDate }}</span>
            <button class="icon-btn" @click="shiftDay(1)" aria-label="next"><font-awesome-icon icon="chevron-right" /></button>
          </div>
          <button class="icon-btn" aria-label="share"><font-awesome-icon icon="share-nodes" /></button>
        </div>
        <div class="tabs">
          <button :class="['tab', activeRange==='day'?'active':'']" @click="activeRange='day'">日</button>
          <button :class="['tab', activeRange==='week'?'active':'']" @click="activeRange='week'">周</button>
          <button :class="['tab', activeRange==='month'?'active':'']" @click="activeRange='month'">月</button>
          <button :class="['tab', activeRange==='custom'?'active':'']" @click="activeRange='custom'">自定义</button>
        </div>
        <div class="empty">
          <div class="empty-face">☺</div>
          <div class="empty-title">暂无专注数据</div>
          <div class="empty-sub">点击待办上的“开始”按钮来专注计时吧</div>
          <button class="primary-btn">查看专注记录</button>
        </div>
      </section>

      <!-- 本月专注时段分布（柱状占位） -->
      <section class="card bars">
        <div class="card-header">
          <div class="card-title">
            <span class="icon-box"><font-awesome-icon icon="chart-simple" /></span>
            <span>本月专注时段分布</span>
          </div>
          <div class="nav-date">
            <button class="icon-btn" @click="shiftMonth(-1)" aria-label="prev"><font-awesome-icon icon="chevron-left" /></button>
            <span class="date-text">{{ formattedMonth }}</span>
            <button class="icon-btn" @click="shiftMonth(1)" aria-label="next"><font-awesome-icon icon="chevron-right" /></button>
          </div>
        </div>
        <div class="bar-chart">
          <div class="y-scale">10分钟</div>
          <div class="bars-wrap">
            <div
              v-for="(h, i) in hourlyBars"
              :key="i"
              class="bar"
              :style="{ height: Math.round(h*8) + 'px' }"
            ></div>
          </div>
          <div class="x-labels">
            <span v-for="h in 12" :key="h">{{ (h-1)*2 }}点</span>
          </div>
        </div>
      </section>

      <!-- 月度专注统计（折线占位） -->
      <section class="card line">
        <div class="card-header">
          <div class="card-title">
            <span class="icon-box"><font-awesome-icon :icon="['far','calendar']" /></span>
            <span>月度专注统计</span>
          </div>
          <div class="nav-date">
            <button class="icon-btn" @click="shiftMonth(-1)" aria-label="prev"><font-awesome-icon icon="chevron-left" /></button>
            <span class="date-text">{{ formattedMonth }}</span>
            <button class="icon-btn" @click="shiftMonth(1)" aria-label="next"><font-awesome-icon icon="chevron-right" /></button>
          </div>
          <button class="icon-btn" aria-label="share"><font-awesome-icon icon="share-nodes" /></button>
        </div>
        <div class="line-chart">
          <svg :viewBox="'0 0 '+chartW+' '+chartH" preserveAspectRatio="none">
            <defs>
              <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#4c8dff" stop-opacity="0.35"/>
                <stop offset="100%" stop-color="#4c8dff" stop-opacity="0"/>
              </linearGradient>
            </defs>
            <path :d="areaPath" fill="url(#area)" />
            <polyline :points="polyPoints" fill="none" stroke="#4c8dff" stroke-width="2"/>
          </svg>
          <div class="y-scale">10分钟</div>
        </div>
      </section>
    </div>

    <TabBar />
  </div>
</template>

<script>
import TabBar from '../components/common/TabBar.vue'
import api from '../api'

export default {
  name: 'StatisticsView',
  components: { TabBar },
  data() {
    const now = new Date()
    return {
      dayCursor: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
      monthCursor: new Date(now.getFullYear(), now.getMonth(), 1),
      activeRange: 'day',
      hourlyBars: Array.from({length:24},()=>0),
      lineData: [],
      chartW: 320,
      chartH: 140,
      // 概览与当日
      totalTimes: 0,
      totalMinutes: 0,
      avgDailyMinutes: 0,
      todayTimes: 0,
      todayMinutes: 0
    }
  },
  computed: {
    formattedDate() {
      const y = this.dayCursor.getFullYear()
      const m = String(this.dayCursor.getMonth() + 1).padStart(2, '0')
      const d = String(this.dayCursor.getDate()).padStart(2, '0')
      return `${y}-${m}-${d}`
    },
    formattedMonth() {
      const y = this.monthCursor.getFullYear()
      const m = String(this.monthCursor.getMonth() + 1).padStart(2, '0')
      return `${y}年${m}月`
    },
    polyPoints() {
      const n = this.lineData.length
      const stepX = this.chartW / (n - 1 || 1)
      const maxY = Math.max(...this.lineData, 10)
      return this.lineData
        .map((v, i) => {
          const x = i * stepX
          const y = this.chartH - (v / maxY) * (this.chartH - 4) - 2
          return `${x},${y}`
        })
        .join(' ')
    },
    areaPath() {
      const n = this.lineData.length
      if (n === 0) return ''
      const points = this.polyPoints.split(' ')
      const first = points[0]
      const last = points[points.length - 1]
      return `M ${first} L ${points.join(' ')} L ${last.split(',')[0]},${this.chartH} L ${first.split(',')[0]},${this.chartH} Z`
    }
  },
  created() {
    this.loadAll()
  },
  methods: {
    shiftDay(delta) {
      const d = new Date(this.dayCursor)
      d.setDate(d.getDate() + delta)
      this.dayCursor = d
      this.loadToday()
    },
    shiftMonth(delta) {
      const d = new Date(this.monthCursor)
      d.setMonth(d.getMonth() + delta)
      this.monthCursor = d
      this.loadMonth()
    },
    async loadAll() {
      await Promise.all([this.loadOverview(), this.loadToday(), this.loadMonth()])
    },
    // helpers
    toISOStart(date) {
      const d = new Date(date)
      d.setHours(0,0,0,0)
      return d.toISOString()
    },
    toISOEnd(date) {
      const d = new Date(date)
      d.setHours(0,0,0,0)
      d.setDate(d.getDate() + 1)
      return d.toISOString()
    },
    minutesFromSeconds(s) {
      const secs = Number(s || 0)
      return Math.round(secs / 60)
    },
    // 概览
    async loadOverview() {
      try {
        const res = await api.pomodoros.getPomodoroStats({})
        const data = res?.data || res?.data?.data || res || {}
        const totalSeconds = Number(
          data.totalFocusSeconds ?? data.totalSeconds ?? data.totalFocusTime ?? 0
        )
        const totalTimes = Number(
          data.totalSessions ?? data.total ?? data.count ?? 0
        )
        // 估算日均：如果后端提供则用之，否则按近30天或活跃天数估算
        const avgDailySeconds = Number(
          data.avgDailyFocusSeconds ?? data.avgDailySeconds ?? 0
        )
        let avgDaily = this.minutesFromSeconds(avgDailySeconds)
        if (!avgDaily) {
          // 回退：按最近30天估算
          avgDaily = Math.round(this.minutesFromSeconds(totalSeconds) / 30)
        }
        this.totalTimes = totalTimes
        this.totalMinutes = this.minutesFromSeconds(totalSeconds)
        this.avgDailyMinutes = avgDaily
      } catch (_) {
        // 静默失败
      }
    },
    // 当日
    async loadToday() {
      try {
        const start = this.toISOStart(this.dayCursor)
        const end = this.toISOEnd(this.dayCursor)
        const res = await api.pomodoros.getAllPomodoros({ startDate: start, endDate: end })
        const list = res?.data || res?.data?.data || res || []
        const totalSeconds = list.reduce((sum, r) => {
          const s = Number(r?.actualFocusTime ?? r?.duration ?? 0)
          return sum + (isFinite(s) ? s : 0)
        }, 0)
        this.todayTimes = list.length
        this.todayMinutes = this.minutesFromSeconds(totalSeconds)
      } catch (_) {
        this.todayTimes = 0
        this.todayMinutes = 0
      }
    },
    // 月度：生成 24 小时分布 + 每日曲线
    async loadMonth() {
      try {
        const startOfMonth = new Date(this.monthCursor.getFullYear(), this.monthCursor.getMonth(), 1)
        const startISO = startOfMonth.toISOString()
        const endISO = new Date(this.monthCursor.getFullYear(), this.monthCursor.getMonth() + 1, 1).toISOString()
        const res = await api.pomodoros.getAllPomodoros({ startDate: startISO, endDate: endISO })
        const records = res?.data || res?.data?.data || res || []
        // 小时分布
        const hours = Array.from({ length: 24 }, () => 0)
        // 每日统计
        const daysInMonth = new Date(this.monthCursor.getFullYear(), this.monthCursor.getMonth() + 1, 0).getDate()
        const dayTotals = Array.from({ length: daysInMonth }, () => 0)
        records.forEach(r => {
          const created = new Date(r?.createdAt || r?.startTime || Date.now())
          const h = created.getHours()
          const d = created.getDate()
          const sec = Number(r?.actualFocusTime ?? r?.duration ?? 0)
          const mins = Math.max(0, Math.round(sec / 60))
          if (isFinite(h)) hours[h] += mins
          if (isFinite(d)) dayTotals[d - 1] += mins
        })
        // 归一化到 0-10 分钟刻度用于占位图高度
        const maxHour = Math.max(...hours, 10)
        this.hourlyBars = hours.map(m => (maxHour ? Math.min(10, (m / maxHour) * 10) : 0))
        this.lineData = dayTotals
      } catch (_) {
        this.hourlyBars = Array.from({ length: 24 }, () => 0)
        this.lineData = []
      }
    }
  }
}
</script>

<style scoped>
.stats-page {
  height: 100vh;
  background: #f5f6fa;
  display: flex;
  flex-direction: column;
}

.content-scroll {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 96px;
}

.card {
  background: #fff;
  margin: 12px 16px;
  padding: 16px;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  color: #1f2329;
}

.icon-box {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 6px;
  background: #eef2ff;
  color: #4c6fff;
  font-size: 12px;
}

.icon-btn {
  border: none;
  background: transparent;
  color: #7a7f87;
  font-size: 18px;
  padding: 4px 6px;
}

.nav-date {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #7a7f87;
}

.date-text { color: #4b5563; font-weight: 600; }

.metrics {
  display: grid;
  gap: 12px;
  margin-top: 12px;
}
.metrics.two { grid-template-columns: repeat(2, 1fr); }
.metrics.three { grid-template-columns: repeat(3, 1fr); }

.metric { background: #f8fafc; border-radius: 12px; padding: 14px; text-align: center; }
.metric-label { color: #89919c; font-size: 12px; margin-bottom: 6px; }
.metric-value { color: #111827; }
.metric-value .num { font-size: 26px; font-weight: 800; }
.metric-value .unit { margin-left: 4px; color: #9aa3af; font-weight: 600; }

.tabs { display: flex; gap: 10px; margin: 12px 0 4px; }
.tab { padding: 6px 10px; border-radius: 10px; background: #f3f4f6; color: #6b7280; border: none; }
.tab.active { background: #e8edff; color: #3b5bff; font-weight: 600; }

.empty { text-align: center; padding: 24px 8px; color: #6b7280; }
.empty-face { font-size: 28px; margin-bottom: 8px; }
.empty-title { color: #1f2329; font-weight: 700; margin-bottom: 6px; }
.empty-sub { font-size: 13px; margin-bottom: 14px; }
.primary-btn { background: #4c6fff; color: #fff; border: none; padding: 10px 14px; border-radius: 12px; font-weight: 700; }

.bar-chart { margin-top: 12px; }
.bars-wrap { display: grid; grid-template-columns: repeat(24, 1fr); gap: 6px; align-items: end; height: 84px; background: linear-gradient(to top, rgba(76,141,255,0.05), transparent 40%); padding: 8px 6px; border-radius: 8px; }
.bar { background: #9db7ff; border-radius: 4px; }
.x-labels { display: grid; grid-template-columns: repeat(12, 1fr); margin-top: 6px; font-size: 12px; color: #9aa3af; }
.y-scale { font-size: 12px; color: #9aa3af; margin-bottom: 6px; }

.line-chart { margin-top: 12px; position: relative; }
.line-chart svg { width: 100%; height: 140px; display: block; }

@media (max-width: 430px) {
  .card { margin: 12px; }
  .metric-value .num { font-size: 24px; }
}
</style>