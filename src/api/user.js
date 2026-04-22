import request from '@/utils/request'

export const userApi = {
  getPage:      (params)        => request.get('/admin/user/page', { params }),
  updateStatus: (id, status)    => request.put(`/admin/user/${id}/status`, null, { params: { status } })
}
