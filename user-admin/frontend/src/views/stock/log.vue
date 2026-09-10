<template>
  <div>
    <el-card shadow="never" class="filter-card">
      <el-form inline>
        <el-form-item label="动作">
          <el-select v-model="query.action" placeholder="全部" clearable style="width: 130px">
            <el-option v-for="a in actions" :key="a" :label="a" :value="a" />
          </el-select>
        </el-form-item>
        <el-form-item label="股票代码">
          <el-input v-model="query.stockCode" placeholder="股票代码" clearable style="width: 140px" @keyup.enter="load(1)" />
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker v-model="range" type="datetimerange" value-format="YYYY-MM-DD HH:mm:ss"
            start-placeholder="开始" end-placeholder="结束" style="width: 340px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="load(1)">查询</el-button>
          <el-button @click="reset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="adminName" label="操作人" width="110" />
        <el-table-column prop="action" label="动作" width="90" />
        <el-table-column prop="stockCode" label="股票代码" width="120" />
        <el-table-column label="变更内容" min-width="260">
          <template #default="{ row }">
            <div class="change">
              <span v-if="row.beforeData" class="before">{{ truncate(row.beforeData) }}</span>
              <span v-if="row.afterData" class="arrow">→</span>
              <span v-if="row.afterData" class="after">{{ truncate(row.afterData) }}</span>
              <span v-if="row.remark">{{ row.remark }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="操作时间" width="165" />
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

const actions = ['新增', '编辑', '导入', '导入更新', '启用', '禁用', '同步']
const loading = ref(false)
const list = ref([])
const total = ref(0)
const range = ref(null)

const query = reactive({ index: 1, size: 10, action: '', stockCode: '' })

const truncate = (s) => (s && s.length > 120 ? s.slice(0, 120) + '…' : s)

const load = async (page) => {
  if (page) query.index = page
  loading.value = true
  try {
    const params = {
      ...query,
      beginTime: range.value ? range.value[0] : null,
      endTime: range.value ? range.value[1] : null,
    }
    const res = await request.get('/api/stock/log', { params })
    list.value = res.data.list
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}

const reset = () => {
  query.action = ''
  query.stockCode = ''
  range.value = null
  load(1)
}

onMounted(() => load())
</script>

<style scoped>
.filter-card { margin-bottom: 12px; }
.pager { margin-top: 14px; display: flex; justify-content: flex-end; }
.change { font-size: 12px; }
.before { color: #909399; }
.after { color: #409eff; }
.arrow { margin: 0 4px; color: #c0c4cc; }
</style>
