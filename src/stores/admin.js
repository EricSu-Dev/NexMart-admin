import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAdminStore = defineStore('admin', () => {
  const token = ref(localStorage.getItem('nexmart_admin_token') || '')
  const userInfo = ref(JSON.parse(localStorage.getItem('nexmart_admin_user') || 'null'))

  const isLoggedIn = computed(() => !!token.value)

  function setToken(val) {
    token.value = val
    localStorage.setItem('nexmart_admin_token', val)
  }

  function setUserInfo(info) {
    userInfo.value = info
    localStorage.setItem('nexmart_admin_user', JSON.stringify(info))
  }

  function logout() {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('nexmart_admin_token')
    localStorage.removeItem('nexmart_admin_user')
  }

  const isBoss = computed(() => userInfo.value?.role === 2)
  
  return { token, userInfo, isLoggedIn, isBoss, setToken, setUserInfo, logout }
})
