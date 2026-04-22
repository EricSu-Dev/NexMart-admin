<template>
  <div class="admin-layout">
    <!-- 侧边栏 -->
    <aside class="sidebar" :class="{ collapsed }">
      <div class="sidebar-logo">
        <span class="logo-icon">N</span>
        <span v-show="!collapsed" class="logo-text">NexMart</span>
      </div>

      <el-menu
        :default-active="$route.path"
        :collapse="collapsed"
        :collapse-transition="false"
        router
        class="sidebar-menu"
      >
        <el-menu-item index="/dashboard">
          <el-icon><Odometer /></el-icon>
          <template #title>概览统计</template>
        </el-menu-item>
        <el-menu-item index="/home-section">
          <el-icon><Operation /></el-icon>
          <template #title>首页模块管理</template>
        </el-menu-item>
        <el-menu-item index="/carousel">
          <el-icon><Picture /></el-icon>
          <template #title>轮播图管理</template>
        </el-menu-item>
        <el-menu-item index="/category">
          <el-icon><Grid /></el-icon>
          <template #title>分类管理</template>
        </el-menu-item>
        <el-menu-item index="/product">
          <el-icon><Goods /></el-icon>
          <template #title>商品管理</template>
        </el-menu-item>
        <el-menu-item index="/promotion">
          <el-icon><Present /></el-icon>
          <template #title>优惠活动管理</template>
        </el-menu-item>
        <el-menu-item index="/coupon">
          <el-icon><Ticket /></el-icon>
          <template #title>优惠券管理</template>
        </el-menu-item>
        <el-sub-menu index="/points">
          <template #title>
            <el-icon><Coin /></el-icon>
            <span>积分管理</span>
          </template>
          <el-menu-item index="/points/checkin">签到积分管理</el-menu-item>
          <el-menu-item index="/points/mall">积分商城管理</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="/seckill">
          <template #title>
            <el-icon><Timer /></el-icon>
            <span>秒杀管理</span>
          </template>
          <el-menu-item index="/seckill">秒杀活动管理</el-menu-item>
          <el-menu-item index="/seckill/items">秒杀项管理</el-menu-item>
        </el-sub-menu>
        <el-menu-item index="/order">
          <el-badge :value="pendingCount" :hidden="!pendingCount" :max="99" :class="{ 'order-badge': true, 'order-badge-collapsed': collapsed }">
            <el-icon><List /></el-icon>
          </el-badge>
          <template #title>订单管理</template>
        </el-menu-item>
        <el-menu-item index="/return">
          <el-badge :value="returnTotalCount" :hidden="!returnTotalCount" :max="99" :class="{ 'order-badge': true, 'order-badge-collapsed': collapsed }">
            <el-icon><RefreshLeft /></el-icon>
          </el-badge>
          <template #title>售后管理</template>
        </el-menu-item>
        <el-menu-item index="/cs/index">
          <el-badge :value="csStore.totalUnreadCount" :hidden="!csStore.totalUnreadCount" :max="99" :class="{ 'cs-badge': true, 'order-badge-collapsed': collapsed }">
            <el-icon><Headset /></el-icon>
          </el-badge>
          <template #title>客服后台管理</template>
        </el-menu-item>
        <el-menu-item index="/user">
          <el-icon><User /></el-icon>
          <template #title>用户管理</template>
        </el-menu-item>
        <el-menu-item v-if="adminStore.isBoss" index="/admin-user">
          <el-icon><Setting /></el-icon>
          <template #title>员工管理</template>
        </el-menu-item>
      </el-menu>
    </aside>

    <!-- 右侧区域 -->
    <div class="main-wrap">
      <!-- 顶部栏 -->
      <header class="topbar">
        <el-button
          :icon="collapsed ? Expand : Fold"
          text circle
          @click="collapsed = !collapsed"
        />
        <div class="topbar-right">
          <el-dropdown @command="handleCommand">
            <span class="admin-info">
              <el-avatar
                :size="30"
                :src="adminStore.userInfo?.avatarUrl"
                style="background:#409eff;font-size:13px"
              >
                {{ adminStore.userInfo?.username?.charAt(0)?.toUpperCase() }}
              </el-avatar>
              <span class="admin-name">{{ adminStore.userInfo?.username }}</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人信息</el-dropdown-item>
                <el-dropdown-item command="password">修改密码</el-dropdown-item>
                <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <!-- 页面内容 -->
      <main class="page-main">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Expand, Fold, ArrowDown, Odometer, Goods, Grid, List, User, Setting, RefreshLeft, Picture, Operation, Headset, Ticket, Discount, Present, Coin, Timer } from '@element-plus/icons-vue'
import { useAdminStore } from '@/stores/admin'
import { useCustomerServiceStore } from '@/stores/customerService'
import { useWebSocket } from '@/utils/websocket'
import { usePendingCount } from '@/composables/usePendingCount'
import { useReturnCount } from '@/composables/useReturnCount'

const router = useRouter()
const adminStore = useAdminStore()
const csStore = useCustomerServiceStore()
const collapsed = ref(false)
const { pendingCount, fetch: fetchPending } = usePendingCount()
const { totalCount: returnTotalCount, fetch: fetchReturn } = useReturnCount()
const { connect, disconnect } = useWebSocket()

onMounted(() => {
  connect()
  fetchPending()
  fetchReturn()
  
  // 初始化全局客服数据
  csStore.fetchSessions()
  csStore.initWebSocket()
})

onUnmounted(() => {
  disconnect()
})

const handleCommand = (cmd) => {
  if (cmd === 'logout') {
    adminStore.logout()
    router.push('/login')
  } else if (cmd === 'profile') {
    router.push('/profile/edit')
  } else if (cmd === 'password') {
    router.push('/profile/password')
  }
}
</script>

<style scoped>
.admin-layout { display: flex; height: 100vh; overflow: hidden; }

.sidebar {
  width: 220px; flex-shrink: 0;
  background: #001529;
  display: flex; flex-direction: column;
  transition: width .2s;
  overflow: hidden;
}
.sidebar.collapsed { width: 64px; }

.sidebar-logo {
  height: 56px;
  display: flex; align-items: center; gap: 10px;
  padding: 0 20px;
  border-bottom: 1px solid rgba(255,255,255,.08);
  overflow: hidden; white-space: nowrap;
}
.logo-icon {
  width: 28px; height: 28px; border-radius: 6px;
  background: #409eff;
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-weight: 700; font-size: 16px;
  flex-shrink: 0;
}
.logo-text { color: #fff; font-size: 17px; font-weight: 600; }

.sidebar-menu {
  flex: 1; border-right: none;
  background: transparent;
  --el-menu-bg-color: transparent;
  --el-menu-text-color: rgba(255,255,255,.65);
  --el-menu-active-color: #fff;
  --el-menu-hover-bg-color: rgba(255,255,255,.08);
  --el-menu-item-height: 48px;
}

.main-wrap { flex: 1; display: flex; flex-direction: column; overflow: hidden; background: #f0f2f5; }

.topbar {
  height: 56px; background: #fff;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 20px;
  border-bottom: 1px solid #e8e8e8;
  flex-shrink: 0;
}
.topbar-right { display: flex; align-items: center; }
.admin-info {
  display: flex; align-items: center; gap: 8px;
  cursor: pointer; padding: 4px 8px; border-radius: 6px;
}
.admin-info:hover { background: #f5f7fa; }
.admin-name { font-size: 14px; color: #303133; }

.page-main { flex: 1; overflow-y: auto; padding: 20px; }
.order-badge :deep(.el-badge__content) { top: 10px; right: -60px; }
.cs-badge :deep(.el-badge__content) { top: 10px; right: -85px; }
.order-badge-collapsed :deep(.el-badge__content) { top: 2px; right: 2px; }
</style>
