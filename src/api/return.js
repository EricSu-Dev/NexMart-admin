import request from '@/utils/request'

export const returnApi = {
  getPage:      (params)        => request.get('/admin/return/list', { params }),
  getDetail:    (id)            => request.get(`/admin/return/detail/${id}`),
  audit:        (id, status, rejectReason, actualRefundAmount) => request.put(`/admin/return/audit/${id}`, null, { params: { status, rejectReason, actualRefundAmount } }),
  refund:       (id)            => request.post(`/admin/return/refund/${id}`)
}