<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">优惠券管理</h2>
      <el-button type="primary" :icon="Plus" @click="handleAdd">新增优惠券</el-button>
    </div>

    <el-card style="margin-bottom:16px">
      <el-form :model="query" inline>
        <el-form-item label="券名称">
          <el-input v-model="query.name" placeholder="请输入券名称" clearable style="width:150px" />
        </el-form-item>
        <el-form-item label="券类型">
          <el-select v-model="query.couponType" placeholder="全部类型" clearable style="width:110px">
            <el-option label="商品券" :value="1" />
            <el-option label="订单券" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="优惠方式">
          <el-select v-model="query.discountType" placeholder="全部方式" clearable style="width:110px">
            <el-option label="满减" :value="1" />
            <el-option label="折扣" :value="2" />
            <el-option label="无门槛" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="领取渠道">
          <el-select v-model="query.receiveChannel" placeholder="全部渠道" clearable style="width:110px" @change="handleSearch">
            <el-option label="领券中心" :value="1" />
            <el-option label="积分商城" :value="2" />
            <el-option label="秒杀" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部状态" clearable style="width:110px">
            <el-option label="上架" :value="1" />
            <el-option label="下架" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card>
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="50" />
        <el-table-column prop="name" label="券名称" min-width="120" />
        <el-table-column label="券类型" width="78">
          <template #default="{ row }">
            <el-tag :type="couponTypeTagType(row.couponType)" size="small">
              {{ row.couponType === 1 ? '商品券' : '订单券' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="领取渠道" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="receiveChannelTagType(row.receiveChannel)" size="small">
              {{ formatReceiveChannel(row.receiveChannel) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="优惠方式" width="80">
          <template #default="{ row }">
            <el-tag :type="discountTypeTagType(row.discountType)" size="small">
              {{ row.discountTypeDesc }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="优惠内容" width="100">
          <template #default="{ row }">
            <span>{{ formatDiscountContent(row) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="适用范围" min-width="110">
          <template #default="{ row }">
            <span>{{ formatScope(row) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="发放/剩余" width="100">
          <template #default="{ row }">
            <span v-if="row.total === -1">不限量</span>
            <span v-else>{{ row.total }} / {{ row.remained }}</span>
          </template>
        </el-table-column>
        <el-table-column label="每人限领" width="60" align="center">
          <template #default="{ row }">
            {{ row.perLimit }}张
          </template>
        </el-table-column>
        <el-table-column label="领取时间" min-width="140">
          <template #default="{ row }">
            <div class="time-range-cell">
              <div>{{ formatTime(row.receiveStart) }}</div>
              <div>至 {{ formatTime(row.receiveEnd) }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="validDays" label="有效天数" width="60">
          <template #default="{ row }">
            {{ row.validDays }}天
          </template>
        </el-table-column>
        <el-table-column label="状态" width="68">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
              {{ row.status === 1 ? '上架' : '下架' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <div class="op-btns">
              <el-button text type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
              <el-button
                text
                :type="row.status === 1 ? 'warning' : 'success'"
                size="small"
                @click="handleToggleStatus(row)"
              >
                {{ row.status === 1 ? '下架' : '上架' }}
              </el-button>
              <el-button text type="danger" size="small" @click="handleDelete(row)">删除</el-button>
              <el-button text type="info" size="small" @click="handleStats(row)">统计</el-button>
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

    <!-- 创建/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑优惠券' : '新增优惠券'"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-alert
        v-if="isEdit && hasReceived"
        title="已有用户领取，仅可修改名称、截止时间"
        type="warning"
        :closable="false"
        style="margin-bottom:16px"
      />
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <el-form-item label="券名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入券名称" maxlength="50" />
        </el-form-item>
        <el-form-item label="券类型" prop="couponType">
          <el-radio-group v-model="form.couponType" :disabled="isEdit && hasReceived" @change="handleCouponTypeChange">
            <el-radio :value="1">商品券</el-radio>
            <el-radio :value="2">订单券</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="优惠方式" prop="discountType">
          <el-radio-group v-model="form.discountType" :disabled="isEdit && hasReceived" @change="handleDiscountTypeChange">
            <el-radio v-if="form.couponType !== 2" :value="1">满减</el-radio>
            <el-radio :value="2">折扣</el-radio>
            <el-radio :value="3">无门槛</el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- 满减：门槛金额 + 减免金额 -->
        <template v-if="form.discountType === 1">
          <el-form-item label="门槛金额" prop="minAmount">
            <el-input-number
              v-model="form.minAmount"
              :min="0.01"
              :precision="2"
              :step="1"
              :disabled="isEdit && hasReceived"
              style="width:200px"
            />
            <span class="unit">元</span>
          </el-form-item>
          <el-form-item label="减免金额" prop="discountAmount">
            <el-input-number
              v-model="form.discountAmount"
              :min="0.01"
              :precision="2"
              :step="1"
              :disabled="isEdit && hasReceived"
              style="width:200px"
            />
            <span class="unit">元</span>
          </el-form-item>
        </template>

        <!-- 折扣：折扣率 -->
        <template v-if="form.discountType === 2">
          <el-form-item label="折扣率" prop="discountRate">
            <el-input-number
              v-model="form.discountRate"
              :min="0.1"
              :max="9.9"
              :precision="1"
              :step="0.1"
              :disabled="isEdit && hasReceived"
              style="width:200px"
            />
            <span class="unit">折</span>
            <span class="tip">(输入0.1~9.9之间的数字)</span>
          </el-form-item>
        </template>

        <!-- 无门槛：减免金额 -->
        <template v-if="form.discountType === 3">
          <el-form-item label="减免金额" prop="discountAmount">
            <el-input-number
              v-model="form.discountAmount"
              :min="0.01"
              :precision="2"
              :step="1"
              :disabled="isEdit && hasReceived"
              style="width:200px"
            />
            <span class="unit">元</span>
          </el-form-item>
        </template>

        <!-- 适用范围 -->
        <template v-if="form.couponType === 1">
          <el-form-item label="适用范围" prop="scope">
            <el-radio-group v-model="form.scope" :disabled="isEdit && hasReceived" @change="handleScopeChange">
              <el-radio :value="1">全场</el-radio>
              <el-radio :value="2">单分类</el-radio>
              <el-radio :value="3" v-if="form.discountType !== 1">单商品</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item v-if="form.scope === 2" label="选择分类" prop="scopeId">
            <el-select v-model="form.scopeId" placeholder="请选择分类" :disabled="isEdit && hasReceived" style="width:200px">
              <el-option v-for="cat in categories" :key="cat.id" :label="cat.name" :value="cat.id" />
            </el-select>
          </el-form-item>
          <el-form-item v-if="form.scope === 3" label="选择商品" prop="scopeId">
            <div class="product-select">
              <el-input
                :model-value="selectedProductName"
                placeholder="请选择商品"
                readonly
                :disabled="isEdit && hasReceived"
                style="width:280px"
              />
              <el-button type="primary" :disabled="isEdit && hasReceived" @click="openProductSelector">选择商品</el-button>
            </div>
          </el-form-item>
        </template>
        <template v-else-if="form.couponType === 2">
          <el-form-item label="适用范围" prop="scope">
            <el-radio-group v-model="form.scope" :disabled="isEdit && hasReceived" @change="handleScopeChange">
              <el-radio :value="1">全场</el-radio>
              <el-radio :value="2" v-if="form.couponType !== 2">单分类</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item v-if="form.scope === 2" label="选择分类" prop="scopeId">
            <el-select v-model="form.scopeId" placeholder="请选择分类" :disabled="isEdit && hasReceived" style="width:200px">
              <el-option v-for="cat in categories" :key="cat.id" :label="cat.name" :value="cat.id" />
            </el-select>
          </el-form-item>
        </template>

        <el-form-item label="发放总量" prop="total">
          <div style="display:flex;align-items:center;gap:12px">
            <el-input-number
              v-model="form.total"
              :min="form.couponType === 2 ? 1 : -1"
              :step="1"
              :disabled="isEdit && hasReceived || form.totalUnlimited"
              style="width:200px"
            />
            <el-checkbox v-if="form.couponType !== 2" v-model="form.totalUnlimited" :disabled="isEdit && hasReceived" @change="handleUnlimitedChange">不限量</el-checkbox>
          </div>
        </el-form-item>
        <el-form-item label="每人限领" prop="perLimit">
          <el-input-number
            v-model="form.perLimit"
            :min="1"
            :step="1"
            :disabled="isEdit && hasReceived"
            style="width:200px"
          />
          <span class="unit">张</span>
        </el-form-item>
        <el-form-item label="领取时间" prop="receiveTimeRange">
          <el-date-picker
            v-model="form.receiveTimeRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DDTHH:mm:ss"
            style="width:360px"
          />
        </el-form-item>
        <el-form-item label="有效天数" prop="validDays">
          <el-input-number
            v-model="form.validDays"
            :min="1"
            :step="1"
            :disabled="isEdit && hasReceived"
            style="width:200px"
          />
          <span class="unit">天（自领取之日起）</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 统计弹窗 -->
    <el-dialog v-model="statsVisible" title="优惠券统计" width="500px">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="券名称">{{ statsData.couponName }}</el-descriptions-item>
        <el-descriptions-item label="发放总量">{{ statsData.total === -1 ? '不限量' : statsData.total }}</el-descriptions-item>
        <el-descriptions-item label="剩余数量">{{ statsData.total === -1 ? '-' : statsData.remained }}</el-descriptions-item>
        <el-descriptions-item label="已领取人数">{{ statsData.receivedCount || 0 }}</el-descriptions-item>
        <el-descriptions-item label="已使用数量">{{ statsData.usedCount || 0 }}</el-descriptions-item>
        <el-descriptions-item label="已过期数量">{{ statsData.expiredCount || 0 }}</el-descriptions-item>
        <el-descriptions-item label="未使用数量">{{ statsData.unusedCount || 0 }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <product-selector ref="productSelectorRef" @select="handleProductSelect" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import { couponApi } from '@/api/coupon'
import { categoryApi } from '@/api/category'
import { productApi } from '@/api/product'
import ProductSelector from '@/components/ProductSelector.vue'

const route = useRoute()

const loading = ref(false)
const list = ref([])
const categories = ref([])
const pagination = ref({ current: 1, size: 10, total: 0 })
const query = ref({ name: '', couponType: null, discountType: null, status: null, receiveChannel: null })

const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref(null)
const hasReceived = ref(false)
const submitting = ref(false)
const formRef = ref(null)
const productSelectorRef = ref(null)

const form = reactive({
  name: '',
  couponType: 1,
  discountType: 1,
  minAmount: null,
  discountAmount: null,
  discountRate: null,
  scope: 1,
  scopeId: null,
  scopeName: '',
  total: 1000,
  totalUnlimited: false,
  perLimit: 1,
  receiveTimeRange: [],
  validDays: 7
})

const selectedProductName = computed(() => {
  if (form.scope === 3 && form.scopeId && form.scopeName) {
    return form.scopeName
  }
  return ''
})

// 验证规则
const validateDiscountAmount = (rule, value, callback) => {
  if (form.discountType === 1 || form.discountType === 3) {
    if (!value || value <= 0) {
      callback(new Error('请输入减免金额'))
    } else if (form.discountType === 1 && form.minAmount && value >= form.minAmount) {
      callback(new Error('减免金额不能大于等于门槛金额'))
    } else {
      callback()
    }
  } else {
    callback()
  }
}

const validateDiscountRate = (rule, value, callback) => {
  if (form.discountType === 2) {
    if (!value || value < 0.1 || value > 9.9) {
      callback(new Error('请输入有效的折扣率(0.1-9.9)'))
    } else {
      callback()
    }
  } else {
    callback()
  }
}

const validateMinAmount = (rule, value, callback) => {
  if (form.discountType === 1) {
    if (!value || value <= 0) {
      callback(new Error('请输入门槛金额'))
    } else {
      callback()
    }
  } else {
    callback()
  }
}

const validateScopeId = (rule, value, callback) => {
  if ((form.couponType === 1 && (form.scope === 2 || form.scope === 3) && !value) ||
      (form.couponType === 2 && form.scope === 2 && !value)) {
    callback(new Error('请选择分类或商品'))
  } else {
    callback()
  }
}

const validateReceiveTimeRange = (rule, value, callback) => {
  if (!value || value.length !== 2) {
    callback(new Error('请选择领取时间'))
  } else {
    callback()
  }
}

const rules = {
  name: [{ required: true, message: '请输入券名称', trigger: 'blur' }],
  couponType: [{ required: true, message: '请选择券类型', trigger: 'change' }],
  discountType: [{ required: true, message: '请选择优惠方式', trigger: 'change' }],
  minAmount: [{ validator: validateMinAmount, trigger: 'blur' }],
  discountAmount: [{ validator: validateDiscountAmount, trigger: 'blur' }],
  discountRate: [{ validator: validateDiscountRate, trigger: 'blur' }],
  scope: [{ required: true, message: '请选择适用范围', trigger: 'change' }],
  scopeId: [{ validator: validateScopeId, trigger: 'change' }],
  total: [{ required: true, message: '请输入发放总量', trigger: 'blur' }],
  perLimit: [{ required: true, message: '请输入每人限领数', trigger: 'blur' }],
  receiveTimeRange: [{ validator: validateReceiveTimeRange, trigger: 'change' }],
  validDays: [{ required: true, message: '请输入有效天数', trigger: 'blur' }]
}

// 标签类型
const couponTypeTagType = (type) => {
  const map = { 1: 'success', 2: 'danger' }
  return map[type] || 'info'
}

const discountTypeTagType = (type) => {
  const map = { 1: 'warning', 2: 'success', 3: 'info' }
  return map[type] || 'info'
}

const receiveChannelTagType = (channel) => {
  const map = { 1: 'success', 2: 'warning', 3: 'danger' }
  return map[channel] || 'info'
}

const formatReceiveChannel = (channel) => {
  const map = { 1: '领券中心', 2: '积分商城', 3: '秒杀' }
  return map[channel] || '暂无'
}

// 格式化优惠内容
const formatDiscountContent = (row) => {
  if (row.discountType === 1) {
    return `满${row.minAmount}减${row.discountAmount}`
  } else if (row.discountType === 2) {
    return `${(row.discountRate * 10).toFixed(1)}折`
  } else if (row.discountType === 3) {
    return `减${row.discountAmount}元`
  }
  return '-'
}

// 格式化适用范围
const formatScope = (row) => {
  if (row.scope === 1) {
    return '全场'
  } else if (row.scope === 2) {
    return row.scopeName || '-'
  } else if (row.scope === 3) {
    return row.scopeName || '-'
  }
  return '-'
}

// 格式化时间
const formatTime = (time) => {
  if (!time) return '-'
  return time.replace('T', ' ').slice(0, 16)
}

// 加载列表
const loadList = async () => {
  loading.value = true
  try {
    const res = await couponApi.getPage({
      current: pagination.value.current,
      size: pagination.value.size,
      name: query.value.name || undefined,
      couponType: query.value.couponType ?? undefined,
      discountType: query.value.discountType ?? undefined,
      status: query.value.status ?? undefined,
      receiveChannel: query.value.receiveChannel ?? undefined
    })
    list.value = res.data.records
    pagination.value.total = res.data.total
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.value.current = 1
  loadList()
}

const resetQuery = () => {
  query.value = { name: '', couponType: null, discountType: null, status: null, receiveChannel: null }
  handleSearch()
}

// 重置表单
const resetForm = () => {
  Object.assign(form, {
    name: '',
    couponType: 1,
    discountType: 1,
    minAmount: null,
    discountAmount: null,
    discountRate: null,
    scope: 1,
    scopeId: null,
    scopeName: '',
    total: 1000,
    totalUnlimited: false,
    perLimit: 1,
    receiveTimeRange: [],
    validDays: 7
  })
  hasReceived.value = false
}

// 监听券类型变化
const handleCouponTypeChange = () => {
  form.scope = 1
  form.scopeId = null
  form.scopeName = ''
  // 如果切换到订单券且当前选了单商品，重置为全场
  if (form.couponType === 2 && form.scope === 3) {
    form.scope = 1
  }
  // 订单券不支持满减，重置为折扣
  if (form.couponType === 2 && form.discountType === 1) {
    form.discountType = 2
  }
  // 订单券不能是不限量，重置为有限数量
  if (form.couponType === 2 && form.totalUnlimited) {
    form.totalUnlimited = false
    form.total = 1000
  }
}

// 监听优惠方式变化
const handleDiscountTypeChange = () => {
  form.minAmount = null
  form.discountAmount = null
  form.discountRate = null
  // 商品券满减时禁用单商品，如果当前选了单商品则重置
  if (form.couponType === 1 && form.discountType === 1 && form.scope === 3) {
    form.scope = 1
    form.scopeId = null
    form.scopeName = ''
  }
}

// 监听适用范围变化
const handleScopeChange = () => {
  form.scopeId = null
  form.scopeName = ''
  if (form.scope === 2) {
    loadCategories()
  }
}

// 监听不限量变化
const handleUnlimitedChange = (val) => {
  if (val) {
    form.total = -1
  } else {
    form.total = 1000
  }
}

// 加载分类
const loadCategories = async () => {
  if (categories.value.length === 0) {
    const res = await categoryApi.getList()
    categories.value = res.data
    console.log('加载的分类数据:', res.data)
  }
}

// 打开商品选择器
const openProductSelector = () => {
  productSelectorRef.value.open()
}

// 选择商品
const handleProductSelect = (product) => {
  form.scopeId = product.id
  form.scopeName = product.name
}

// 新增
const handleAdd = async () => {
  isEdit.value = false
  editId.value = null
  resetForm()
  await loadCategories()
  dialogVisible.value = true
}

// 编辑
const handleEdit = async (row) => {
  console.log('编辑数据:', row)
  isEdit.value = true
  editId.value = row.id
  // 判断是否有用户领取（通过已领取人数或剩余数量判断）
  hasReceived.value = row.total !== -1 && row.remained < row.total
  
  await loadCategories()

  // 尝试获取 scopeName
  let scopeName = row.scopeName || ''
  if (!scopeName && row.scopeId) {
    if (row.scope === 2) {
      const cat = categories.value.find(c => c.id === row.scopeId)
      scopeName = cat ? cat.name : ''
    } else if (row.scope === 3) {
      try {
        const res = await productApi.getDetail(row.scopeId)
        scopeName = res.data.name
      } catch (e) {
        console.error('获取商品详情回显失败:', e)
      }
    }
  }

  Object.assign(form, {
    name: row.name,
    couponType: row.couponType,
    discountType: row.discountType,
    minAmount: row.minAmount,
    discountAmount: row.discountAmount,
    discountRate: row.discountRate ? row.discountRate * 10 : null,
    scope: row.scope,
    scopeId: row.scopeId,
    scopeName: scopeName,
    total: row.total,
    totalUnlimited: row.total === -1,
    perLimit: row.perLimit,
    receiveTimeRange: [row.receiveStart, row.receiveEnd],
    validDays: row.validDays
  })
  console.log('表单数据:', form)
  dialogVisible.value = true
}

// 提交
const handleSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    const data = {
      name: form.name,
      couponType: form.couponType,
      discountType: form.discountType,
      minAmount: form.minAmount,
      discountAmount: form.discountAmount,
      discountRate: form.discountType === 2 ? form.discountRate / 10 : null,
      scope: form.scope,
      total: form.total,
      perLimit: form.perLimit,
      receiveStart: form.receiveTimeRange[0],
      receiveEnd: form.receiveTimeRange[1],
      validDays: form.validDays
    }
    if ((form.couponType === 1 && (form.scope === 2 || form.scope === 3)) ||
        (form.couponType === 2 && form.scope === 2)) {
      data.scopeId = form.scopeId
    }

    if (isEdit.value) {
      data.id = editId.value
      await couponApi.update(editId.value, data)
      ElMessage.success('修改成功')
    } else {
      await couponApi.create(data)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadList()
  } finally {
    submitting.value = false
  }
}

// 切换状态
const handleToggleStatus = async (row) => {
  const nextStatus = row.status === 1 ? 0 : 1
  const label = nextStatus === 1 ? '上架' : '下架'
  await ElMessageBox.confirm(`确定将优惠券「${row.name}」${label}？`, '提示', { type: 'warning' })
  await couponApi.updateStatus(row.id, nextStatus)
  ElMessage.success('状态已更新')
  loadList()
}

// 删除
const handleDelete = async (row) => {
  await ElMessageBox.confirm(`确定删除优惠券「${row.name}」？`, '提示', { type: 'warning' })
  await couponApi.remove(row.id)
  ElMessage.success('删除成功')
  loadList()
}

// 统计弹窗
const statsVisible = ref(false)
const statsData = ref({
  couponId: null,
  couponName: '',
  total: 0,
  remained: 0,
  receivedCount: 0,
  usedCount: 0,
  expiredCount: 0,
  unusedCount: 0
})

const handleStats = async (row) => {
  try {
    const res = await couponApi.getStats(row.id)
    statsData.value = res.data
    statsVisible.value = true
  } catch (err) {
    ElMessage.error('获取统计数据失败')
  }
}

onMounted(() => {
  loadList()
  if (route.query.action === 'add') {
    handleAdd()
    if (route.query.couponType) {
      form.couponType = parseInt(route.query.couponType)
      handleCouponTypeChange()
    }
  }
})
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.page-title {
  font-size: 20px;
  color: #303133;
  margin: 0;
}
.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
.unit {
  margin-left: 8px;
  color: #909399;
}
.tip {
  margin-left: 8px;
  font-size: 12px;
  color: #909399;
}
.product-select {
  display: flex;
  gap: 10px;
}
.time-range-cell {
  line-height: 1.4;
  font-size: 12px;
  color: #606266;
}
.op-btns {
  display: flex;
  gap: 10px;
}
.op-btns :deep(.el-button) {
  padding-left: 4px;
  padding-right: 4px;
  margin-left: 0;
}

/* 表格单元格自动换行 */
:deep(.el-table .cell) {
  white-space: normal !important;
  line-height: 1.4;
  word-break: break-word;
}
</style>
