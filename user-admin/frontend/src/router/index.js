import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../store/user'

// 组件映射：菜单 component 字段 -> 页面组件
const modules = import.meta.glob('../views/**/*.vue')

function loadComponent(path) {
  const key = `../views/${path}.vue`
  return modules[key]
}

const routes = [
  { path: '/login', name: 'login', component: () => import('../views/login/index.vue') },
  {
    path: '/',
    name: 'layout',
    component: () => import('../layout/index.vue'),
    redirect: '/cusers/list',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 动态路由是否已注册
let dynamicRegistered = false

router.beforeEach(async (to, from, next) => {
  const store = useUserStore()
  if (to.path === '/login') {
    next()
    return
  }
  if (!store.token) {
    next('/login')
    return
  }
  if (!dynamicRegistered) {
    try {
      if (!store.userInfo) {
        await store.fetchMe()
      } else {
        store.restore()
      }
      // 按菜单动态注册路由
      const addMenuRoutes = (menus) => {
        menus.forEach((m) => {
          if (m.type === 2 && m.component) {
            const comp = loadComponent(m.component)
            if (comp) {
              router.addRoute('layout', {
                path: m.path,
                name: `menu_${m.id}`,
                component: comp,
                meta: { title: m.name },
              })
            }
          }
          if (m.children && m.children.length) {
            addMenuRoutes(m.children)
          }
        })
      }
      addMenuRoutes(store.menus)
      dynamicRegistered = true
      next({ ...to, replace: true })
      return
    } catch (e) {
      next('/login')
      return
    }
  }
  next()
})

export default router
