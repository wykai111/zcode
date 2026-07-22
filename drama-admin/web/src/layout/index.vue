<template>
  <el-container class="layout">
    <!-- 侧边栏 -->
    <el-aside width="220px" class="sidebar">
      <div class="logo">
        <span class="logo-icon">🎬</span>
        <span class="logo-text">ShortDrama</span>
      </div>
      <el-menu
        :default-active="$route.path"
        router
        background-color="#1f1f2e"
        text-color="#b7b7c5"
        active-text-color="#ffffff"
      >
        <el-menu-item v-for="item in menus" :key="item.path" :index="item.path">
          <span class="menu-icon">{{ item.icon }}</span>
          <span>{{ item.title }}</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <!-- 顶部栏 -->
      <el-header class="header">
        <div class="header-title">{{ $route.meta.title || '管理后台' }}</div>
        <div class="header-right">
          <span class="user-name">{{ userInfo?.nickname || 'admin' }}</span>
          <el-button type="text" @click="logout">退出</el-button>
        </div>
      </el-header>

      <!-- 内容区 -->
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const menus = [
  { path: '/dashboard', title: '数据概览', icon: '📊' },
  { path: '/dramas', title: '短剧管理', icon: '🎬' },
  { path: '/episodes', title: '剧集管理', icon: '📺' },
  { path: '/categories', title: '分类管理', icon: '🏷️' },
]

const userInfo = computed(() => {
  const raw = localStorage.getItem('admin_user')
  return raw ? JSON.parse(raw) : null
})

function logout() {
  localStorage.removeItem('admin_token')
  localStorage.removeItem('admin_user')
  router.push('/login')
}
</script>

<style scoped>
.layout {
  height: 100vh;
}
.sidebar {
  background: #1f1f2e;
}
.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #fff;
  font-size: 20px;
  font-weight: 700;
  border-bottom: 1px solid #2a2a3e;
}
.logo-icon {
  font-size: 26px;
}
.menu-icon {
  margin-right: 8px;
}
:deep(.el-menu) {
  border-right: none;
}
.header {
  background: #fff;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
}
.header-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.user-name {
  color: #606266;
  font-size: 14px;
}
.main {
  background: #f5f7fa;
  padding: 24px;
  overflow-y: auto;
}
</style>
