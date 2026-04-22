import { ElNotification } from 'element-plus'

const WS_URL = 'ws://localhost:8087/ws/order'
const RECONNECT_DELAY = 3000
const ORDER_AUDIO = new URL('../叮咚，你有新订单.mp3', import.meta.url).href

let ws = null
let reconnectTimer = null
let isManualClose = false

function playOrderSound() {
  const audio = new Audio(ORDER_AUDIO)
  audio.play().catch(e => console.warn('[WebSocket] 音频播放失败:', e))
}

function connect() {
  if (ws && ws.readyState === WebSocket.OPEN) {
    return
  }

  ws = new WebSocket(WS_URL)

  ws.onopen = () => {
    console.log('[WebSocket] 连接成功')
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
  }

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      handleMessage(data)
    } catch (e) {
      console.error('[WebSocket] 消息解析失败:', e)
    }
  }

  ws.onerror = (error) => {
    console.error('[WebSocket] 连接错误:', error)
  }

  ws.onclose = () => {
    console.log('[WebSocket] 连接关闭')
    if (!isManualClose) {
      reconnect()
    }
  }
}

function handleMessage(data) {
  const { type, orderId, amount, time } = data

  if (type === 'NEW_ORDER') {
    playOrderSound()
    ElNotification({
      title: '新订单通知',
      message: `订单 #${orderId} 支付成功，金额 ¥${amount}，时间 ${time}`,
      type: 'success',
      duration: 0,
      position: 'top-right'
    })
  } else if (type === 'REFUND_APPLY') {
    ElNotification({
      title: '退款申请通知',
      message: `订单 #${orderId} 申请退款，金额 ¥${amount}，时间 ${time}`,
      type: 'warning',
      duration: 0,
      position: 'top-right'
    })
  } else if (type === 'CANCEL_ORDER') {
    ElNotification({
      title: '取消订单通知',
      message: `订单 #${orderId} 已取消，金额 ¥${amount}，时间 ${time}`,
      type: 'info',
      duration: 0,
      position: 'top-right'
    })
  } else if (type === 'CANCEL_REFUND_APPLY') {
    ElNotification({
      title: '取消退款申请通知',
      message: `订单 #${orderId} 已取消退款申请，金额 ¥${amount}，时间 ${time}`,
      type: 'info',
      duration: 0,
      position: 'top-right'
    })
  }
}

function reconnect() {
  if (reconnectTimer) {
    return
  }
  console.log(`[WebSocket] ${RECONNECT_DELAY / 1000} 秒后尝试重连...`)
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null
    connect()
  }, RECONNECT_DELAY)
}

function disconnect() {
  isManualClose = true
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  if (ws) {
    ws.close()
    ws = null
  }
}

export function useWebSocket() {
  return {
    connect,
    disconnect
  }
}
