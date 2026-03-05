/**
 * BroadcastChannel Composable
 * 管理与 PACS 系统的跨窗口通信
 */
import { ref, onMounted, onUnmounted } from 'vue'
import { broadcastManager } from '@/services/broadcast'
import { useDashboardStore } from '@/stores/dashboard'
import type { PatientInfo, ExamInfo } from '@/types'

/**
 * BroadcastChannel 组合式函数
 * 提供与 PACS 系统的通信能力
 */
export function useBroadcast() {
  const store = useDashboardStore()
  
  /** 是否支持 BroadcastChannel */
  const isSupported = ref(false)
  
  /** 是否已初始化 */
  const isInitialized = ref(false)
  
  /** PACS 连接状态 */
  const pacsConnected = ref(false)
  
  /** 清理函数列表 */
  const cleanupFns: Array<() => void> = []

  /**
   * 初始化 BroadcastChannel
   */
  function init(): boolean {
    isSupported.value = broadcastManager.checkSupport()
    
    if (!isSupported.value) {
      console.warn('[useBroadcast] 当前浏览器不支持 BroadcastChannel')
      return false
    }
    
    const success = broadcastManager.init()
    isInitialized.value = success
    
    if (success) {
      setupHandlers()
      // 请求同步当前数据
      broadcastManager.requestSync()
    }
    
    return success
  }

  /**
   * 关闭通道
   */
  function close(): void {
    cleanup()
    broadcastManager.close()
    isInitialized.value = false
    pacsConnected.value = false
    store.updateDeviceStatus({ pacs: false })
  }

  /**
   * 通知 PACS 患者选择变更
   */
  function notifyPatientSelected(patient: PatientInfo): void {
    if (!isInitialized.value) return
    broadcastManager.notifyPatientSelected(patient)
  }

  /**
   * 通知 PACS 检查更新
   */
  function notifyExamUpdated(exam: ExamInfo): void {
    if (!isInitialized.value) return
    broadcastManager.notifyExamUpdated(exam)
  }

  /**
   * 设置消息处理器
   */
  function setupHandlers(): void {
    // 监听患者选择（来自 PACS）
    const unsubPatient = broadcastManager.on<PatientInfo>('patient_selected', (data) => {
      store.setCurrentPatient(data)
      pacsConnected.value = true
      store.updateDeviceStatus({ pacs: true })
    })
    cleanupFns.push(unsubPatient)

    // 监听检查更新（来自 PACS）
    const unsubExam = broadcastManager.on<ExamInfo>('exam_updated', (data) => {
      if (data) {
        store.loadCurrentExam()
      }
    })
    cleanupFns.push(unsubExam)

    // 监听同步请求（来自 PACS）
    const unsubSyncReq = broadcastManager.on('sync_request', () => {
      broadcastManager.respondSync(
        store.currentPatient,
        store.currentExam
      )
      pacsConnected.value = true
      store.updateDeviceStatus({ pacs: true })
    })
    cleanupFns.push(unsubSyncReq)

    // 监听同步响应（来自 PACS）
    const unsubSyncResp = broadcastManager.on<{
      patientInfo: PatientInfo | null
      examInfo: ExamInfo | null
    }>('sync_response', (data) => {
      if (data.patientInfo) {
        store.setCurrentPatient(data.patientInfo)
      }
      pacsConnected.value = true
      store.updateDeviceStatus({ pacs: true })
    })
    cleanupFns.push(unsubSyncResp)
  }

  /**
   * 清理处理器
   */
  function cleanup(): void {
    cleanupFns.forEach(fn => fn())
    cleanupFns.length = 0
  }

  // 组件挂载时初始化
  onMounted(() => {
    init()
  })

  // 组件卸载时清理
  onUnmounted(() => {
    close()
  })

  return {
    isSupported,
    isInitialized,
    pacsConnected,
    init,
    close,
    notifyPatientSelected,
    notifyExamUpdated,
  }
}
