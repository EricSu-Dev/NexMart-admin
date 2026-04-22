import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { customerServiceApi } from '@/api/customerService'
import { useAdminStore } from './admin'
import { ElMessage } from 'element-plus'

export const useCustomerServiceStore = defineStore('customerService', () => {
  const adminStore = useAdminStore()
  const sessionList = ref([])
  const wsConnected = ref(false)
  const currentSessionId = ref(null)
  let onMessageCallback = null // 消息回调，用于通知聊天页面
  let ws = null
  let heartbeatTimer = null
  let reconnectTimer = null
  let isUnmounted = false

  // 计算属性：统计所有会话的未读总数 (3 + 1 = 4)
  const totalUnreadCount = computed(() => {
    return sessionList.value.reduce((sum, item) => sum + (item.unreadCount || 0), 0)
  })

  // 加载会话列表
  const fetchSessions = async (keyword = '') => {
    try {
      const res = await customerServiceApi.getSessionList({ 
        current: 1, 
        size: 100, 
        keyword 
      })
      sessionList.value = res.data.records || []
    } catch (err) {
      console.error('[CS Store] 加载会话失败', err)
    }
  }

  // 初始化 WebSocket
  const initWebSocket = () => {
    if (ws || isUnmounted) return
    
    const adminId = adminStore.userInfo?.id
    if (!adminId) return

    const role = adminStore.isBoss ? 'ROLE_BOSS' : 'ROLE_ADMIN'
    const wsUrl = `ws://localhost:8087/ws/cs/websocket?userId=${adminId}&role=${role}`
    
    ws = new WebSocket(wsUrl)
    
    ws.onopen = () => {
      wsConnected.value = true
      console.log('[CS WS] Connected')
      startHeartbeat()
    }
    
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data)
      
      // 已读回执消息处理
      if (data.action === 'READ_ACK' && data.sessionId) {
        const s = sessionList.value.find(x => String(x.sessionId) === String(data.sessionId))
        if (s) {
          // 如果是对方已读了我的消息
          // 这里的具体消息列表更新由页面级处理，Store 只管会话列表的大状态
        }
        return
      }

      // 新消息处理
      if (data.sessionId && data.id) {
        // 如果页面注册了回调，则通知页面（用于更新聊天记录列表）
        if (onMessageCallback) {
          onMessageCallback(data)
        }

        const s = sessionList.value.find(x => String(x.sessionId) === String(data.sessionId))
        if (s) {
          s.lastMessage = data.content || '[图片/卡片]'
          s.lastMessageTime = data.createdAt
          // 如果不是当前选中的会话，且是用户发的消息，增加未读数
          if (String(data.sessionId) !== String(currentSessionId.value) && data.senderType !== 2) {
            s.unreadCount = (s.unreadCount || 0) + 1
          }
        } else {
          fetchSessions() // 不在列表中则重新加载
        }
      }
    }
    
    ws.onclose = () => {
      wsConnected.value = false
      stopHeartbeat()
      if (!isUnmounted) {
        if (reconnectTimer) clearTimeout(reconnectTimer)
        reconnectTimer = setTimeout(initWebSocket, 5000)
      }
    }
  }

  const startHeartbeat = () => {
    if (heartbeatTimer) clearInterval(heartbeatTimer)
    heartbeatTimer = setInterval(() => {
      if (ws && ws.readyState === WebSocket.OPEN && currentSessionId.value) {
        ws.send(JSON.stringify({
          action: 'READ_ACK',
          sessionId: currentSessionId.value
        }))
      }
    }, 3000)
  }

  const stopHeartbeat = () => {
    if (heartbeatTimer) clearInterval(heartbeatTimer)
  }

  const closeWebSocket = () => {
    isUnmounted = true
    if (ws) {
      ws.onclose = null
      ws.close()
      ws = null
    }
    stopHeartbeat()
    if (reconnectTimer) clearTimeout(reconnectTimer)
  }

  // 发送消息的方法封装（统一入口）
  const sendWsMessage = (payload) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload))
      return true
    }
    ElMessage.error('网路连接未准备好')
    return false
  }

  // 页面注册/注销回调的方法
  const registerMessageCallback = (cb) => { onMessageCallback = cb }
  const unregisterMessageCallback = () => { onMessageCallback = null }

  return {
    sessionList,
    wsConnected,
    currentSessionId,
    totalUnreadCount,
    fetchSessions,
    initWebSocket,
    closeWebSocket,
    sendWsMessage,
    startHeartbeat,
    stopHeartbeat,
    registerMessageCallback,
    unregisterMessageCallback
  }
})
