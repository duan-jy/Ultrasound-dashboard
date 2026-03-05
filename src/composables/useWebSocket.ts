/**
 * WebSocket Composable
 * 管理 WebSocket 连接和消息处理
 */
import { ref, onMounted, onUnmounted } from 'vue'
import { wsManager } from '@/services/websocket'
import { useDashboardStore } from '@/stores/dashboard'
import type { WebSocketStatus, AnalysisResultItem, PatientInfo } from '@/types'

/**
 * WebSocket 组合式函数
 * 提供 WebSocket 连接管理和消息处理
 */
export function useWebSocket() {
  const store = useDashboardStore()
  
  /** 连接状态 */
  const status = ref<WebSocketStatus>('disconnected')
  
  /** 是否正在连接 */
  const isConnecting = ref(false)
  
  /** 清理函数列表 */
  const cleanupFns: Array<() => void> = []

  /**
   * 连接 WebSocket
   */
  function connect(): void {
    if (isConnecting.value) return
    
    isConnecting.value = true
    wsManager.connect()
  }

  /**
   * 断开连接
   */
  function disconnect(): void {
    wsManager.disconnect()
  }

  /**
   * 发送消息
   */
  function send<T>(type: string, data: T): boolean {
    return wsManager.send(type as never, data)
  }

  /**
   * 设置消息处理器
   */
  function setupHandlers(): void {
    // 监听连接状态变化
    const unsubStatus = wsManager.onStatusChange((newStatus) => {
      status.value = newStatus
      store.setWsStatus(newStatus)
      
      if (newStatus === 'connected') {
        isConnecting.value = false
        store.updateDeviceStatus({ aiService: true })
      } else if (newStatus === 'disconnected' || newStatus === 'error') {
        isConnecting.value = false
        store.updateDeviceStatus({ aiService: false })
      }
    })
    cleanupFns.push(unsubStatus)

    // 监听患者信息更新
    const unsubPatient = wsManager.on<PatientInfo>('patient_info', (data) => {
      store.setCurrentPatient(data)
    })
    cleanupFns.push(unsubPatient)

    // 监听 AI 分析结果
    const unsubAnalysis = wsManager.on<AnalysisResultItem>('analysis_result', (data) => {
      store.addRealtimeResult(data)
    })
    cleanupFns.push(unsubAnalysis)

    // 监听检查开始
    const unsubExamStart = wsManager.on('exam_start', () => {
      store.loadCurrentExam()
    })
    cleanupFns.push(unsubExamStart)

    // 监听检查结束
    const unsubExamEnd = wsManager.on('exam_end', () => {
      store.loadCurrentExam()
      store.loadAnalysisReport()
    })
    cleanupFns.push(unsubExamEnd)

    // 监听错误消息
    const unsubError = wsManager.on<{ message: string }>('error', (data) => {
      store.addNotification('error', '服务器错误', data.message)
    })
    cleanupFns.push(unsubError)
  }

  /**
   * 清理所有处理器
   */
  function cleanup(): void {
    cleanupFns.forEach(fn => fn())
    cleanupFns.length = 0
  }

  // 组件挂载时设置处理器
  onMounted(() => {
    setupHandlers()
  })

  // 组件卸载时清理
  onUnmounted(() => {
    cleanup()
  })

  return {
    status,
    isConnecting,
    connect,
    disconnect,
    send,
  }
}
