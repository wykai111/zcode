<template>
  <div>
    <el-card shadow="never" class="filter-card">
      <el-form inline>
        <el-form-item label="用户ID">
          <el-input v-model="query.userId" placeholder="用户ID" clearable style="width: 130px" @keyup.enter="load(1)" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="query.phone" placeholder="手机号" clearable style="width: 140px" @keyup.enter="load(1)" />
        </el-form-item>
        <el-form-item label="昵称">
          <el-input v-model="query.nickname" placeholder="昵称" clearable style="width: 140px" @keyup.enter="load(1)" />
        </el-form-item>
        <el-form-item label="注册时间">
          <el-date-picker v-model="range" type="daterange" value-format="YYYY-MM-DD"
            start-placeholder="开始" end-placeholder="结束" style="width: 240px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部" clearable style="width: 110px">
            <el-option label="正常" :value="1" />
            <el-option label="冻结" :value="2" />
            <el-option label="注销" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="load(1)">查询</el-button>
          <el-button @click="reset">重置</el-button>
          <el-button type="success" v-if="store.hasPerm('cuser:export')" @click="onExport">导出Excel</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="id" label="用户ID" width="90" />
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column label="绑定" width="110">
          <template #default="{ row }">
            <el-tag size="small" :type="row.wxBound ? 'success' : 'info'">微信{{ row.wxBound ? '√' : '×' }}</el-tag>
            <el-tag size="small" :type="row.qqBound ? 'success' : 'info'">QQ{{ row.qqBound ? '√' : '×' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="nickname" label="昵称" min-width="110" />
        <el-table-column label="头像" width="70">
          <template #default="{ row }">
            <el-avatar :size="34" :src="row.avatar">{{ (row.nickname || '?')[0] }}</el-avatar>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="registerTime" label="注册时间" width="160" />
        <el-table-column prop="lastLoginTime" label="最后登录" width="160" />
        <el-table-column label="登录来源" width="110">
          <template #default="{ row }">{{ sourceText(row.lastLoginSource) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="230" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openDetail(row)">详情</el-button>
            <template v-if="row.status !== 3 && store.hasPerm('cuser:status')">
              <el-button size="small" :type="row.status === 1 ? 'warning' : 'success'" @click="toggleStatus(row)">
                {{ row.status === 1 ? '冻结' : '解冻' }}
              </el-button>
            </template>
            <el-button size="small" type="primary" v-if="store.hasPerm('cuser:phone')" @click="openPhone(row)">重置手机号</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        class="pager" background layout="total, prev, pager, next, sizes"
        :total="total" v-model:current-page="query.index" v-model:page-size="query.size"
        :page-sizes="[10, 20, 50]" @current-change="load()" @size-change="load(1)"
      />
    </el-card>

    <!-- 用户详情 -->
    <el-drawer v-model="detailVisible" title="用户详情" size="560px">
      <template v-if="detail">
        <el-descriptions title="基础信息" :column="2" border>
          <el-descriptions-item label="用户ID">{{ detail.id }}</el-descriptions-item>
          <el-descriptions-item label="昵称">{{ detail.nickname || '-' }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ detail.phone || '未绑定' }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusType(detail.status)">{{ statusText(detail.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="微信绑定">{{ detail.wxBound ? '已绑定' : '未绑定' }}</el-descriptions-item>
          <el-descriptions-item label="QQ绑定">{{ detail.qqBound ? '已绑定' : '未绑定' }}</el-descriptions-item>
          <el-descriptions-item label="注册时间">{{ detail.registerTime || '-' }}</el-descriptions-item>
          <el-descriptions-item label="最近登录">{{ detail.lastLoginTime || '-' }}</el-descriptions-item>
          <el-descriptions-item label="头像" :span="2">
            <el-avatar :size="40" :src="detail.avatar" />
          </el-descriptions-item>
        </el-descriptions>

        <h4>登录历史</h4>
        <el-table :data="detail.loginLogs || []" size="small" max-height="220" stripe>
          <el-table-column prop="loginTime" label="登录时间" width="170" />
          <el-table-column label="渠道" width="100">
            <template #default="{ row }">{{ sourceText(row.source) }}</template>
          </el-table-column>
          <el-table-column prop="ip" label="IP" />
        </el-table>

        <h4>后台操作记录</h4>
        <el-table :data="detail.operateLogs || []" size="small" max-height="220" stripe>
          <el-table-column prop="createdAt" label="时间" width="170" />
          <el-table-column prop="adminName" label="操作人" width="100" />
          <el-table-column prop="action" label="动作" width="100" />
          <el-table-column prop="content" label="内容" min-width="200" show-overflow-tooltip />
        </el-table>
      </template>
    </el-drawer>

    <!-- 重置手机号 -->
    <el-dialog v-model="phoneVisible" title="重置手机号" width="420px">
      <el-form ref="phoneFormRef" :model="phoneForm" :rules="phoneRules" label-width="80px">
        <el-form-item label="用户">
          <span>{{ phoneForm.nickname }} (ID: {{ phoneForm.id }})</span>
        </el-form-item>
        <el-form-item label="新手机号" prop="phone">
          <el-input v-model="phoneForm.phone" placeholder="11位手机号" maxlength="11" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="phoneVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="savePhone">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request, { download } from '../../api/request'
import { useUserStore } from '../../store/user'

const store = useUserStore()
const loading = ref(false)
const saving = ref(false)
const list = ref([])
const total = ref(0)
const range = ref(null)

const query = reactive({ index: 1, size: 10, userId: null, phone: '', nickname: '', status: null })

const statusText = (s) => ({ 1: '正常', 2: '冻结', 3: '注销' }[s] || '-')
const statusType = (s) => ({ 1: 'success', 2: 'warning', 3: 'info' }[s] || 'info')
const sourceText = (s) => ({ 1: '手机号登录', 2: '微信', 3: 'QQ' }[s] || '-')

const load = async (page) => {
  if (page) query.index = page
  loading.value = true
  try {
    const params = {
      ...query,
      registerBegin: range.value ? range.value[0] : null,
      registerEnd: range.value ? range.value[1] : null,
    }
    const res = await request.get('/api/cuser/list', { params })
    list.value = res.data.list
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}

const reset = () => {
  query.userId = null
  query.phone = ''
  query.nickname = ''
  query.status = null
  range.value = null
  load(1)
}

const onExport = () => {
  download('/api/cuser/export', {
    ...query,
    registerBegin: range.value ? range.value[0] : null,
    registerEnd: range.value ? range.value[1] : null,
  }, '用户列表.xlsx')
}

// ---------- 详情 ----------
const detailVisible = ref(false)
const detail = ref(null)
const openDetail = async (row) => {
  detailVisible.value = true
  detail.value = null
  const res = await request.get(`/api/cuser/${row.id}`)
  detail.value = res.data
}

// ---------- 冻结/解冻 ----------
const toggleStatus = async (row) => {
  const action = row.status === 1 ? '冻结' : '解冻'
  await ElMessageBox.confirm(
    action === '冻结' ? `确定冻结用户「${row.nickname}」吗？冻结后用户无法登录APP` : `确定解冻用户「${row.nickname}」吗？`,
    '操作确认', { type: 'warning' }
  )
  await request.put(`/api/cuser/${row.id}/status`, { status: row.status === 1 ? 2 : 1 })
  ElMessage.success(`${action}成功`)
  load()
}

// ---------- 重置手机号 ----------
const phoneVisible = ref(false)
const phoneFormRef = ref()
const phoneForm = reactive({ id: null, nickname: '', phone: '' })
const phoneRules = { phone: [{ required: true, pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }] }

const openPhone = (row) => {
  Object.assign(phoneForm, { id: row.id, nickname: row.nickname, phone: '' })
  phoneVisible.value = true
}

const savePhone = async () => {
  await phoneFormRef.value.validate()
  saving.value = true
  try {
    await request.put(`/api/cuser/${phoneForm.id}/phone`, { phone: phoneForm.phone })
    ElMessage.success('手机号已重置（操作已留痕）')
    phoneVisible.value = false
    load()
  } finally {
    saving.value = false
  }
}

onMounted(() => load())
</script>

<style scoped>
.filter-card { margin-bottom: 12px; }
.pager { margin-top: 14px; display: flex; justify-content: flex-end; }
h4 { margin: 18px 0 8px; color: #303133; }
</style>
