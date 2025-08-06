import taskApi from './tasks'
import collectionApi from './collections'
import pomodoroApi from './pomodoros'

// 统一API入口
const api = {
  tasks: taskApi,
  collections: collectionApi,
  pomodoros: pomodoroApi
}

export default api