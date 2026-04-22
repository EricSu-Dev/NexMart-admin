import request from '@/utils/request'

export const pointsMallApi = {
  /**
   * 查询兑换项列表
   * @param {Object} params { status: 1|2 }
   */
  getPage: (params) => request.get('/admin/points/mall', { params }),

  /**
   * 创建兑换项
   * @param {Object} data { couponId, pointsCost, exchangeLimit }
   */
  create: (data) => request.post('/admin/points/mall', data),

  /**
   * 上下架操作
   * @param {number|string} id 
   * @param {number} status 1=上架 2=下架
   */
  updateStatus: (id, status) => request.patch(`/admin/points/mall/${id}/status`, null, { params: { status } }),

  /**
   * 获取可选订单券列表
   * @param {Object} params { current, size, keyWord, discountType }
   */
  getOrderCoupons: (params) => request.get('/admin/points/mall/orderCouponPage', { params }),

  /**
   * 修改所需积分
   * @param {number|string} id 
   * @param {number} pointsCost 
   */
  updatePointsCost: (id, pointsCost) => request.patch(`/admin/points/mall/${id}/points-cost`, null, { params: { pointsCost } }),

  /**
   * 删除兑换项
   * @param {number|string} id 
   */
  deleteItem: (id) => request.delete(`/admin/points/mall/${id}`)
}
