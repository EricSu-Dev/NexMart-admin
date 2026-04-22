import request from '@/utils/request'

export const categoryApi = {
  getList:  ()         => request.get('/admin/category/list'),
  add:      (data)     => request.post('/admin/category', data),
  update:   (id, data) => request.put(`/admin/category/${id}`, data),
  remove:   (id)       => request.delete(`/admin/category/${id}`)
}
