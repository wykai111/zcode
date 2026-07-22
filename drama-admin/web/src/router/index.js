import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { public: true },
  },
  {
    path: '/',
    component: () => import('@/layout/index.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '数据概览', icon: '📊' },
      },
      {
        path: 'dramas',
        name: 'Dramas',
        component: () => import('@/views/drama/index.vue'),
        meta: { title: '短剧管理', icon: '🎬' },
      },
      {
        path: 'episodes',
        name: 'Episodes',
        component: () => import('@/views/episode/index.vue'),
        meta: { title: '剧集管理', icon: '📺' },
      },
      {
        path: 'categories',
        name: 'Categories',
        component: () => import('@/views/category/index.vue'),
        meta: { title: '分类管理', icon: '🏷️' },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 登录守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('admin_token')
  if (!to.meta.public && !token) {
    next('/login')
  } else if (to.path === '/login' && token) {
    next('/')
  } else {
    next()
  }
})

export default router
