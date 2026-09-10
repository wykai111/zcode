import { defineStore } from 'pinia'
import request from '../api/request'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('admin_token') || '',
    userInfo: JSON.parse(localStorage.getItem('admin_user') || 'null'),
    menus: [],
    perms: [],
  }),
  getters: {
    isSuper: (state) => !!state.userInfo?.isSuper,
    hasPerm: (state) => (perm) =>
      state.userInfo?.isSuper === 1 || state.perms.includes(perm),
    realName: (state) => state.userInfo?.realName || state.userInfo?.username || '',
  },
  actions: {
    async login(form) {
      const res = await request.post('/api/admin/auth/login', form)
      this.token = res.data.token
      this.userInfo = res.data
      this.menus = res.data.menus || []
      this.perms = res.data.perms || []
      localStorage.setItem('admin_token', this.token)
      localStorage.setItem('admin_user', JSON.stringify(this.userInfo))
      localStorage.setItem('admin_menus', JSON.stringify(this.menus))
      localStorage.setItem('admin_perms', JSON.stringify(this.perms))
      return res.data
    },
    async fetchMe() {
      const res = await request.get('/api/admin/auth/me')
      this.userInfo = res.data
      this.menus = res.data.menus || []
      this.perms = res.data.perms || []
      localStorage.setItem('admin_user', JSON.stringify(this.userInfo))
      localStorage.setItem('admin_menus', JSON.stringify(this.menus))
      localStorage.setItem('admin_perms', JSON.stringify(this.perms))
      return res.data
    },
    restore() {
      this.menus = JSON.parse(localStorage.getItem('admin_menus') || '[]')
      this.perms = JSON.parse(localStorage.getItem('admin_perms') || '[]')
    },
    logout() {
      this.token = ''
      this.userInfo = null
      this.menus = []
      this.perms = []
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_user')
      localStorage.removeItem('admin_menus')
      localStorage.removeItem('admin_perms')
    },
  },
})
