<template>
  <el-container class="layout">
    <el-aside width="220px" class="aside">
      <div class="logo">用户管理中心</div>
      <el-menu
        :default-active="$route.path"
        router
        background-color="#001529"
        text-color="rgba(255,255,255,0.7)"
        active-text-color="#fff"
      >
        <template v-for="m in store.menus" :key="m.id">
          <el-sub-menu v-if="m.children && m.children.length" :index="String(m.id)">
            <template #title>
              <el-icon v-if="m.icon"><component :is="m.icon" /></el-icon>
              <span>{{ m.name }}</span>
            </template>
            <el-menu-item v-for="c in m.children" :key="c.id" :index="c.path">
              {{ c.name }}
            </el-menu-item>
          </el-sub-menu>
          <el-menu-item v-else :index="m.path">
            <el-icon v-if="m.icon"><component :is="m.icon" /></el-icon>
            <span>{{ m.name }}</span>
          </el-menu-item>
        </template>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="crumb">{{ currentTitle }}</div>
        <el-dropdown @command="onCommand">
          <span class="user">
            <el-icon><UserFilled /></el-icon>
            {{ store.realName }}
            <el-icon><ArrowDown /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </el-header>

      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import request from '../api/request'
import { useUserStore } from '../store/user'

const store = useUserStore()
const route = useRoute()
const router = useRouter()

const currentTitle = computed(() => {
  const find = (menus, path) => {
    for (const m of menus) {
      if (m.path === path) return m.name
      if (m.children) {
        const t = find(m.children, path)
        if (t) return `${m.name} / ${t}`
      }
    }
    return ''
  }
  return find(store.menus, route.path) || '用户管理中心'
})

const onCommand = async (cmd) => {
  if (cmd === 'logout') {
    await ElMessageBox.confirm('确定退出登录吗？', '提示', { type: 'warning' })
    try { await request.post('/api/admin/auth/logout') } catch (e) { /* 忽略 */ }
    store.logout()
    router.push('/login')
  }
}

// 30 分钟无操作自动登出
let timer = null
const IDLE_MS = 30 * 60 * 1000
const resetTimer = () => {
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    store.logout()
    router.push('/login')
  }, IDLE_MS)
}

onMounted(() => {
  const events = ['mousemove', 'keydown', 'click', 'scroll']
  events.forEach((e) => window.addEventListener(e, resetTimer))
  resetTimer()
})
onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
})
</script>

<style scoped>
.layout { height: 100vh; }
.aside { background: #001529; }
.logo {
  height: 60px; line-height: 60px; text-align: center;
  color: #fff; font-size: 17px; font-weight: 600; letter-spacing: 1px;
}
.aside :deep(.el-menu) { border-right: none; }
.header {
  background: #fff; display: flex; align-items: center;
  justify-content: space-between; box-shadow: 0 1px 4px rgba(0,21,41,.08);
}
.crumb { font-size: 15px; color: #333; }
.user { cursor: pointer; display: flex; align-items: center; gap: 4px; font-size: 14px; }
.main { padding: 16px; overflow: auto; }
</style>
