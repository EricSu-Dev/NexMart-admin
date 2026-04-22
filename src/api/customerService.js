import request from '@/utils/request'

export const customerServiceApi = {
  // 会话列表
  getSessionList: (params) => request.get('/admin/cs/session/list', { params }),
  
  // 会话详情（用户信息）
  getSessionDetail: (sessionId) => request.get('/admin/cs/session/detail', { params: { sessionId } }),
  
  // 历史消息
  getHistory: (sessionId) => request.get('/admin/cs/message/history', { params: { sessionId } })
}
