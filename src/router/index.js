import { createRouter, createWebHistory } from 'vue-router'
import { useAdminStore } from '@/stores/admin'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '管理员登录' }
  },
  {
    path: '/',
    component: () => import('@/components/AdminLayout.vue'),
    meta: { requireAuth: true },
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/Dashboard.vue'),
        meta: { title: '概览统计', icon: 'Odometer' }
      },
      {
        path: 'home-section',
        name: 'HomeSectionList',
        component: () => import('@/views/home/HomeSectionList.vue'),
        meta: { title: '首页模块管理', icon: 'Operation' }
      },
      {
        path: 'carousel',
        name: 'CarouselList',
        component: () => import('@/views/carousel/CarouselList.vue'),
        meta: { title: '轮播图管理', icon: 'Picture' }
      },
      {
        path: 'category',
        name: 'CategoryList',
        component: () => import('@/views/category/CategoryList.vue'),
        meta: { title: '分类管理', icon: 'Grid' }
      },
      {
        path: 'product',
        name: 'ProductList',
        component: () => import('@/views/product/ProductList.vue'),
        meta: { title: '商品管理', icon: 'Goods' }
      },
      {
        path: 'promotion',
        name: 'PromotionList',
        component: () => import('@/views/promotion/PromotionList.vue'),
        meta: { title: '优惠活动管理', icon: 'Present' }
      },
      {
        path: 'coupon',
        name: 'CouponList',
        component: () => import('@/views/coupon/CouponList.vue'),
        meta: { title: '优惠券管理', icon: 'Ticket' }
      },
      {
        path: 'points',
        redirect: '/points/mall',
        meta: { title: '积分管理', icon: 'Coin' },
        children: [
          {
            path: 'checkin',
            name: 'PointsCheckin',
            component: () => import('@/views/points/CheckInList.vue'),
            meta: { title: '签到积分管理' }
          },
          {
            path: 'mall',
            name: 'PointsMallList',
            component: () => import('@/views/points/PointsMallList.vue'),
            meta: { title: '积分商城管理' }
          }
        ]
      },
      {
        path: 'seckill',
        name: 'SeckillActivityList',
        component: () => import('@/views/seckill/ActivityList.vue'),
        meta: { title: '秒杀活动管理', icon: 'Timer' }
      },
      {
        path: 'seckill/items',
        name: 'SeckillItems',
        component: () => import('@/views/seckill/SeckillItems.vue'),
        meta: { title: '秒杀项管理', hidden: true }
      },
      {
        path: 'order',
        name: 'OrderList',
        component: () => import('@/views/order/OrderList.vue'),
        meta: { title: '订单管理', icon: 'List' }
      },
      {
        path: 'return',
        name: 'ReturnList',
        component: () => import('@/views/order/ReturnList.vue'),
        meta: { title: '退货管理', icon: 'RefreshLeft' }
      },
      {
        path: 'user',
        name: 'UserList',
        component: () => import('@/views/user/UserList.vue'),
        meta: { title: '用户管理', icon: 'User' }
      },
      {
        path: 'admin-user',
        name: 'AdminList',
        component: () => import('@/views/user/EmployeeList.vue'),
        meta: { title: '员工管理', icon: 'Setting', role: 2 }
      },
      {
        path: 'cs/index',
        name: 'CustomerService',
        component: () => import('@/views/cs/CustomerService.vue'),
        meta: { title: '客服后台管理', icon: 'Headset' }
      },
      {
        path: 'profile/edit',
        name: 'EditProfile',
        component: () => import('@/views/user/EditProfile.vue'),
        meta: { title: '个人信息', hidden: true }
      },
      {
        path: 'profile/password',
        name: 'ChangePassword',
        component: () => import('@/views/user/ChangePassword.vue'),
        meta: { title: '修改密码', hidden: true }
      }
    ]
  },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  document.title = (to.meta.title || 'NexMart') + ' — 管理后台'
  const adminStore = useAdminStore()

  if (to.meta.requireAuth && !adminStore.isLoggedIn) {
    next('/login')
  } else if (to.path === '/login' && adminStore.isLoggedIn) {
    next('/')
  } else if (to.meta.role && adminStore.userInfo?.role !== to.meta.role) {
    // 如果页面需要特定角色（如 BOSS），但用户没有该角色，重定向到首页
    next('/')
  } else {
    next()
  }
})

export default router
