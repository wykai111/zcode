import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '../router'

const request = axios.create({
  baseURL: '',
  timeout: 30000,
})

// 请求拦截：自动带 token
request.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截：统一处理 code + 滑动续期
request.interceptors.response.use(
  (response) => {
    // 滑动续期：后端签发新 token
    const newToken = response.headers['x-new-token']
    if (newToken) {
      localStorage.setItem('admin_token', newToken)
    }
    const res = response.data
    if (res.code === 0) {
      return res
    }
    if (res.code === 401) {
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_user')
      router.push('/login')
      ElMessage.error(res.message || '登录已失效，请重新登录')
    } else {
      ElMessage.error(res.message || '请求失败')
    }
    return Promise.reject(res)
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_user')
      router.push('/login')
      ElMessage.error('登录已失效，请重新登录')
    } else {
      ElMessage.error(error.response?.data?.message || error.message || '网络错误')
    }
    return Promise.reject(error)
  }
)

/** 带鉴权的文件下载（导出 Excel） */
export function download(url, params, fileName) {
  return request({
    url,
    method: 'get',
    params,
    responseType: 'blob',
  }).then((res) => {
    const blob = new Blob([res], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = fileName
    link.click()
    URL.revokeObjectURL(link.href)
  })
}

export default request
