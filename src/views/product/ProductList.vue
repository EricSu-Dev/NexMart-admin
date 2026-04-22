﻿﻿﻿﻿﻿﻿﻿﻿<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">商品管理</h2>
      <el-button type="primary" :icon="Plus" @click="openDialog()">新增商品</el-button>
    </div>

    <!-- 搜索栏 -->
    <el-card style="margin-bottom:16px">
      <el-form :model="query" inline>
        <el-form-item label="商品名称">
          <el-input v-model="query.keyword" placeholder="请输入关键字" clearable style="width:200px" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="query.categoryId" placeholder="全部分类" clearable style="width:140px">
            <el-option v-for="cat in categories" :key="cat.id" :label="cat.name" :value="cat.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部状态" clearable style="width:120px">
            <el-option label="上架" :value="1" />
            <el-option label="下架" :value="0" />
            <el-option label="售空" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="价格区间">
          <el-input-number v-model="query.minPrice" :min="0" :precision="2" :step="1" style="width:120px" />
          <span class="range-sep">-</span>
          <el-input-number v-model="query.maxPrice" :min="0" :precision="2" :step="1" style="width:120px" />
        </el-form-item>
        <el-form-item label="排序">
          <div class="sort-buttons">
            <el-button 
              :type="query.sortBy === 'id' ? 'primary' : 'default'" 
              :icon="query.sortBy === 'id' ? (query.sortOrder === 'asc' ? 'ArrowUp' : 'ArrowDown') : ''"
              @click="toggleSort('id')"
            >ID</el-button>
            <el-button 
              :type="query.sortBy === 'price' ? 'primary' : 'default'" 
              :icon="query.sortBy === 'price' ? (query.sortOrder === 'asc' ? 'ArrowUp' : 'ArrowDown') : ''"
              @click="toggleSort('price')"
            >价格</el-button>
            <el-button 
              :type="query.sortBy === 'sales' ? 'primary' : 'default'" 
              :icon="query.sortBy === 'sales' ? (query.sortOrder === 'asc' ? 'ArrowUp' : 'ArrowDown') : ''"
              @click="toggleSort('sales')"
            >销量</el-button>
            <el-button 
              :type="query.sortBy === 'stock' ? 'primary' : 'default'" 
              :icon="query.sortBy === 'stock' ? (query.sortOrder === 'asc' ? 'ArrowUp' : 'ArrowDown') : ''"
              @click="toggleSort('stock')"
            >库存</el-button>
            <el-button 
              :type="query.sortBy === 'createdAt' ? 'primary' : 'default'" 
              :icon="query.sortBy === 'createdAt' ? (query.sortOrder === 'asc' ? 'ArrowUp' : 'ArrowDown') : ''"
              @click="toggleSort('createdAt')"
            >更新时间</el-button>
          </div>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card>
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column label="封面" width="80">
          <template #default="{ row }">
            <el-image
              :src="row.coverUrl" fit="cover"
              style="width:48px;height:48px;border-radius:4px"
            >
              <template #error><div class="img-err">无图</div></template>
            </el-image>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="商品名称" min-width="160" />
        <el-table-column label="优惠活动" width="125">
          <template #default="{ row }">
            <span v-if="row.promotionName">{{ row.promotionName }}</span>
            <span v-else>无</span>
          </template>
        </el-table-column>
        <el-table-column prop="categoryName" label="分类" width="100" />
        <el-table-column prop="price" label="价格" width="90">
          <template #default="{ row }">¥{{ row.price }}</template>
        </el-table-column>
        <el-table-column prop="discountedPrice" label="活动价" width="90">
          <template #default="{ row }">
            <span v-if="row.discountedPrice">¥{{ row.discountedPrice }}</span>
            <span v-else>无</span>
          </template>
        </el-table-column>
        <el-table-column prop="sales" label="销量" width="70" />
        <el-table-column prop="stock" label="库存" width="70" />
        <el-table-column label="状态" width="70">
          <template #default="{ row }">
            <el-tag v-if="row.status === 1" type="success" size="small">上架</el-tag>
            <el-tag v-else-if="row.status === 2" type="danger" size="small">售空</el-tag>
            <el-tag v-else type="info" size="small">下架</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button text type="warning" size="small" @click="handleToggleStatus(row)">
              {{ row.status === 1 ? '下架' : '上架' }}
            </el-button>
            <el-button text type="primary" size="small" @click="openDialog(row)">编辑</el-button>
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

    <!-- 商品编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑商品' : '新增商品'" width="720px" :close-on-click-modal="false">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px" v-loading="formLoading">
        <el-form-item label="商品名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入商品名称" />
        </el-form-item>

        <el-form-item label="所属分类" prop="categoryId">
          <el-select v-model="form.categoryId" placeholder="请选择分类" style="width:100%">
            <el-option v-for="cat in categories" :key="cat.id" :label="cat.name" :value="cat.id" />
          </el-select>
        </el-form-item>

        <el-form-item label="价格" prop="price">
          <el-input-number
            v-model="form.price" :min="0.01" :precision="2" :step="1"
            style="width:100%" placeholder="请输入价格"
          />
        </el-form-item>

        <el-form-item label="库存" prop="stock">
          <el-input-number v-model="form.stock" :min="0" style="width:100%" />
        </el-form-item>

        <el-form-item label="商品封面">
          <div class="upload-area">
            <el-image
              v-if="form.coverUrl"
              :src="form.coverUrl" fit="cover"
              style="width:120px;height:120px;border-radius:8px;border:1px solid #eee"
            />
            <el-upload
              :show-file-list="false"
              accept="image/*"
              :before-upload="handleUpload"
            >
              <el-button :loading="uploading" :icon="Upload">
                {{ form.coverUrl ? '重新上传' : '上传图片' }}
              </el-button>
            </el-upload>
          </div>
        </el-form-item>

        <el-form-item label="商品描述">
          <el-input
            v-model="form.description" type="textarea"
            :rows="4" placeholder="请输入商品描述"
          />
        </el-form-item>

        <el-form-item label="上架状态">
          <el-radio-group v-model="form.status" @change="handleStatusChange">
            <el-radio :value="1">上架</el-radio>
            <el-radio :value="0">下架</el-radio>
            <el-radio :value="2">售空</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="开启规格">
          <el-radio-group v-model="form.hasSpec">
            <el-radio :value="1">开启</el-radio>
            <el-radio :value="0">关闭</el-radio>
          </el-radio-group>
        </el-form-item>

        <div v-if="form.hasSpec === 1" class="spec-container">
          <div class="spec-header">
            <span>商品规格列表(名称/排序值/库存)</span>
            <el-button type="primary" link @click="addSpec">+ 添加规格</el-button>
          </div>
          <div v-for="(spec, index) in form.productSpecList" :key="index" class="spec-item">
            <el-input v-model="spec.specName" placeholder="名称 (如: 黑色)" style="flex: 2" />
            <el-input-number v-model="spec.sort" :min="0"  style="width: 100px" />
            <el-input-number v-model="spec.stock" :min="0"  style="width: 100px" />
            <el-button type="danger" link @click="removeSpec(index)">删除</el-button>
          </div>
          <p v-if="form.productSpecList.length === 0" class="spec-tip">点击上方按钮添加规格</p>
        </div>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">
            {{ isEdit ? '保存修改' : '提交' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, ArrowUp, ArrowDown, Upload } from '@element-plus/icons-vue'
import { productApi } from '@/api/product'
import { categoryApi } from '@/api/category'
import { uploadApi } from '@/api/upload'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const list = ref([])
const categories = ref([])
const pagination = ref({ current: 1, size: 10, total: 0 })
const query = ref({
  keyword: '',
  categoryId: null,
  status: null,
  minPrice: null,
  maxPrice: null,
  sortBy: 'id',
  sortOrder: 'asc'
})

// 弹窗相关
const dialogVisible = ref(false)
const formRef = ref()
const formLoading = ref(false)
const submitting = ref(false)
const uploading = ref(false)
const currentEditId = ref(null)

const isEdit = computed(() => !!currentEditId.value)

const form = ref({
  name: '', categoryId: null, price: null,
  stock: 0, coverUrl: '', description: '', status: 1,
  hasSpec: 0, productSpecList: []
})

const rules = {
  name:       [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  categoryId: [{ required: true, message: '请选择分类',     trigger: 'change' }],
  price:      [{ required: true, message: '请输入价格',     trigger: 'blur' }],
  stock:      [{ required: true, message: '请输入库存',     trigger: 'blur' }]
}

// 保存之前的状态
let previousStatus = null

const loadList = async () => {
  loading.value = true
  try {
    const res = await productApi.getPage({
      current: pagination.value.current,
      size: pagination.value.size,
      keyword: query.value.keyword || undefined,
      categoryId: query.value.categoryId ?? undefined,
      status: query.value.status ?? undefined,
      minPrice: query.value.minPrice ?? undefined,
      maxPrice: query.value.maxPrice ?? undefined,
      sortBy: query.value.sortBy || undefined,
      sortOrder: query.value.sortOrder || undefined
    })
    list.value = res.data.records
    pagination.value.total = res.data.total
  } finally {
    loading.value = false
  }
}

const openDialog = async (row = null) => {
  currentEditId.value = row ? row.id : null
  if (row) {
    formLoading.value = true
    try {
      // 调用商品详情接口获取完整信息，包括规格
      const res = await productApi.getDetail(row.id)
      const detail = res.data
      form.value = {
        name: detail.name,
        categoryId: detail.categoryId,
        price: detail.price,
        stock: detail.stock,
        coverUrl: detail.coverUrl || '',
        description: detail.description || '',
        status: detail.status,
        hasSpec: detail.hasSpec || 0,
        productSpecList: detail.productSpecList || []
      }
      previousStatus = detail.status
    } finally {
      formLoading.value = false
    }
  } else {
    form.value = {
      name: '', categoryId: null, price: null,
      stock: 0, coverUrl: '', description: '', status: 1,
      hasSpec: 0, productSpecList: []
    }
    previousStatus = 1
  }
  dialogVisible.value = true
}

const handleUpload = async (file) => {
  uploading.value = true
  try {
    const res = await uploadApi.image(file)
    form.value.coverUrl = res.data
    ElMessage.success('上传成功')
  } finally {
    uploading.value = false
  }
  return false
}

const addSpec = () => {
  form.value.productSpecList.push({ specName: '', sort: 0, stock: 0 })
}

const removeSpec = (index) => {
  form.value.productSpecList.splice(index, 1)
}

const handleStatusChange = (status) => {
  if (status === 2 && form.value.stock > 0) {
    ElMessage.warning('请先将库存清零，再选择售空')
    setTimeout(() => {
      form.value.status = previousStatus || 1
    }, 100)
  } else {
    previousStatus = status
  }
}

const handleSubmit = async () => {
  await formRef.value.validate()
  
  if (form.value.hasSpec === 1) {
    if (form.value.productSpecList.length === 0) {
      ElMessage.warning('开启规格后，至少需要添加一个规格')
      return
    }
    if (form.value.productSpecList.some(s => !s.specName.trim())) {
      ElMessage.warning('请填写完整的规格名称')
      return
    }
  }

  if (form.value.status === 2 && form.value.stock > 0) {
    ElMessage.warning('请先将库存清零，再选择售空')
    return
  }

  submitting.value = true
  try {
    if (isEdit.value) {
      await productApi.update(currentEditId.value, form.value)
      ElMessage.success('修改成功')
    } else {
      await productApi.add(form.value)
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    loadList()
  } finally {
    submitting.value = false
  }
}

const handleSearch = () => {
  if (query.value.minPrice != null && query.value.maxPrice != null
    && query.value.minPrice > query.value.maxPrice) {
    ElMessage.error('最低价不能大于最高价')
    return
  }
  pagination.value.current = 1
  loadList()
}

const resetQuery = () => {
  query.value = {
    keyword: '',
    categoryId: null,
    status: null,
    minPrice: null,
    maxPrice: null,
    sortBy: 'id',
    sortOrder: 'asc'
  }
  handleSearch()
}

const toggleSort = (sortBy) => {
  if (query.value.sortBy === sortBy) {
    query.value.sortOrder = query.value.sortOrder === 'asc' ? 'desc' : 'asc'
  } else {
    query.value.sortBy = sortBy
    query.value.sortOrder = 'desc'
  }
  handleSearch()
}

const handleToggleStatus = async (row) => {
  const nextStatus = row.status === 1 ? 0 : 1
  const label = nextStatus === 1 ? '上架' : '下架'
  await ElMessageBox.confirm(`确定将商品「${row.name}」设为${label}？`, '提示', { type: 'warning' })
  await productApi.updateStatus(row.id, nextStatus)
  ElMessage.success('状态已更新')
  loadList()
}

const handleDelete = async (row) => {
  await ElMessageBox.confirm(`确定删除商品「${row.name}」？`, '提示', { type: 'warning' })
  await productApi.remove(row.id)
  ElMessage.success('删除成功')
  loadList()
}

onMounted(async () => {
  const res = await categoryApi.getList()
  categories.value = res.data
  loadList()
  
  // 检测查询参数，如果有 action=add 则自动打开新增弹窗
  if (route.query.action === 'add') {
    openDialog()
    // 清除查询参数，避免刷新时重复打开
    router.replace({ path: '/product', query: {} })
  }
})
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-title { font-size: 20px; color: #303133; margin: 0; }
.pagination { display: flex; justify-content: flex-end; margin-top: 16px; }
.img-err { width:48px; height:48px; background:#f5f7fa; display:flex; align-items:center; justify-content:center; font-size:11px; color:#c0c4cc; border-radius:4px; }
.range-sep { margin: 0 6px; color: #909399; }
.sort-buttons { display: flex; gap: 8px; }
.sort-buttons .el-button { min-width: 60px; }

/* 弹窗样式 */
.upload-area { display: flex; align-items: flex-end; gap: 16px; }

.spec-container {
  margin-bottom: 24px;
  background: #f9fafc;
  padding: 16px;
  border-radius: 8px;
  margin-left: 90px;
}
.spec-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-weight: bold;
  font-size: 14px;
  color: #606266;
}
.spec-item {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}
.spec-tip {
  text-align: center;
  color: #909399;
  font-size: 13px;
  margin: 10px 0;
}

/* 表格单元格自动换行 */
:deep(.el-table .cell) {
  white-space: normal !important;
  line-height: 1.4;
  word-break: break-word;
}
</style>
