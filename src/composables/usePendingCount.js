import { ref } from 'vue'
import { orderApi } from '@/api/order'

const pendingCount = ref(0)

export function usePendingCount() {
  const fetch = () => {
    return orderApi.getPage({ current: 1, size: 1, status: 2 }).then(res => {
      pendingCount.value = res.data.total
    }).catch(() => {})
  }

  const decrease = (n = 1) => {
    pendingCount.value = Math.max(0, pendingCount.value - n)
  }

  const increase = (n = 1) => {
    pendingCount.value += n
  }

  return { pendingCount, fetch, decrease, increase }
}
