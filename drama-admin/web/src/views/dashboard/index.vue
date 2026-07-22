<template>
  <div class="dashboard">
    <!-- 数据卡片 -->
    <el-row :gutter="20" class="stat-row">
      <el-col :span="8">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-icon blue">🎬</div>
            <div class="stat-info">
              <div class="stat-value">{{ data.dramaTotal || 0 }}</div>
              <div class="stat-label">短剧总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-icon red">▶</div>
            <div class="stat-info">
              <div class="stat-value">{{ formatViews(data.totalViews) }}</div>
              <div class="stat-label">累计播放量</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-icon green">🏷️</div>
            <div class="stat-info">
              <div class="stat-value">{{ data.categoryTotal || 0 }}</div>
              <div class="stat-label">分类总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 最近上新 / 热门播放 -->
    <el-row :gutter="20" style="margin-top: 24px">
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>📌 最近上新</template>
          <el-table :data="data.recentDramas || []" size="small">
            <el-table-column prop="title" label="剧名" min-width="140" />
            <el-table-column prop="views" label="播放" width="100" />
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>🔥 播放 TOP 5</template>
          <el-table :data="data.topPlayed || []" size="small">
            <el-table-column prop="title" label="剧名" min-width="140" />
            <el-table-column prop="views" label="播放" width="100" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getDashboard } from '@/api'

const data = ref({})

function formatViews(n) {
  if (!n) return '0'
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return String(n)
}

onMounted(async () => {
  const res = await getDashboard()
  data.value = res.data
})
</script>

<style scoped>
.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
}
.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}
.stat-icon.blue { background: #ecf5ff; }
.stat-icon.red  { background: #fef0f0; }
.stat-icon.green{ background: #f0f9eb; }
.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
}
.stat-label {
  color: #909399;
  font-size: 14px;
  margin-top: 4px;
}
</style>
