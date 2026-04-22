import request from '@/utils/request'

export const carouselApi = {
  getPage:  ()         => request.get('/admin/banner'),
  getDetail:(id)       => request.get(`/admin/banner/${id}`),
  add:      (data)     => request.post('/admin/banner', data),
  update:   (id, data) => request.put(`/admin/banner/${id}`, data),
  remove:   (id)       => request.delete(`/admin/banner/${id}`),
  updateStatus: (id, status) => request.put(`/admin/banner/${id}/status`, null, { params: { status } })
}