import http from './http'

// 番茄钟相关API
const pomodoroApi = {
  // 获取所有番茄钟记录
  getAllPomodoros(params = {}) {
    return http.get('/pomodoro', { params })
  },
  
  // 创建番茄钟记录
  createPomodoro(pomodoroData) {
    return http.post('/pomodoro', pomodoroData)
  },
  
  // 获取单个番茄钟记录
  getPomodoroById(id) {
    return http.get(`/pomodoro/${id}`)
  },
  
  // 更新番茄钟记录
  updatePomodoro(id, pomodoroData) {
    return http.put(`/pomodoro/${id}`, pomodoroData)
  },
  
  // 删除番茄钟记录
  deletePomodoro(id) {
    return http.delete(`/pomodoro/${id}`)
  },
  
  // 获取番茄钟统计数据
  getPomodoroStats(params = {}) {
    return http.get('/pomodoro/stats', { params })
  },
  
  // 获取今日番茄钟记录
  getTodayPomodoros(userId = 'default') {
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
    
    return this.getAllPomodoros({
      userId,
      startDate: startOfDay.toISOString(),
      endDate: endOfDay.toISOString()
    })
  },
  
  // 获取任务的番茄钟记录
  getTaskPomodoros(taskName, userId = 'default') {
    return this.getAllPomodoros({
      userId,
      taskName
    })
  },
  
  // 获取任务统计
  getTaskStats(taskName, userId = 'default') {
    return this.getPomodoroStats({
      userId,
      taskName
    })
  }
}

export default pomodoroApi