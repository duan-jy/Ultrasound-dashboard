/**
 * BroadcastChannel 服务
 * 处理与 PACS 系统的跨窗口通信
 * Chrome 54+ 原生支持，兼容 Win7 Chrome 109
 */
import type { BroadcastMessage, BroadcastMessageType, PatientInfo, ExamInfo } from '@/types'

/** 频道名称 */
const CHANNEL_NAME = 'ultrasound-ai-channel'

/** 消息处理器类型 */
type BroadcastHandler<T = unknown> = (data: T, source: 'pacs' | 'dashboard') => void

/**
 * BroadcastChannel 管理器
 * 用于与 PACS 系统进行跨窗口通信
 */
export class BroadcastManager {
  private channel: BroadcastChannel | null = null
  private handlers: Map<BroadcastMessageType, Set<BroadcastHandler>> = new Map()
  private isSupported: boolean = false

  constructor() {
    // 检查浏览器是否支持 BroadcastChannel
    this.isSupported = typeof BroadcastChannel !== 'undefined'
    
    if (!this.isSupported) {
      console.warn('[Broadcast] 当前浏览器不支持 BroadcastChannel')
    }
  }

  /**
   * 检查是否支持
   */
  checkSupport(): boolean {
    return this.isSupported
  }

  /**
   * 初始化频道
   */
  init(): boolean {
    if (!this.isSupported) {
      return false
    }

    if (this.channel) {
      console.warn('[Broadcast] 频道已初始化')
      return true
    }

    try {
      this.channel = new BroadcastChannel(CHANNEL_NAME)
      this.setupEventHandlers()
      console.log('[Broadcast] 频道初始化成功')
      return true
    } catch (error) {
      console.error('[Broadcast] 频道初始化失败:', error)
      return false
    }
  }

  /**
   * 关闭频道
   */
  close(): void {
    if (this.channel) {
      this.channel.close()
      this.channel = null
      console.log('[Broadcast] 频道已关闭')
    }
  }

  /**
   * 发送消息到 PACS 系统
   */
  send<T>(type: BroadcastMessageType, data: T): boolean {
    if (!this.channel) {
      console.warn('[Broadcast] 频道未初始化')
      return false
    }

    const message: BroadcastMessage<T> = {
      type,
      source: 'dashboard',
      data,
      timestamp: Date.now(),
    }

    try {
      this.channel.postMessage(message)
      return true
    } catch (error) {
      console.error('[Broadcast] 发送消息失败:', error)
      return false
    }
  }

  /**
   * 注册消息处理器
   */
  on<T>(type: BroadcastMessageType, handler: BroadcastHandler<T>): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set())
    }
    
    this.handlers.get(type)!.add(handler as BroadcastHandler)

    return () => {
      this.handlers.get(type)?.delete(handler as BroadcastHandler)
    }
  }

  /**
   * 请求同步患者信息
   */
  requestSync(): void {
    this.send('sync_request', { requestTime: Date.now() })
  }

  /**
   * 响应同步请求
   */
  respondSync(patientInfo: PatientInfo | null, examInfo: ExamInfo | null): void {
    this.send('sync_response', { patientInfo, examInfo })
  }

  /**
   * 通知患者选择
   */
  notifyPatientSelected(patientInfo: PatientInfo): void {
    this.send('patient_selected', patientInfo)
  }

  /**
   * 通知检查更新
   */
  notifyExamUpdated(examInfo: ExamInfo): void {
    this.send('exam_updated', examInfo)
  }

  /**
   * 设置事件处理器
   */
  private setupEventHandlers(): void {
    if (!this.channel) return

    this.channel.onmessage = (event: MessageEvent<BroadcastMessage>) => {
      const message = event.data
      
      // 忽略自己发送的消息
      if (message.source === 'dashboard') {
        return
      }

      console.log('[Broadcast] 收到消息:', message.type)
      this.handleMessage(message)
    }

    this.channel.onmessageerror = (event) => {
      console.error('[Broadcast] 消息解析错误:', event)
    }
  }

  /**
   * 处理收到的消息
   */
  private handleMessage(message: BroadcastMessage): void {
    const handlers = this.handlers.get(message.type)
    
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(message.data, message.source)
        } catch (error) {
          console.error(`[Broadcast] 处理消息 ${message.type} 失败:`, error)
        }
      })
    }
  }
}

/** 默认 BroadcastChannel 实例 */
export const broadcastManager = new BroadcastManager()
