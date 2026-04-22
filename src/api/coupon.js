import request from '@/utils/request'

export const couponApi = {
  getPage: (params) => request.get('/admin/coupon/page', { params }),
  create: (data) => request.post('/admin/coupon', data),
  update: (id, data) => request.put(`/admin/coupon/${id}`, data),
  remove: (id) => request.delete(`/admin/coupon/${id}`),
  updateStatus: (id, status) => request.put(`/admin/coupon/${id}/status`, { status }),
  getStats: (id) => request.get(`/admin/coupon/${id}/stats`)
}
