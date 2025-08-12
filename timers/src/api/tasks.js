import http from './http'

// 任务相关API
const taskApi = {
  // 获取所有任务
  getAllTasks(params = {}) {
    return http.get('/tasks', { params })
  },
  
  // 获取未指定时间的任务
  getUnscheduledTasks() {
    return http.get('/tasks/unscheduled')
  },
  
  // 根据时间块类型获取任务
  getTasksByTimeBlock(timeBlockType) {
    return http.get(`/tasks/timeblock/${timeBlockType}`)
  },
  
  // 创建任务
  createTask(taskData) {
    return http.post('/tasks', taskData)
  },
  
  // 获取单个任务
  getTaskById(id) {
    return http.get(`/tasks/${id}`)
  },
  
  // 更新任务
  updateTask(id, taskData) {
    return http.put(`/tasks/${id}`, taskData)
  },
  
  // 删除任务
  deleteTask(id) {
    return http.delete(`/tasks/${id}`)
  },
  
  // 切换任务完成状态
  toggleTaskStatus(id) {
    return http.patch(`/tasks/${id}/toggle`)
  }
}

export default taskApi