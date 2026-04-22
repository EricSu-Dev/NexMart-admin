<template>
  <div class="home-section-container">
    <div class="page-header">
      <h2 class="page-title">首页模块管理</h2>
    </div>

    <div class="section-cards">
      <el-row :gutter="20">
        <el-col v-for="section in sections" :key="section.sectionType" :span="24" :xl="8" style="margin-bottom: 20px">
          <el-card class="section-card">
            <template #header>
              <div class="card-header">
                <span class="section-name">{{ getSectionName(section.sectionType) }}</span>
                <el-switch
                  v-model="section.status"
                  :active-value="1"
                  :inactive-value="0"
                  @change="handleUpdateSection(section)"
                />
              </div>
            </template>

            <div class="section-config">
              <el-form label-width="80px" size="small">
                <el-form-item label="配置模式">
                  <el-radio-group v-model="section.autoMode" @change="handleUpdateSection(section)">
                    <el-radio :label="1">{{ getAutoModeLabel(section.sectionType) }}</el-radio>
                    <el-radio :label="0">手动</el-radio>
                  </el-radio-group>
                </el-form-item>

                <el-form-item v-if="section.autoMode === 1" label="获取数量">
                  <el-input-number
                    v-model="section.autoLimit"
                    :min="1"
                    :max="50"
                    @change="handleUpdateSection(section)"
                  />
                  <span class="tip">取前 {{ section.autoLimit }} 条商品</span>
                </el-form-item>

                <div v-else class="manual-items">
                  <div class="manual-header">
                    <span class="label">精选商品列表</span>
                    <el-button type="primary" size="small" :icon="Plus" @click="openProductSelector(section.sectionType)">添加商品</el-button>
                  </div>
                  
                  <el-table
                    :data="sectionItems[section.sectionType] || []"
                    :row-key="row => row.itemId"
                    border
                    stripe
                    size="small"
                    class="drag-table"
                    :class="'drag-table-' + section.sectionType"
                  >
                    <el-table-column width="40" align="center">
                      <template #default>
                        <el-icon class="drag-handler" style="cursor: move"><Rank /></el-icon>
                      </template>
                    </el-table-column>
                    <el-table-column label="图片" width="70">
                      <template #default="{ row }">
                        <el-image :src="row.coverUrl" fit="cover" style="width: 40px; height: 40px; border-radius: 4px" />
                      </template>
                    </el-table-column>
                    <el-table-column prop="name" label="商品名称" show-overflow-tooltip />
                    <el-table-column label="操作" width="60" align="center">
                      <template #default="{ row }">
                        <el-button type="danger" link :icon="Delete" @click="handleRemoveItem(section.sectionType, row.itemId)" />
                      </template>
                    </el-table-column>
                  </el-table>
                  <p class="drag-tip">提示：长按左侧图标可拖拽排序</p>
                </div>
              </el-form>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 商品选择组件 -->
    <product-selector ref="selectorRef" @select="handleAddItem" />
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Delete, Rank } from '@element-plus/icons-vue'
import { homeSectionApi } from '@/api/homeSection'
import ProductSelector from '@/components/ProductSelector.vue'
import Sortable from 'sortablejs'

const sections = ref([])
const sectionItems = ref({})
const selectorRef = ref(null)
const currentType = ref(null)

const productList = ref([])
const productTotal = ref(0)
const loadingProducts = ref(false)
const productQuery = ref({
  current: 1,
  size: 10,
  keyword: '',
  categoryId: null
})

const getSectionName = (type) => {
  return { 1: '热销商品', 2: '新品上市', 3: '为你推荐' }[type] || '未知模块'
}

const loadCategories = async () => {
  try {
    const res = await categoryApi.getList()
    categories.value = res.data
  } catch (err) {}
}

// 根据模块类型返回自动模式的标签
const getAutoModeLabel = (type) => {
  const labels = {
    1: '自动 (销量前N)',
    2: '自动 (最新前N)',
    3: '自动 (随机)'
  }
  return labels[type] || '自动 (Top N)'
}

const loadData = async () => {
  try {
    const res = await homeSectionApi.getSections()
    sections.value = res.data
    // 加载每个模块的商品列表
    for (const section of sections.value) {
      if (section.autoMode === 0) {
        loadSectionItems(section.sectionType)
      }
    }
  } catch (err) {
    ElMessage.error('加载配置失败')
  }
}

const loadSectionItems = async (type) => {
  try {
    const res = await homeSectionApi.getSectionItems(type)
    sectionItems.value[type] = res.data
    // 初始化拖拽
    nextTick(() => {
      initDraggable(type)
    })
  } catch (err) {}
}

const handleUpdateSection = async (section) => {
  try {
    // 确保传递正确的参数类型
    const params = {
      autoMode: Number(section.autoMode),
      autoLimit: Number(section.autoLimit),
      status: Number(section.status)
    }
    console.log('Update section params:', section.sectionType, params)
    await homeSectionApi.updateSection(section.sectionType, params)
    ElMessage.success('配置已更新')
    if (section.autoMode === 0) {
      loadSectionItems(section.sectionType)
    }
  } catch (err) {
    ElMessage.error('更新失败')
    console.error('Update section error:', err)
  }
}

const openProductSelector = (type) => {
  currentType.value = type
  selectorRef.value.open()
}

const loadProducts = async () => {
  loadingProducts.value = true
  try {
    const res = await productApi.getPage({
      current: productQuery.value.current,
      size: productQuery.value.size,
      keyword: productQuery.value.keyword || undefined,
      categoryId: productQuery.value.categoryId || undefined
    })
    productList.value = res.data.records
    productTotal.value = res.data.total
  } catch (err) {
    ElMessage.error('获取商品列表失败')
  } finally {
    loadingProducts.value = false
  }
}

const handleAddItem = async (product) => {
  try {
    await homeSectionApi.addItem(currentType.value, product.id)
    ElMessage.success('添加成功')
    loadSectionItems(currentType.value)
  } catch (err) {
    ElMessage.error('商品已存在或添加失败')
  }
}

const handleRemoveItem = async (type, itemId) => {
  try {
    await homeSectionApi.removeItem(type, itemId)
    ElMessage.success('已移除')
    loadSectionItems(type)
  } catch (err) {
    ElMessage.error('删除失败')
  }
}

const initDraggable = (type) => {
  const el = document.querySelector(`.drag-table-${type} tbody`)
  if (!el) return
  
  // 销毁旧的实例（如果存在）
  if (el._sortable) el._sortable.destroy()

  el._sortable = Sortable.create(el, {
    handle: '.drag-handler',
    animation: 200,
    onEnd: async (evt) => {
      const items = sectionItems.value[type]
      const currRow = items.splice(evt.oldIndex, 1)[0]
      items.splice(evt.newIndex, 0, currRow)
      
      // 构建排序数据
      const sortData = items.map((item, index) => ({
        id: item.itemId,
        sort: index + 1
      }))
      
      try {
        await homeSectionApi.updateSort(type, sortData)
        ElMessage.success('排序已保存')
      } catch (err) {
        ElMessage.error('排序更新失败')
        loadSectionItems(type) // 恢复列表
      }
    }
  })
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.page-header { margin-bottom: 20px; }
.page-title { font-size: 20px; color: #303133; margin: 0; }

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.section-name {
  font-weight: bold;
  font-size: 16px;
}

.tip {
  margin-left: 10px;
  color: #909399;
  font-size: 12px;
}

.manual-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 15px 0 10px;
}
.manual-header .label {
  font-size: 14px;
  color: #606266;
}

.drag-table {
  margin-top: 10px;
}

.drag-tip {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
}

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
