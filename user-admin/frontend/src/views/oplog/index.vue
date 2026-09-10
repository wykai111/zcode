<template>
  <div>
    <el-card shadow="never" class="filter-card">
      <el-form inline>
        <el-form-item label="操作人/账号">
          <el-input v-model="query.adminName" placeholder="操作人" clearable style="width: 140px" @keyup.enter="load(1)" />
        </el-form-item>
        <el-form-item label="模块">
          <el-select v-model="query.module" placeholder="全部" clearable style="width: 120px">
            <el-option label="管理员" value="管理员" />
            <el-option label="用户" value="用户" />
            <el-option label="码表" value="码表" />
          </el-select>
        </el-form-item>
        <el-form-item label="动作">
          <el-input v-model="query.action" placeholder="动作" clearable style="width: 120px" @keyup.enter="load(1)" />
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
      <el-tabs v-model="activeTab">
        <el-tab-pane label="操作日志" name="operate">
          <el-table :data="list" v-loading="loading" stripe>
            <el-table-column prop="id" label="ID" width="70" />
            <el-table-column prop="adminName" label="操作人" width="110" />
            <el-table-column prop="module" label="模块" width="90" />
            <el-table-column prop="action" label="动作" width="100" />
            <el-table-column prop="content" label="操作内容" min-width="260" show-overflow-tooltip />
            <el-table-column prop="ip" label="IP" width="130" />
            <el-table-column prop="createdAt" label="操作时间" width="165" />
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="登录日志" name="login">
          <el-table :data="loginList" v-loading="loginLoading" stripe>
            <el-table-column prop="id" label="ID" width="70" />
            <el-table-column prop="username" label="账号" width="130" />
            <el-table-column label="结果" width="90">
              <template #default="{ row }">
                <el-tag :type="row.result === 1 ? 'success' : 'danger'">
                  {{ row.result === 1 ? '成功' : '失败' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="reason" label="原因" min-width="200" />
            <el-table-column prop="ip" label="IP" width="130" />
            <el-table-column prop="createdAt" label="登录时间" width="165" />
          </el-table>
        </el-tab-pane>
      </el-tabs>
      <el-pagination
        class="pager" background layout="total, prev, pager, next"
        :total="total" v-model:current-page="query.index" v-model:page-size="query.size"
        @current-change="load()"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import request from '../../api/request'

const activeTab = ref('operate')
const loading = ref(false)
const loginLoading = ref(false)
const list = ref([])
const loginList = ref([])
const total = ref(0)
const range = ref(null)

const query = reactive({ index: 1, size: 10, adminName: '', module: '', action: '' })

const load = async (page) => {
  if (page) query.index = page
  if (activeTab.value === 'operate') {
    loading.value = true
    try {
      const params = {
        ...query,
        beginTime: range.value ? range.value[0] : null,
        endTime: range.value ? range.value[1] : null,
      }
      const res = await request.get('/api/log/operate/list', { params })
      list.value = res.data.list
      total.value = res.data.total
    } finally {
      loading.value = false
    }
  } else {
    loginLoading.value = true
    try {
      const params = {
        username: query.adminName,
        beginTime: range.value ? range.value[0] : null,
        endTime: range.value ? range.value[1] : null,
      }
      const res = await request.get('/api/log/login/list', { params })
      loginList.value = res.data.list
      total.value = res.data.total
    } finally {
      loginLoading.value = false
    }
  }
}

const reset = () => {
  query.adminName = ''
  query.module = ''
  query.action = ''
  range.value = null
  load(1)
}

watch(activeTab, () => load(1))
onMounted(() => load())
</script>

<style scoped>
.filter-card { margin-bottom: 12px; }
.pager { margin-top: 14px; display: flex; justify-content: flex-end; }
</style>
