<template>
  <div class="login-page">
    <div class="login-box">
      <h2 class="title">用户管理中心</h2>
      <p class="subtitle">后台管理系统</p>
      <el-form ref="formRef" :model="form" :rules="rules" size="large" @keyup.enter="onSubmit">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="管理员账号" :prefix-icon="User" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" type="password" placeholder="登录密码" :prefix-icon="Lock" show-password />
        </el-form-item>
        <el-form-item prop="captcha">
          <div class="captcha-row">
            <el-input v-model="form.captcha" placeholder="验证码" :prefix-icon="Key" />
            <img v-if="captchaImg" :src="captchaImg" class="captcha-img" title="点击刷新" @click="refreshCaptcha" />
          </div>
        </el-form-item>
        <el-button type="primary" size="large" class="submit" :loading="loading" @click="onSubmit">
          登 录
        </el-button>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, Key } from '@element-plus/icons-vue'
import request from '../../api/request'
import { useUserStore } from '../../store/user'

const router = useRouter()
const store = useUserStore()

const formRef = ref()
const loading = ref(false)
const captchaImg = ref('')
const form = ref({ username: '', password: '', captcha: '', captchaId: '' })

const rules = {
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  captcha: [{ required: true, message: '请输入验证码', trigger: 'blur' }],
}

const refreshCaptcha = async () => {
  try {
    const res = await request.get('/api/admin/auth/captcha')
    captchaImg.value = res.data.image
    form.value.captchaId = res.data.captchaId
    form.value.captcha = ''
  } catch (e) { /* 提示已由拦截器处理 */ }
}

const onSubmit = async () => {
  await formRef.value.validate()
  loading.value = true
  try {
    await store.login(form.value)
    ElMessage.success('登录成功')
    router.push('/')
  } catch (e) {
    refreshCaptcha()
  } finally {
    loading.value = false
  }
}

onMounted(refreshCaptcha)
</script>

<style scoped>
.login-page {
  height: 100vh;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #1d39c4 0%, #2754e6 50%, #4a7df5 100%);
}
.login-box {
  width: 400px; background: #fff; border-radius: 10px;
  padding: 40px 36px 32px; box-shadow: 0 12px 40px rgba(0,0,0,.25);
}
.title { text-align: center; margin: 0 0 4px; color: #1f2d3d; }
.subtitle { text-align: center; margin: 0 0 28px; color: #909399; font-size: 13px; }
.captcha-row { display: flex; gap: 10px; width: 100%; }
.captcha-img { width: 140px; height: 44px; border-radius: 4px; cursor: pointer; border: 1px solid #dcdfe6; flex-shrink: 0; }
.submit { width: 100%; margin-top: 6px; }
</style>
