<template>
  <div>
    <!-- 顶部选择短剧 -->
    <el-card shadow="never" class="selector-bar">
      <el-form inline>
        <el-form-item label="选择短剧">
          <el-select
            v-model="dramaId"
            filterable
            placeholder="请选择短剧"
            style="width: 320px"
            @change="loadEpisodes"
          >
            <el-option
              v-for="d in dramaOptions"
              :key="d.id"
              :label="`${d.title} (${d.episodes} 集)`"
              :value="d.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item v-if="dramaId">
          <el-button type="primary" @click="openGenerate">批量生成剧集</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 剧集列表 -->
    <el-card v-if="dramaId" shadow="never" style="margin-top: 16px">
      <el-table :data="episodes" v-loading="loading" border>
        <el-table-column prop="ep_number" label="集数" width="80" />
        <el-table-column prop="label" label="标签" width="120" />
        <el-table-column label="免费" width="100">
          <template #default="{ row }">
            <el-switch
              :model-value="!!row.free"
              @change="(val) => toggleFree(row, val)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="duration" label="时长" width="100" />
        <el-table-column prop="video_url" label="播放地址" min-width="220" show-overflow-tooltip />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="onDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-empty v-else description="请先选择一部短剧" />

    <!-- 编辑剧集 -->
    <el-dialog v-model="editVisible" title="编辑剧集" width="500px">
      <el-form :model="editForm" label-width="100px">
        <el-form-item label="集数">{{ editForm.ep_number }}</el-form-item>
        <el-form-item label="标签">
          <el-input v-model="editForm.label" />
        </el-form-item>
        <el-form-item label="免费">
          <el-switch v-model="editForm.free" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="时长">
          <el-input v-model="editForm.duration" placeholder="0:58" />
        </el-form-item>
        <el-form-item label="播放地址">
          <el-input v-model="editForm.video_url" placeholder="https://..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" @click="saveEdit">保存</el-button>
      </template>
    </el-dialog>

    <!-- 批量生成 -->
    <el-dialog v-model="genVisible" title="批量生成剧集" width="400px">
      <el-alert type="warning" :closable="false" style="margin-bottom: 16px">
        将删除现有剧集并重新生成（前 2 集免费）
      </el-alert>
      <el-form label-width="100px">
        <el-form-item label="集数">
          <el-input-number v-model="genCount" :min="1" :max="999" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="genVisible = false">取消</el-button>
        <el-button type="primary" :loading="genLoading" @click="doGenerate">确认生成</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getDramaList, getEpisodeList, updateEpisode, deleteEpisode, generateEpisodes,
} from '@/api'

const route = useRoute()
const dramaId = ref('')
const dramaOptions = ref([])
const episodes = ref([])
const loading = ref(false)

async function loadDramaOptions() {
  const res = await getDramaList({ page: 1, pageSize: 999 })
  dramaOptions.value = res.data.list
  // 从 query 自动选中
  if (route.query.dramaId) {
    dramaId.value = route.query.dramaId
    loadEpisodes()
  }
}

async function loadEpisodes() {
  if (!dramaId.value) return
  loading.value = true
  try {
    const res = await getEpisodeList(dramaId.value)
    episodes.value = res.data
  } finally {
    loading.value = false
  }
}

// ===== 编辑 =====
const editVisible = ref(false)
const editForm = reactive({})

function openEdit(row) {
  Object.assign(editForm, row)
  editVisible.value = true
}

async function saveEdit() {
  await updateEpisode(editForm.id, editForm)
  ElMessage.success('已保存')
  editVisible.value = false
  loadEpisodes()
}

async function toggleFree(row, val) {
  await updateEpisode(row.id, { free: val ? 1 : 0 })
  row.free = val ? 1 : 0
  ElMessage.success(val ? '已设为免费' : '已设为 VIP')
}

async function onDelete(row) {
  await ElMessageBox.confirm(`确定删除第 ${row.ep_number} 集吗？`, '删除确认', { type: 'warning' })
  await deleteEpisode(row.id)
  ElMessage.success('已删除')
  loadEpisodes()
}

// ===== 批量生成 =====
const genVisible = ref(false)
const genCount = ref(20)
const genLoading = ref(false)

function openGenerate() {
  genCount.value = dramaOptions.value.find((d) => d.id === dramaId.value)?.episodes || 20
  genVisible.value = true
}

async function doGenerate() {
  genLoading.value = true
  try {
    await generateEpisodes(dramaId.value, genCount.value)
    ElMessage.success(`已生成 ${genCount.value} 集`)
    genVisible.value = false
    loadEpisodes()
  } finally {
    genLoading.value = false
  }
}

onMounted(loadDramaOptions)
</script>
