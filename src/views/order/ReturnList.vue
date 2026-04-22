<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">售后管理</h2>
    </div>

    <!-- 状态筛选 -->
    <el-card style="margin-bottom:16px">
      <div class="status-buttons">
        <el-button 
          :type="query.status === null ? 'primary' : 'default'" 
          @click="setReturnStatus(null)"
        >全部</el-button>
        <el-button 
          :type="query.status === 0 ? 'primary' : 'default'" 
          @click="setReturnStatus(0)"
        >
          申请中
          <el-badge :value="applyCount" :hidden="!applyCount" class="status-badge" />
        </el-button>
        <el-button 
          :type="query.status === 1 ? 'primary' : 'default'" 
          @click="setReturnStatus(1)"
        >
          已批准
          <el-badge :value="approvedCount" :hidden="!approvedCount" class="status-badge" />
        </el-button>
        <el-button 
          :type="query.status === 2 ? 'primary' : 'default'" 
          @click="setReturnStatus(2)"
        >已拒绝</el-button>
        <el-button 
          :type="query.status === 3 ? 'primary' : 'default'" 
          @click="setReturnStatus(3)"
        >退款中</el-button>
        <el-button 
          :type="query.status === 4 ? 'primary' : 'default'" 
          @click="setReturnStatus(4)"
        >已退款</el-button>
        <el-button 
          :type="query.status === 5 ? 'primary' : 'default'" 
          @click="setReturnStatus(5)"
        >已取消</el-button>
        <el-button @click="resetQuery">重置</el-button>
      </div>
    </el-card>

    <el-card>
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="orderNo" label="订单号" width="200" show-overflow-tooltip />
        <el-table-column prop="productName" label="商品名称" min-width="120" show-overflow-tooltip />
        <el-table-column prop="quantity" label="数量" width="80" />
        <el-table-column prop="expectedRefundAmount" label="用户期望退额" width="110">
          <template #default="{ row }">¥{{ row.expectedRefundAmount }}</template>
        </el-table-column>
        <el-table-column prop="actualRefundAmount" label="实际退额" width="100">
          <template #default="{ row }">
            <template v-if="row.actualRefundAmount !== null && row.actualRefundAmount !== undefined">¥{{ row.actualRefundAmount }}</template>
            <span v-else style="color: #909399; font-size: 12px;">暂未退款</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="120" header-align="center" align="center">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" size="small" style="display: inline-block; vertical-align: middle; padding: 4px 8px; white-space: normal;">
              <template v-if="row.statusDesc === '退货已批准'">
                <div style="line-height: 16px;">退货已批准</div>
              </template>
              <template v-else>
                {{ row.statusDesc || statusText(row.status) }}
              </template>
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="申请时间" width="120">
          <template #default="{ row }">
            <div>{{ row.createdAt?.split('T')[0] }}</div>
            <div>{{ row.createdAt?.split('T')[1] }}</div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button text type="primary" size="small" @click="showDetail(row)">详情</el-button>
              <template v-if="row.status === 0">
                <el-button text type="success" size="small" @click="handleApprove(row)">批准</el-button>
                <el-button text type="danger" size="small" @click="handleReject(row)">拒绝</el-button>
              </template>
              <el-button 
                v-if="row.status === 1 || row.status === 3"
                text type="warning" size="small"
                @click="handleRefund(row)"
              >确认收货并退款</el-button>
            </div>
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

    <!-- 退货详情弹窗 -->
    <el-dialog v-model="detailVisible" title="退货详情" width="600px">
      <template v-if="currentReturn">
        <el-descriptions :column="2" border size="small" v-loading="detailLoading">
          <el-descriptions-item label="退货ID">{{ currentReturn.id || '—' }}</el-descriptions-item>
          <el-descriptions-item label="订单号">{{ currentReturn.orderNo }}</el-descriptions-item>
          
          <el-descriptions-item label="商品信息" :span="2">
            <div v-if="currentReturn.orderItemVO" style="display: flex; align-items: center; gap: 12px;">
              <el-image :src="currentReturn.orderItemVO.coverUrl" style="width: 48px; height: 48px; border-radius: 4px;" fit="cover" />
              <div>
                <div style="font-weight: 600;">{{ currentReturn.orderItemVO.productName }}</div>
                <div style="font-size: 12px; color: #909399;">规格：{{ currentReturn.orderItemVO.specName || '默认' }}</div>
              </div>
            </div>
          </el-descriptions-item>

          <el-descriptions-item label="商品数量">{{ currentReturn.orderItemVO?.quantity || '—' }}</el-descriptions-item>
          <el-descriptions-item label="当前状态">
            <el-tag :type="statusType(currentReturn.status)" size="small">{{ currentReturn.statusDesc || statusText(currentReturn.status) }}</el-tag>
          </el-descriptions-item>

          <el-descriptions-item label="期望退款">¥{{ currentReturn.expectedRefundAmount }}</el-descriptions-item>
          <el-descriptions-item label="实际退额">
            <template v-if="currentReturn.actualRefundAmount !== null && currentReturn.actualRefundAmount !== undefined">¥{{ currentReturn.actualRefundAmount }}</template>
            <span v-else style="color: #909399;">暂未退款</span>
          </el-descriptions-item>
          
          <el-descriptions-item label="申请时间" :span="2">{{ currentReturn.createdAt }}</el-descriptions-item>
          <el-descriptions-item label="申请原因" :span="2">{{ currentReturn.reason || '—' }}</el-descriptions-item>
          <el-descriptions-item v-if="currentReturn.status === 2 || currentReturn.statusDesc === '退货已拒绝'" label="拒绝原因" :span="2">{{ currentReturn.rejectReason || '—' }}</el-descriptions-item>
        </el-descriptions>

        <!-- 申请图片 -->
        <div style="margin-top: 20px;">
          <p style="font-weight: 600; margin-bottom: 10px; font-size: 14px;">申请图片</p>
          <div v-if="hasValidImages()" style="display: flex; gap: 12px; flex-wrap: wrap;">
            <template v-for="(image, index) in getValidImages()" :key="index">
              <el-image
                :src="image"
                :preview-src-list="getValidImages()"
                :initial-index="index"
                fit="cover"
                style="width: 120px; height: 120px; border-radius: 4px;"
              >
                <template #error>
                  <div style="width:120px;height:120px;background:#f5f7fa;display:flex;align-items:center;justify-content:center;font-size:11px;color:#c0c4cc;border-radius:4px;">加载失败</div>
                </template>
              </el-image>
            </template>
          </div>
          <div v-else style="color: #909399; font-size: 13px; padding: 5px 0;">无</div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { returnApi } from '@/api/return'
import { useReturnCount } from '@/composables/useReturnCount'

const loading = ref(false)
const detailLoading = ref(false)
const list = ref([])
const pagination = ref({ current: 1, size: 10, total: 0 })
const query = ref({ status: null })
const detailVisible = ref(false)
const currentReturn = ref(null)
const { applyCount, approvedCount, fetch: fetchReturnCount, decreaseApply, decreaseApproved, increaseApproved } = useReturnCount()

const statusType = (s) => ({
  0: 'warning',
  1: 'primary',
  2: 'danger',
  3: 'info',
  4: 'success',
  5: 'info'
}[s] ?? 'info')

const statusText = (s) => ({
  0: '申请中',
  1: '已批准',
  2: '已拒绝',
  3: '退款中',
  4: '已退款',
  5: '已取消'
}[s] ?? '未知')

const loadList = async () => {
  loading.value = true
  try {
    const res = await returnApi.getPage({
      current: pagination.value.current,
      size: pagination.value.size,
      status: query.value.status ?? undefined
    })
    list.value = res.data.records
    pagination.value.total = res.data.total
  } finally {
    loading.value = false
  }
}

const handleSearch = () => { pagination.value.current = 1; loadList() }
const resetQuery = () => { query.value = { status: null }; handleSearch() }
const setReturnStatus = (status) => { query.value.status = status; handleSearch() }

const showDetail = async (row) => { 
  currentReturn.value = row
  detailVisible.value = true 
  detailLoading.value = true
  try {
    const res = await returnApi.getDetail(row.id)
    currentReturn.value = res.data
  } catch (error) {
    ElMessage.error('获取退货详情失败')
  } finally {
    detailLoading.value = false
  }
}

// 检查是否有有效图片
const hasValidImages = () => {
  return getValidImages().length > 0
}

// 获取有效图片数组
const getValidImages = () => {
  if (!currentReturn.value || !currentReturn.value.images) return []
  
  let imgs = currentReturn.value.images
  if (typeof imgs === 'string') {
    imgs = imgs.split(',')
  }
  
  // 过滤掉空值及仅含空格的项
  return Array.isArray(imgs) ? imgs.filter(img => img && String(img).trim() !== '') : []
}

const handleApprove = async (row) => {
  const { value: actualRefundAmount } = await ElMessageBox.prompt(
    `请输入要实际退款的金额（${row.productName}×${row.quantity}）`,
    '批准退货申请',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPattern: /^\d+(\.\d{1,2})?$/,
      inputErrorMessage: '请输入有效的金额（最多两位小数）',
      inputValue: row.expectedRefundAmount?.toString() || '',
      customClass: 'centered-title',
      beforeClose: (action, instance, done) => {
        if (action === 'confirm') {
          const value = parseFloat(instance.inputValue)
          if (value > row.expectedRefundAmount) {
            ElMessage.error('退款金额不能超过原退款金额')
            return
          }
        }
        done()
      }
    }
  )
  await returnApi.audit(row.id, 1, null, parseFloat(actualRefundAmount))
  ElMessage.success('已批准')
  decreaseApply()
  increaseApproved()
  loadList()
}

const handleReject = async (row) => {
  const { value: rejectReason } = await ElMessageBox.prompt(
    `请输入拒绝原因（${row.productName}×${row.quantity}）`,
    '拒绝退货申请',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPattern: /\S+/,
      inputErrorMessage: '拒绝原因不能为空',
      customClass: 'centered-title'
    }
  )
  await returnApi.audit(row.id, 2, rejectReason)
  ElMessage.success('已拒绝')
  decreaseApply()
  loadList()
}

const handleRefund = async (row) => {
  await ElMessageBox.confirm(`确定确认收货并退款「${row.productName}×${row.quantity}」？`, '提示', { type: 'warning' })
  await returnApi.refund(row.id)
  ElMessage.success('已退款')
  if (row.status === 1) decreaseApproved()
  loadList()
}

onMounted(() => {
  loadList()
  fetchReturnCount()
})
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-title { font-size: 20px; color: #303133; margin: 0; }
.pagination { display: flex; justify-content: flex-end; margin-top: 16px; }
.status-buttons { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.status-badge { margin-left: 4px; }
.status-badge :deep(.el-badge__content) { transform: translateY(-2px); }
.action-buttons { display: flex; gap: 4px; flex-wrap: nowrap; }
:deep(.centered-title .el-message-box__title) { text-align: center; }
</style>