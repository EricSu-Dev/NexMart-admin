<template>
  <div class="checkin-container">
    <div class="page-header">
      <h2 class="page-title">签到积分管理</h2>
    </div>

    <el-card>
      <el-table :data="list" v-loading="loading" stripe border style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="consecutiveDays" label="连续签到天数" min-width="200" align="center">
          <template #default="{ row }">
            <span v-if="row.consecutiveDays === 0">默认</span>
            <span v-else>连续签到{{ row.consecutiveDays }}天</span>
          </template>
        </el-table-column>
        <el-table-column prop="points" label="奖励积分" min-width="150" align="center">
          <template #default="{ row }">
            <el-tag type="warning" size="small">{{ row.points }} 积分</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="150" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEditPoints(row)">编辑积分</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { checkinRuleApi } from '@/api/checkinRule'

const loading = ref(false)
const list = ref([])

const loadList = async () => {
  loading.value = true
  try {
    const res = await checkinRuleApi.getList()
    list.value = res.data
  } catch (err) {
    ElMessage.error('获取签到规则失败')
  } finally {
    loading.value = false
  }
}

const handleEditPoints = async (row) => {
  try {
    const { value } = await ElMessageBox.prompt('请输入新的奖励积分', '修改积分', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPattern: /^[1-9]\d*$/,
      inputErrorMessage: '请输入大于 0 的整数',
      inputValue: row.points.toString()
    })
    if (value) {
      await checkinRuleApi.update(row.id, parseInt(value))
      ElMessage.success('积分修改成功')
      loadList()
    }
  } catch (err) {
    // 取消操作
  }
}

onMounted(() => {
  loadList()
})
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 30px;
}
.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}
.checkin-container {
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 20px;
}
.el-card {
  margin-bottom: 30px;
}
.el-table {
  width: 100% !important;
}
.el-table th,
.el-table td {
  font-size: 14px;
  padding: 16px 8px;
}
</style>
