<template>
  <div class="points-mall-container">
    <div class="page-header">
      <h2 class="page-title">积分商城管理</h2>
      <el-button type="primary" :icon="Plus" @click="handleAdd">新增兑换项</el-button>
    </div>

    <el-card style="margin-bottom: 16px">
      <el-form :model="query" inline>
        <el-form-item label="券名称">
          <el-input v-model="query.keyword" placeholder="请输入名称" clearable style="width: 200px" @keyup.enter="loadList" />
        </el-form-item>
        <el-form-item label="优惠方式">
          <el-select v-model="query.discountType" placeholder="全部方式" clearable style="width: 140px" @change="loadList">
            <el-option label="折扣" :value="2" />
            <el-option label="无门槛" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部状态" clearable style="width: 140px" @change="loadList">
            <el-option label="上架" :value="1" />
            <el-option label="下架" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="loadList">搜索</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card>
      <el-table :data="list" v-loading="loading" stripe border>
        <el-table-column prop="id" label="ID" width="60" align="center" />
        <el-table-column prop="couponName" label="券名称" min-width="150" show-overflow-tooltip />
        <el-table-column label="优惠方式" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="discountTypeTag(row.discountType)" size="small">
              {{ discountTypeLabel(row.discountType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="优惠内容" width="100" align="center">
          <template #default="{ row }">
            {{ formatDiscountContent(row) }}
          </template>
        </el-table-column>
        <el-table-column prop="pointsCost" label="所需积分" width="85" align="center" />
        <el-table-column label="每人限领" width="90" align="center">
          <template #default="{ row }">
            {{ row.perLimit === -1 ? '不限' : row.perLimit + '张' }}
          </template>
        </el-table-column>
        <el-table-column prop="validDays" label="有效天数" width="85" align="center">
          <template #default="{ row }">
            {{ row.validDays }}天
          </template>
        </el-table-column>
        <el-table-column label="剩余库存" width="85" align="center">
          <template #default="{ row }">
            <el-tag :type="row.remained === 0 ? 'danger' : 'info'" size="small">
              {{ row.total === -1 ? '不限量' : row.remained }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="已领取" width="80" align="center">
          <template #default="{ row }">
            {{ row.total === -1 ? '-' : row.total - row.remained }}
          </template>
        </el-table-column>
        <el-table-column prop="receiveEnd" label="领取截止" width="135" align="center">
          <template #default="{ row }">
            {{ formatTime(row.receiveEnd) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="70" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
              {{ row.status === 1 ? '上架' : '下架' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="190" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              link
              :type="row.status === 1 ? 'warning' : 'success'"
              @click="handleToggleStatus(row)"
            >
              {{ row.status === 1 ? '下架' : '上架' }}
            </el-button>
            <el-button link type="primary" @click="handleEditPoints(row)">编辑积分</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      title="新增兑换项"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="选择订单券" prop="couponId">
          <div class="coupon-select">
            <el-button v-if="!form.couponId" type="primary" @click="openCouponSelector">选择订单券</el-button>
            <div v-else class="selected-coupon">
              <el-tag closable @close="clearSelectedCoupon">{{ selectedCouponName }}</el-tag>
              <el-button link type="primary" @click="openCouponSelector">重新选择</el-button>
            </div>
          </div>
        </el-form-item>
        <el-form-item label="所需积分" prop="pointsCost">
          <el-input-number v-model="form.pointsCost" :min="1" :step="1" style="width: 100%" />
        </el-form-item>

      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">提交</el-button>
      </template>
    </el-dialog>

    <!-- 订单券选择器组件 -->
    <order-coupon-selector ref="couponSelectorRef" @select="handleCouponSelect" @empty="handleCouponEmpty" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { pointsMallApi } from '@/api/pointsMall'
import OrderCouponSelector from '@/components/OrderCouponSelector.vue'

const router = useRouter()

const loading = ref(false)
const list = ref([])
const query = reactive({
  status: null,
  keyword: '',
  discountType: null
})

const dialogVisible = ref(false)
const submitting = ref(false)
const formRef = ref(null)
const couponSelectorRef = ref(null)
const selectedCouponName = ref('')

const form = reactive({
  couponId: null,
  pointsCost: 1
})

const rules = {
  couponId: [{ required: true, message: '请选择订单券', trigger: 'change' }],
  pointsCost: [{ required: true, message: '请输入所需积分', trigger: 'blur' }]
}

const discountTypeLabel = (type) => {
  const labels = { 1: '满减', 2: '折扣', 3: '无门槛' }
  return labels[type] || '未知'
}

const discountTypeTag = (type) => {
  const tags = { 1: 'warning', 2: 'success', 3: 'info' }
  return tags[type] || 'info'
}

const formatDiscountContent = (row) => {
  if (row.discountType === 2) {
    return `${(row.discountRate * 10).toFixed(1)}折`
  } else if (row.discountType === 3 || row.discountType === 1) {
    return `减${row.discountAmount}元`
  }
  return '-'
}

const formatTime = (time) => {
  if (!time) return '-'
  return time.replace('T', ' ').slice(0, 16)
}

const loadList = async () => {
  loading.value = true
  try {
    const res = await pointsMallApi.getPage({
      status: query.status ?? undefined,
      keyword: query.keyword || undefined,
      discountType: query.discountType ?? undefined
    })
    list.value = res.data
  } catch (err) {
    ElMessage.error('获取列表失败')
  } finally {
    loading.value = false
  }
}

const resetQuery = () => {
  query.status = null
  query.keyword = ''
  query.discountType = null
  loadList()
}

const handleAdd = () => {
  dialogVisible.value = true
  selectedCouponName.value = ''
  Object.assign(form, {
    couponId: null,
    pointsCost: 1
  })
}

const openCouponSelector = () => {
  couponSelectorRef.value.open()
}

const handleCouponSelect = (coupon) => {
  form.couponId = coupon.id
  selectedCouponName.value = coupon.name
}

const handleCouponEmpty = () => {
  // 现在 OrderCouponSelector 内部会直接显示带提示的空状态表格，无需在此弹出额外对话框
  console.log('订单券列表为空')
}

const clearSelectedCoupon = () => {
  form.couponId = null
  selectedCouponName.value = ''
}

const handleToggleStatus = async (row) => {
  const newStatus = row.status === 1 ? 2 : 1
  const actionText = newStatus === 1 ? '上架' : '下架'
  try {
    await ElMessageBox.confirm(`确定要${actionText}该兑换项吗？`, '提示', {
      type: 'warning'
    })
    await pointsMallApi.updateStatus(row.id, newStatus)
    ElMessage.success(`${actionText}成功`)
    loadList()
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error(`${actionText}失败`)
    }
  }
}

const handleEditPoints = async (row) => {
  try {
    const { value } = await ElMessageBox.prompt('请输入新的所需积分', '修改积分', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPattern: /^[1-9]\d*$/,
      inputErrorMessage: '请输入大于 0 的整数',
      inputValue: row.pointsCost.toString()
    })
    if (value) {
      await pointsMallApi.updatePointsCost(row.id, parseInt(value))
      ElMessage.success('积分修改成功')
      loadList()
    }
  } catch (err) {
    //取消操作
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该兑换项吗？删除后不可恢复', '警告', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'danger'
    })
    await pointsMallApi.deleteItem(row.id)
    ElMessage.success('删除成功')
    loadList()
  } catch (err) {
    //取消操作
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate()
  
  submitting.value = true
  try {
    await pointsMallApi.create(form)
    ElMessage.success('创建成功')
    dialogVisible.value = false
    loadList()
  } catch (err) {
    ElMessage.error('创建失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadList()
})
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: 500;
}
.item-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}
.coupon-select {
  display: flex;
  align-items: center;
}
.selected-coupon {
  display: flex;
  align-items: center;
  gap: 10px;
}
</style>
