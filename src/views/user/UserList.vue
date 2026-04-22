<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">用户管理</h2>
    </div>

    <el-card style="margin-bottom:16px">
      <el-form inline>
        <el-form-item label="用户名">
          <el-input v-model="query.keyword" placeholder="请输入用户名" clearable style="width:200px" />
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
        <el-table-column prop="username"  label="用户名" width="180" />
        <el-table-column label="邮箱"  min-width="180" show-overflow-tooltip>
          <template #default="{ row }">{{ row.email || '无' }}</template>
        </el-table-column>
        <el-table-column prop="phone"     label="手机号" width="180">
          <template #default="{ row }">{{ row.phone || '—' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="注册时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 1"
              text type="danger" size="small"
              @click="toggleStatus(row, 0)"
            >禁用</el-button>
            <el-button
              v-else
              text type="success" size="small"
              @click="toggleStatus(row, 1)"
            >启用</el-button>
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { userApi } from '@/api/user'

const loading = ref(false)
const list = ref([])
const pagination = ref({ current: 1, size: 10, total: 0 })
const query = ref({ keyword: '' })

const loadList = async () => {
  loading.value = true
  try {
    const res = await userApi.getPage({
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

const toggleStatus = async (row, status) => {
  const action = status === 1 ? '启用' : '禁用'
  await ElMessageBox.confirm(`确定${action}用户「${row.username}」？`, '提示', { type: 'warning' })
  await userApi.updateStatus(row.id, status)
  ElMessage.success(`${action}成功`)
  loadList()
}

onMounted(loadList)
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-title { font-size: 20px; color: #303133; margin: 0; }
.pagination { display: flex; justify-content: flex-end; margin-top: 16px; }
</style>
