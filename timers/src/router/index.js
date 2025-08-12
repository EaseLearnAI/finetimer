import { createRouter, createWebHistory } from 'vue-router'
import Task from '../views/Task.vue'
import Calendar from '../views/Calendar.vue'
import AiSecretary from '../views/AiSecretary.vue'
import TaskCollections from '../views/TaskCollections.vue'
import Stats from '../views/Stats.vue'
import Pomodoro from '../views/Pomodoro.vue'
import Auth from '../views/Auth.vue'

const routes = [
  {
    path: '/',
    redirect: '/task'
  },
  // 认证相关路由
  {
    path: '/auth/:mode?',
    name: 'Auth',
    component: Auth,
    props: true,
    meta: { requiresGuest: true } // 需要未登录状态
  },
  // 主要功能页面（需要认证）
  {
    path: '/task',
    name: 'Task',
    component: Task,
    meta: { requiresAuth: true }
  },
  {
    path: '/calendar',
    name: 'Calendar',
    component: Calendar,
    meta: { requiresAuth: true }
  },
  {
    path: '/ai-secretary',
    name: 'AiSecretary',
    component: AiSecretary,
    meta: { requiresAuth: true }
  },
  {
    path: '/task-collections',
    name: 'TaskCollections',
    component: TaskCollections,
    meta: { requiresAuth: true }
  },
  {
    path: '/stats',
    name: 'Stats',
    component: Stats,
    meta: { requiresAuth: true }
  },
  {
    path: '/pomodoro',
    name: 'Pomodoro',
    component: Pomodoro,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  console.log(`🧭 路由导航: ${from.path} -> ${to.path}`)
  
  // 检查本地存储中的认证状态
  const token = localStorage.getItem('token')
  const user = localStorage.getItem('user')
  const isAuthenticated = !!(token && user)
  
  console.log(`🔍 认证状态检查: ${isAuthenticated ? '已登录' : '未登录'}`)

  // 需要认证的页面
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!isAuthenticated) {
      console.log('❌ 用户未登录，跳转到登录页')
      next({
        path: '/auth/login',
        query: { redirect: to.fullPath }
      })
      return
    }
  }

  // 需要未登录状态的页面（如登录、注册页）
  if (to.matched.some(record => record.meta.requiresGuest)) {
    if (isAuthenticated) {
      console.log('✅ 用户已登录，跳转到主页')
      next('/')
      return
    }
  }

  // 如果访问根路径且已登录，确保跳转到任务页面
  if (to.path === '/' && isAuthenticated) {
    console.log('🏠 已登录用户访问根路径，跳转到任务页面')
    next('/task')
    return
  }

  // 如果访问根路径且未登录，跳转到登录页
  if (to.path === '/' && !isAuthenticated) {
    console.log('🔑 未登录用户访问根路径，跳转到登录页')
    next('/auth/login')
    return
  }

  console.log('✅ 路由导航通过')
  next()
})

export default router