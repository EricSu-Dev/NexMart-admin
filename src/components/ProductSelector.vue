<template>
  <el-dialog v-model="visible" title="选择商品" width="850px" append-to-body>
    <div class="selector-filter">
      <el-select
        v-model="query.categoryId"
        placeholder="全部分类"
        clearable
        style="width: 160px"
        @change="handleSearch"
      >
        <el-option
          v-for="item in categories"
          :key="item.id"
          :label="item.name"
          :value="item.id"
        />
      </el-select>
      <el-input
        v-model="query.keyword"
        placeholder="搜索商品名称"
        clearable
        style="width: 260px"
        @keyup.enter="handleSearch"
      />
      <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
      <el-button type="success" :icon="Plus" @click="handleAddProduct">添加商品</el-button>
    </div>

    <el-table v-loading="loading" :data="list" height="400px" stripe border size="small">
      <el-table-column label="商品图" width="80" align="center">
        <template #default="{ row }">
          <el-image :src="row.coverUrl" fit="cover" style="width: 50px; height: 50px; border-radius: 4px" />
        </template>
      </el-table-column>
      <el-table-column prop="name" label="名称" show-overflow-tooltip />
      <el-table-column prop="price" label="价格" width="100" align="right">
        <template #default="{ row }">¥{{ row.price }}</template>
      </el-table-column>
      <el-table-column prop="stock" label="库存" width="80" align="center" />
      <el-table-column label="操作" width="100" align="center">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="handleSelect(row)">选择</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination">
      <el-pagination
        v-model:current-page="query.current"
        v-model:page-size="query.size"
        :total="total"
        layout="total, prev, pager, next"
        @current-change="loadData"
      />
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { Search, Plus } from '@element-plus/icons-vue'
import { productApi } from '@/api/product'
import { categoryApi } from '@/api/category'
import { ElMessage } from 'element-plus'

const emit = defineEmits(['select', 'add'])

const visible = ref(false)
const loading = ref(false)
const list = ref([])
const total = ref(0)
const categories = ref([])

const query = reactive({
  current: 1,
  size: 10,
  keyword: '',
  categoryId: null
})

const loadCategories = async () => {
  try {
    const res = await categoryApi.getList()
    categories.value = res.data
  } catch (err) {}
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await productApi.getPage({
      current: query.current,
      size: query.size,
      keyword: query.keyword || undefined,
      categoryId: query.categoryId || undefined
    })
    list.value = res.data.records
    total.value = res.data.total
  } catch (err) {
    ElMessage.error('获取商品列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  query.current = 1
  loadData()
}

const handleSelect = (row) => {
  emit('select', row)
  visible.value = false
}

const handleAddProduct = () => {
  emit('add')
  visible.value = false
}

const open = () => {
  visible.value = true
  query.current = 1
  query.keyword = ''
  query.categoryId = null
  loadData()
  if (categories.value.length === 0) loadCategories()
}

defineExpose({ open })
</script>

<style scoped>
.selector-filter {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}
.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>
