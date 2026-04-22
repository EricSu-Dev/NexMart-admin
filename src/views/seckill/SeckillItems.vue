<template>
  <div class="seckill-items-container">
    <!-- 顶部 -->
    <div class="page-header">
      <h2 class="page-title">秒杀项管理</h2>
    </div>

    <!-- 商品列表 -->
    <el-card class="list-card">
      <template #header>
        <div class="card-header">
          <div class="filter-section">
            <span>秒杀商品</span>
            <el-select v-model="productFilter.activityId" placeholder="选择活动" clearable style="width: 180px; margin-left: 10px" @change="loadProductList">
              <el-option v-for="activity in productActivities" :key="activity.value" :label="activity.label" :value="activity.value" />
            </el-select>
            <el-checkbox v-model="productFilter.onlyUnbound" @change="loadProductList" style="margin-left: 10px">只看未绑定</el-checkbox>
          </div>
          <el-button type="primary" :icon="Plus" @click="openAddProductDialog">添加商品</el-button>
        </div>
      </template>
      <el-table :data="productList" v-loading="productLoading" stripe border>
        <el-table-column prop="id" label="ID" width="60" align="center" />
        <el-table-column label="商品名称" min-width="200">
          <template #default="{ row }">
            <div class="product-info">
              <el-image 
                :src="row.productImage" 
                fit="cover"
                class="product-thumb"
                :preview-teleported="true"
              />
              <span class="product-name">{{ row.productName }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="商品规格" width="100" align="center">
          <template #default="{ row }">
            {{ row.specName || '无' }}
          </template>
        </el-table-column>
        <el-table-column label="活动名称" min-width="100" align="center">
          <template #default="{ row }">
            {{ row.activityName || '未绑定' }}
          </template>
        </el-table-column>
        <el-table-column label="原价" width="100" align="center">
          <template #default="{ row }">
            ¥{{ row.originalPrice }}
          </template>
        </el-table-column>
        <el-table-column label="秒杀价" width="90" align="center">
          <template #default="{ row }">
            <span class="seckill-price">¥{{ row.seckillPrice }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="seckillStock" label="秒杀库存" width="60" align="center" />
        <el-table-column prop="soldCount" label="已售数量" width="60" align="center" />
        <el-table-column prop="perLimit" label="每人限购" width="60" align="center" />
        <el-table-column label="状态" width="70" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
              {{ row.status === 1 ? '上架' : '下架' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" align="center" fixed="right">
          <template #default="{ row }">
            <el-button 
              link 
              :type="row.status === 1 ? 'warning' : 'success'" 
              @click="handleToggleStatus(row, 1)"
            >
              {{ row.status === 1 ? '下架' : '上架' }}
            </el-button>
            <el-button 
              link 
              type="primary" 
              @click="openEditProductDialog(row)"
            >
              修改
            </el-button>
            <el-popconfirm
              title="确定删除该秒杀项吗？"
              confirm-button-text="确定"
              cancel-button-text="取消"
              @confirm="handleDelete(row)"
            >
              <template #reference>
                <el-button link type="danger">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination">
        <el-pagination
          v-model:current-page="productPagination.current"
          v-model:page-size="productPagination.size"
          :total="productPagination.total"
          :page-sizes="[5, 10, 20]"
          layout="total, sizes, prev, pager, next"
          @change="loadProductList"
        />
      </div>
    </el-card>

    <!-- 订单券列表 -->
    <el-card class="list-card">
      <template #header>
        <div class="card-header">
          <div class="filter-section">
            <span>秒杀订单券</span>
            <el-select v-model="couponFilter.activityId" placeholder="选择活动" clearable style="width: 180px; margin-left: 10px" @change="loadCouponList">
              <el-option v-for="activity in couponActivities" :key="activity.value" :label="activity.label" :value="activity.value" />
            </el-select>
            <el-checkbox v-model="couponFilter.onlyUnbound" @change="loadCouponList" style="margin-left: 10px">只看未绑定</el-checkbox>
          </div>
          <el-button type="warning" :icon="Ticket" @click="openAddCouponDialog">添加订单券</el-button>
        </div>
      </template>
      <el-table :data="couponList" v-loading="couponLoading" stripe border>
        <el-table-column prop="id" label="ID" width="60" align="center" />
        <el-table-column label="券名称" min-width="200">
          <template #default="{ row }">
            <span class="coupon-name">{{ row.couponName }}</span>
          </template>
        </el-table-column>
        <el-table-column label="活动名称" min-width="140" align="center">
          <template #default="{ row }">
            {{ row.activityName || '未绑定' }}
          </template>
        </el-table-column>
        <el-table-column label="优惠内容" width="120" align="center">
          <template #default="{ row }">
            {{ formatCouponDetail(row) }}
          </template>
        </el-table-column>
        <el-table-column prop="couponRemained" label="秒杀库存" width="90" align="center" />
        <el-table-column label="已售数量" width="90" align="center">
          <template #default="{ row }">
            {{ (row.couponTotal || 0) - (row.couponRemained || 0) }}
          </template>
        </el-table-column>
        <el-table-column prop="couponPerLimit" label="每人限购" width="90" align="center" />
        <el-table-column label="领取时间" width="160" align="center">
          <template #default="{ row }">
            <div style="line-height: 1.4">
              <div>{{ formatTime(row.couponReceiveStart) }}</div>
              <div>~ {{ formatTime(row.couponReceiveEnd) }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
              {{ row.status === 1 ? '上架' : '下架' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" align="center" fixed="right">
          <template #default="{ row }">
            <el-button 
              link 
              :type="row.status === 1 ? 'warning' : 'success'" 
              @click="handleToggleStatus(row, 2)"
            >
              {{ row.status === 1 ? '下架' : '上架' }}
            </el-button>
            <el-popconfirm
              title="确定删除该秒杀项吗？"
              confirm-button-text="确定"
              cancel-button-text="取消"
              @confirm="handleDelete(row)"
            >
              <template #reference>
                <el-button link type="danger">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination">
        <el-pagination
          v-model:current-page="couponPagination.current"
          v-model:page-size="couponPagination.size"
          :total="couponPagination.total"
          :page-sizes="[5, 10, 20]"
          layout="total, sizes, prev, pager, next"
          @change="loadCouponList"
        />
      </div>
    </el-card>

    <!-- 添加商品弹窗 -->
    <el-dialog
      v-model="productDialogVisible"
      :title="isEditProduct ? '修改商品' : '添加商品'"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form ref="productFormRef" :model="productForm" :rules="productRules" label-width="100px">
        <el-form-item label="选择商品" prop="productId" v-if="!isEditProduct">
          <div class="product-select-area">
            <div v-if="productForm.productId" class="selected-product">
              <el-tag type="success" closable @close="clearProduct">{{ selectedProductName || '商品ID: ' + productForm.productId }}</el-tag>
            </div>
            <el-button type="primary" plain size="small" @click="openProductSelector">{{ productForm.productId ? '更换商品' : '选择商品' }}</el-button>
          </div>
        </el-form-item>
        <el-form-item label="商品名称" v-else>
          <el-input v-model="selectedProductName" disabled />
        </el-form-item>
        <el-form-item label="秒杀价" prop="seckillPrice">
          <el-input-number 
            v-model="productForm.seckillPrice" 
            :min="0.01" 
            :precision="2" 
            :step="1"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="秒杀库存" prop="seckillStock" v-if="!isEditProduct">
          <el-input-number 
            v-model="productForm.seckillStock" 
            :min="1" 
            :step="1"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="每人限购" prop="perLimit">
          <el-input-number 
            v-model="productForm.perLimit" 
            :min="1" 
            :step="1"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="选择规格" prop="productSpecId" v-if="!isEditProduct && selectedProduct && selectedProduct.hasSpec === 1">
          <el-select v-model="productForm.productSpecId" placeholder="请选择规格" style="width: 100%" :loading="specLoading">
            <el-option v-for="spec in productSpecs" :key="spec.id" :label="spec.specName" :value="spec.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="productDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="isEditProduct ? handleEditProduct() : handleAddProduct()">确定</el-button>
      </template>
    </el-dialog>

    <!-- 商品选择组件 -->
    <product-selector ref="productSelectorRef" @select="handleProductSelect" @add="openProductDialogFromSelector" />



    <!-- 订单券选择器 -->
    <order-coupon-selector ref="couponSelectorRef" @select="handleCouponSelect" @empty="handleCouponEmpty" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Plus, Ticket } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'
import OrderCouponSelector from '@/components/OrderCouponSelector.vue'
import ProductSelector from '@/components/ProductSelector.vue'

const router = useRouter()
const route = useRoute()

// 商品列表
const productLoading = ref(false)
const productList = ref([])
const productPagination = reactive({
  current: 1,
  size: 5,
  total: 0
})

// 订单券列表
const couponLoading = ref(false)
const couponList = ref([])
const couponPagination = reactive({
  current: 1,
  size: 5,
  total: 0
})

// 活动筛选相关
const productActivities = ref([])
const couponActivities = ref([])
const productActivityLoading = ref(false)
const couponActivityLoading = ref(false)

// 筛选条件
const productFilter = reactive({
  activityId: null,
  onlyUnbound: false
})

const couponFilter = reactive({
  activityId: null,
  onlyUnbound: false
})

// 添加商品弹窗
const productDialogVisible = ref(false)
const isEditProduct = ref(false)
const currentEditId = ref(null)
const productFormRef = ref(null)
const productForm = reactive({
  productId: '',
  productSpecId: null,
  seckillPrice: null,
  seckillStock: null,
  perLimit: 1
})
const productSelectorRef = ref(null)
const selectedProductName = ref('')
const selectedProduct = ref(null)
const productSpecs = ref([])
const specLoading = ref(false)

const couponSelectorRef = ref(null)
const submitting = ref(false)

const productRules = {
  productId: [{ required: true, message: '请输入商品ID', trigger: 'blur' }],
  productSpecId: [
    {
      required: (rule, value, callback) => {
        if (selectedProduct && selectedProduct.hasSpec === 1 && !value) {
          callback(new Error('请选择规格'))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ],
  seckillPrice: [{ required: true, message: '请输入秒杀价', trigger: 'blur' }],
  seckillStock: [{ required: true, message: '请输入秒杀库存', trigger: 'blur' }],
  perLimit: [{ required: true, message: '请输入每人限购数', trigger: 'blur' }]
}



const formatTime = (time) => {
  if (!time) return '-'
  return time.replace('T', ' ').slice(0, 16)
}

const formatCouponDetail = (row) => {
  if (row.couponDiscountType === 3) {
    return `无门槛 ${row.couponDiscountAmount}元`
  } else if (row.couponDiscountType === 2) {
    return `折扣 ${(row.couponDiscountRate * 10).toFixed(1)}折`
  }
  return '-'
}

// 获取活动名称
const getActivityNames = async (activityType, targetList, loadingRef) => {
  loadingRef.value = true
  try {
    const res = await request.get('/admin/seckill/activity/activity/name', {
      params: { activityType }
    })
    if (res.data) {
      // 将Map转换为下拉框选项格式
      targetList.value = Object.entries(res.data).map(([id, name]) => ({
        value: parseInt(id),
        label: name
      }))
    }
  } catch (err) {
    console.error('获取活动名称失败:', err)
  } finally {
    loadingRef.value = false
  }
}

// 获取商品活动
const loadProductActivities = () => {
  getActivityNames(1, productActivities, productActivityLoading)
}

// 获取订单券活动
const loadCouponActivities = () => {
  getActivityNames(2, couponActivities, couponActivityLoading)
}

const loadProductList = async () => {
  productLoading.value = true
  try {
    const res = await request.get('/admin/seckill/item/product/list', {
      params: {
        current: productPagination.current,
        size: productPagination.size,
        onlyUnbound: productFilter.onlyUnbound,
        activityId: productFilter.activityId || undefined
      }
    })
    const data = res.data || {}
    productList.value = data.records || []
    productPagination.total = data.total || 0
  } catch (err) {
    console.error('加载商品列表失败:', err)
  } finally {
    productLoading.value = false
  }
}

const loadCouponList = async () => {
  couponLoading.value = true
  try {
    const res = await request.get('/admin/seckill/item/coupon/list', {
      params: {
        current: couponPagination.current,
        size: couponPagination.size,
        onlyUnbound: couponFilter.onlyUnbound,
        activityId: couponFilter.activityId || undefined
      }
    })
    const data = res.data || {}
    couponList.value = data.records || []
    couponPagination.total = data.total || 0
  } catch (err) {
    console.error('加载订单券列表失败:', err)
  } finally {
    couponLoading.value = false
  }
}

const handleToggleStatus = async (row, itemType) => {
  const newStatus = row.status === 1 ? 2 : 1
  const actionText = newStatus === 1 ? '上架' : '下架'
  try {
    await request.patch(`/admin/seckill/item/${row.id}/status`, null, {
      params: { status: newStatus }
    })
    ElMessage.success(`${actionText}成功`)
    // 刷新对应列表
    if (itemType === 1) {
      loadProductList()
    } else {
      loadCouponList()
    }
  } catch (err) {
    console.error(`${actionText}失败:`, err)
  }
}

const handleDelete = async (row) => {
  try {
    await request.delete(`/admin/seckill/item/${row.id}`)
    ElMessage.success('删除成功')
    // 刷新两个列表
    loadProductList()
    loadCouponList()
  } catch (err) {
    console.error('删除失败:', err)
  }
}

const openAddProductDialog = () => {
  isEditProduct.value = false
  productDialogVisible.value = true
  Object.assign(productForm, {
    productId: '',
    seckillPrice: null,
    seckillStock: null,
    perLimit: 1
  })
  selectedProductName.value = ''
}

const openEditProductDialog = (row) => {
  isEditProduct.value = true
  currentEditId.value = row.id
  productDialogVisible.value = true
  Object.assign(productForm, {
    productId: row.productId,
    seckillPrice: row.seckillPrice,
    perLimit: row.perLimit
  })
  selectedProductName.value = row.productName
}

const openProductSelector = () => {
  productSelectorRef.value.open()
}

const handleProductSelect = async (product) => {
  productForm.productId = product.id
  productForm.productSpecId = null
  selectedProductName.value = product.name
  selectedProduct.value = product
  
  // 检查商品是否有规格
  if (product.hasSpec === 1) {
    // 加载商品规格
    await loadProductSpecs(product.id)
  } else {
    // 无规格，清空规格列表
    productSpecs.value = []
  }
}

const loadProductSpecs = async (productId) => {
  specLoading.value = true
  try {
    const res = await request.get(`/admin/seckill/item/spec/${productId}`)
    if (res.data) {
      // 将Map转换为下拉框选项格式
      productSpecs.value = Object.entries(res.data).map(([id, name]) => ({
        id: parseInt(id),
        specName: name
      }))
    } else {
      productSpecs.value = []
    }
  } catch (err) {
    console.error('加载商品规格失败:', err)
    productSpecs.value = []
  } finally {
    specLoading.value = false
  }
}

const clearProduct = () => {
  productForm.productId = ''
  productForm.productSpecId = null
  selectedProductName.value = ''
  selectedProduct.value = null
  productSpecs.value = []
}

const openProductDialogFromSelector = () => {
  // 关闭商品选择器，跳转到商品管理页面并自动打开新增弹窗
  router.push('/product?action=add')
}

const openAddCouponDialog = () => {
  // 直接打开订单券选择器
  couponSelectorRef.value.open()
}



const handleCouponSelect = async (coupon) => {
  submitting.value = true
  try {
    const data = {
      itemType: 2,
      couponId: coupon.id
    }
    await request.post('/admin/seckill/item', data)
    ElMessage.success('添加优惠券成功')
    loadCouponList()
  } catch (err) {
    console.error('添加优惠券失败:', err)
  } finally {
    submitting.value = false
  }
}

const handleCouponEmpty = () => {
  // 现在 OrderCouponSelector 内部会直接显示带提示的空状态表格，无需在此弹出额外对话框
  console.log('订单券列表为空')
}



const handleAddProduct = async () => {
  const valid = await productFormRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    const data = {
      itemType: 1,
      productId: parseInt(productForm.productId),
      productSpecId: productForm.productSpecId || null,
      seckillPrice: productForm.seckillPrice,
      seckillStock: productForm.seckillStock,
      perLimit: productForm.perLimit
    }
    await request.post('/admin/seckill/item', data)
    ElMessage.success('添加商品成功')
    productDialogVisible.value = false
    loadProductList()
  } catch (err) {
    console.error('添加商品失败:', err)
  } finally {
    submitting.value = false
  }
}

const handleEditProduct = async () => {
  const valid = await productFormRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    await request.put(`/admin/seckill/item/${currentEditId.value}`, null, {
      params: {
        seckillPrice: productForm.seckillPrice,
        perLimit: productForm.perLimit
      }
    })
    ElMessage.success('修改商品成功')
    productDialogVisible.value = false
    loadProductList()
  } catch (err) {
    console.error('修改商品失败:', err)
  } finally {
    submitting.value = false
  }
}



onMounted(() => {
  // 加载活动列表
  loadProductActivities()
  loadCouponActivities()
  
  // 加载商品和券列表
  loadProductList()
  loadCouponList()
  
  // 检查路由参数，自动打开对应的添加对话框
  const action = route.query.action
  if (action === 'addProduct') {
    openAddProductDialog()
  } else if (action === 'addCoupon') {
    openAddCouponDialog()
  }
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
.list-card {
  margin-bottom: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 500;
  font-size: 16px;
}

.filter-section {
  display: flex;
  align-items: center;
  gap: 10px;
}
.product-info {
  display: flex;
  align-items: center;
  gap: 10px;
}
.product-thumb {
  width: 50px;
  height: 50px;
  border-radius: 4px;
  border: 1px solid #ebeef5;
}
.product-name {
  flex: 1;
}
.coupon-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.coupon-name {
  font-weight: 500;
}
.coupon-detail {
  font-size: 12px;
  color: #909399;
}
.seckill-price {
  color: #f56c6c;
  font-weight: 500;
}
.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
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
.product-select-area {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.selected-product {
  display: flex;
  align-items: center;
}
</style>
