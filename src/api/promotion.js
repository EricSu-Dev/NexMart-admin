import request from '@/utils/request'

export const promotionApi = {
  getPage: (params) => request.get('/admin/promotion/page', { params }),
  create: (data) => request.post('/admin/promotion', data),
  update: (id, data) => request.put(`/admin/promotion/${id}`, data),
  remove: (id) => request.delete(`/admin/promotion/${id}`),
  updateStatus: (id, status) => request({ url: `/admin/promotion/${id}/status`, method: 'patch', params: { status } })
}
