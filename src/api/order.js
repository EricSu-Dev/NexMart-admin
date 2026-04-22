import request from '@/utils/request'

export const orderApi = {
  getPage:      (params)        => request.get('/admin/order/page', { params }),
  updateStatus: (id, status)    => request.put(`/admin/order/${id}/status`, null, { params: { status } })
}
