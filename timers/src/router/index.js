import { createRouter, createWebHistory } from 'vue-router'
import Task from '../views/Task.vue'
import Calendar from '../views/Calendar.vue'
import AiSecretary from '../views/AiSecretary.vue'
import TaskCollections from '../views/TaskCollections.vue'
import Stats from '../views/Stats.vue'
import Pomodoro from '../views/Pomodoro.vue'

const routes = [
  {
    path: '/',
    redirect: '/task'
  },
  {
    path: '/task',
    name: 'Task',
    component: Task
  },
  {
    path: '/calendar',
    name: 'Calendar',
    component: Calendar
  },
  {
    path: '/ai-secretary',
    name: 'AiSecretary',
    component: AiSecretary
  },
  {
    path: '/task-collections',
    name: 'TaskCollections',
    component: TaskCollections
  },
  {
    path: '/stats',
    name: 'Stats',
    component: Stats
  },
  {
    path: '/pomodoro',
    name: 'Pomodoro',
    component: Pomodoro
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router