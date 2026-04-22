import request from '@/utils/request'

export const dashboardApi = {
  getStats: () => request.get('/admin/dashboard/stats'),
  getOrderTrend: (days = 30) => request.get('/admin/dashboard/order-trend', { params: { days } }),
  getRevenueTrend: (days = 30) => request.get('/admin/dashboard/revenue-trend', { params: { days } })
}
