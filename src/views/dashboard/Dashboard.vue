<template>
  <div>
    <h2 class="page-title">概览统计</h2>

    <div class="stat-row">
      <div class="stat-card" v-for="card in statCards" :key="card.label">
        <div class="stat-icon" :style="{ background: card.bg }">
          <el-icon size="20" :color="card.color"><component :is="card.icon" /></el-icon>
        </div>
        <div class="stat-body">
          <p class="stat-label">{{ card.label }}</p>
          <p class="stat-value">{{ card.value }}</p>
        </div>
      </div>
    </div>

    <div class="chart-row">
      <div class="chart-card">
        <h3 class="chart-title">近30天订单趋势</h3>
        <div ref="orderChartRef" class="chart-container"></div>
      </div>
      <div class="chart-card">
        <h3 class="chart-title">近30天营收趋势</h3>
        <div ref="revenueChartRef" class="chart-container"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { Goods, List, User, ShoppingCart, Tickets } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { dashboardApi } from '@/api/dashboard'

const statCards = ref([
  { label: '商品总数', value: '-', icon: 'Goods',        bg: '#e8f4ff', color: '#409eff' },
  { label: '订单总数', value: '-', icon: 'List',         bg: '#fff3e0', color: '#e6a23c' },
  { label: '用户总数', value: '-', icon: 'User',         bg: '#e8fff3', color: '#67c23a' },
  { label: '待发货订单', value: '-', icon: 'ShoppingCart', bg: '#fff0f0', color: '#f56c6c' },
  { label: '售后订单', value: '-', icon: 'Tickets',      bg: '#f3e8ff', color: '#a855f7' }
])

const orderChartRef = ref(null)
const revenueChartRef = ref(null)
let orderChart = null
let revenueChart = null

const initOrderChart = (data) => {
  if (!orderChartRef.value) return
  orderChart = echarts.init(orderChartRef.value)
  orderChart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: data.map(item => item.date.slice(5)),
      axisLine: { lineStyle: { color: '#ddd' } },
      axisLabel: { color: '#666' }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#eee' } },
      axisLabel: { color: '#666' }
    },
    series: [{
      name: '订单数',
      type: 'line',
      smooth: true,
      data: data.map(item => item.orderCount),
      areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
        { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
      ])},
      lineStyle: { color: '#409eff', width: 2 },
      itemStyle: { color: '#409eff' }
    }]
  })
}

const initRevenueChart = (data) => {
  if (!revenueChartRef.value) return
  revenueChart = echarts.init(revenueChartRef.value)
  revenueChart.setOption({
    tooltip: { trigger: 'axis', formatter: '{b}<br/>营收: ¥{c}' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: data.map(item => item.date.slice(5)),
      axisLine: { lineStyle: { color: '#ddd' } },
      axisLabel: { color: '#666' }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#eee' } },
      axisLabel: { color: '#666', formatter: '¥{value}' }
    },
    series: [{
      name: '营收',
      type: 'line',
      smooth: true,
      data: data.map(item => item.revenue),
      areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: 'rgba(103, 194, 58, 0.3)' },
        { offset: 1, color: 'rgba(103, 194, 58, 0.05)' }
      ])},
      lineStyle: { color: '#67c23a', width: 2 },
      itemStyle: { color: '#67c23a' }
    }]
  })
}

const handleResize = () => {
  orderChart?.resize()
  revenueChart?.resize()
}

onMounted(async () => {
  try {
    const [statsRes, orderRes, revenueRes] = await Promise.all([
      dashboardApi.getStats(),
      dashboardApi.getOrderTrend(),
      dashboardApi.getRevenueTrend()
    ])
    const d = statsRes.data
    statCards.value[0].value = d.totalProducts
    statCards.value[1].value = d.totalOrders
    statCards.value[2].value = d.totalUsers
    statCards.value[3].value = d.pendingDelivery
    statCards.value[4].value = d.refundingOrders
    initOrderChart(orderRes.data)
    initRevenueChart(revenueRes.data)
  } catch {}
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  orderChart?.dispose()
  revenueChart?.dispose()
})
</script>

<style scoped>
.page-title { font-size: 20px; color: #303133; margin: 0 0 20px; }

.stat-row { display: flex; gap: 12px; }

.stat-card {
  flex: 1;
  background: #fff; border-radius: 10px;
  padding: 14px 16px; display: flex; align-items: center; gap: 12px;
  border: 1px solid #f0f0f0;
}
.stat-icon {
  width: 40px; height: 40px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.stat-label { font-size: 12px; color: #909399; margin: 0 0 2px; }
.stat-value { font-size: 20px; font-weight: 700; color: #303133; margin: 0; }

.chart-row { display: flex; gap: 16px; margin-top: 20px; }
.chart-card {
  flex: 1;
  background: #fff;
  border-radius: 10px;
  border: 1px solid #f0f0f0;
  padding: 16px;
}
.chart-title { font-size: 15px; color: #303133; margin: 0 0 12px; font-weight: 600; }
.chart-container { height: 280px; }
</style>
