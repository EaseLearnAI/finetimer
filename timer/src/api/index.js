import taskApi from './tasks'
import collectionApi from './collections'
import pomodoroApi from './pomodoros'
import aivoiceAPI from './aivoice'

// 统一API入口
const api = {
  tasks: taskApi,
  collections: collectionApi,
  pomodoros: pomodoroApi,
  aivoice: aivoiceAPI
}

export default api