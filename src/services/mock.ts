/**
 * Mock 数据
 * 用于独立开发和测试的模拟数据
 */
import type { 
  PatientInfo, 
  ExamInfo, 
  AnalysisReport, 
  CapturedImage,
  AnalysisResultItem 
} from '@/types'

/** 模拟患者队列 */
export const mockPatientQueue: PatientInfo[] = [
  {
    id: 'P20240315001',
    name: '测试22',
    gender: 'male',
    age: 32,
    patientNo: 'MRN2024031500123',
    department: '超声科',
    examPart: '对开12',
    examTime: new Date().toISOString(),
    chiefComplaint: '常规检查',
  },
  {
    id: 'P20240315002',
    name: '李明华',
    gender: 'male',
    age: 58,
    patientNo: 'MRN2024031500124',
    department: '内科',
    examPart: '肝胆脾',
    examTime: new Date(Date.now() - 600000).toISOString(),
    chiefComplaint: '上腹部不适3天',
    clinicalDiagnosis: '待查：肝脏占位性病变？',
  },
  {
    id: 'P20240315003',
    name: '王秀英',
    gender: 'female',
    age: 42,
    patientNo: 'MRN2024031500125',
    department: '妇科',
    examPart: '盆腔',
    examTime: new Date(Date.now() - 1200000).toISOString(),
    chiefComplaint: '下腹疼痛',
  },
  {
    id: 'P20240315004',
    name: '张伟',
    gender: 'male',
    age: 65,
    patientNo: 'MRN2024031500126',
    department: '心内科',
    examPart: '心脏',
    examTime: new Date(Date.now() - 1800000).toISOString(),
    chiefComplaint: '心悸、胸闷',
    clinicalDiagnosis: '冠心病？',
  },
  {
    id: 'P20240315005',
    name: '陈静',
    gender: 'female',
    age: 35,
    patientNo: 'MRN2024031500127',
    department: '甲乳外科',
    examPart: '甲状腺',
    examTime: new Date(Date.now() - 2400000).toISOString(),
    chiefComplaint: '颈部肿块',
  },
]

/** 模拟患者信息 */
export const mockPatientInfo: PatientInfo = mockPatientQueue[0]

/** 模拟检查信息 */
export const mockExamInfo: ExamInfo = {
  id: 'E20240315001',
  type: '腹部超声',
  bodyPart: '肝胆脾胰',
  status: 'in-progress',
  startTime: new Date().toISOString(),
  device: 'GE Logiq E10',
  doctor: '李医生',
}

/** 模拟 AI 分析结果项 */
const mockResultItems: AnalysisResultItem[] = [
  {
    id: 'R001',
    title: '肝脏回声异常',
    description: '肝右叶可见一低回声区，大小约 2.3cm × 1.8cm，边界清晰，形态规则',
    level: 'attention',
    confidence: 87,
    timestamp: new Date(Date.now() - 60000).toISOString(),
  },
  {
    id: 'R002',
    title: '胆囊壁增厚',
    description: '胆囊壁厚度约 4mm，局部欠光滑',
    level: 'attention',
    confidence: 72,
    timestamp: new Date(Date.now() - 45000).toISOString(),
  },
  {
    id: 'R003',
    title: '脾脏大小正常',
    description: '脾脏形态正常，实质回声均匀，未见明显异常',
    level: 'normal',
    confidence: 95,
    timestamp: new Date(Date.now() - 30000).toISOString(),
  },
  {
    id: 'R004',
    title: '肝内血管清晰',
    description: '肝内血管走行正常，门静脉内径约 1.1cm',
    level: 'normal',
    confidence: 91,
    timestamp: new Date(Date.now() - 15000).toISOString(),
  },
]

/** 模拟 AI 分析报告 */
export const mockAnalysisReport: AnalysisReport = {
  id: 'AR20240315001',
  patientId: 'P20240315001',
  examId: 'E20240315001',
  status: 'completed',
  results: mockResultItems,
  conclusion: '肝右叶低回声区，建议进一步检查；胆囊壁轻度增厚；脾脏未见明显异常',
  suggestion: '建议：1. 增强CT进一步明确肝脏病变性质；2. 定期复查胆囊',
  startTime: new Date(Date.now() - 120000).toISOString(),
  completeTime: new Date(Date.now() - 10000).toISOString(),
}

/** 模拟截图列表 */
export const mockCapturedImages: CapturedImage[] = [
  {
    id: 'IMG001',
    data: '/placeholder-ultrasound-1.jpg',
    timestamp: new Date(Date.now() - 300000).toISOString(),
    remark: '肝右叶横切面',
  },
  {
    id: 'IMG002',
    data: '/placeholder-ultrasound-2.jpg',
    timestamp: new Date(Date.now() - 240000).toISOString(),
    analysisId: 'R001',
    remark: '肝右叶低回声区',
  },
  {
    id: 'IMG003',
    data: '/placeholder-ultrasound-3.jpg',
    timestamp: new Date(Date.now() - 180000).toISOString(),
    remark: '胆囊纵切面',
  },
]

/** 生成随机患者列表 */
export function generateMockPatients(count: number): PatientInfo[] {
  const names = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十']
  const departments = ['超声科', '内科', '外科', '急诊科']
  const examParts = ['肝胆脾', '泌尿系统', '甲状腺', '心脏', '乳腺']
  
  return Array.from({ length: count }, (_, i) => ({
    id: `P${Date.now()}${i}`,
    name: names[i % names.length],
    gender: i % 2 === 0 ? 'male' : 'female' as const,
    age: 20 + Math.floor(Math.random() * 60),
    patientNo: `MRN${Date.now()}${i}`,
    bedNo: `${i + 1}床`,
    department: departments[i % departments.length],
    examPart: examParts[i % examParts.length],
    examTime: new Date().toISOString(),
  }))
}

/** 生成模拟实时分析结果 */
export function generateMockAnalysisResult(): AnalysisResultItem {
  const titles = [
    '检测到异常回声区',
    '血管结构清晰',
    '组织边界正常',
    '发现可疑区域',
    '回声均匀',
  ]
  const levels: AnalysisResultItem['level'][] = ['normal', 'attention', 'abnormal', 'normal', 'normal']
  const index = Math.floor(Math.random() * titles.length)
  
  return {
    id: `R${Date.now()}`,
    title: titles[index],
    description: `AI 自动检测到的分析结果，置信度 ${70 + Math.floor(Math.random() * 25)}%`,
    level: levels[index],
    confidence: 70 + Math.floor(Math.random() * 25),
    timestamp: new Date().toISOString(),
  }
}
