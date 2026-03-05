/**
 * 类型定义文件
 * 超声智能体大屏系统核心类型
 */

// ============ 患者信息相关类型 ============

/** 患者性别 */
export type Gender = 'male' | 'female' | 'unknown'

/** 患者基础信息 */
export interface PatientInfo {
  /** 患者ID */
  id: string
  /** 患者姓名 */
  name: string
  /** 性别 */
  gender: Gender
  /** 年龄 */
  age: number
  /** 住院号/门诊号 */
  patientNo: string
  /** 床号 */
  bedNo?: string
  /** 科室 */
  department?: string
  /** 检查部位 */
  examPart?: string
  /** 检查时间 */
  examTime?: string
  /** 主诉 */
  chiefComplaint?: string
  /** 临床诊断 */
  clinicalDiagnosis?: string
}

// ============ 检查相关类型 ============

/** 检查状态 */
export type ExamStatus = 
  | 'waiting'     // 等待中
  | 'in-progress' // 检查中
  | 'completed'   // 已完成
  | 'paused'      // 已暂停

/** 检查信息 */
export interface ExamInfo {
  /** 检查ID */
  id: string
  /** 检查类型 */
  type: string
  /** 检查部位 */
  bodyPart: string
  /** 检查状态 */
  status: ExamStatus
  /** 开始时间 */
  startTime?: string
  /** 结束时间 */
  endTime?: string
  /** 检查设备 */
  device?: string
  /** 操作医生 */
  doctor?: string
}

// ============ AI分析相关类型 ============

/** AI分析状态 */
export type AnalysisStatus = 
  | 'idle'        // 空闲
  | 'analyzing'   // 分析中
  | 'completed'   // 分析完成
  | 'error'       // 分析错误

/** AI分析结果等级 */
export type ResultLevel = 
  | 'normal'      // 正常
  | 'attention'   // 注意
  | 'abnormal'    // 异常
  | 'critical'    // 危急

/** AI分析结果项 */
export interface AnalysisResultItem {
  /** 结果ID */
  id: string
  /** 结果标题 */
  title: string
  /** 结果描述 */
  description: string
  /** 结果等级 */
  level: ResultLevel
  /** 置信度 (0-100) */
  confidence: number
  /** 相关图像ID */
  imageId?: string
  /** 检测时间 */
  timestamp: string
}

/** AI分析报告 */
export interface AnalysisReport {
  /** 报告ID */
  id: string
  /** 患者ID */
  patientId: string
  /** 检查ID */
  examId: string
  /** 分析状态 */
  status: AnalysisStatus
  /** 分析结果列表 */
  results: AnalysisResultItem[]
  /** 总体结论 */
  conclusion?: string
  /** 建议 */
  suggestion?: string
  /** 分析开始时间 */
  startTime?: string
  /** 分析完成时间 */
  completeTime?: string
}

// ============ 视频/图像相关类型 ============

/** 媒体类型 */
export type MediaType = 'video' | 'image'

/** 媒体源配置 */
export interface MediaSource {
  /** 源ID */
  id: string
  /** 源名称 */
  name: string
  /** 媒体类型 */
  type: MediaType
  /** 源地址 (视频流地址或图像URL) */
  url: string
  /** 是否激活 */
  active: boolean
}

/** 截图信息 */
export interface CapturedImage {
  /** 图像ID */
  id: string
  /** 图像数据 (base64 或 URL) */
  data: string
  /** 截图时间 */
  timestamp: string
  /** 关联的分析结果 */
  analysisId?: string
  /** 备注 */
  remark?: string
}

// ============ WebSocket 相关类型 ============

/** WebSocket 连接状态 */
export type WebSocketStatus = 
  | 'disconnected'  // 断开连接
  | 'connecting'    // 连接中
  | 'connected'     // 已连接
  | 'reconnecting'  // 重连中
  | 'error'         // 连接错误

/** WebSocket 消息类型 */
export type WSMessageType = 
  | 'patient_info'      // 患者信息
  | 'exam_start'        // 开始检查
  | 'exam_end'          // 结束检查
  | 'analysis_result'   // 分析结果
  | 'voice_command'     // 语音命令
  | 'heartbeat'         // 心跳
  | 'error'             // 错误

/** WebSocket 消息基础结构 */
export interface WSMessage<T = unknown> {
  /** 消息类型 */
  type: WSMessageType
  /** 消息数据 */
  data: T
  /** 时间戳 */
  timestamp: number
}

// ============ 语音交互相关类型 ============

/** 语音状态 */
export type VoiceStatus = 
  | 'idle'        // 空闲
  | 'listening'   // 监听中
  | 'processing'  // 处理中
  | 'speaking'    // 播放中

/** 语音命令 */
export interface VoiceCommand {
  /** 命令ID */
  id: string
  /** 原始文本 */
  text: string
  /** 命令类型 */
  commandType: string
  /** 命令参数 */
  params?: Record<string, unknown>
  /** 识别置信度 */
  confidence: number
  /** 时间戳 */
  timestamp: string
}

// ============ BroadcastChannel 相关类型 ============

/** 跨窗口消息类型 */
export type BroadcastMessageType = 
  | 'patient_selected'    // 选择患者
  | 'exam_updated'        // 检查更新
  | 'sync_request'        // 同步请求
  | 'sync_response'       // 同步响应

/** 跨窗口消息 */
export interface BroadcastMessage<T = unknown> {
  /** 消息类型 */
  type: BroadcastMessageType
  /** 消息来源 */
  source: 'pacs' | 'dashboard'
  /** 消息数据 */
  data: T
  /** 时间戳 */
  timestamp: number
}

// ============ 系统状态相关类型 ============

/** 设备连接状态 */
export interface DeviceStatus {
  /** 超声设备连接状态 */
  ultrasound: boolean
  /** 摄像头连接状态 */
  camera: boolean
  /** AI服务连接状态 */
  aiService: boolean
  /** PACS系统连接状态 */
  pacs: boolean
}

/** 系统通知 */
export interface SystemNotification {
  /** 通知ID */
  id: string
  /** 通知类型 */
  type: 'info' | 'success' | 'warning' | 'error'
  /** 通知标题 */
  title: string
  /** 通知内容 */
  message: string
  /** 创建时间 */
  timestamp: string
  /** 是否已读 */
  read: boolean
}
