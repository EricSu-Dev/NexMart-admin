<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">分类管理</h2>
      <el-button type="primary" :icon="Plus" @click="openDialog()">新增分类</el-button>
    </div>

    <el-card>
      <el-table :data="list" v-loading="loading" stripe fit>
        <el-table-column prop="id" label="ID" width="200" align="left" header-align="left" />
        <el-table-column
          prop="name"
          label="分类名称"
          min-width="150"
          align="left"
          header-align="left"
        />
        <el-table-column prop="sortOrder" label="排序值" width="120" />
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
              {{ row.status === 1 ? '显示' : '隐藏' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="320" fixed="right" align="left" header-align="left">
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

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑分类' : '新增分类'" width="440px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="排序值">
          <el-input-number v-model="form.sortOrder" :min="0" style="width:100%" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">显示</el-radio>
            <el-radio :value="0">隐藏</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { categoryApi } from '@/api/category'

const loading = ref(false)
const submitting = ref(false)
const list = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref()
const editId = ref(null)

const defaultForm = () => ({ name: '', sortOrder: 0, status: 1 })
const form = ref(defaultForm())

const rules = {
  name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }]
}

const loadList = async () => {
  loading.value = true
  try {
    const res = await categoryApi.getList()
    list.value = res.data
  } finally {
    loading.value = false
  }
}

const openDialog = (row = null) => {
  isEdit.value = !!row
  editId.value = row?.id || null
  form.value = row ? { name: row.name, sortOrder: row.sortOrder, status: row.status } : defaultForm()
  dialogVisible.value = true
  formRef.value?.clearValidate()
}

const handleSubmit = async () => {
  await formRef.value.validate()
  submitting.value = true
  try {
    if (isEdit.value) {
      await categoryApi.update(editId.value, form.value)
      ElMessage.success('修改成功')
    } else {
      await categoryApi.add(form.value)
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    loadList()
  } finally {
    submitting.value = false
  }
}

const handleToggleStatus = async (row) => {
  const nextStatus = row.status === 1 ? 0 : 1
  const label = nextStatus === 1 ? '显示' : '隐藏'
  await ElMessageBox.confirm(`确定将分类「${row.name}」设为${label}？`, '提示', { type: 'warning' })
  await categoryApi.update(row.id, {
    name: row.name,
    sortOrder: row.sortOrder,
    status: nextStatus
  })
  ElMessage.success('状态已更新')
  loadList()
}

const handleDelete = async (row) => {
  await ElMessageBox.confirm(`确定删除分类「${row.name}」？`, '提示', { type: 'warning' })
  await categoryApi.remove(row.id)
  ElMessage.success('删除成功')
  loadList()
}

onMounted(loadList)
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-title { font-size: 20px; color: #303133; margin: 0; }
</style>
