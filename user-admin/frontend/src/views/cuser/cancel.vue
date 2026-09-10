<template>
  <div>
    <el-card shadow="never" class="filter-card">
      <el-form inline>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部" clearable style="width: 130px">
            <el-option label="冷却中" :value="1" />
            <el-option label="已完成" :value="2" />
            <el-option label="已撤销" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="load(1)">查询</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="userId" label="用户ID" width="100" />
        <el-table-column prop="nickname" label="昵称" min-width="120" />
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column prop="applyTime" label="申请时间" width="165" />
        <el-table-column prop="coolingEndTime" label="冷静期截止" width="165" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'warning' : row.status === 2 ? 'success' : 'info'">
              {{ statusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="cancelTime" label="注销完成时间" width="165" />
      </el-table>
      <el-pagination
        class="pager" background layout="total, prev, pager, next"
        :total="total" v-model:current-page="query.index" v-model:page-size="query.size"
        @current-change="load()"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import request from '../../api/request'

const loading = ref(false)
const list = ref([])
const total = ref(0)
const query = reactive({ index: 1, size: 10, status: null })

const statusText = (s) => ({ 1: '冷却中', 2: '已完成', 3: '已撤销' }[s] || '-')

const load = async (page) => {
  if (page) query.index = page
  loading.value = true
  try {
    const res = await request.get('/api/cuser/cancel/list', { params: query })
    list.value = res.data.list
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}

onMounted(() => load())
</script>

<style scoped>
.filter-card { margin-bottom: 12px; }
.pager { margin-top: 14px; display: flex; justify-content: flex-end; }
</style>
