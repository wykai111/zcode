import request from './request'

// ===== 鉴权 =====
export const login = (data) => request.post('/admin/login', data)
export const getProfile = () => request.get('/admin/profile')

// ===== 数据概览 =====
export const getDashboard = () => request.get('/admin/dashboard')

// ===== 短剧管理 =====
export const getDramaList = (params) => request.get('/admin/dramas', { params })
export const getDrama = (id) => request.get(`/admin/dramas/${id}`)
export const createDrama = (data) => request.post('/admin/dramas', data)
export const updateDrama = (id, data) => request.put(`/admin/dramas/${id}`, data)
export const deleteDrama = (id) => request.delete(`/admin/dramas/${id}`)
export const generateEpisodes = (id, count) =>
  request.post(`/admin/dramas/${id}/episodes/generate`, { count })

// ===== 剧集管理 =====
export const getEpisodeList = (dramaId) =>
  request.get('/admin/episodes', { params: { dramaId } })
export const updateEpisode = (id, data) => request.put(`/admin/episodes/${id}`, data)
export const deleteEpisode = (id) => request.delete(`/admin/episodes/${id}`)

// ===== 分类管理 =====
export const getCategoryList = () => request.get('/admin/categories')
export const createCategory = (data) => request.post('/admin/categories', data)
export const updateCategory = (id, data) => request.put(`/admin/categories/${id}`, data)
export const deleteCategory = (id) => request.delete(`/admin/categories/${id}`)

// ===== 上传 =====
export const uploadFile = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return request.post('/admin/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
