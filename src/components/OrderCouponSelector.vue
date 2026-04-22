<template>
  <el-dialog v-model="visible" title="选择订单券" width="900px" append-to-body>
    <div class="selector-filter">
      <el-form :model="query" inline>
        <el-form-item label="券名称">
          <el-input
            v-model="query.keyWord"
            placeholder="请输入券名称"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="优惠方式">
          <el-select
            v-model="query.discountType"
            placeholder="全部方式"
            clearable
            style="width: 140px"
            @change="handleSearch"
          >
            <el-option label="折扣" :value="2" />
            <el-option label="无门槛" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button type="warning" @click="goToAddCoupon">添加订单券</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-table 
      v-loading="loading" 
      :data="list" 
      height="450px" 
      stripe 
      border 
      size="small"
      empty-text="当前没有任何无领取渠道的订单券,请点击'添加订单券'去添加"
    >
      <el-table-column prop="id" label="ID" width="60" align="center" />
      <el-table-column prop="name" label="订单券名称" min-width="150" show-overflow-tooltip />
      <el-table-column label="优惠方式" width="90" align="center">
        <template #default="{ row }">
          <el-tag :type="row.discountType === 2 ? 'success' : 'info'" size="small">
            {{ row.discountType === 2 ? '折扣' : '无门槛' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="优惠内容" width="80">
        <template #default="{ row }">
          <span>{{ formatDiscountContent(row) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="发放/剩余" width="100" align="center">
        <template #default="{ row }">
          <span>{{ row.total === -1 ? '不限量' : row.total }} / {{ row.total === -1 ? '-' : row.remained }}</span>
        </template>
      </el-table-column>
      <el-table-column label="领取时间" min-width="140">
        <template #default="{ row }">
          <div class="time-range">
            <div>{{ formatTime(row.receiveStart) }}</div>
            <div>至 {{ formatTime(row.receiveEnd) }}</div>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="validDays" label="有效天数" width="70" align="center">
        <template #default="{ row }">
          {{ row.validDays }}天
        </template>
      </el-table-column>
      <el-table-column prop="perLimit" label="每人限领" width="80" align="center">
        <template #default="{ row }">
          {{ row.perLimit }}张
        </template>
      </el-table-column>
      <el-table-column label="操作" width="80" align="center" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="handleSelect(row)">选择</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination">
      <el-pagination
        v-model:current-page="query.current"
        v-model:page-size="query.size"
        :total="total"
        layout="total, prev, pager, next"
        @current-change="loadData"
      />
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { Search } from '@element-plus/icons-vue'
import { couponApi } from '@/api/coupon'
import { ElMessage } from 'element-plus'

const emit = defineEmits(['select'])
const router = useRouter()

const visible = ref(false)
const loading = ref(false)
const list = ref([])
const total = ref(0)

const query = reactive({
  current: 1,
  size: 10,
  keyWord: '',
  discountType: null,
  noReceiveChannel: true
})

const formatTime = (time) => {
  if (!time) return '-'
  return time.replace('T', ' ').slice(0, 16)
}

const formatDiscountContent = (row) => {
  if (row.discountType === 2) {
    return `${(row.discountRate * 10).toFixed(1)}折`
  } else if (row.discountType === 3) {
    return `减${row.discountAmount}元`
  }
  return '-'
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await couponApi.getPage({
      current: query.current,
      size: query.size,
      name: query.keyWord || undefined,
      discountType: query.discountType ?? undefined,
      couponType: 2, // 只需要订单券
      noReceiveChannel: query.noReceiveChannel
    })
    list.value = res.data.records
    total.value = res.data.total
  } catch (err) {
    ElMessage.error('获取订单券列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  query.current = 1
  loadData()
}

const handleSelect = (row) => {
  emit('select', row)
  visible.value = false
}

const goToAddCoupon = () => {
  visible.value = false
  router.push('/coupon?action=add&couponType=2')
}

const open = async () => {
  query.current = 1
  query.keyWord = ''
  query.discountType = null
  
  visible.value = true // 直接打开弹窗
  loading.value = true
  try {
    const res = await couponApi.getPage({
      current: query.current,
      size: query.size,
      couponType: 2, // 只需要订单券
      noReceiveChannel: query.noReceiveChannel
    })
    list.value = res.data.records
    total.value = res.data.total
    
    if (total.value === 0) {
      emit('empty')
    }
  } catch (err) {
    ElMessage.error('获取订单券列表失败')
  } finally {
    loading.value = false
  }
}

defineExpose({ open })
</script>

<style scoped>
.selector-filter {
  margin-bottom: 10px;
}
.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
.time-range {
  font-size: 12px;
  line-height: 1.4;
  color: #606266;
}
</style>
