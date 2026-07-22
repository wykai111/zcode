<template>
  <div>
    <!-- 搜索栏 -->
    <el-card shadow="never" class="search-bar">
      <el-form inline>
        <el-form-item label="关键字">
          <el-input v-model="query.keyword" placeholder="剧名/简介" clearable @clear="loadList" />
        </el-form-item>
        <el-form-item label="板块">
          <el-select v-model="query.board" placeholder="全部" clearable style="width: 140px">
            <el-option label="Gallery" value="gallery" />
            <el-option label="New Arrivals" value="new" />
            <el-option label="Top Shorts" value="topshort" />
            <el-option label="Trending" value="trending" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="上架" :value="1" />
            <el-option label="下架" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadList">搜索</el-button>
          <el-button @click="resetQuery">重置</el-button>
          <el-button type="success" @click="openDialog()">+ 新增短剧</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 列表 -->
    <el-card shadow="never" style="margin-top: 16px">
      <el-table :data="list" v-loading="loading" border>
        <el-table-column label="封面" width="80">
          <template #default="{ row }">
            <el-image :src="row.cover" style="width: 50px; height: 66px" fit="cover" />
          </template>
        </el-table-column>
        <el-table-column prop="title" label="剧名" min-width="160" />
        <el-table-column label="分类" width="100">
          <template #default="{ row }">{{ row.category_id || '-' }}</template>
        </el-table-column>
        <el-table-column prop="episodes" label="集数" width="70" />
        <el-table-column prop="rating" label="评分" width="70" />
        <el-table-column label="播放量" width="100">
          <template #default="{ row }">{{ formatViews(row.views) }}</template>
        </el-table-column>
        <el-table-column label="板块" width="200">
          <template #default="{ row }">
            <el-tag v-for="b in (row.board || [])" :key="b" size="small" style="margin-right: 4px">{{ b }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="标识" width="90">
          <template #default="{ row }">
            <el-tag v-if="row.tag" :type="row.tag === 'HOT' ? 'danger' : 'primary'" size="small">{{ row.tag }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status ? 'success' : 'info'" size="small">{{ row.status ? '上架' : '下架' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openDialog(row)">编辑</el-button>
            <el-button size="small" type="primary" @click="goEpisodes(row)">剧集</el-button>
            <el-button size="small" type="danger" @click="onDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="query.page"
        v-model:page-size="query.pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        style="margin-top: 16px"
        @size-change="loadList"
        @current-change="loadList"
      />
    </el-card>

    <!-- 新增/编辑表单 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑短剧' : '新增短剧'" width="640px" @close="resetForm">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="剧名" prop="title">
          <el-input v-model="form.title" placeholder="请输入短剧名称" />
        </el-form-item>
        <el-form-item label="封面图">
          <el-input v-model="form.cover" placeholder="图片 URL">
            <template #append>
              <el-upload :show-file-list="false" :before-upload="onUpload">
                <el-button>上传</el-button>
              </el-upload>
            </template>
          </el-input>
          <el-image v-if="form.cover" :src="form.cover" style="width: 80px; height: 106px; margin-top: 8px" fit="cover" />
        </el-form-item>
        <el-form-item label="简介">
          <el-input v-model="form.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="form.category_id" placeholder="选择分类" clearable>
            <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-row>
          <el-col :span="8">
            <el-form-item label="总集数">
              <el-input-number v-model="form.episodes" :min="0" :max="999" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="评分">
              <el-input-number v-model="form.rating" :min="0" :max="10" :step="0.1" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="播放量">
              <el-input-number v-model="form.views" :min="0" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="单集时长">
          <el-input v-model="form.duration" placeholder="0:58" style="width: 160px" />
        </el-form-item>
        <el-form-item label="板块">
          <el-checkbox-group v-model="form.board">
            <el-checkbox label="gallery">Gallery</el-checkbox>
            <el-checkbox label="new">New Arrivals</el-checkbox>
            <el-checkbox label="topshort">Top Shorts</el-checkbox>
            <el-checkbox label="trending">Trending</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="题材标签">
          <el-select v-model="form.tags" multiple filterable allow-create placeholder="输入后回车">
            <el-option v-for="t in tagOptions" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态标识">
          <el-radio-group v-model="form.tag">
            <el-radio label="">无</el-radio>
            <el-radio label="NEW">NEW</el-radio>
            <el-radio label="HOT">HOT</el-radio>
            <el-radio label="FEATURED">FEATURED</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="排序权重">
          <el-input-number v-model="form.sort_order" :min="0" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" active-text="上架" inactive-text="下架" />
        </el-form-item>
        <el-form-item v-if="!isEdit" label="自动生成剧集">
          <el-switch v-model="form.autoEpisodes" /> <span style="margin-left: 8px; color: #909399; font-size: 13px">开启后将按总集数自动创建剧集（前2集免费）</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="onSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getDramaList, createDrama, updateDrama, deleteDrama,
  getCategoryList, uploadFile,
} from '@/api'

const list = ref([])
const total = ref(0)
const loading = ref(false)
const categories = ref([])

const query = reactive({
  keyword: '', board: '', status: '',
  page: 1, pageSize: 20,
})

const tagOptions = ['Romance', 'Action', 'Drama', 'Comedy', 'Revenge', 'Betrayal', 'Mystery', 'Sci-Fi', 'Anime']

// ===== 加载列表 =====
async function loadList() {
  loading.value = true
  try {
    const res = await getDramaList(query)
    list.value = res.data.list
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}

function resetQuery() {
  Object.assign(query, { keyword: '', board: '', status: '', page: 1 })
  loadList()
}

function formatViews(n) {
  if (!n) return '0'
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return String(n)
}

// ===== 新增/编辑 =====
const dialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref()

const form = reactive({
  id: '', title: '', cover: '', description: '',
  category_id: '', episodes: 0, rating: 0, views: 0,
  tag: '', board: [], tags: [], duration: '0:58',
  sort_order: 0, status: 1, autoEpisodes: true,
})

const rules = {
  title: [{ required: true, message: '请输入剧名', trigger: 'blur' }],
}

function openDialog(row) {
  resetForm()
  if (row) {
    isEdit.value = true
    Object.assign(form, row, {
      board: row.board || [],
      tags: row.tags || [],
    })
  } else {
    isEdit.value = false
  }
  dialogVisible.value = true
}

function resetForm() {
  Object.assign(form, {
    id: '', title: '', cover: '', description: '',
    category_id: '', episodes: 0, rating: 0, views: 0,
    tag: '', board: [], tags: [], duration: '0:58',
    sort_order: 0, status: 1, autoEpisodes: true,
  })
}

async function onSubmit() {
  await formRef.value.validate()
  submitting.value = true
  try {
    if (isEdit.value) {
      await updateDrama(form.id, form)
      ElMessage.success('更新成功')
    } else {
      await createDrama(form)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadList()
  } finally {
    submitting.value = false
  }
}

async function onDelete(row) {
  await ElMessageBox.confirm(`确定删除「${row.title}」吗？相关剧集也会一并删除。`, '删除确认', {
    type: 'warning',
  })
  await deleteDrama(row.id)
  ElMessage.success('删除成功')
  loadList()
}

async function onUpload(file) {
  try {
    const res = await uploadFile(file)
    form.cover = res.data.url.startsWith('http') ? res.data.url : res.data.url
    if (form.cover.startsWith('/uploads')) {
      form.cover = form.cover // 相对路径，开发时走 vite 代理
    }
    ElMessage.success('上传成功')
  } catch (e) {
    // 错误已在拦截器处理
  }
  return false // 阻止 el-upload 默认上传
}

function goEpisodes(row) {
  // 用 query 传递 dramaId 到剧集页
  location.href = `/episodes?dramaId=${row.id}&title=${encodeURIComponent(row.title)}`
}

onMounted(async () => {
  loadList()
  const res = await getCategoryList()
  categories.value = res.data
})
</script>

<style scoped>
.search-bar {
  margin-bottom: 0;
}
</style>
