/**
 * API 服务层
 * 统一管理所有 HTTP 请求，支持 Mock 数据模式
 */
import type { PatientInfo, ExamInfo, AnalysisReport, CapturedImage } from '@/types'
import { mockPatientInfo, mockExamInfo, mockAnalysisReport, mockCapturedImages } from './mock'

/** API 配置 */
interface ApiConfig {
  baseUrl: string
  timeout: number
  useMock: boolean
}

/** 默认配置 */
const defaultConfig: ApiConfig = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
  useMock: import.meta.env.VITE_USE_MOCK === 'true' || true, // 默认使用 Mock
}

/**
 * 通用请求方法
 * 兼容 Chrome 109+ (Win7)
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${defaultConfig.baseUrl}${endpoint}`
  
  // 使用 AbortController 替代 timeout（Chrome 109+ 支持）
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), defaultConfig.timeout)
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return response.json() as Promise<T>
  } catch (error) {
    clearTimeout(timeoutId)
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('请求超时')
    }
    
    throw error
  }
}

/**
 * 患者信息 API
 */
export const patientApi = {
  /**
   * 获取当前患者信息
   */
  async getCurrentPatient(): Promise<PatientInfo> {
    if (defaultConfig.useMock) {
      // 模拟网络延迟
      await delay(300)
      return mockPatientInfo
    }
    return request<PatientInfo>('/patient/current')
  },

  /**
   * 根据ID获取患者信息
   */
  async getPatientById(id: string): Promise<PatientInfo> {
    if (defaultConfig.useMock) {
      await delay(200)
      return { ...mockPatientInfo, id }
    }
    return request<PatientInfo>(`/patient/${id}`)
  },
}

/**
 * 检查信息 API
 */
export const examApi = {
  /**
   * 获取当前检查信息
   */
  async getCurrentExam(): Promise<ExamInfo> {
    if (defaultConfig.useMock) {
      await delay(200)
      return mockExamInfo
    }
    return request<ExamInfo>('/exam/current')
  },

  /**
   * 开始检查
   */
  async startExam(patientId: string, examType: string): Promise<ExamInfo> {
    if (defaultConfig.useMock) {
      await delay(500)
      return {
        ...mockExamInfo,
        status: 'in-progress',
        startTime: new Date().toISOString(),
      }
    }
    return request<ExamInfo>('/exam/start', {
      method: 'POST',
      body: JSON.stringify({ patientId, examType }),
    })
  },

  /**
   * 结束检查
   */
  async endExam(examId: string): Promise<ExamInfo> {
    if (defaultConfig.useMock) {
      await delay(300)
      return {
        ...mockExamInfo,
        id: examId,
        status: 'completed',
        endTime: new Date().toISOString(),
      }
    }
    return request<ExamInfo>(`/exam/${examId}/end`, {
      method: 'POST',
    })
  },
}

/**
 * AI 分析 API
 */
export const analysisApi = {
  /**
   * 获取分析报告
   */
  async getReport(examId: string): Promise<AnalysisReport> {
    if (defaultConfig.useMock) {
      await delay(400)
      return { ...mockAnalysisReport, examId }
    }
    return request<AnalysisReport>(`/analysis/report/${examId}`)
  },

  /**
   * 触发 AI 分析
   */
  async triggerAnalysis(imageData: string): Promise<{ taskId: string }> {
    if (defaultConfig.useMock) {
      await delay(200)
      return { taskId: `task_${Date.now()}` }
    }
    return request<{ taskId: string }>('/analysis/trigger', {
      method: 'POST',
      body: JSON.stringify({ imageData }),
    })
  },
}

/**
 * 图像 API
 */
export const imageApi = {
  /**
   * 获取截图列表
   */
  async getCapturedImages(examId: string): Promise<CapturedImage[]> {
    if (defaultConfig.useMock) {
      await delay(300)
      return mockCapturedImages
    }
    return request<CapturedImage[]>(`/images/exam/${examId}`)
  },

  /**
   * 保存截图
   */
  async saveImage(data: Omit<CapturedImage, 'id'>): Promise<CapturedImage> {
    if (defaultConfig.useMock) {
      await delay(200)
      return {
        ...data,
        id: `img_${Date.now()}`,
      }
    }
    return request<CapturedImage>('/images/save', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
}

/**
 * 工具函数：延迟
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 更新 API 配置
 */
export function updateApiConfig(config: Partial<ApiConfig>): void {
  Object.assign(defaultConfig, config)
}
