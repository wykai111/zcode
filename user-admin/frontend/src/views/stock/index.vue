<template>
  <div>
    <el-card shadow="never" class="filter-card">
      <el-form inline>
        <el-form-item label="股票代码">
          <el-input v-model="query.code" placeholder="如 sz000001" clearable style="width: 150px" @keyup.enter="load(1)" />
        </el-form-item>
        <el-form-item label="股票名称">
          <el-input v-model="query.name" placeholder="名称" clearable style="width: 140px" @keyup.enter="load(1)" />
        </el-form-item>
        <el-form-item label="市场">
          <el-select v-model="query.market" placeholder="全部" clearable style="width: 100px">
            <el-option v-for="m in markets" :key="m" :label="m" :value="m" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部" clearable style="width: 110px">
            <el-option label="正常" :value="1" />
            <el-option label="停牌" :value="2" />
            <el-option label="退市" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="load(1)">查询</el-button>
          <el-button @click="reset">重置</el-button>
          <el-button type="success" v-if="store.hasPerm('stock:save')" @click="openDialog()">新增</el-button>
          <el-button type="warning" v-if="store.hasPerm('stock:import')" @click="importVisible = true">批量导入</el-button>
          <el-button v-if="store.hasPerm('stock:export')" @click="onExport">导出Excel</el-button>
          <el-button type="primary" plain v-if="store.hasPerm('stock:sync')" :loading="syncing" @click="onSync">同步行情API</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="code" label="股票代码" width="120" />
        <el-table-column prop="exchangeCode" label="交易代码" width="100" />
        <el-table-column prop="name" label="股票名称" min-width="120" />
        <el-table-column prop="market" label="市场" width="80">
          <template #default="{ row }">
            <el-tag size="small">{{ row.market }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="industry" label="行业" width="100" />
        <el-table-column label="类别" width="80">
          <template #default="{ row }">{{ categoryText(row.category) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="100" show-overflow-tooltip />
        <el-table-column prop="createdAt" label="创建时间" width="165" />
        <el-table-column prop="updatedAt" label="更新时间" width="165" />
        <el-table-column label="操作" width="170" fixed="right">
          <template #default="{ row }">
            <el-button size="small" v-if="store.hasPerm('stock:save')" @click="openDialog(row)">编辑</el-button>
            <el-button size="small" v-if="store.hasPerm('stock:status')" :type="row.status === 1 ? 'danger' : 'success'" @click="toggleStatus(row)">
              {{ row.status === 1 ? '禁用' : '启用' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        class="pager" background layout="total, prev, pager, next, sizes"
        :total="total" v-model:current-page="query.index" v-model:page-size="query.size"
        :page-sizes="[10, 20, 50, 100]" @current-change="load()" @size-change="load(1)"
      />
    </el-card>

    <!-- 新增/编辑 -->
    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑股票码表' : '新增股票码表'" width="480px">
      <el-form ref="dialogFormRef" :model="form" :rules="dialogRules" label-width="90px">
        <el-form-item label="股票代码" prop="code">
          <el-input v-model="form.code" placeholder="如 sz000001" />
        </el-form-item>
        <el-form-item label="交易代码">
          <el-input v-model="form.exchangeCode" placeholder="如 000001" />
        </el-form-item>
        <el-form-item label="股票名称" prop="name">
          <el-input v-model="form.name" placeholder="股票名称" />
        </el-form-item>
        <el-form-item label="所属市场" prop="market">
          <el-select v-model="form.market" placeholder="选择市场" style="width: 100%">
            <el-option v-for="m in markets" :key="m" :label="m" :value="m" />
          </el-select>
        </el-form-item>
        <el-form-item label="行业分类">
          <el-input v-model="form.industry" placeholder="行业" />
        </el-form-item>
        <el-form-item label="类别">
          <el-select v-model="form.category" style="width: 100%">
            <el-option label="股票" :value="1" />
            <el-option label="期货" :value="2" />
            <el-option label="期权" :value="3" />
            <el-option label="基金" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status" style="width: 100%">
            <el-option label="正常" :value="1" />
            <el-option label="停牌" :value="2" />
            <el-option label="退市" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-dialog>

    <!-- 批量导入 -->
    <el-dialog v-model="importVisible" title="Excel 批量导入" width="560px">
      <el-alert type="info" :closable="false" show-icon style="margin-bottom: 12px"
        title="导入规则：代码+市场 组合唯一；已存在的记录将被更新；请先下载模板" />
      <div class="import-row">
        <el-upload
          :auto-upload="false" :limit="1" accept=".xlsx,.xls"
          :on-change="(f) => (importFile = f.raw)" :on-remove="() => (importFile = null)"
        >
          <el-button type="primary">选择 Excel 文件</el-button>
        </el-upload>
        <el-button @click="downloadTemplate">下载模板</el-button>
      </div>
      <template v-if="importResult">
        <el-divider />
        <el-descriptions :column="3" size="small" border>
          <el-descriptions-item label="新增">{{ importResult.insertCount }} 条</el-descriptions-item>
          <el-descriptions-item label="更新">{{ importResult.updateCount }} 条</el-descriptions-item>
          <el-descriptions-item label="失败">{{ importResult.errors.length }} 条</el-descriptions-item>
        </el-descriptions>
        <el-collapse v-if="importResult.errors.length" style="margin-top: 8px">
          <el-collapse-item :title="`查看失败明细（${importResult.errors.length}）`">
            <div v-for="(e, i) in importResult.errors" :key="i" class="err-line">{{ e }}</div>
          </el-collapse-item>
        </el-collapse>
      </template>
      <template #footer>
        <el-button @click="importVisible = false">关闭</el-button>
        <el-button type="primary" :loading="importing" :disabled="!importFile" @click="doImport">开始导入</el-button>
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
const markets = ['SH', 'SZ', 'BJ', 'HK', 'US']

const loading = ref(false)
const saving = ref(false)
const importing = ref(false)
const syncing = ref(false)
const list = ref([])
const total = ref(0)

const query = reactive({ index: 1, size: 10, code: '', name: '', market: '', status: null })

const statusText = (s) => ({ 1: '正常', 2: '停牌', 3: '退市' }[s] || '-')
const statusType = (s) => ({ 1: 'success', 2: 'warning', 3: 'danger' }[s] || 'info')
const categoryText = (c) => ({ 1: '股票', 2: '期货', 3: '期权', 4: '基金' }[c] || '-')

const load = async (page) => {
  if (page) query.index = page
  loading.value = true
  try {
    const res = await request.get('/api/stock/list', { params: query })
    list.value = res.data.list
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}

const reset = () => {
  Object.assign(query, { index: 1, code: '', name: '', market: '', status: null })
  load()
}

const onExport = () => download('/api/stock/export', query, '股票码表.xlsx')
const downloadTemplate = () => download('/api/stock/template', {}, '码表导入模板.xlsx')

// ---------- 新增/编辑 ----------
const dialogVisible = ref(false)
const dialogFormRef = ref()
const form = reactive({ id: null, code: '', exchangeCode: '', name: '', market: '', industry: '', category: 1, status: 1, remark: '' })
const dialogRules = {
  code: [{ required: true, message: '请输入股票代码', trigger: 'blur' }],
  name: [{ required: true, message: '请输入股票名称', trigger: 'blur' }],
  market: [{ required: true, message: '请选择市场', trigger: 'change' }],
}

const openDialog = (row) => {
  Object.assign(form, {
    id: null, code: '', exchangeCode: '', name: '', market: '', industry: '', category: 1, status: 1, remark: '',
  })
  if (row) Object.assign(form, row)
  dialogVisible.value = true
}

const save = async () => {
  await dialogFormRef.value.validate()
  saving.value = true
  try {
    if (form.id) {
      await request.put('/api/stock', form)
    } else {
      await request.post('/api/stock', form)
    }
    ElMessage.success('保存成功')
    dialogVisible.value = false
    load()
  } finally {
    saving.value = false
  }
}

// ---------- 启用/禁用 ----------
const toggleStatus = async (row) => {
  const action = row.status === 1 ? '禁用' : '启用'
  await ElMessageBox.confirm(`确定${action}「${row.name}」吗？`, '操作确认', { type: 'warning' })
  await request.put(`/api/stock/${row.id}/status`, { status: row.status === 1 ? 2 : 1 })
  ElMessage.success(`${action}成功`)
  load()
}

// ---------- 导入 ----------
const importVisible = ref(false)
const importFile = ref(null)
const importResult = ref(null)

const doImport = async () => {
  importing.value = true
  importResult.value = null
  try {
    const fd = new FormData()
    fd.append('file', importFile.value)
    const res = await request.post('/api/stock/import', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    importResult.value = res.data
    ElMessage.success('导入完成')
    load()
  } finally {
    importing.value = false
  }
}

// ---------- 同步 ----------
const onSync = async () => {
  await ElMessageBox.confirm('将从行情 API（stock.followman.vip）同步全部码表数据，可能耗时较长，确定继续吗？', '操作确认', { type: 'warning' })
  syncing.value = true
  try {
    const res = await request.post('/api/stock/sync')
    ElMessage.success(`同步完成：新增 ${res.data.insert} 条，更新 ${res.data.update} 条，失败 ${res.data.fail} 条`)
    load()
  } finally {
    syncing.value = false
  }
}

onMounted(() => load())
</script>

<style scoped>
.filter-card { margin-bottom: 12px; }
.pager { margin-top: 14px; display: flex; justify-content: flex-end; }
.import-row { display: flex; gap: 10px; align-items: center; }
.err-line { color: #f56c6c; font-size: 12px; line-height: 1.8; }
</style>
