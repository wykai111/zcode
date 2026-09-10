<template>
  <div>
    <!-- 筛选区 -->
    <el-card shadow="never" class="filter-card">
      <el-form inline>
        <el-form-item label="账号">
          <el-input v-model="query.username" placeholder="账号" clearable style="width: 160px" @keyup.enter="load(1)" />
        </el-form-item>
        <el-form-item label="姓名">
          <el-input v-model="query.realName" placeholder="姓名" clearable style="width: 160px" @keyup.enter="load(1)" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="load(1)">查询</el-button>
          <el-button @click="reset">重置</el-button>
          <el-button type="success" @click="openDialog()">新增管理员</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="username" label="账号" min-width="120" />
        <el-table-column prop="realName" label="姓名" min-width="100" />
        <el-table-column prop="roleName" label="角色" min-width="110" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="165" />
        <el-table-column prop="lastLoginTime" label="最后登录时间" width="165" />
        <el-table-column prop="lastLoginIp" label="最后登录IP" width="130" />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openDialog(row)">编辑</el-button>
            <el-button size="small" type="warning" @click="openPwd(row)">重置密码</el-button>
            <el-button size="small" :type="row.status === 1 ? 'danger' : 'success'" @click="toggleStatus(row)">
              {{ row.status === 1 ? '禁用' : '启用' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        class="pager" background layout="total, prev, pager, next, sizes"
        :total="total" v-model:current-page="query.index" v-model:page-size="query.size"
        :page-sizes="[10, 20, 50]" @current-change="load()" @size-change="load(1)"
      />
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑管理员' : '新增管理员'" width="460px">
      <el-form ref="dialogFormRef" :model="form" :rules="dialogRules" label-width="80px">
        <el-form-item label="账号" prop="username">
          <el-input v-model="form.username" :disabled="!!form.id && form.isSuper === 1" placeholder="登录账号" />
        </el-form-item>
        <el-form-item label="姓名">
          <el-input v-model="form.realName" placeholder="姓名" />
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="!form.id">
          <el-input v-model="form.password" type="password" placeholder="登录密码" show-password />
        </el-form-item>
        <el-form-item label="角色" prop="roleId">
          <el-select v-model="form.roleId" placeholder="选择角色" style="width: 100%">
            <el-option v-for="r in roles" :key="r.id" :label="r.name" :value="r.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" v-if="form.id">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" active-text="启用" inactive-text="禁用" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-dialog>

    <!-- 重置密码弹窗 -->
    <el-dialog v-model="pwdVisible" title="重置密码" width="420px">
      <el-form ref="pwdFormRef" :model="pwdForm" :rules="pwdRules" label-width="80px">
        <el-form-item label="新密码" prop="password">
          <el-input v-model="pwdForm.password" type="password" placeholder="至少6位" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="pwdVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="savePwd">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../../api/request'

const loading = ref(false)
const saving = ref(false)
const list = ref([])
const total = ref(0)
const roles = ref([])

const query = reactive({ index: 1, size: 10, username: '', realName: '', status: null })

const load = async (page) => {
  if (page) query.index = page
  loading.value = true
  try {
    const res = await request.get('/api/admin/users', { params: query })
    list.value = res.data.list
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}

const reset = () => {
  query.username = ''
  query.realName = ''
  query.status = null
  load(1)
}

// ---------- 新增/编辑 ----------
const dialogVisible = ref(false)
const dialogFormRef = ref()
const form = reactive({ id: null, username: '', realName: '', roleId: null, status: 1, password: '', isSuper: 0 })
const dialogRules = {
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, min: 6, message: '密码至少6位', trigger: 'blur' }],
  roleId: [{ required: true, message: '请选择角色', trigger: 'change' }],
}

const openDialog = (row) => {
  Object.assign(form, { id: null, username: '', realName: '', roleId: null, status: 1, password: '', isSuper: 0 })
  if (row) {
    Object.assign(form, { id: row.id, username: row.username, realName: row.realName, roleId: row.roleId, status: row.status, isSuper: row.isSuper })
  }
  dialogVisible.value = true
}

const save = async () => {
  await dialogFormRef.value.validate()
  saving.value = true
  try {
    if (form.id) {
      await request.put('/api/admin/users', form)
    } else {
      await request.post('/api/admin/users', form)
    }
    ElMessage.success('保存成功')
    dialogVisible.value = false
    load()
  } finally {
    saving.value = false
  }
}

// ---------- 重置密码 ----------
const pwdVisible = ref(false)
const pwdFormRef = ref()
const pwdForm = reactive({ id: null, password: '' })
const pwdRules = { password: [{ required: true, min: 6, message: '密码至少6位', trigger: 'blur' }] }

const openPwd = (row) => {
  pwdForm.id = row.id
  pwdForm.password = ''
  pwdVisible.value = true
}

const savePwd = async () => {
  await pwdFormRef.value.validate()
  saving.value = true
  try {
    await request.put(`/api/admin/users/${pwdForm.id}/password`, { password: pwdForm.password })
    ElMessage.success('密码已重置')
    pwdVisible.value = false
  } finally {
    saving.value = false
  }
}

// ---------- 启用/禁用 ----------
const toggleStatus = async (row) => {
  const action = row.status === 1 ? '禁用' : '启用'
  await ElMessageBox.confirm(`确定${action}管理员「${row.username}」吗？`, '操作确认', { type: 'warning' })
  await request.put(`/api/admin/users/${row.id}/status`, { status: row.status === 1 ? 0 : 1 })
  ElMessage.success(`${action}成功`)
  load()
}

onMounted(async () => {
  load()
  const res = await request.get('/api/admin/roles')
  roles.value = res.data
})
</script>

<style scoped>
.filter-card { margin-bottom: 12px; }
.pager { margin-top: 14px; display: flex; justify-content: flex-end; }
</style>
