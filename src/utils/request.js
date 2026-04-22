import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useAdminStore } from '@/stores/admin'
import router from '@/router'

const request = axios.create({
  baseURL: '/api',
  timeout: 10000
})

request.interceptors.request.use(
  config => {
    const adminStore = useAdminStore()
    if (adminStore.token) {
      config.headers['Authorization'] = `Bearer ${adminStore.token}`
    }
    return config
  },
  error => Promise.reject(error)
)

request.interceptors.response.use(
  response => {
    const res = response.data
    if (res.code !== 200) {
      ElMessage.error(res.msg || '操作失败')
      return Promise.reject(new Error(res.msg))
    }
    return res
  },
  error => {
    const status = error.response?.status
    if (status === 401) {
      ElMessage.warning('登录已过期，请重新登录')
      const adminStore = useAdminStore()
      adminStore.logout()
      router.push('/login')
    } else if (status === 403) {
      ElMessage.error('无权限访问')
    } else {
      ElMessage.error(error.response?.data?.msg || '网络错误')
    }
    return Promise.reject(error)
  }
)

export default request
