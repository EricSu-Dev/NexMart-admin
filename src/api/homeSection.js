import request from '@/utils/request'

export const homeSectionApi = {
  // 获取所有模块配置
  getSections: () => request.get('/admin/home/section'),
  
  // 更新模块配置 (autoMode, autoLimit, status)
  updateSection: (type, data) => request.put(`/admin/home/section/${type}`, data),
  
  // 查询手动模式已配置商品
  getSectionItems: (type) => request.get(`/admin/home/section/${type}/items`),
  
  // 添加商品到模块 (后端接收 @RequestBody LongproductId)
  addItem: (type, productId) => request.post(`/admin/home/section/${type}/items`, productId, {
    headers: { 'Content-Type': 'application/json' }
  }),
  
  // 从模块删除商品
  removeItem: (type, itemId) => request.delete(`/admin/home/section/${type}/items/${itemId}`),
  
  // 更新排序
  updateSort: (type, data) => request.put(`/admin/home/section/${type}/items/sort`, data)
}
