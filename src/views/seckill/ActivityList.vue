<template>
  <div class="seckill-activity-container">
    <div class="page-header">
      <h2 class="page-title">秒杀活动管理</h2>
      <el-button type="primary" :icon="Plus" @click="handleAdd">新建活动</el-button>
    </div>

    <el-card style="margin-bottom: 16px">
      <el-form :model="query" inline>
        <el-form-item label="活动类型">
          <el-select v-model="query.activityType" placeholder="全部类型" clearable style="width: 140px" @change="handleSearch">
            <el-option label="全部" :value="null" />
            <el-option label="商品秒杀" :value="1" />
            <el-option label="订单券秒杀" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="阶段">
          <el-select v-model="query.phase" placeholder="全部阶段" clearable style="width: 140px" @change="handleSearch">
            <el-option label="全部" :value="null" />
            <el-option label="未开始" :value="1" />
            <el-option label="进行中" :value="2" />
            <el-option label="已结束" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部状态" clearable style="width: 140px" @change="handleSearch">
            <el-option label="全部" :value="null" />
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card>
      <el-table :data="list" v-loading="loading" stripe border>
        <el-table-column prop="id" label="ID" width="60" align="center" />
        <el-table-column prop="name" label="活动名称" min-width="150" show-overflow-tooltip />
        <el-table-column label="活动类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.activityType === 1 ? 'primary' : 'warning'" size="small">
              {{ row.activityType === 1 ? '商品秒杀' : '订单券秒杀' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="itemCount" label="秒杀项个数" width="95" align="center" />
        <el-table-column prop="startTime" label="开始时间" width="160" align="center">
          <template #default="{ row }">
            {{ formatTime(row.startTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="endTime" label="结束时间" width="160" align="center">
          <template #default="{ row }">
            {{ formatTime(row.endTime) }}
          </template>
        </el-table-column>
        <el-table-column label="阶段" width="78" align="center">
          <template #default="{ row }">
            <el-tag :type="phaseTagType(row.phase)" size="small">
              {{ phaseLabel(row.phase) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="66" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" size="small">
              {{ statusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="360" align="center" fixed="right">
          <template #default="{ row }">
            <el-button 
              link 
              :type="row.status === 1 ? 'warning' : 'success'" 
              @click="handleToggleStatus(row)"
            >
              {{ row.status === 1 ? '禁用' : '启用' }}
            </el-button>
            <el-button 
              v-if="row.status === 1" 
              link 
              type="primary" 
              @click="handleEdit(row)"
            >
              编辑
            </el-button>
            <el-popconfirm
              title="确定删除该活动吗？"
              confirm-button-text="确定"
              cancel-button-text="取消"
              @confirm="handleDelete(row)"
            >
              <template #reference>
                <el-button link type="danger">删除</el-button>
              </template>
            </el-popconfirm>
            <el-button link type="primary" :icon="Link" @click="handleManageItems(row)">绑定秒杀项</el-button>
            <el-button link type="primary" @click="handleViewItems(row)">管理秒杀项</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
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
      :title="isEdit ? '编辑活动' : '新建活动'"
      width="560px"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="活动名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入活动名称" maxlength="100" />
        </el-form-item>
        <el-form-item label="活动类型" prop="activityType">
          <el-radio-group v-model="form.activityType">
            <el-radio :label="1">商品秒杀活动</el-radio>
            <el-radio :label="2">订单券秒杀活动</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="活动描述" prop="description">
          <el-input 
            v-model="form.description" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入活动描述（选填）" 
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="开始时间" prop="startTime">
          <el-date-picker
            v-model="form.startTime"
            type="datetime"
            placeholder="选择开始时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="结束时间" prop="endTime">
          <el-date-picker
            v-model="form.endTime"
            type="datetime"
            placeholder="选择结束时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 绑定秒杀项弹窗 -->
    <el-dialog v-model="manageDialogVisible" title="绑定秒杀项" width="900px" :close-on-click-modal="false">
      <div class="manage-dialog-content">
        <!-- 活动信息 -->
        <div class="activity-info-bar">
          <div class="activity-info-left">
            <span class="activity-name">{{ currentActivity.name }}</span>
            <el-tag :type="statusTagType(currentActivity.status)" size="small">
              {{ statusLabel(currentActivity.status) }}
            </el-tag>
            <el-tag :type="currentActivity.activityType === 1 ? 'primary' : 'warning'" size="small">
              {{ currentActivity.activityType === 1 ? '商品秒杀' : '订单券秒杀' }}
            </el-tag>
          </div>
          <el-button 
            v-if="(currentActivity.activityType === 1 && selectedProducts.length > 0) || (currentActivity.activityType === 2 && selectedCoupons.length > 0)" 
            type="primary" 
            size="small"
            @click="handleBatchBind"
          >
            绑定选中的秒杀项 ({{ currentActivity.activityType === 1 ? selectedProducts.length : selectedCoupons.length }})
          </el-button>
        </div>

        <!-- 商品列表 - 仅商品秒杀活动显示 -->
        <el-card v-if="currentActivity.activityType === 1" class="list-card" shadow="never">
          <template #header>
            <div class="card-header">
              <div class="header-left">
                <span>未绑定活动的秒杀商品</span>
                <el-tag v-if="selectedProducts.length > 0" type="primary" size="small">已选 {{ selectedProducts.length }} 个</el-tag>
              </div>
              <el-button type="primary" size="small" :icon="Plus" @click="goToAddProduct">添加商品</el-button>
            </div>
          </template>
          <el-table 
            :data="productList" 
            v-loading="productLoading" 
            stripe 
            border 
            size="small"
            @selection-change="handleProductSelectionChange"
          >
            <el-table-column type="selection" width="50" align="center" />
            <el-table-column prop="id" label="ID" width="60" align="center" />
            <el-table-column label="商品名称" min-width="180">
              <template #default="{ row }">
                <div class="product-info">
                  <el-image :src="row.productImage" fit="cover" class="product-thumb" />
                  <span class="product-name">{{ row.productName }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="商品规格" width="90" align="center">
              <template #default="{ row }">
                {{ row.specName || '无' }}
              </template>
            </el-table-column>
            <el-table-column label="原价" width="70" align="center">
              <template #default="{ row }">¥{{ row.originalPrice }}</template>
            </el-table-column>
            <el-table-column label="秒杀价" width="70" align="center">
              <template #default="{ row }"><span class="seckill-price">¥{{ row.seckillPrice }}</span></template>
            </el-table-column>
            <el-table-column prop="seckillStock" label="库存" width="55" align="center" />
            <el-table-column prop="soldCount" label="已售" width="55" align="center" />
            <el-table-column prop="perLimit" label="限购" width="55" align="center" />
            <el-table-column label="状态" width="70" align="center">
              <template #default="{ row }">
                <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">{{ row.status === 1 ? '上架' : '下架' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80" align="center" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="handleBindProduct(row)">绑定</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="pagination">
            <el-pagination v-model:current-page="productPagination.current" v-model:page-size="productPagination.size" :total="productPagination.total" :page-sizes="[5, 10]" layout="total, prev, pager, next" @click="loadProductList" />
          </div>
        </el-card>

        <!-- 订单券列表 - 仅订单券秒杀活动显示 -->
        <el-card v-if="currentActivity.activityType === 2" class="list-card" shadow="never">
          <template #header>
            <div class="card-header">
              <div class="header-left">
                <span>未绑定活动的秒杀订单券</span>
                <el-tag v-if="selectedCoupons.length > 0" type="primary" size="small">已选 {{ selectedCoupons.length }} 个</el-tag>
              </div>
              <el-button type="warning" size="small" :icon="Ticket" @click="goToAddCoupon">添加订单券</el-button>
            </div>
          </template>
          <el-table 
            :data="couponList" 
            v-loading="couponLoading" 
            stripe 
            border 
            size="small"
            @selection-change="handleCouponSelectionChange"
          >
            <el-table-column type="selection" width="50" align="center" />
            <el-table-column prop="id" label="ID" width="60" align="center" />
            <el-table-column label="券名称" min-width="140">
              <template #default="{ row }">
                <span class="coupon-name">{{ row.couponName }}</span>
              </template>
            </el-table-column>
            <el-table-column label="优惠" width="100" align="center">
              <template #default="{ row }">{{ formatCouponDetail(row) }}</template>
            </el-table-column>
            <el-table-column prop="couponRemained" label="库存" width="70" align="center" />
            <el-table-column label="已售" width="60" align="center">
              <template #default="{ row }">
                {{ (row.couponTotal || 0) - (row.couponRemained || 0) }}
              </template>
            </el-table-column>
            <el-table-column prop="couponPerLimit" label="限购" width="60" align="center" />
            <el-table-column label="领取时间" width="150" align="center">
              <template #default="{ row }">
                <div style="line-height: 1.4">
                  <div>{{ formatShortTime(row.couponReceiveStart) }}</div>
                  <div>~ {{ formatShortTime(row.couponReceiveEnd) }}</div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="70" align="center">
              <template #default="{ row }">
                <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">{{ row.status === 1 ? '上架' : '下架' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80" align="center" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="handleBindCoupon(row)">绑定</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="pagination">
            <el-pagination v-model:current-page="couponPagination.current" v-model:page-size="couponPagination.size" :total="couponPagination.total" :page-sizes="[5, 10]" layout="total, prev, pager, next" @change="loadCouponList" />
          </div>
        </el-card>
      </div>
    </el-dialog>

    <!-- 管理秒杀项弹窗（查看已绑定的秒杀项） -->
    <el-dialog v-model="viewItemsDialogVisible" title="管理秒杀项" width="900px" :close-on-click-modal="false">
      <div class="manage-dialog-content">
        <!-- 活动信息 -->
        <div class="activity-info-bar">
          <div class="activity-info-left">
            <span class="activity-name">{{ currentActivity.name }}</span>
            <el-tag :type="statusTagType(currentActivity.status)" size="small">
              {{ statusLabel(currentActivity.status) }}
            </el-tag>
            <el-tag :type="currentActivity.activityType === 1 ? 'primary' : 'warning'" size="small">
              {{ currentActivity.activityType === 1 ? '商品秒杀' : '订单券秒杀' }}
            </el-tag>
          </div>
          <el-button 
            v-if="(currentActivity.activityType === 1 && selectedBoundProducts.length > 0) || (currentActivity.activityType === 2 && selectedBoundCoupons.length > 0)" 
            type="danger" 
            size="small"
            @click="handleBatchDeleteAll"
          >
            批量删除 ({{ currentActivity.activityType === 1 ? selectedBoundProducts.length : selectedBoundCoupons.length }})
          </el-button>
        </div>

        <!-- 已绑定商品列表 - 仅商品秒杀活动显示 -->
        <el-card v-if="currentActivity.activityType === 1" class="list-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>已绑定的秒杀商品</span>
              <el-tag v-if="selectedBoundProducts.length > 0" type="primary" size="small">已选 {{ selectedBoundProducts.length }} 个</el-tag>
            </div>
          </template>
          <el-table 
            :data="boundProductList" 
            v-loading="boundProductLoading" 
            stripe 
            border 
            size="small"
            @selection-change="handleBoundProductSelectionChange"
          >
            <el-table-column type="selection" width="50" align="center" />
            <el-table-column prop="id" label="ID" width="60" align="center" />
            <el-table-column label="商品名称" min-width="160">
              <template #default="{ row }">
                <div class="product-info">
                  <el-image :src="row.productImage" fit="cover" class="product-thumb" />
                  <span class="product-name">{{ row.productName }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="商品规格" width="90" align="center">
              <template #default="{ row }">
                {{ row.specName || '无' }}
              </template>
            </el-table-column>
            <el-table-column label="原价" width="70" align="center">
              <template #default="{ row }">¥{{ row.originalPrice }}</template>
            </el-table-column>
            <el-table-column label="秒杀价" width="70" align="center">
              <template #default="{ row }"><span class="seckill-price">¥{{ row.seckillPrice }}</span></template>
            </el-table-column>
            <el-table-column prop="seckillStock" label="库存" width="60" align="center" />
            <el-table-column prop="soldCount" label="已售" width="60" align="center" />
            <el-table-column prop="perLimit" label="限购" width="60" align="center" />
            <el-table-column label="状态" width="70" align="center">
              <template #default="{ row }">
                <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">{{ row.status === 1 ? '上架' : '下架' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80" align="center" fixed="right">
              <template #default="{ row }">
                <el-button link type="danger" size="small" @click="handleDeleteBind([row.id], 1)">解除绑定</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="pagination">
            <el-pagination v-model:current-page="boundProductPagination.current" v-model:page-size="boundProductPagination.size" :total="boundProductPagination.total" :page-sizes="[5, 10]" layout="total, prev, pager, next" @change="loadBoundProductList" />
          </div>
        </el-card>

        <!-- 已绑定订单券列表 - 仅订单券秒杀活动显示 -->
        <el-card v-if="currentActivity.activityType === 2" class="list-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>已绑定的秒杀订单券</span>
              <el-tag v-if="selectedBoundCoupons.length > 0" type="primary" size="small">已选 {{ selectedBoundCoupons.length }} 个</el-tag>
            </div>
          </template>
          <el-table 
            :data="boundCouponList" 
            v-loading="boundCouponLoading" 
            stripe 
            border 
            size="small"
            @selection-change="handleBoundCouponSelectionChange"
          >
            <el-table-column type="selection" width="50" align="center" />
            <el-table-column prop="id" label="ID" width="60" align="center" />
            <el-table-column label="券名称" min-width="140">
              <template #default="{ row }">
                <span class="coupon-name">{{ row.couponName }}</span>
              </template>
            </el-table-column>
            <el-table-column label="优惠" width="100" align="center">
              <template #default="{ row }">{{ formatCouponDetail(row) }}</template>
            </el-table-column>
            <el-table-column prop="couponRemained" label="库存" width="70" align="center" />
            <el-table-column label="已售" width="60" align="center">
              <template #default="{ row }">
                {{ (row.couponTotal || 0) - (row.couponRemained || 0) }}
              </template>
            </el-table-column>
            <el-table-column prop="couponPerLimit" label="限购" width="60" align="center" />
            <el-table-column label="领取时间" width="150" align="center">
              <template #default="{ row }">
                <div style="line-height: 1.4">
                  <div>{{ formatShortTime(row.couponReceiveStart) }}</div>
                  <div>~ {{ formatShortTime(row.couponReceiveEnd) }}</div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="70" align="center">
              <template #default="{ row }">
                <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">{{ row.status === 1 ? '上架' : '下架' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80" align="center" fixed="right">
              <template #default="{ row }">
                <el-button link type="danger" size="small" @click="handleDeleteBind([row.id], 2)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="pagination">
            <el-pagination v-model:current-page="boundCouponPagination.current" v-model:page-size="boundCouponPagination.size" :total="boundCouponPagination.total" :page-sizes="[5, 10]" layout="total, prev, pager, next" @change="loadBoundCouponList" />
          </div>
        </el-card>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Search, Ticket, Link } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'
import dayjs from 'dayjs'

const router = useRouter()

const loading = ref(false)
const list = ref([])
const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})
const query = reactive({
  phase: null,
  status: null,
  activityType: null
})

const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref(null)
const submitting = ref(false)
const formRef = ref(null)

const form = reactive({
  name: '',
  activityType: 1,
  description: '',
  startTime: '',
  endTime: ''
})

// 管理秒杀项弹窗相关
const manageDialogVisible = ref(false)
const currentActivity = reactive({
  id: null,
  name: '',
  status: null,
  activityType: 1
})

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

// 多选相关
const selectedProducts = ref([])
const selectedCoupons = ref([])

// 查看已绑定秒杀项弹窗相关
const viewItemsDialogVisible = ref(false)

// 已绑定商品列表
const boundProductLoading = ref(false)
const boundProductList = ref([])
const boundProductPagination = reactive({
  current: 1,
  size: 5,
  total: 0
})

// 已绑定订单券列表
const boundCouponLoading = ref(false)
const boundCouponList = ref([])
const boundCouponPagination = reactive({
  current: 1,
  size: 5,
  total: 0
})

// 已绑定秒杀项多选相关
const selectedBoundProducts = ref([])
const selectedBoundCoupons = ref([])

const validateEndTime = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请选择结束时间'))
  } else if (form.startTime && dayjs(value).isBefore(dayjs(form.startTime))) {
    callback(new Error('结束时间必须晚于开始时间'))
  } else {
    callback()
  }
}

const rules = {
  name: [{ required: true, message: '请输入活动名称', trigger: 'blur' }],
  activityType: [{ required: true, message: '请选择活动类型', trigger: 'change' }],
  startTime: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  endTime: [
    { required: true, message: '请选择结束时间', trigger: 'change' },
    { validator: validateEndTime, trigger: 'change' }
  ]
}

// 阶段标签
const phaseLabel = (phase) => {
  const map = { 1: '未开始', 2: '进行中', 3: '已结束' }
  return map[phase] || '-'
}

const phaseTagType = (phase) => {
  const map = { 1: 'info', 2: 'success', 3: 'danger' }
  return map[phase] || 'info'
}

// 状态标签（启用/禁用）
const statusLabel = (status) => {
  const map = { 1: '启用', 2: '禁用' }
  return map[status] || '-'
}

const statusTagType = (status) => {
  const map = { 1: 'success', 2: 'info' }
  return map[status] || 'info'
}

const formatTime = (time) => {
  if (!time) return '-'
  return time.replace('T', ' ').slice(0, 19)
}

const formatShortTime = (time) => {
  if (!time) return '-'
  return time.replace('T', ' ').slice(0, 16)
}

const loadList = async () => {
  loading.value = true
  try {
    const res = await request.get('/admin/seckill/activity/page', {
      params: {
        page: pagination.page,
        size: pagination.size,
        phase: query.phase ?? undefined,
        status: query.status ?? undefined,
        activityType: query.activityType ?? undefined
      }
    })
    // 兼容不同后端返回格式：优先使用 list，其次 records
    const data = res.data || {}
    list.value = data.list || data.records || []
    pagination.total = data.total || 0
    console.log('接口返回数据:', res)
    console.log('解析后的列表:', list.value)
  } catch (err) {
    console.error('加载列表失败:', err)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadList()
}

const resetQuery = () => {
  query.phase = null
  query.status = null
  query.activityType = null
  handleSearch()
}

const resetForm = () => {
  Object.assign(form, {
    name: '',
    activityType: 1,
    description: '',
    startTime: '',
    endTime: ''
  })
}

const handleAdd = () => {
  isEdit.value = false
  editId.value = null
  resetForm()
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  editId.value = row.id
  Object.assign(form, {
    name: row.name,
    activityType: row.activityType,
    description: row.description || '',
    startTime: formatTime(row.startTime),
    endTime: formatTime(row.endTime)
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
      activityType: form.activityType,
      description: form.description,
      startTime: form.startTime,
      endTime: form.endTime
    }

    if (isEdit.value) {
      await request.put(`/admin/seckill/activity/${editId.value}`, data)
      ElMessage.success('修改成功')
    } else {
      await request.post('/admin/seckill/activity', data)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadList()
  } catch (err) {
    console.error('提交失败:', err)
  } finally {
    submitting.value = false
  }
}

const handleToggleStatus = async (row) => {
  const newStatus = row.status === 1 ? 2 : 1
  const actionText = newStatus === 1 ? '启用' : '禁用'
  try {
    await request.patch(`/admin/seckill/activity/${row.id}/status`, null, {
      params: { status: newStatus }
    })
    ElMessage.success(`${actionText}成功`)
    loadList()
  } catch (err) {
    console.error(`${actionText}失败:`, err)
  }
}

const handleDelete = async (row) => {
  try {
    await request.delete(`/admin/seckill/activity/${row.id}`)
    ElMessage.success('删除成功')
    loadList()
  } catch (err) {
    console.error('删除失败:', err)
  }
}

const handleManageItems = (row) => {
  Object.assign(currentActivity, {
    id: row.id,
    name: row.name,
    status: row.status,
    activityType: row.activityType
  })
  productPagination.current = 1
  couponPagination.current = 1
  selectedProducts.value = []
  selectedCoupons.value = []
  // 根据活动类型加载对应列表
  if (row.activityType === 1) {
    loadProductList()
  } else {
    loadCouponList()
  }
  manageDialogVisible.value = true
}

const loadProductList = async () => {
  productLoading.value = true
  try {
    const res = await request.get('/admin/seckill/item/product/list', {
      params: {
        current: productPagination.current,
        size: productPagination.size,
        onlyUnbound: true
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
        onlyUnbound: true
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

const handleBindProduct = async (row) => {
  try {
    await request.patch('/admin/seckill/activity/bind', {
      activityId: currentActivity.id,
      itemIds: [row.id]
    })
    ElMessage.success('绑定成功')
    loadProductList()
    loadList() // 刷新活动列表，更新秒杀项个数
  } catch (err) {
    console.error('绑定失败:', err)
  }
}

const handleBindCoupon = async (row) => {
  try {
    await request.patch('/admin/seckill/activity/bind', {
      activityId: currentActivity.id,
      itemIds: [row.id]
    })
    ElMessage.success('绑定成功')
    loadCouponList()
    loadList() // 刷新活动列表，更新秒杀项个数
  } catch (err) {
    console.error('绑定失败:', err)
  }
}

const handleProductSelectionChange = (selection) => {
  selectedProducts.value = selection
}

const handleCouponSelectionChange = (selection) => {
  selectedCoupons.value = selection
}

const handleBatchBind = async () => {
  const productIds = selectedProducts.value.map(item => item.id)
  const couponIds = selectedCoupons.value.map(item => item.id)
  const allIds = [...productIds, ...couponIds]
  
  if (allIds.length === 0) {
    ElMessage.warning('请先选择要绑定的秒杀项')
    return
  }
  
  try {
    await request.patch('/admin/seckill/activity/bind', {
      activityId: currentActivity.id,
      itemIds: allIds
    })
    ElMessage.success(`成功绑定 ${allIds.length} 个秒杀项`)
    selectedProducts.value = []
    selectedCoupons.value = []
    loadProductList()
    loadCouponList()
    loadList() // 刷新活动列表，更新秒杀项个数
  } catch (err) {
    console.error('批量绑定失败:', err)
  }
}

const formatCouponDetail = (row) => {
  if (row.couponDiscountType === 3) {
    return `无门槛 ${row.couponDiscountAmount}元`
  } else if (row.couponDiscountType === 2) {
    return `折扣 ${(row.couponDiscountRate * 10).toFixed(1)}折`
  }
  return '-'
}

const goToAddProduct = () => {
  manageDialogVisible.value = false
  router.push('/seckill/items?action=addProduct')
}

const goToAddCoupon = () => {
  manageDialogVisible.value = false
  router.push('/seckill/items?action=addCoupon')
}

// 查看已绑定的秒杀项
const handleViewItems = (row) => {
  Object.assign(currentActivity, {
    id: row.id,
    name: row.name,
    status: row.status,
    activityType: row.activityType
  })
  boundProductPagination.current = 1
  boundCouponPagination.current = 1
  selectedBoundProducts.value = []
  selectedBoundCoupons.value = []
  // 根据活动类型加载对应列表
  if (row.activityType === 1) {
    loadBoundProductList()
  } else {
    loadBoundCouponList()
  }
  viewItemsDialogVisible.value = true
}

// 加载已绑定的商品列表
const loadBoundProductList = async () => {
  boundProductLoading.value = true
  try {
    const res = await request.get('/admin/seckill/item/product/list', {
      params: {
        current: boundProductPagination.current,
        size: boundProductPagination.size,
        onlyUnbound: false,
        activityId: currentActivity.id
      }
    })
    const data = res.data || {}
    boundProductList.value = data.records || []
    boundProductPagination.total = data.total || 0
  } catch (err) {
    console.error('加载已绑定商品列表失败:', err)
  } finally {
    boundProductLoading.value = false
  }
}

// 加载已绑定的订单券列表
const loadBoundCouponList = async () => {
  boundCouponLoading.value = true
  try {
    const res = await request.get('/admin/seckill/item/coupon/list', {
      params: {
        current: boundCouponPagination.current,
        size: boundCouponPagination.size,
        onlyUnbound: false,
        activityId: currentActivity.id
      }
    })
    const data = res.data || {}
    boundCouponList.value = data.records || []
    boundCouponPagination.total = data.total || 0
  } catch (err) {
    console.error('加载已绑定订单券列表失败:', err)
  } finally {
    boundCouponLoading.value = false
  }
}

// 已绑定商品选择变化
const handleBoundProductSelectionChange = (selection) => {
  selectedBoundProducts.value = selection
}

// 已绑定订单券选择变化
const handleBoundCouponSelectionChange = (selection) => {
  selectedBoundCoupons.value = selection
}

// 删除绑定
const handleDeleteBind = async (itemIds, itemType) => {
  try {
    await request.patch('/admin/seckill/activity/bind/delete', {
      activityId: currentActivity.id,
      itemIds: itemIds
    })
    ElMessage.success('删除成功')
    // 刷新对应列表
    if (itemType === 1) {
      loadBoundProductList()
      selectedBoundProducts.value = []
    } else if (itemType === 2) {
      loadBoundCouponList()
      selectedBoundCoupons.value = []
    } else {
      // itemType为0时同时刷新两个列表
      loadBoundProductList()
      loadBoundCouponList()
      selectedBoundProducts.value = []
      selectedBoundCoupons.value = []
    }
    loadList() // 刷新活动列表，更新秒杀项个数
  } catch (err) {
    console.error('删除绑定失败:', err)
  }
}

// 批量删除绑定
const handleBatchDeleteBind = (selection, itemType) => {
  const itemIds = selection.map(item => item.id)
  if (itemIds.length === 0) {
    ElMessage.warning('请先选择要删除的秒杀项')
    return
  }
  handleDeleteBind(itemIds, itemType)
}

// 合并批量删除（商品和订单券一起）
const handleBatchDeleteAll = () => {
  const productIds = selectedBoundProducts.value.map(item => item.id)
  const couponIds = selectedBoundCoupons.value.map(item => item.id)
  const allIds = [...productIds, ...couponIds]
  
  if (allIds.length === 0) {
    ElMessage.warning('请先选择要删除的秒杀项')
    return
  }
  
  handleDeleteBind(allIds, 0) // itemType为0表示混合类型，删除后两个列表都刷新
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
.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

/* 管理秒杀项弹窗样式 */
.manage-dialog-content {
  max-height: 600px;
  overflow-y: auto;
}
.activity-info-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 4px;
}
.activity-info-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.activity-info-bar .activity-name {
  font-weight: 500;
  font-size: 16px;
}
.list-card {
  margin-bottom: 16px;
}
.list-card :deep(.el-card__header) {
  padding: 12px 16px;
}
.list-card :deep(.el-card__body) {
  padding: 12px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 500;
  font-size: 14px;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.product-info {
  display: flex;
  align-items: center;
  gap: 8px;
}
.product-thumb {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  border: 1px solid #ebeef5;
}
.product-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.coupon-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.coupon-name {
  font-weight: 500;
  font-size: 13px;
}
.coupon-detail {
  font-size: 11px;
  color: #909399;
}
.seckill-price {
  color: #f56c6c;
  font-weight: 500;
}
</style>
