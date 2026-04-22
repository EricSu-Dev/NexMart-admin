<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">优惠活动管理</h2>
      <el-button type="primary" :icon="Plus" @click="handleAdd">新增活动</el-button>
    </div>

    <el-card style="margin-bottom:16px">
      <el-form :model="query" inline>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部状态" clearable style="width:120px">
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="阶段">
          <el-select v-model="query.stage" placeholder="全部阶段" clearable style="width:120px">
            <el-option label="未开始" :value="0" />
            <el-option label="进行中" :value="1" />
            <el-option label="已结束" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="适用范围">
          <el-select v-model="query.scope" placeholder="全部范围" clearable style="width:120px">
            <el-option label="全场" :value="1" />
            <el-option label="分类" :value="2" />
            <el-option label="单商品" :value="3" />
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
        <el-table-column prop="name" label="活动名称" min-width="100" />
        <el-table-column label="类型" width="80">
          <template #default="{ row }">
            <el-tag :type="row.type === 1 ? 'warning' : 'success'" size="small">
              {{ row.type === 1 ? '满减' : '折扣' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="优惠内容" width="120">
          <template #default="{ row }">
            <div>
              <span v-if="row.type === 1">满{{ row.minAmount }}减{{ row.discountAmount }}</span>
              <span v-else>满{{ row.minAmount }}打{{ (row.discountRate * 10).toFixed(1) }}折</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="适用范围" width="80">
          <template #default="{ row }">
            <el-tag :type="scopeTagType(row.scope)" size="small">
              {{ scopeLabel(row.scope) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="scopeName" label="范围名称" width="130" />
        <el-table-column label="活动时间" min-width="100">
          <template #default="{ row }">
            <div class="time-range-cell">
              <div>{{ formatTime(row.startTime) }}至</div>
              <div>{{ formatTime(row.endTime) }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="stage" label="阶段" width="80">
          <template #default="{ row }">
            <el-tag :type="stageTagType(row.stage)" size="small">
              {{ stageLabel(row.stage) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="70">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button text type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button
              text
              :type="row.status === 1 ? 'warning' : 'success'"
              size="small"
              @click="handleToggleStatus(row)"
            >
              {{ row.status === 1 ? '禁用' : '启用' }}
            </el-button>
            <el-button text type="danger" size="small" @click="handleDelete(row)">删除</el-button>
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

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑活动' : '新增活动'"
      width="560px"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="活动名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入活动名称" maxlength="50" />
        </el-form-item>
        <el-form-item label="优惠类型" prop="type">
          <el-radio-group v-model="form.type" @change="handleTypeChange">
            <el-radio :value="1">满减</el-radio>
            <el-radio :value="2">折扣</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="form.type === 1" label="减免金额" prop="discountAmount">
          <el-input-number
            v-model="form.discountAmount"
            :min="0.01"
            :precision="2"
            :step="1"
            style="width:200px"
          />
          <span class="unit">元</span>
        </el-form-item>
        <el-form-item v-if="form.type === 2" label="折扣率" prop="discountRate">
          <el-input-number
            v-model="form.discountRate"
            :min="0.1"
            :max="9.9"
            :precision="1"
            :step="0.1"
            style="width:200px"
          />
          <span class="unit">折</span>
          <span class="tip">(输入0.1~9.9之间的数字)</span>
        </el-form-item>
        <el-form-item label="减免门槛" prop="minAmount">
          <el-input-number
            v-model="form.minAmount"
            :min="0"
            :precision="2"
            :step="1"
            style="width:200px"
          />
          <span class="unit">元</span>
        </el-form-item>
        <el-form-item label="适用范围" prop="scope">
          <el-radio-group v-model="form.scope" @change="handleScopeChange">
            <el-radio :value="1">全场</el-radio>
            <el-radio :value="2">分类</el-radio>
            <el-radio :value="3">单商品</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="form.scope === 2" label="选择分类" prop="scopeId">
          <el-select v-model="form.scopeId" placeholder="请选择分类" style="width:200px">
            <el-option v-for="cat in categories" :key="cat.id" :label="cat.name" :value="cat.id" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="form.scope === 3" label="选择商品" prop="scopeId">
          <div class="product-select">
            <el-input
              :model-value="selectedProductName"
              placeholder="请选择商品"
              readonly
              style="width:300px"
            />
            <el-button type="primary" @click="openProductSelector">选择商品</el-button>
          </div>
        </el-form-item>
        <el-form-item label="活动时间" prop="timeRange">
          <el-date-picker
            v-model="form.timeRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DDTHH:mm:ss"
            style="width:360px"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <product-selector ref="productSelectorRef" @select="handleProductSelect" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import { promotionApi } from '@/api/promotion'
import { categoryApi } from '@/api/category'
import ProductSelector from '@/components/ProductSelector.vue'

const loading = ref(false)
const list = ref([])
const categories = ref([])
const pagination = ref({ current: 1, size: 10, total: 0 })
const query = ref({ status: null, stage: null, scope: null })

const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref(null)
const submitting = ref(false)
const formRef = ref(null)
const productSelectorRef = ref(null)

const form = reactive({
  name: '',
  type: 1,
  discountAmount: null,
  discountRate: null,
  minAmount: null,
  scope: 1,
  scopeId: null,
  scopeName: '',
  timeRange: []
})

const selectedProductName = computed(() => {
  if (form.scope === 3 && form.scopeId && form.scopeName) {
    return form.scopeName
  }
  return ''
})

const validateDiscountAmount = (rule, value, callback) => {
  if (form.type === 1 && (!value || value <= 0)) {
    callback(new Error('请输入减免金额'))
  } else if (form.type === 1 && form.minAmount && value >= form.minAmount) {
    callback(new Error('减免金额不能大于等于最低消费金额'))
  } else {
    callback()
  }
}

const validateDiscountRate = (rule, value, callback) => {
  if (form.type === 2 && (!value || value <= 0 || value >= 10)) {
    callback(new Error('请输入有效的折扣率(0.1-9.9)'))
  } else {
    callback()
  }
}

const validateScopeId = (rule, value, callback) => {
  if ((form.scope === 2 || form.scope === 3) && !value) {
    callback(new Error('请选择分类或商品'))
  } else {
    callback()
  }
}

const validateTimeRange = (rule, value, callback) => {
  if (!value || value.length !== 2) {
    callback(new Error('请选择活动时间'))
  } else {
    callback()
  }
}

const rules = {
  name: [{ required: true, message: '请输入活动名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择优惠类型', trigger: 'change' }],
  discountAmount: [{ validator: validateDiscountAmount, trigger: 'blur' }],
  discountRate: [{ validator: validateDiscountRate, trigger: 'blur' }],
  minAmount: [{ required: true, message: '请输入最低消费金额', trigger: 'blur' }],
  scope: [{ required: true, message: '请选择适用范围', trigger: 'change' }],
  scopeId: [{ validator: validateScopeId, trigger: 'change' }],
  timeRange: [{ validator: validateTimeRange, trigger: 'change' }]
}

const scopeLabel = (scope) => {
  const map = { 1: '全场', 2: '分类', 3: '单商品' }
  return map[scope] || '-'
}

const scopeTagType = (scope) => {
  const map = { 1: 'success', 2: 'warning', 3: 'info' }
  return map[scope] || 'info'
}

const statusLabel = (status) => {
  const map = { 0: '禁用', 1: '启用' }
  return map[status] || '-' 
}

const stageLabel = (stage) => {
  const map = { 0: '未开始', 1: '进行中', 2: '已结束' }
  return map[stage] || '-' 
}

const stageTagType = (stage) => {
  const map = { 0: 'info', 1: 'success', 2: 'danger' }
  return map[stage] || 'info'
}

const statusTagType = (status) => {
  const map = { 0: 'info', 1: 'success' }
  return map[status] || 'info'
}

const formatTime = (time) => {
  if (!time) return '-'
  return time.replace('T', ' ').slice(0, 16)
}

const loadList = async () => {
  loading.value = true
  try {
    const res = await promotionApi.getPage({
      current: pagination.value.current,
      size: pagination.value.size,
      status: query.value.status ?? undefined,
      stage: query.value.stage ?? undefined,
      scope: query.value.scope ?? undefined
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
  query.value = { status: null, stage: null, scope: null }
  handleSearch()
}

const resetForm = () => {
  Object.assign(form, {
    name: '',
    type: 1,
    discountAmount: null,
    discountRate: null,
    minAmount: null,
    scope: 1,
    scopeId: null,
    scopeName: '',
    timeRange: []
  })
}

const handleTypeChange = () => {
  form.discountAmount = null
  form.discountRate = null
}

const handleScopeChange = () => {
  form.scopeId = null
  form.scopeName = ''
  if (form.scope === 2) {
    loadCategories()
  }
}

const loadCategories = async () => {
  if (categories.value.length === 0) {
    const res = await categoryApi.getList()
    categories.value = res.data
  }
}

const openProductSelector = () => {
  productSelectorRef.value.open()
}

const handleProductSelect = (product) => {
  form.scopeId = product.id
  form.scopeName = product.name
}

const handleAdd = async () => {
  isEdit.value = false
  editId.value = null
  resetForm()
  await loadCategories()
  dialogVisible.value = true
}

const handleEdit = async (row) => {
  isEdit.value = true
  editId.value = row.id
  await loadCategories()
  Object.assign(form, {
    name: row.name,
    type: row.type,
    discountAmount: row.discountAmount,
    discountRate: row.discountRate ? row.discountRate * 10 : null,
    minAmount: row.minAmount,
    scope: row.scope,
    scopeId: row.scopeId,
    scopeName: row.scopeName || '',
    timeRange: [row.startTime, row.endTime]
  })
  dialogVisible.value = true
}

const handleSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    const data = {
      name: form.name,
      type: form.type,
      minAmount: form.minAmount,
      scope: form.scope,
      startTime: form.timeRange[0],
      endTime: form.timeRange[1]
    }
    if (form.type === 1) {
      data.discountAmount = form.discountAmount
    } else {
      data.discountRate = form.discountRate / 10
    }
    if (form.scope === 2 || form.scope === 3) {
      data.scopeId = form.scopeId
    }

    if (isEdit.value) {
      await promotionApi.update(editId.value, data)
      ElMessage.success('修改成功')
    } else {
      await promotionApi.create(data)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadList()
  } finally {
    submitting.value = false
  }
}

const handleToggleStatus = async (row) => {
  const nextStatus = row.status === 1 ? 0 : 1
  const label = nextStatus === 1 ? '启用' : '禁用'
  await ElMessageBox.confirm(`确定将活动「${row.name}」${label}？`, '提示', { type: 'warning' })
  await promotionApi.updateStatus(row.id, nextStatus)
  ElMessage.success('状态已更新')
  loadList()
}

const handleDelete = async (row) => {
  await ElMessageBox.confirm(`确定删除活动「${row.name}」？`, '提示', { type: 'warning' })
  await promotionApi.remove(row.id)
  ElMessage.success('删除成功')
  loadList()
}

onMounted(() => {
  loadList()
})
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-title { font-size: 20px; color: #303133; margin: 0; }
.pagination { display: flex; justify-content: flex-end; margin-top: 16px; }
.time-range { font-size: 12px; color: #606266; line-height: 1.6; }
.unit { margin-left: 8px; color: #909399; }
.tip { margin-left: 8px; font-size: 12px; color: #909399; }
.product-select { display: flex; gap: 10px; }

/* 表格单元格自动换行 */
:deep(.el-table .cell) {
  white-space: normal !important;
  line-height: 1.4;
  word-break: break-word;
}

/* 活动时间单元格样式 */
.time-range-cell {
  line-height: 1.4;
  font-size: 12px;
  color: #606266;
}
</style>
