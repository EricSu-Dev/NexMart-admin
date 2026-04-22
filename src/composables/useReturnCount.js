import { ref, computed } from 'vue'
import { returnApi } from '@/api/return'

const applyCount = ref(0)
const approvedCount = ref(0)

export function useReturnCount() {
  const totalCount = computed(() => applyCount.value + approvedCount.value)

  const fetch = async () => {
    try {
      const [applyRes, approvedRes] = await Promise.all([
        returnApi.getPage({ current: 1, size: 1, status: 0 }),
        returnApi.getPage({ current: 1, size: 1, status: 1 })
      ])
      applyCount.value = applyRes.data.total
      approvedCount.value = approvedRes.data.total
    } catch {}
  }

  const decreaseApply = (n = 1) => {
    applyCount.value = Math.max(0, applyCount.value - n)
  }

  const decreaseApproved = (n = 1) => {
    approvedCount.value = Math.max(0, approvedCount.value - n)
  }

  const increaseApply = (n = 1) => {
    applyCount.value += n
  }

  const increaseApproved = (n = 1) => {
    approvedCount.value += n
  }

  return {
    applyCount,
    approvedCount,
    totalCount,
    fetch,
    decreaseApply,
    decreaseApproved,
    increaseApply,
    increaseApproved
  }
}
