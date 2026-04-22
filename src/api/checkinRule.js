import request from '@/utils/request'

export const checkinRuleApi = {
  getList: () => request.get('/admin/checkin/rules'),
  update: (id, points) => request.put(`/admin/checkin/rules/${id}`, null, { params: { points } })
}
