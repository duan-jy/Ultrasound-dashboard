/**
 * WebSocket 服务
 * 处理与 AI 服务器的实时通信
 * 兼容 Chrome 109+ (Win7)
 */
import type { WebSocketStatus, WSMessage, WSMessageType } from '@/types'

/** WebSocket 配置 */
interface WebSocketConfig {
  url: string
  reconnectInterval: number
  maxReconnectAttempts: number
  heartbeatInterval: number
}

/** 默认配置 */
const defaultConfig: WebSocketConfig = {
  url: import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws',
  reconnectInterval: 3000,
  maxReconnectAttempts: 10,
  heartbeatInterval: 30000,
}

/** 消息处理器类型 */
type MessageHandler<T = unknown> = (data: T) => void

/**
 * WebSocket 管理器
 * 使用传统类语法，避免私有字段 (#) 语法以兼容 Chrome 109
 */
export class WebSocketManager {
  private ws: WebSocket | null = null
  private config: WebSocketConfig
  private status: WebSocketStatus = 'disconnected'
  private reconnectAttempts = 0
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private handlers: Map<WSMessageType, Set<MessageHandler>> = new Map()
  private statusListeners: Set<(status: WebSocketStatus) => void> = new Set()

  constructor(config: Partial<WebSocketConfig> = {}) {
    this.config = { ...defaultConfig, ...config }
  }

  /**
   * 获取当前连接状态
   */
  getStatus(): WebSocketStatus {
    return this.status
  }

  /**
   * 连接 WebSocket
   */
  connect(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.warn('[WebSocket] 已经连接')
      return
    }

    this.setStatus('connecting')

    try {
      this.ws = new WebSocket(this.config.url)
      this.setupEventHandlers()
    } catch (error) {
      console.error('[WebSocket] 连接失败:', error)
      this.setStatus('error')
      this.scheduleReconnect()
    }
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    this.clearTimers()
    
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    
    this.setStatus('disconnected')
    this.reconnectAttempts = 0
  }

  /**
   * 发送消息
   */
  send<T>(type: WSMessageType, data: T): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[WebSocket] 未连接，无法发送消息')
      return false
    }

    const message: WSMessage<T> = {
      type,
      data,
      timestamp: Date.now(),
    }

    try {
      this.ws.send(JSON.stringify(message))
      return true
    } catch (error) {
      console.error('[WebSocket] 发送消息失败:', error)
      return false
    }
  }

  /**
   * 注册消息处理器
   */
  on<T>(type: WSMessageType, handler: MessageHandler<T>): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set())
    }
    
    this.handlers.get(type)!.add(handler as MessageHandler)

    // 返回取消注册函数
    return () => {
      this.handlers.get(type)?.delete(handler as MessageHandler)
    }
  }

  /**
   * 监听状态变化
   */
  onStatusChange(listener: (status: WebSocketStatus) => void): () => void {
    this.statusListeners.add(listener)
    
    // 立即触发一次当前状态
    listener(this.status)

    return () => {
      this.statusListeners.delete(listener)
    }
  }

  /**
   * 设置事件处理器
   */
  private setupEventHandlers(): void {
    if (!this.ws) return

    this.ws.onopen = () => {
      console.log('[WebSocket] 连接成功')
      this.setStatus('connected')
      this.reconnectAttempts = 0
      this.startHeartbeat()
    }

    this.ws.onclose = (event) => {
      console.log('[WebSocket] 连接关闭:', event.code, event.reason)
      this.clearTimers()
      
      if (this.status !== 'disconnected') {
        this.scheduleReconnect()
      }
    }

    this.ws.onerror = (error) => {
      console.error('[WebSocket] 连接错误:', error)
      this.setStatus('error')
    }

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WSMessage
        this.handleMessage(message)
      } catch (error) {
        console.error('[WebSocket] 解析消息失败:', error)
      }
    }
  }

  /**
   * 处理收到的消息
   */
  private handleMessage(message: WSMessage): void {
    const handlers = this.handlers.get(message.type)
    
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(message.data)
        } catch (error) {
          console.error(`[WebSocket] 处理消息 ${message.type} 失败:`, error)
        }
      })
    }
  }

  /**
   * 设置状态并通知监听器
   */
  private setStatus(status: WebSocketStatus): void {
    this.status = status
    this.statusListeners.forEach(listener => listener(status))
  }

  /**
   * 开始心跳
   */
  private startHeartbeat(): void {
    this.clearTimers()
    
    this.heartbeatTimer = setInterval(() => {
      this.send('heartbeat', { timestamp: Date.now() })
    }, this.config.heartbeatInterval)
  }

  /**
   * 安排重连
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.error('[WebSocket] 达到最大重连次数')
      this.setStatus('error')
      return
    }

    this.setStatus('reconnecting')
    this.reconnectAttempts++

    console.log(`[WebSocket] ${this.config.reconnectInterval}ms 后尝试第 ${this.reconnectAttempts} 次重连`)

    this.reconnectTimer = setTimeout(() => {
      this.connect()
    }, this.config.reconnectInterval)
  }

  /**
   * 清除定时器
   */
  private clearTimers(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }
}

/** 默认 WebSocket 实例 */
export const wsManager = new WebSocketManager()
