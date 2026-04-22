import request from '@/utils/request'

/**
 * 分页获取员工列表
 * @param {Object} params { current, size, keyword }
 */
export function getEmployeePage(params) {
  return request({
    url: '/admin/employee/page',
    method: 'get',
    params
  })
}

/**
 * 注册员工
 * @param {Object} data { username, password, email, phone }
 */
export function registerEmployee(data) {
  return request({
    url: '/admin/employee/register',
    method: 'post',
    data
  })
}

/**
 * 修改个人资料（用户名、手机、邮箱），成功后返回新 token 与用户信息
 * @param {Object} data { username, phone, email }
 */
export function updateProfile(data) {
  return request({
    url: '/common/profile',
    method: 'put',
    data
  })
}

/**
 * 修改个人密码
 * @param {Object} data { oldPassword, newPassword }
 */
export function updatePassword(data) {
  return request({
    url: '/common/profile/password',
    method: 'put',
    data
  })
}

/** 删除员工 @param {number} id */
export function deleteEmployee(id) {
  return request({
    url: `/admin/employee/${id}`,
    method: 'delete'
  })
}

/** 启用/禁用员工 @param {number} id @param {0|1} status */
export function updateEmployeeStatus(id, status) {
  return request({
    url: `/admin/employee/${id}/status`,
    method: 'put',
    params: { status }
  })
}
