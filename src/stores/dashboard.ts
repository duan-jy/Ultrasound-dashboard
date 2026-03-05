/**
 * Dashboard Store
 * 超声智能体大屏核心状态管理
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { 
  PatientInfo, 
  ExamInfo, 
  AnalysisReport, 
  AnalysisResultItem,
  CapturedImage,
  DeviceStatus,
  VoiceStatus,
  WebSocketStatus,
  SystemNotification
} from '@/types'
import { patientApi, examApi, analysisApi, imageApi } from '@/services/api'

export const useDashboardStore = defineStore('dashboard', () => {
  // ============ 状态定义 ============
  
  /** 当前患者信息 */
  const currentPatient = ref<PatientInfo | null>(null)
  
  /** 当前检查信息 */
  const currentExam = ref<ExamInfo | null>(null)
  
  /** AI 分析报告 */
  const analysisReport = ref<AnalysisReport | null>(null)
  
  /** 实时分析结果列表 */
  const realtimeResults = ref<AnalysisResultItem[]>([])
  
  /** 截图列表 */
  const capturedImages = ref<CapturedImage[]>([])
  
  /** 设备连接状态 */
  const deviceStatus = ref<DeviceStatus>({
    ultrasound: false,
    camera: false,
    aiService: false,
    pacs: false,
  })
  
  /** 语音状态 */
  const voiceStatus = ref<VoiceStatus>('idle')
  
  /** WebSocket 连接状态 */
  const wsStatus = ref<WebSocketStatus>('disconnected')
  
  /** 系统通知列表 */
  const notifications = ref<SystemNotification[]>([])
  
  /** 加载状态 */
  const loading = ref({
    patient: false,
    exam: false,
    analysis: false,
    images: false,
  })
  
  /** 错误信息 */
  const error = ref<string | null>(null)

  // ============ 计算属性 ============
  
  /** 是否有活动的检查 */
  const hasActiveExam = computed(() => {
    return currentExam.value?.status === 'in-progress'
  })
  
  /** 异常结果数量 */
  const abnormalResultCount = computed(() => {
    return realtimeResults.value.filter(
      r => r.level === 'abnormal' || r.level === 'critical'
    ).length
  })
  
  /** 需要关注的结果数量 */
  const attentionResultCount = computed(() => {
    return realtimeResults.value.filter(r => r.level === 'attention').length
  })
  
  /** 未读通知数量 */
  const unreadNotificationCount = computed(() => {
    return notifications.value.filter(n => !n.read).length
  })
  
  /** 整体连接状态 */
  const isConnected = computed(() => {
    return deviceStatus.value.aiService && wsStatus.value === 'connected'
  })

  // ============ 患者相关操作 ============
  
  /**
   * 加载当前患者信息
   */
  async function loadCurrentPatient(): Promise<void> {
    loading.value.patient = true
    error.value = null
    
    try {
      currentPatient.value = await patientApi.getCurrentPatient()
    } catch (e) {
      error.value = '加载患者信息失败'
      console.error('[Store] 加载患者信息失败:', e)
    } finally {
      loading.value.patient = false
    }
  }
  
  /**
   * 设置当前患者
   */
  function setCurrentPatient(patient: PatientInfo): void {
    currentPatient.value = patient
    // 清空之前的检查和分析数据
    currentExam.value = null
    analysisReport.value = null
    realtimeResults.value = []
    capturedImages.value = []
  }
  
  /**
   * 清除当前患者
   */
  function clearCurrentPatient(): void {
    currentPatient.value = null
    currentExam.value = null
    analysisReport.value = null
    realtimeResults.value = []
    capturedImages.value = []
  }

  // ============ 检查相关操作 ============
  
  /**
   * 加载当前检查信息
   */
  async function loadCurrentExam(): Promise<void> {
    loading.value.exam = true
    error.value = null
    
    try {
      currentExam.value = await examApi.getCurrentExam()
    } catch (e) {
      error.value = '加载检查信息失败'
      console.error('[Store] 加载检查信息失败:', e)
    } finally {
      loading.value.exam = false
    }
  }
  
  /**
   * 开始检查
   */
  async function startExam(examType: string): Promise<void> {
    if (!currentPatient.value) {
      error.value = '请先选择患者'
      return
    }
    
    loading.value.exam = true
    error.value = null
    
    try {
      currentExam.value = await examApi.startExam(currentPatient.value.id, examType)
      realtimeResults.value = []
      addNotification('success', '检查开始', `开始 ${examType} 检查`)
    } catch (e) {
      error.value = '开始检查失败'
      console.error('[Store] 开始检查失败:', e)
    } finally {
      loading.value.exam = false
    }
  }
  
  /**
   * 结束检查
   */
  async function endExam(): Promise<void> {
    if (!currentExam.value) {
      return
    }
    
    loading.value.exam = true
    error.value = null
    
    try {
      currentExam.value = await examApi.endExam(currentExam.value.id)
      addNotification('success', '检查完成', '检查已结束')
    } catch (e) {
      error.value = '结束检查失败'
      console.error('[Store] 结束检查失败:', e)
    } finally {
      loading.value.exam = false
    }
  }

  // ============ AI 分析相关操作 ============
  
  /**
   * 加载分析报告
   */
  async function loadAnalysisReport(): Promise<void> {
    if (!currentExam.value) {
      return
    }
    
    loading.value.analysis = true
    error.value = null
    
    try {
      analysisReport.value = await analysisApi.getReport(currentExam.value.id)
      if (analysisReport.value.results) {
        realtimeResults.value = analysisReport.value.results
      }
    } catch (e) {
      error.value = '加载分析报告失败'
      console.error('[Store] 加载分析报告失败:', e)
    } finally {
      loading.value.analysis = false
    }
  }
  
  /**
   * 添加实时分析结果
   */
  function addRealtimeResult(result: AnalysisResultItem): void {
    // 添加到列表开头
    realtimeResults.value.unshift(result)
    
    // 限制最大数量
    if (realtimeResults.value.length > 50) {
      realtimeResults.value = realtimeResults.value.slice(0, 50)
    }
    
    // 如果是异常结果，添加通知
    if (result.level === 'abnormal' || result.level === 'critical') {
      addNotification('warning', 'AI 检测到异常', result.title)
    }
  }
  
  /**
   * 清除分析结果
   */
  function clearAnalysisResults(): void {
    realtimeResults.value = []
    analysisReport.value = null
  }

  // ============ 图像相关操作 ============
  
  /**
   * 加载截图列表
   */
  async function loadCapturedImages(): Promise<void> {
    if (!currentExam.value) {
      return
    }
    
    loading.value.images = true
    error.value = null
    
    try {
      capturedImages.value = await imageApi.getCapturedImages(currentExam.value.id)
    } catch (e) {
      error.value = '加载截图失败'
      console.error('[Store] 加载截图失败:', e)
    } finally {
      loading.value.images = false
    }
  }
  
  /**
   * 保存截图
   */
  async function saveCapturedImage(data: string, remark?: string): Promise<void> {
    try {
      const image = await imageApi.saveImage({
        data,
        timestamp: new Date().toISOString(),
        remark,
      })
      capturedImages.value.unshift(image)
      addNotification('success', '截图保存', '图像已保存')
    } catch (e) {
      error.value = '保存截图失败'
      console.error('[Store] 保存截图失败:', e)
    }
  }

  // ============ 状态相关操作 ============
  
  /**
   * 更新设备状态
   */
  function updateDeviceStatus(status: Partial<DeviceStatus>): void {
    deviceStatus.value = { ...deviceStatus.value, ...status }
  }
  
  /**
   * 设置语音状态
   */
  function setVoiceStatus(status: VoiceStatus): void {
    voiceStatus.value = status
  }
  
  /**
   * 设置 WebSocket 状态
   */
  function setWsStatus(status: WebSocketStatus): void {
    wsStatus.value = status
  }

  // ============ 通知相关操作 ============
  
  /**
   * 添加系统通知
   */
  function addNotification(
    type: SystemNotification['type'],
    title: string,
    message: string
  ): void {
    const notification: SystemNotification = {
      id: `notif_${Date.now()}`,
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
      read: false,
    }
    
    notifications.value.unshift(notification)
    
    // 限制最大数量
    if (notifications.value.length > 100) {
      notifications.value = notifications.value.slice(0, 100)
    }
  }
  
  /**
   * 标记通知为已读
   */
  function markNotificationRead(id: string): void {
    const notification = notifications.value.find(n => n.id === id)
    if (notification) {
      notification.read = true
    }
  }
  
  /**
   * 标记所有通知为已读
   */
  function markAllNotificationsRead(): void {
    notifications.value.forEach(n => {
      n.read = true
    })
  }
  
  /**
   * 清除所有通知
   */
  function clearNotifications(): void {
    notifications.value = []
  }
  
  /**
   * 清除错误
   */
  function clearError(): void {
    error.value = null
  }

  // ============ 初始化 ============
  
  /**
   * 初始化 Dashboard
   */
  async function initialize(): Promise<void> {
    await Promise.all([
      loadCurrentPatient(),
      loadCurrentExam(),
    ])
    
    if (currentExam.value) {
      await Promise.all([
        loadAnalysisReport(),
        loadCapturedImages(),
      ])
    }
  }

  return {
    // 状态
    currentPatient,
    currentExam,
    analysisReport,
    realtimeResults,
    capturedImages,
    deviceStatus,
    voiceStatus,
    wsStatus,
    notifications,
    loading,
    error,
    
    // 计算属性
    hasActiveExam,
    abnormalResultCount,
    attentionResultCount,
    unreadNotificationCount,
    isConnected,
    
    // 患者操作
    loadCurrentPatient,
    setCurrentPatient,
    clearCurrentPatient,
    
    // 检查操作
    loadCurrentExam,
    startExam,
    endExam,
    
    // 分析操作
    loadAnalysisReport,
    addRealtimeResult,
    clearAnalysisResults,
    
    // 图像操作
    loadCapturedImages,
    saveCapturedImage,
    
    // 状态操作
    updateDeviceStatus,
    setVoiceStatus,
    setWsStatus,
    
    // 通知操作
    addNotification,
    markNotificationRead,
    markAllNotificationsRead,
    clearNotifications,
    clearError,
    
    // 初始化
    initialize,
  }
})
