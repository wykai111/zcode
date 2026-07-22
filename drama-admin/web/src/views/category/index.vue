<template>
  <div>
    <el-card shadow="never">
      <div style="margin-bottom: 16px">
        <el-button type="success" @click="openDialog()">+ 新增分类</el-button>
      </div>

      <el-table :data="list" v-loading="loading" border>
        <el-table-column prop="icon" label="图标" width="80">
          <template #default="{ row }">
            <span style="font-size: 24px">{{ row.icon }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="id" label="ID (slug)" width="180" />
        <el-table-column prop="name" label="名称" width="180" />
        <el-table-column prop="sort_order" label="排序" width="100" />
        <el-table-column prop="created_at" label="创建时间" min-width="180" />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openDialog(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="onDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑分类' : '新增分类'" width="440px" @close="resetForm">
      <el-form :model="form" label-width="100px">
        <el-form-item label="ID (slug)">
          <el-input v-model="form.id" :disabled="isEdit" placeholder="如 romance" />
        </el-form-item>
        <el-form-item label="名称">
          <el-input v-model="form.name" placeholder="如 Romance" />
        </el-form-item>
        <el-form-item label="图标 (emoji)">
          <el-input v-model="form.icon" placeholder="如 💕" style="width: 120px" />
        </el-form-item>
        <el-form-item label="排序权重">
          <el-input-number v-model="form.sort_order" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="onSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getCategoryList, createCategory, updateCategory, deleteCategory } from '@/api'

const list = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)

const form = reactive({ id: '', name: '', icon: '', sort_order: 0 })

async function loadList() {
  loading.value = true
  try {
    const res = await getCategoryList()
    list.value = res.data
  } finally {
    loading.value = false
  }
}

function openDialog(row) {
  resetForm()
  if (row) {
    isEdit.value = true
    Object.assign(form, row)
  } else {
    isEdit.value = false
  }
  dialogVisible.value = true
}

function resetForm() {
  Object.assign(form, { id: '', name: '', icon: '', sort_order: 0 })
}

async function onSubmit() {
  if (!form.id || !form.name) {
    ElMessage.warning('ID 和名称必填')
    return
  }
  if (isEdit.value) {
    await updateCategory(form.id, form)
    ElMessage.success('更新成功')
  } else {
    await createCategory(form)
    ElMessage.success('创建成功')
  }
  dialogVisible.value = false
  loadList()
}

async function onDelete(row) {
  await ElMessageBox.confirm(`确定删除分类「${row.name}」吗？`, '删除确认', { type: 'warning' })
  await deleteCategory(row.id)
  ElMessage.success('删除成功')
  loadList()
}

onMounted(loadList)
</script>
