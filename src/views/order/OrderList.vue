﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">订单管理</h2>
    </div>

    <!-- 状态筛选 -->
    <el-card style="margin-bottom:16px">
      <div class="status-buttons">
        <el-button 
          :type="query.status === null ? 'primary' : 'default'" 
          @click="setOrderStatus(null)"
        >全部</el-button>
        <el-button 
          :type="query.status === 1 ? 'primary' : 'default'" 
          @click="setOrderStatus(1)"
        >待付款</el-button>
        <el-button 
          :type="query.status === 2 ? 'primary' : 'default'" 
          @click="setOrderStatus(2)"
        >
          待发货
          <el-badge :value="pendingCount" :hidden="!pendingCount" class="pending-badge" />
        </el-button>
        <el-button 
          :type="query.status === 3 ? 'primary' : 'default'" 
          @click="setOrderStatus(3)"
        >待收货</el-button>
        <el-button 
          :type="query.status === 4 ? 'primary' : 'default'" 
          @click="setOrderStatus(4)"
        >已完成</el-button>
        <el-button 
          :type="query.status === 0 ? 'primary' : 'default'" 
          @click="setOrderStatus(0)"
        >已取消</el-button>
        <el-button @click="resetQuery">重置</el-button>
        <el-input
          v-model="query.keyword"
          placeholder="输入订单号搜索"
          clearable
          style="width:220px;margin-left:8px"
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>
    </el-card>

    <el-card>
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="orderNo" label="订单号" min-width="200" show-overflow-tooltip />
        <el-table-column prop="originalAmount" label="原价" width="100">
          <template #default="{ row }">¥{{ row.originalAmount }}</template>
        </el-table-column>
        <el-table-column label="实付金额" width="100">
          <template #default="{ row }">
            <span style="color:#f56c6c;font-weight:700">¥{{ row.finalAmount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="totalQuantity" label="数量" width="70" />
        <el-table-column prop="receiverName" label="收货人" width="100" />
        <el-table-column prop="receiverPhone" label="收货人手机号" width="130" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" size="small">{{ row.statusDesc }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="下单时间" width="100">
          <template #default="{ row }">
            <div class="time-cell">
              <div>{{ formatDate(row.createdAt) }}</div>
              <div>{{ formatTime(row.createdAt) }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="完成时间" width="100">
          <template #default="{ row }">
            <div v-if="row.completeTime" class="time-cell">
              <div>{{ formatDate(row.completeTime) }}</div>
              <div>{{ formatTime(row.completeTime) }}</div>
            </div>
            <div v-else>暂未完成</div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button text type="primary" size="small" @click="showDetail(row)">详情</el-button>
            <el-button
              v-if="row.status === 2"
              text type="warning" size="small"
              @click="handleShip(row)"
            >发货</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.current"
          v-model:page-size="pagination.size"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @change="loadList"
        />
      </div>
    </el-card>

    <!-- 订单详情弹窗 -->
    <el-dialog v-model="detailVisible" title="订单详情" width="780px">
      <template v-if="currentOrder">
        <el-descriptions :column="3" border size="small">
          <el-descriptions-item label="订单号" :span="2">{{ currentOrder.orderNo }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusType(currentOrder.status)" size="small">{{ currentOrder.statusDesc }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="收货人">{{ currentOrder.receiverName }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ currentOrder.receiverPhone }}</el-descriptions-item>
          <el-descriptions-item label="下单时间">
            {{ formatDate(currentOrder.createdAt) }} {{ formatTime(currentOrder.createdAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="地址" :span="3">{{ currentOrder.address }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="3">{{ currentOrder.remark || '—' }}</el-descriptions-item>
        </el-descriptions>

        <div style="margin-top:20px">
          <p class="section-title">商品明细</p>
          <el-table :data="currentOrder.items" size="small" border stripe>
            <el-table-column prop="productName" label="商品" show-overflow-tooltip />
            <el-table-column prop="specName" label="规格" width="100">
              <template #default="{ row }">{{ row.specName || "默认" }}</template>
            </el-table-column>
            <el-table-column label="单价" width="110">
              <template #default="{ row }">
                <div class="price-stack">
                  <div v-if="row.promotionalPrice && row.promotionalPrice !== row.price" class="old-price">¥{{ row.price }}</div>
                  <div class="cur-price">¥{{ row.promotionalPrice || row.price }}</div>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="quantity" label="数量" width="60" align="center" />
            <el-table-column label="优惠明细" width="180">
              <template #default="{ row }">
                <div v-if="row.seckillName" class="discount-tag seckill">商品秒杀活动: - ¥{{ (row.price - row.seckillPrice).toFixed(2) }}</div>
                <div v-if="Number(row.promotionDiscount || 0) > 0" class="discount-tag promo">活动: -¥{{ row.promotionDiscount }}</div>
                <div v-if="Number(row.couponDiscount || 0) > 0" class="discount-tag coupon">商品券: -¥{{ row.couponDiscount }}</div>
                <div v-if="!row.seckillName && !Number(row.promotionDiscount || 0) && !Number(row.couponDiscount || 0)">无优惠</div>
              </template>
            </el-table-column>
            <el-table-column label="小计" width="100" align="right">
              <template #default="{ row }">
                <span class="row-subtotal">¥{{ row.finalAmount }}</span>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 财务汇总板块 -->
        <div class="fee-summary-box">
          <div class="fee-row">
            <span>商品原价总额：</span>
            <span class="val">¥{{ currentOrder.originalAmount }}</span>
          </div>
          <div v-if="Number(currentOrder.seckillDiscount || 0) > 0" class="fee-row seckill">
            <span>秒杀优惠金额：</span>
            <span class="val">- ¥{{ currentOrder.seckillDiscount }}</span>
          </div>
          <div v-if="Number(currentOrder.promotionTotalDiscount || 0) > 0" class="fee-row promo">
            <span>活动优惠总计：</span>
            <span class="val">- ¥{{ currentOrder.promotionTotalDiscount }}</span>
          </div>
          <div v-if="Number(currentOrder.productCouponTotalDiscount || 0) > 0" class="fee-row coupon">
            <span>商品券优惠总计：</span>
            <span class="val">- ¥{{ currentOrder.productCouponTotalDiscount }}</span>
          </div>
          <div v-if="Number(currentOrder.orderCouponDiscount || 0) > 0" class="fee-row coupon">
            <span>订单券优惠 ({{ currentOrder.orderCouponName || '优惠券' }})：</span>
            <span class="val">- ¥{{ currentOrder.orderCouponDiscount }}</span>
          </div>
          <div class="fee-divider"></div>
          <div class="fee-row final">
            <span>实付总额：</span>
            <span class="final-val">¥{{ currentOrder.finalAmount }}</span>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { orderApi } from '@/api/order'
import { usePendingCount } from '@/composables/usePendingCount'

const loading = ref(false)
const list = ref([])
const pagination = ref({ current: 1, size: 10, total: 0 })
const query = ref({ status: null, keyword: '' })
const detailVisible = ref(false)
const currentOrder = ref(null)
const { pendingCount, fetch: fetchPending, decrease: decreasePending } = usePendingCount()

const statusType = (s) => ({ 0: 'info', 1: 'warning', 2: 'primary', 3: '', 4: 'success' }[s] ?? 'info')

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toISOString().split('T')[0]
}

const formatTime = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toTimeString().split(' ')[0]
}

const loadList = async () => {
  loading.value = true
  try {
    const res = await orderApi.getPage({
      current: pagination.value.current,
      size: pagination.value.size,
      status: query.value.status ?? undefined,
      keyword: query.value.keyword || undefined
    })
    list.value = res.data.records
    pagination.value.total = res.data.total
  } finally {
    loading.value = false
  }
}

const handleSearch = () => { pagination.value.current = 1; loadList() }
const resetQuery = () => { query.value = { status: null, keyword: '' }; handleSearch() }
const setOrderStatus = (status) => { query.value.status = status; handleSearch() }

const showDetail = (row) => { currentOrder.value = row; detailVisible.value = true }

const handleShip = async (row) => {
  await ElMessageBox.confirm(`确定将订单「${row.orderNo}」标记为已发货？`, '提示', { type: 'warning' })
  await orderApi.updateStatus(row.id, 3)
  ElMessage.success('已发货')
  decreasePending()
  loadList()
}

onMounted(async () => {
  loadList()
  fetchPending()
})
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-title { font-size: 20px; color: #303133; margin: 0; }
.pagination { display: flex; justify-content: flex-end; margin-top: 16px; }
.status-buttons { display: flex; gap: 8px; align-items: center; }
.pending-badge { margin-left: 4px; }
.pending-badge :deep(.el-badge__content) { transform: translateY(-2px); }

/* 时间单元格样式 */
.time-cell {
  line-height: 1.4;
  font-size: 12px;
  color: #606266;
}

.section-title { font-weight: 600; margin-bottom: 12px; font-size: 14px; color: #303133; border-left: 4px solid #409eff; padding-left: 10px; }
.price-stack { line-height: 1.2; }
.old-price { text-decoration: line-through; color: #909399; font-size: 11px; }
.cur-price { font-weight: 500; color: #303133; }
.row-subtotal { font-weight: 600; color: #606266; }
.discount-tag { font-size: 11px; line-height: 1.4; padding: 2px 6px; border-radius: 4px; margin-bottom: 2px; }
.discount-tag.promo { background: #fdf6ec; color: #e6a23c; border: 1px solid #faecd8; }
.discount-tag.coupon { background: #f5f0ff; color: #7d56f6; border: 1px solid #e9e0ff; }
.discount-tag.seckill { background: #fef0f0; color: #f56c6c; border: 1px solid #fde2e2; }

/* 费用汇总样式 */
.fee-summary-box { background: #f9f9f9; padding: 16px; border-radius: 8px; margin-top: 20px; border: 1px solid #ebeef5; }
.fee-row { display: flex; justify-content: space-between; font-size: 13px; color: #606266; margin-bottom: 8px; }
.fee-row.promo { color: #e6a23c; }
.fee-row.coupon { color: #704df3; }
.fee-row.seckill { color: #f56c6c; }
.fee-divider { height: 1px; background: #e4e7ed; margin: 12px 0; }
.fee-row.final { align-items: center; color: #303133; margin-bottom: 0; }
.final-val { font-size: 22px; font-weight: 700; color: #f56c6c; }
</style>
