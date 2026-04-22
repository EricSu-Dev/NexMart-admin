<template>
  <div class="cs-admin-page">
    <div class="cs-container">
      <!-- 左侧：会话列表 -->
      <aside class="session-sidebar">
        <div class="sidebar-header">
          <el-input
            v-model="sessionKeyword"
            placeholder="搜索会话..."
            :prefix-icon="Search"
            clearable
            @input="loadSessions"
          />
        </div>
        <div class="session-list" v-loading="sessionsLoading">
          <div
            v-for="item in csStore.sessionList"
            :key="item.sessionId"
            class="session-item"
            :class="{ active: csStore.currentSessionId === item.sessionId }"
            @click="selectSession(item)"
          >
            <el-avatar :size="45" :src="item.avatar || undefined" class="user-avatar">
              {{ item.username.charAt(0) }}
            </el-avatar>
            <div class="session-info">
              <div class="info-top">
                <span class="username">{{ item.username }}</span>
                <span class="time">{{ formatTime(item.lastMessageTime) }}</span>
              </div>
              <div class="info-bottom">
                <span class="last-msg">{{ item.lastMessage }}</span>
                <el-badge v-if="item.unreadCount > 0" :value="item.unreadCount" class="unread-badge" />
              </div>
            </div>
          </div>
          <el-empty v-if="csStore.sessionList.length === 0" description="暂无会话" />
        </div>
      </aside>

      <!-- 右侧：聊天窗口 -->
      <main class="chat-window">
        <template v-if="currentSession">
          <header class="chat-header">
            <span class="chat-title">{{ currentSession.username }}</span>
            <span class="ws-status" :class="{ connected: csStore.wsConnected }">
              {{ csStore.wsConnected ? '已连接' : '未连接' }}
            </span>
          </header>

          <div class="message-area" ref="messageBox">
            <div v-loading="messagesLoading" style="height: 100%" v-if="messagesLoading"></div>
            <div v-else class="message-list">
              <div
                v-for="msg in messages"
                :key="msg.id"
                class="message-row"
                :class="{ 'self': msg.senderType === 2 }" 
              >
                <el-avatar
                  v-if="msg.senderType !== 2"
                  :size="36"
                  :src="currentSession.avatar || undefined"
                  class="msg-avatar"
                >
                  {{ currentSession.username.charAt(0) }}
                </el-avatar>
                <template v-else>
                  <el-avatar
                    v-if="msg.senderId === adminStore.userInfo?.id"
                    :size="36"
                    :src="adminStore.userInfo?.avatarUrl || undefined"
                    class="msg-avatar"
                  >
                    {{ adminStore.userInfo?.username?.charAt(0) || '客' }}
                  </el-avatar>
                  <el-avatar
                    v-else
                    :size="36"
                    class="msg-avatar other-agent-avatar"
                  >
                    客服
                  </el-avatar>
                </template>
                
                <div class="msg-content">
                  <div v-if="msg.type === 1" class="msg-bubble text-content">
                    {{ msg.content }}
                  </div>
                  <div v-else-if="msg.type === 2" class="image-content">
                    <el-image
                      v-for="(img, idx) in (msg.imageList || [])"
                      :key="idx"
                      :src="img"
                      :preview-src-list="msg.imageList"
                      fit="cover"
                      class="chat-img"
                      @load="scrollToBottom"
                    />
                  </div>
                  <div v-else-if="msg.type === 3 && msg.productCard" class="card-content product-card">
                     <img :src="msg.productCard.coverImage" />
                     <div class="card-info">
                       <p class="name">{{ msg.productCard.name }}</p>
                       <p v-if="msg.productCard.promotionName" class="promotion-name">{{ msg.productCard.promotionName }}</p>
                       <div class="price-info">
                         <span v-if="msg.productCard.discountedPrice" class="discounted-price">¥{{ msg.productCard.discountedPrice }}</span>
                         <span v-else class="discounted-price">¥{{ msg.productCard.price }}</span>
                         <span v-if="msg.productCard.discountedPrice" class="original-price">¥{{ msg.productCard.price }}</span>
                         <span v-if="msg.productCard.sales" class="sales-info">已售{{ msg.productCard.sales }}件</span>
                       </div>
                     </div>
                  </div>
                  <div v-else-if="msg.type === 4 && msg.orderCard" class="order-card-container">
                    <div class="order-card">
                      <div class="order-card-left">
                        <img :src="msg.orderCard.firstItemImage" class="order-card-image" />
                      </div>
                      <div class="order-card-right">
                        <p class="order-card-order-no">订单号: {{ msg.orderCard.orderNo }}</p>
                        <p class="order-card-item-name">
                          {{ msg.orderCard.firstItemName }}
                          <span class="order-card-item-count">等 {{ msg.orderCard.itemCount }} 件</span>
                        </p>
                        <p v-if="msg.orderCard.promotionName" class="order-card-promotion">{{ msg.orderCard.promotionName }}</p>
                        <div class="order-card-amount">
                          <span v-if="msg.orderCard.actualTotalAmount && msg.orderCard.actualTotalAmount !== msg.orderCard.totalAmount" class="order-card-actual-amount">¥{{ msg.orderCard.actualTotalAmount }}</span>
                          <span v-else class="order-card-actual-amount">¥{{ msg.orderCard.totalAmount }}</span>
                          <span v-if="msg.orderCard.actualTotalAmount && msg.orderCard.actualTotalAmount !== msg.orderCard.totalAmount" class="order-card-original-amount">¥{{ msg.orderCard.totalAmount }}</span>
                          <span class="order-card-status">({{ msg.orderCard.statusDesc }})</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="msg-footer">
                    <span v-if="msg.senderType === 2" class="read-status" :class="{ 'is-read': msg.isRead === 1 }">
                      {{ msg.isRead === 1 ? '已读' : '未读' }}
                    </span>
                    <span class="msg-time">{{ formatTime(msg.createdAt) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <footer class="chat-footer">
            <div class="tool-bar">
              <!-- 表情 -->
              <el-popover placement="top-start" :width="300" trigger="click">
                <template #reference>
                  <el-button circle text class="emoji-trigger-btn">
                    <svg viewBox="0 0 1024 1024" width="20" height="20" style="vertical-align: middle;">
                      <path fill="currentColor" d="M512 64a448 448 0 1 1 0 896 448 448 0 0 1 0-896zm0 80a368 368 0 1 0 0 736 368 368 0 0 0 0-736zm-144 272a48 48 0 1 1 0 96 48 48 0 0 1 0-96zm288 0a48 48 0 1 1 0 96 48 48 0 0 1 0-96zm-144 192c81.6 0 155.2 46.4 192 115.2-12.8 9.6-27.2 16-41.6 19.2-28.8-54.4-86.4-89.6-150.4-89.6s-121.6 35.2-150.4 89.6c-14.4-3.2-28.8-9.6-41.6-19.2 36.8-68.8 110.4-115.2 192-115.2z"></path>
                    </svg>
                  </el-button>
                </template>
                <div class="emoji-picker">
                  <span v-for="e in emojis" :key="e" @click="inputMessage += e">{{ e }}</span>
                </div>
              </el-popover>
              <!-- 图片 -->
              <el-button :icon="Picture" circle text @click="triggerImageUpload" />
              <!-- 商品 -->
              <el-button :icon="Goods" circle text @click="productDialogVisible = true" />
            </div>
            <div class="input-container">
                <el-input
                v-model="inputMessage"
                type="textarea"
                :rows="2"
                placeholder="请输入消息... (Ctrl+Enter 发送)"
                resize="none"
                @keyup.ctrl.enter="sendMessage"
                @keyup.enter.exact.prevent="sendMessage"
              />
              <div class="send-btn-wrap">
                <el-button type="primary" @click="sendMessage" :disabled="!inputMessage.trim() && !csStore.wsConnected">发送</el-button>
              </div>
            </div>
          </footer>
        </template>
        <template v-else>
          <div class="empty-chat">
            <el-icon :size="60" color="#e4e7ed"><ChatDotRound /></el-icon>
            <p>选择一个会话开始聊天</p>
          </div>
        </template>
      </main>
    </div>

    <!-- 隐藏的文件上传 -->
    <input type="file" ref="fileInput" hidden accept="image/*" multiple @change="onImageSelected" />

    <!-- 商品选择对话框 -->
    <el-dialog v-model="productDialogVisible" title="选择要发送的商品" width="800px">
      <div class="selector-filter">
        <el-input 
          v-model="productSearch.keyword" 
          placeholder="搜索商品名称..." 
          @input="loadProducts" 
          clearable 
          style="width: 300px; margin-right: 15px;"
        />
        <el-select
          v-model="productSearch.categoryId"
          placeholder="全部分类"
          clearable
          style="width: 200px;"
          @change="loadProducts"
        >
          <el-option
            v-for="item in categoryList"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </el-select>
      </div>
      <el-table :data="productItems" v-loading="productsLoading" style="width: 100%" height="400">
        <el-table-column property="coverUrl" label="图片" width="80">
          <template #default="{ row }">
            <el-image :src="row.coverUrl" style="width: 50px; height: 50px" fit="cover" />
          </template>
        </el-table-column>
        <el-table-column property="name" label="商品名称" show-overflow-tooltip />
        <el-table-column label="活动名称" width="150" show-overflow-tooltip>
          <template #default="{ row }">{{ row.promotionName || '无' }}</template>
        </el-table-column>
        <el-table-column label="价格" width="120">
          <template #default="{ row }">
            <div v-if="row.discountedPrice" class="price-info">
              <div class="discounted-price">¥{{ row.discountedPrice }}</div>
              <div class="original-price">¥{{ row.price }}</div>
            </div>
            <div v-else>¥{{ row.price }}</div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80">
          <template #default="{ row }">
            <el-button link type="primary" @click="sendProduct(row)">发送</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="selector-pagination">
        <el-pagination
          v-model:current-page="productSearch.current"
          layout="prev, pager, next"
          :total="productTotal"
          @current-change="loadProducts"
        />
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Search, ChatDotRound, Picture, Goods } from '@element-plus/icons-vue'
import { useAdminStore } from '@/stores/admin'
import { useCustomerServiceStore } from '@/stores/customerService'
import { customerServiceApi } from '@/api/customerService'
import { productApi } from '@/api/product'
import { categoryApi } from '@/api/category'
import { uploadApi } from '@/api/upload'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import { emojis } from '@/utils/emojis'

const router = useRouter()
const route = useRoute()
const adminStore = useAdminStore()
const csStore = useCustomerServiceStore()

const inputMessage = ref('')
const messageBox = ref(null)
const fileInput = ref(null)

// 会话展示相关 (Store中管理列表)
const sessionKeyword = ref('')
const currentSession = ref(null)
const sessionsLoading = ref(false)

// 页面消息列表
const messages = ref([])
const messagesLoading = ref(false)

// 选择弹窗
const productDialogVisible = ref(false)
const productItems = ref([])
const productTotal = ref(0)
const productSearch = ref({ current: 1, size: 10, keyword: '', categoryId: '' })
const productsLoading = ref(false)
const categoryList = ref([])

const formatTime = (time) => time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : ''

// 加载会话列表 (通过 Store 刷新)
const loadSessions = async () => {
  sessionsLoading.value = true
  await csStore.fetchSessions(sessionKeyword.value)
  sessionsLoading.value = false
}

// 选中会话
const selectSession = async (session) => {
  currentSession.value = session
  csStore.currentSessionId = session.sessionId
  messages.value = []
  loadHistory(session.sessionId)
  
  // 重置 Store 中的未读数
  session.unreadCount = 0
  csStore.startHeartbeat() // 开启当前会话的心跳
  
  // 更新 URL 保持状态
  router.replace({ query: { ...route.query, sessionId: session.sessionId } })
}

// 加载历史记录
const loadHistory = async (sessionId) => {
  messagesLoading.value = true
  try {
    const res = await customerServiceApi.getHistory(sessionId)
    messages.value = res.data || []
  } catch (err) {
    ElMessage.error('加载消息失败')
  } finally {
    messagesLoading.value = false
    scrollToBottom()
  }
}

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (messageBox.value) {
      messageBox.value.scrollTop = messageBox.value.scrollHeight
    }
  })
}

// 发送消息
const sendMessage = () => {
  const content = inputMessage.value.trim()
  if (!content || !csStore.wsConnected || !currentSession.value) return
  
  const payload = {
    action: 'MESSAGE',
    sessionId: currentSession.value.sessionId,
    type: 1,
    content: content,
    senderType: 2,
    senderId: adminStore.userInfo?.id
  }
  
  if (csStore.sendWsMessage(payload)) {
    const localMsg = {
      id: Date.now(),
      sessionId: currentSession.value.sessionId,
      senderType: 2,
      senderId: adminStore.userInfo?.id,
      type: 1,
      content: content,
      createdAt: new Date().toISOString()
    }
    messages.value.push(localMsg)
    inputMessage.value = ''
    scrollToBottom()
  }
}

// 图片上传相关
const triggerImageUpload = () => {
  if (fileInput.value) fileInput.value.value = '' 
  fileInput.value.click()
}

const onImageSelected = async (e) => {
  const files = e.target.files
  if (!files.length) return
  for (let file of files) {
    try {
      const res = await uploadApi.image(file)
      sendImage(res.data)
    } catch (err) {
      ElMessage.error('图片上传失败')
    }
  }
}

const sendImage = (url) => {
  const payload = {
    action: 'MESSAGE',
    sessionId: currentSession.value.sessionId,
    type: 2,
    images: url,
    senderType: 2,
    senderId: adminStore.userInfo?.id
  }
  if (csStore.sendWsMessage(payload)) {
    const localMsg = {
      id: Date.now(),
      sessionId: currentSession.value.sessionId,
      senderType: 2,
      senderId: adminStore.userInfo?.id,
      type: 2,
      imageList: [url],
      createdAt: new Date().toISOString()
    }
    messages.value.push(localMsg)
    scrollToBottom()
  }
}

// 商品相关
const loadCategories = async () => {
  try {
    const res = await categoryApi.getList()
    categoryList.value = res.data || []
  } catch (err) {
    console.error('加载分类失败', err)
  }
}

const loadProducts = async () => {
  productsLoading.value = true
  try {
    const res = await productApi.getPage(productSearch.value)
    productItems.value = res.data.records
    productTotal.value = res.data.total
  } finally {
    productsLoading.value = false
  }
}

const sendProduct = (item) => {
  const payload = {
    action: 'MESSAGE',
    sessionId: currentSession.value.sessionId,
    type: 3,
    productId: item.id,
    senderType: 2,
    senderId: adminStore.userInfo?.id
  }
  if (csStore.sendWsMessage(payload)) {
    const localMsg = {
      id: Date.now(),
      sessionId: currentSession.value.sessionId,
      senderType: 2,
      senderId: adminStore.userInfo?.id,
      type: 3,
      productCard: {
        productId: item.id,
        name: item.name,
        coverImage: item.coverUrl,
        price: item.price,
        promotionName: item.promotionName || null,
        discountedPrice: item.discountedPrice || null,
        sales: item.sales || 0
      },
      createdAt: new Date().toISOString()
    }
    messages.value.push(localMsg)
    productDialogVisible.value = false
    scrollToBottom()
  }
}

watch(productDialogVisible, (val) => {
  if (val) {
    loadCategories()
    loadProducts()
  }
})

// 处理全局推送来的消息
const handleIncomingMessage = (data) => {
  // 如果是当前正在聊天的会话的消息
  if (String(data.sessionId) === String(csStore.currentSessionId)) {
    // 处理回执 (对方已读)
    if (data.action === 'READ_ACK') {
      messages.value.forEach(m => {
        if (m.senderType === 2) m.isRead = 1
      })
      return
    }

    // 处理新消息 (只有别人发的才追加, 因为自己发的本地已经追加了)
    if (data.id && data.senderType !== 2) {
      messages.value.push(data)
      scrollToBottom()
    }
  }
}

onMounted(async () => {
  // 注册全局消息回调
  csStore.registerMessageCallback(handleIncomingMessage)
  
  // 初始加载列表
  await csStore.fetchSessions()
  
  // 恢复 URL 会话
  const querySessionId = route.query.sessionId
  if (querySessionId) {
    const session = csStore.sessionList.find(s => String(s.sessionId) === String(querySessionId))
    if (session) {
      selectSession(session)
    }
  }
})

onUnmounted(() => {
  csStore.unregisterMessageCallback()
  csStore.currentSessionId = null
  csStore.stopHeartbeat()
})
</script>

<style scoped>
.cs-admin-page {
  height: calc(100vh - 120px);
  background: #f5f7fa;
  padding: 10px;
}

.cs-container {
  display: flex;
  height: 100%;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  overflow: hidden;
}

/* Sidebar */
.session-sidebar {
  width: 240px;
  border-right: 1px solid #ebeef5;
  display: flex;
  flex-direction: column;
}
.sidebar-header {
  padding: 15px;
  border-bottom: 1px solid #f0f2f5;
}
.session-list {
  flex: 1;
  overflow-y: auto;
}
.session-item {
  display: flex;
  padding: 12px 15px;
  cursor: pointer;
  transition: background 0.2s;
  align-items: center;
}
.session-item:hover {
  background: #f9fafc;
}
.session-item.active {
  background: #edf5ff;
}
.user-avatar {
  margin-right: 12px;
  flex-shrink: 0;
  background: #409eff;
}
.session-info {
  flex: 1;
  min-width: 0;
}
.info-top {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}
.username {
  font-weight: 500;
  font-size: 14px;
  color: #303133;
}
.time {
  font-size: 12px;
  color: #909399;
}
.info-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.last-msg {
  font-size: 12px;
  color: #909399;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}
.unread-badge {
  margin-left: 5px;
}

/* Chat Window */
.chat-window {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}
.chat-header {
  height: 60px;
  padding: 0 20px;
  background: white;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.chat-title {
  font-size: 16px;
  font-weight: 600;
}
.ws-status {
  font-size: 12px;
  color: #909399;
}
.ws-status.connected::before {
  content: '●';
  color: #67c23a;
  margin-right: 4px;
}

.message-area {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}
.message-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.message-row {
  display: flex;
  gap: 12px;
}
.message-row.self {
  flex-direction: row-reverse;
}

.msg-content {
  max-width: 70%;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.message-row.self .msg-content {
  align-items: flex-end;
}

.msg-footer {
  display: flex;
  align-items: center;
  gap: 8px;
}

.read-status {
  font-size: 11px;
  color: #c0c4cc;
}
.read-status.is-read {
  color: #409eff;
}

.msg-bubble {
  padding: 10px 14px;
  border-radius: 8px;
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  font-size: 14px;
  color: #303133;
  line-height: 1.5;
  word-break: break-all;
}
.message-row.self .msg-bubble {
  background: #409eff;
  color: white;
}

.text-content {
  white-space: pre-wrap;
}

.msg-avatar {
  flex-shrink: 0;
  background-color: #409eff !important;
  color: #fff !important;
}
.other-agent-avatar {
  background-color: #409eff !important;
  font-size: 12px;
  color: #fff;
}
.msg-time {
  font-size: 11px;
  color: #c0c4cc;
}

.image-content .chat-img {
  max-width: 200px;
  max-height: 200px;
  border-radius: 4px;
}

/* 商品卡片样式 */
.card-content {
  display: flex;
  gap: 10px;
  background: white;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid #ebeef5;
  width: 220px;
}
.card-content img {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
}
.card-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.card-info .name {
  font-size: 13px;
  margin: 0 0 4px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}
.card-info .promotion-name {
  font-size: 12px;
  color: #f56c6c;
  margin: 0 0 4px 0;
  font-weight: 500;
}
.card-info .price-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 4px 0 0 0;
  flex-wrap: wrap;
}
.card-info .discounted-price {
  color: #f56c6c;
  font-weight: 500;
  font-size: 16px;
}
.card-info .original-price {
  color: #909399;
  font-size: 12px;
  text-decoration: line-through;
}
.card-info .sales-info {
  font-size: 12px;
  color: #909399;
  margin: 0;
  white-space: nowrap;
}

/* 订单卡片样式 */
.order-card-container {
  background: white;
  border-radius: 4px;
  border: 1px solid #ebeef5;
  padding: 12px;
  width: 320px;
}
.order-card {
  display: flex;
  gap: 12px;
}
.order-card-left {
  flex-shrink: 0;
}
.order-card-image {
  width: 70px;
  height: 70px;
  object-fit: cover;
  border-radius: 4px;
}
.order-card-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.order-card-order-no {
  font-size: 12px;
  color: #909399;
  margin: 0;
}
.order-card-item-name {
  font-size: 14px;
  color: #303133;
  margin: 0;
  font-weight: 500;
}
.order-card-item-count {
  font-size: 12px;
  color: #909399;
  font-weight: normal;
  margin-left: 4px;
}
.order-card-promotion {
  font-size: 12px;
  color: #f56c6c;
  margin: 0;
  font-weight: 500;
}
.order-card-amount {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 4px;
}
.order-card-actual-amount {
  color: #f56c6c;
  font-weight: 500;
  font-size: 16px;
}
.order-card-original-amount {
  color: #909399;
  font-size: 12px;
  text-decoration: line-through;
}
.order-card-status {
  color: #909399;
  font-size: 12px;
  font-weight: normal;
}

/* Footer */
.chat-footer {
  height: 150px;
  background: white;
  border-top: 1px solid #ebeef5;
  display: flex;
  flex-direction: column;
}
.tool-bar {
  padding: 5px 15px;
  display: flex;
  gap: 10px;
}
.emoji-trigger-btn {
  font-size: 20px;
  padding: 0;
}
.input-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0 15px 10px;
}
.input-container :deep(.el-textarea__inner) {
  border: none;
  box-shadow: none;
  padding: 5px 0;
  font-size: 14px;
}
.send-btn-wrap {
  display: flex;
  justify-content: flex-end;
}

.empty-chat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #909399;
}

/* Emoji Picker */
.emoji-picker {
  display: flex;
  flex-wrap: wrap;
  max-height: 200px;
  overflow-y: auto;
  gap: 8px;
  padding: 10px;
}
.emoji-picker span {
  cursor: pointer;
  font-size: 20px;
  transition: transform 0.1s;
}
.emoji-picker span:hover {
  transform: scale(1.2);
}

.selector-filter {
  margin-bottom: 15px;
}
.selector-pagination {
  margin-top: 15px;
  display: flex;
  justify-content: flex-end;
}

/* 价格信息样式 */
.price-info {
  line-height: 1.3;
  font-size: 12px;
}

.discounted-price {
  color: #f56c6c;
  font-weight: 500;
  font-size: 14px;
}

.original-price {
  text-decoration: line-through;
  color: #909399;
  font-size: 11px;
  margin-top: 2px;
}
</style>
