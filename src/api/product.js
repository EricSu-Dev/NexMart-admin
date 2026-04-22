import request from '@/utils/request'

export const productApi = {
  getPage:  (params)   => request.get('/admin/product/page', { params }),
  list:     (params)   => request.get('/admin/product/list', { params }),
  getDetail:(id)       => request.get(`/admin/product/${id}`),
  add:      (data)     => request.post('/admin/product', data),
  update:   (id, data) => request.put(`/admin/product/${id}`, data),
  remove:   (id)       => request.delete(`/admin/product/${id}`),
  updateStatus: (id, status) => request.put(`/admin/product/${id}/${status}`)
}
