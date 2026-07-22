<template>
  <div class="login-page">
    <div class="login-box">
      <div class="login-header">
        <div class="logo-icon">🎬</div>
        <h2>ShortDrama 管理后台</h2>
        <p>短剧运营管理系统</p>
      </div>

      <el-form ref="formRef" :model="form" :rules="rules" @submit.prevent="onLogin">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="管理员账号" size="large" prefix-icon="User" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="密码"
            size="large"
            prefix-icon="Lock"
            show-password
            @keyup.enter="onLogin"
          />
        </el-form-item>
        <el-button type="primary" size="large" :loading="loading" style="width: 100%" @click="onLogin">
          登 录
        </el-button>
      </el-form>

      <div class="login-tip">
        默认账号：<strong>admin</strong> / 密码：<strong>admin123</strong>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { login } from '@/api'

const router = useRouter()
const formRef = ref()
const loading = ref(false)

const form = reactive({
  username: 'admin',
  password: 'admin123',
})

const rules = {
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

async function onLogin() {
  await formRef.value.validate()
  loading.value = true
  try {
    const res = await login(form)
    localStorage.setItem('admin_token', res.data.token)
    localStorage.setItem('admin_user', JSON.stringify(res.data.user))
    ElMessage.success('登录成功')
    router.push('/')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1f1f2e 0%, #2d2d44 100%);
}
.login-box {
  width: 400px;
  padding: 40px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}
.login-header {
  text-align: center;
  margin-bottom: 32px;
}
.logo-icon {
  font-size: 48px;
  margin-bottom: 12px;
}
.login-header h2 {
  margin: 0 0 8px;
  color: #303133;
}
.login-header p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}
.login-tip {
  margin-top: 16px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 6px;
  text-align: center;
  color: #909399;
  font-size: 13px;
}
</style>
