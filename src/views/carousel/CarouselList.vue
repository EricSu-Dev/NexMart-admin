<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">轮播图管理</h2>
      <el-button type="primary" :icon="Plus" @click="openDialog()">新增轮播图</el-button>
    </div>

    <el-card>
      <el-table :data="list" v-loading="loading" stripe fit>
        <el-table-column prop="id" label="ID" width="70" align="left" header-align="left" />
        <el-table-column label="图片" width="120" align="left" header-align="left">
          <template #default="{ row }">
            <el-image
              :src="row.imageUrl"
              :preview-src-list="[row.imageUrl]"
              :preview-teleported="true"
              fit="cover"
              style="width:80px;height:40px;border-radius:4px;cursor:pointer"
            >
              <template #error><div class="img-err">无图</div></template>
            </el-image>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" min-width="150" align="left" header-align="left" />
        <el-table-column prop="productId" label="商品ID" min-width="100" align="left" header-align="left" />
        <el-table-column prop="productName" label="商品名称" min-width="150" align="left" header-align="left" show-overflow-tooltip />
        <el-table-column prop="sort" label="排序值" min-width="100" align="left" header-align="left" />
        <el-table-column label="状态" min-width="90" align="left" header-align="left">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
              {{ row.status === 1 ? '显示' : '隐藏' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right" align="left" header-align="left">
          <template #default="{ row }">
            <el-button
              text
              type="warning"
              size="small"
              @click="handleToggleStatus(row)"
            >{{ row.status === 1 ? '隐藏' : '显示' }}</el-button>
            <el-button text type="primary" size="small" @click="openDialog(row)">编辑</el-button>
            <el-button text type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>


    </el-card>

    <!-- 轮播图编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑轮播图' : '新增轮播图'" width="500px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入轮播图标题" />
        </el-form-item>
        <el-form-item label="图片" prop="imageUrl">
          <div class="upload-area">
            <el-image
              v-if="form.imageUrl"
              :src="form.imageUrl"
              :preview-src-list="[form.imageUrl]"
              :preview-teleported="true"
              fit="cover"
              style="width:100%;height:180px;border-radius:8px;border:1px solid #eee;cursor:pointer"
            />
            <el-upload
              :show-file-list="false"
              :before-upload="beforeUpload"
              action="#"
              class="uploader"
            >
              <el-button :loading="uploading" v-if="!form.imageUrl" type="primary">上传图片</el-button>
              <el-button :loading="uploading" v-else type="primary">更换图片</el-button>
            </el-upload>
          </div>
        </el-form-item>
        <el-form-item label="关联商品" prop="productId">
          <div class="product-select-area">
            <div v-if="form.productId" class="selected-product">
              <el-tag type="success" closable @close="clearProduct">{{ selectedProductName || '商品ID: ' + form.productId }}</el-tag>
            </div>
            <el-button type="primary" plain size="small" @click="openProductSelector">{{ form.productId ? '更换商品' : '选择商品' }}</el-button>
          </div>
        </el-form-item>
        <el-form-item label="排序值" prop="sort">
          <el-input-number v-model="form.sort" :min="0" style="width:100%" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 商品选择组件 -->
    <product-selector ref="selectorRef" @select="handleProductSelect" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { carouselApi } from '@/api/carousel'
import { uploadApi } from '@/api/upload'
import ProductSelector from '@/components/ProductSelector.vue'

const list = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const uploading = ref(false)
const selectorRef = ref(null)
const selectedProductName = ref('')

const form = reactive({
  title: '',
  imageUrl: '',
  productId: '',
  sort: 0,
  status: 1
})

const rules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  productId: [{ required: true, message: '请输入商品ID', trigger: 'blur' }]
}

const loadList = async () => {
  loading.value = true
  try {
    const res = await carouselApi.getPage()
    list.value = res.data
  } catch (error) {
    ElMessage.error('获取轮播图列表失败')
  } finally {
    loading.value = false
  }
}

const openDialog = (row = null) => {
  if (row) {
    isEdit.value = true
    Object.assign(form, row)
    selectedProductName.value = row.productName || ''
  } else {
    isEdit.value = false
    Object.assign(form, {
      title: '',
      imageUrl: '',
      productId: '',
      sort: 0,
      status: 1
    })
    selectedProductName.value = ''
  }
  dialogVisible.value = true
}

const submitForm = async () => {
  await formRef.value.validate()
  try {
    if (isEdit.value) {
      await carouselApi.update(form.id, form)
      ElMessage.success('更新成功')
    } else {
      await carouselApi.add(form)
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    loadList()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const openProductSelector = () => {
  selectorRef.value.open()
}

const handleProductSelect = (product) => {
  form.productId = product.id
  selectedProductName.value = product.name
}

const clearProduct = () => {
  form.productId = ''
  selectedProductName.value = ''
}

const handleToggleStatus = async (row) => {
  const nextStatus = row.status === 1 ? 0 : 1
  const label = nextStatus === 1 ? '显示' : '隐藏'
  await ElMessageBox.confirm(`确定将轮播图「${row.title}」设为${label}？`, '提示', { type: 'warning' })
  try {
    await carouselApi.updateStatus(row.id, nextStatus)
    ElMessage.success('状态已更新')
    loadList()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const handleDelete = async (row) => {
  await ElMessageBox.confirm(`确定删除轮播图「${row.title}」？`, '提示', { type: 'warning' })
  try {
    await carouselApi.remove(row.id)
    ElMessage.success('删除成功')
    loadList()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const beforeUpload = async (file) => {
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    ElMessage.error('只能上传图片文件')
    return false
  }
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过2MB')
    return false
  }

  uploading.value = true
  try {
    const res = await uploadApi.image(file)
    form.imageUrl = res.data
    ElMessage.success('上传成功')
  } catch (error) {
    // 错误通常借由拦截器上报，不需赘述
  } finally {
    uploading.value = false
  }
  return false // 阻止 el-upload 默认的浏览器上传行为
}

onMounted(() => {
  loadList()
})
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-title { font-size: 20px; color: #303133; margin: 0; }
.upload-area { margin-top: 8px; }
.uploader { margin-top: 12px; }
.img-err { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #f5f7fa; color: #909399; font-size: 12px; }
.product-select-area { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.selected-product { display: flex; align-items: center; }
</style>