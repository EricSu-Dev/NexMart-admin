<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">员工管理</h2>
      <el-button type="primary" :icon="Plus" @click="showRegisterDialog = true">添加员工</el-button>
    </div>

    <el-card style="margin-bottom:16px">
      <el-form inline>
        <el-form-item label="员工名">
          <el-input v-model="query.keyword" placeholder="请输入员工名" clearable style="width:200px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card>
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="id"        label="ID"   width="100" />
        <el-table-column prop="username" label="员工名" width="140" />
        <el-table-column label="邮箱"  min-width="180" show-overflow-tooltip>
          <template #default="{ row }">{{ row.email || '无' }}</template>
        </el-table-column>
        <el-table-column prop="phone"     label="手机号" width="180">
          <template #default="{ row }">{{ row.phone || '—' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
              {{ row.status === 1 ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="添加时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 1"
              link
              type="warning"
              @click="handleDisable(row)"
            >
              禁用
            </el-button>
            <el-button
              v-else
              link
              type="success"
              @click="handleEnable(row)"
            >
              启用
            </el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
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

    <!-- 注册员工弹窗 -->
    <el-dialog
      v-model="showRegisterDialog"
      title="添加员工"
      width="450px"
      @closed="resetForm"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="80px"
        label-position="top"
        style="padding: 0 10px"
      >
        <el-form-item label="员工名" prop="username">
          <el-input v-model="form.username" placeholder="请输入员工登录名" />
        </el-form-item>
        <el-form-item label="初始密码" prop="password">
          <el-input v-model="form.password" type="password" show-password placeholder="请输入密码" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" maxlength="11" placeholder="11 位手机号，必填" />
        </el-form-item>
        <el-form-item label="邮箱（选填）" prop="email">
          <el-input v-model="form.email" placeholder="不填可留空" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRegisterDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleRegister">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus } from '@element-plus/icons-vue'
import { getEmployeePage, registerEmployee, deleteEmployee, updateEmployeeStatus } from '@/api/admin-account'

const loading = ref(false)
const list = ref([])
const pagination = ref({ current: 1, size: 10, total: 0 })
const query = ref({ keyword: '' })

const showRegisterDialog = ref(false)
const submitting = ref(false)
const formRef = ref()
const form = ref({
  username: '',
  password: '',
  email: '',
  phone: ''
})

const rules = {
  username: [
    { required: true, message: '请输入员工名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的 11 位手机号', trigger: 'blur' }
  ],
  email: [
    {
      validator: (_rule, value, callback) => {
        if (!value || !String(value).trim()) {
          callback()
          return
        }
        const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim())
        callback(ok ? undefined : new Error('邮箱格式不正确'))
      },
      trigger: 'blur'
    }
  ]
}

const loadList = async () => {
  loading.value = true
  try {
    const res = await getEmployeePage({
      current: pagination.value.current,
      size: pagination.value.size,
      keyword: query.value.keyword || undefined
    })
    list.value = res.data.records
    pagination.value.total = res.data.total
  } finally {
    loading.value = false
  }
}

const handleSearch = () => { pagination.value.current = 1; loadList() }
const resetQuery = () => { query.value = { keyword: '' }; handleSearch() }

const handleRegister = async () => {
  if (!formRef.value) return
  await formRef.value.validate()

  submitting.value = true
  try {
    const payload = {
      username: form.value.username.trim(),
      password: form.value.password,
      phone: form.value.phone.trim(),
      email: form.value.email?.trim() || undefined
    }
    await registerEmployee(payload)
    ElMessage.success('员工添加成功')
    showRegisterDialog.value = false
    loadList()
  } finally {
    submitting.value = false
  }
}

const resetForm = () => {
  if (formRef.value) formRef.value.resetFields()
}

const handleDisable = (row) => {
  ElMessageBox.confirm(`确定禁用员工「${row.username}」？禁用后将无法登录。`, '禁用', {
    type: 'warning',
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  })
    .then(async () => {
      await updateEmployeeStatus(row.id, 0)
      ElMessage.success('已禁用')
      loadList()
    })
    .catch(() => {})
}

const handleEnable = (row) => {
  ElMessageBox.confirm(`确定重新启用员工「${row.username}」？`, '启用', {
    type: 'info',
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  })
    .then(async () => {
      await updateEmployeeStatus(row.id, 1)
      ElMessage.success('已启用')
      loadList()
    })
    .catch(() => {})
}

const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定删除员工「${row.username}」？此操作不可恢复。`,
    '删除员工',
    { type: 'error', confirmButtonText: '删除', cancelButtonText: '取消' }
  )
    .then(async () => {
      await deleteEmployee(row.id)
      ElMessage.success('已删除')
      loadList()
    })
    .catch(() => {})
}

onMounted(loadList)
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.page-title { font-size: 20px; color: #303133; margin: 0; }
.pagination { display: flex; justify-content: flex-end; margin-top: 20px; }
</style>
