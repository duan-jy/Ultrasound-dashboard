<script setup lang="ts">
/**
 * 超声智能体大屏主页面
 * 三栏布局：左侧患者列表+语音 | 中间视频区 | 右侧诊断区
 */
import { onMounted, computed, ref, onUnmounted } from 'vue'
import { useDashboardStore } from '@/stores/dashboard'
import { useWebSocket } from '@/composables/useWebSocket'
import { useBroadcast } from '@/composables/useBroadcast'
import { generateMockAnalysisResult } from '@/services/mock'
import type { PatientInfo, ServiceConfig } from '@/types'

// 组件
import PatientQueue from '@/components/patient/PatientQueue.vue'
import VoicePanel from '@/components/voice/VoicePanel.vue'
import VideoDisplay from '@/components/media/VideoDisplay.vue'
import DiagnosisPanel from '@/components/diagnosis/DiagnosisPanel.vue'
import ConnectionStatus from '@/components/status/ConnectionStatus.vue'
import ImageGallery from '@/components/media/ImageGallery.vue'
import ServiceConfigModal from '@/components/modals/ServiceConfigModal.vue'
import GlowCard from '@/components/common/GlowCard.vue'

// Store
const store = useDashboardStore()

// Composables
const { status: wsStatus } = useWebSocket()
const { isSupported: broadcastSupported, pacsConnected } = useBroadcast()

// 本地状态
const currentTime = ref(new Date())
const showConfigModal = ref(false)
let timeInterval: ReturnType<typeof setInterval> | null = null
let mockAnalysisInterval: ReturnType<typeof setInterval> | null = null

// 计算属性
const formattedTime = computed(() => {
  return currentTime.value.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
})

const formattedDate = computed(() => {
  return currentTime.value.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'long',
  })
})

// 当前患者显示信息
const currentPatientDisplay = computed(() => {
  const p = store.currentPatient
  if (!p) return null
  return {
    name: p.name,
    age: p.age,
    gender: p.gender === 'male' ? '男' : p.gender === 'female' ? '女' : '未知',
    examPart: p.examPart || '-',
  }
})

// 初始化
onMounted(async () => {
  // 更新时间
  timeInterval = setInterval(() => {
    currentTime.value = new Date()
  }, 1000)

  // 初始化数据
  await store.initialize()
  
  // 加载患者队列
  await store.loadPatientQueue()
  
  // 默认选中第一个患者
  if (store.patientQueue.length > 0 && !store.currentPatient) {
    store.selectPatient(store.patientQueue[0])
  }

  // 模拟实时分析结果（演示用）
  startMockAnalysis()
})

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval)
  }
  if (mockAnalysisInterval) {
    clearInterval(mockAnalysisInterval)
  }
})

// 方法
function startMockAnalysis() {
  // 每5秒生成一个模拟分析结果
  mockAnalysisInterval = setInterval(() => {
    if (store.hasActiveExam) {
      const result = generateMockAnalysisResult()
      store.addRealtimeResult(result)
    }
  }, 5000)
}

function handleCapture(imageData: string) {
  store.saveCapturedImage(imageData, `截图 ${store.capturedImages.length + 1}`)
}

function handleCaptureError(message: string) {
  store.addNotification('error', '截图失败', message)
}

function handleSelectPatient(patient: PatientInfo) {
  store.selectPatient(patient)
}

function handleStartVoice() {
  store.setVoiceStatus('listening')
  // 模拟语音识别
  setTimeout(() => {
    store.setVoiceStatus('processing')
    setTimeout(() => {
      store.addVoiceTranscript('肝脏回声均匀，大小正常', false)
      store.setVoiceStatus('idle')
    }, 1000)
  }, 2000)
}

function handleStopVoice() {
  if (store.voiceStatus === 'listening') {
    store.setVoiceStatus('processing')
    setTimeout(() => {
      store.addVoiceTranscript('检查完成，未见明显异常', false)
      store.setVoiceStatus('idle')
    }, 800)
  }
}

function handleSaveConfig(config: ServiceConfig) {
  store.updateServiceConfig(config)
  store.addNotification('success', '配置已保存', '服务配置已更新')
}

function openConfigModal() {
  showConfigModal.value = true
}
</script>

<template>
  <div class="h-screen w-screen bg-dark-400 flex flex-col overflow-hidden">
    <!-- 顶部栏 -->
    <header class="flex-shrink-0 h-16 bg-dark-300/95 backdrop-blur border-b border-dark-50 px-6 flex items-center justify-between">
      <!-- 左侧：Logo 和标题 -->
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
          </div>
          <div>
            <h1 class="text-lg font-bold text-white tracking-tight">智能超声辅助检查系统</h1>
            <p class="text-xs text-gray-500">AI-Powered Ultrasound Assistant</p>
          </div>
        </div>
      </div>

      <!-- 中间：当前患者信息 -->
      <div v-if="currentPatientDisplay" class="flex items-center gap-6 px-6 py-2 bg-dark-200/80 rounded-xl border border-dark-50">
        <div class="flex items-center gap-2">
          <span class="text-xs text-gray-500 uppercase tracking-wide">姓名</span>
          <span class="text-primary-400 font-semibold">{{ currentPatientDisplay.name }}</span>
        </div>
        <div class="w-px h-4 bg-dark-50" />
        <div class="flex items-center gap-2">
          <span class="text-xs text-gray-500 uppercase tracking-wide">年龄</span>
          <span class="text-white font-medium">{{ currentPatientDisplay.age }}岁</span>
        </div>
        <div class="w-px h-4 bg-dark-50" />
        <div class="flex items-center gap-2">
          <span class="text-xs text-gray-500 uppercase tracking-wide">性别</span>
          <span class="text-white font-medium">{{ currentPatientDisplay.gender }}</span>
        </div>
        <div class="w-px h-4 bg-dark-50" />
        <div class="flex items-center gap-2">
          <span class="text-xs text-gray-500 uppercase tracking-wide">检查部位</span>
          <span class="text-emerald-400 font-medium">{{ currentPatientDisplay.examPart }}</span>
        </div>
      </div>

      <!-- 右侧：操作按钮 -->
      <div class="flex items-center gap-3">
        <button class="px-4 py-2 text-sm font-medium bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-all hover:shadow-lg hover:shadow-primary-500/20 active:scale-95">
          查看报告
        </button>
        <button class="px-4 py-2 text-sm font-medium bg-primary-500/15 text-primary-400 border border-primary-500/30 rounded-lg hover:bg-primary-500/25 transition-all">
          触动图
        </button>
        <button class="px-4 py-2 text-sm font-medium bg-dark-100 text-gray-300 border border-dark-50 rounded-lg hover:border-gray-500 hover:text-white transition-all">
          使用说明
        </button>
        <button 
          class="px-4 py-2 text-sm font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/25 transition-all flex items-center gap-2"
          @click="openConfigModal"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          服务配置
        </button>
      </div>
    </header>

    <!-- 主内容区 -->
    <main class="flex-1 flex gap-4 p-4 min-h-0">
      <!-- 左栏：患者队列 + 语音助手 -->
      <aside class="w-72 flex-shrink-0 flex flex-col gap-4">
        <!-- 患者队列 -->
        <div class="flex-[1.2] min-h-0">
          <PatientQueue
            :patients="store.patientQueue"
            :current-patient-id="store.currentPatient?.id || null"
            :loading="store.loading.patient"
            @select="handleSelectPatient"
          />
        </div>

        <!-- 语音助手 -->
        <div class="flex-1 min-h-0">
          <VoicePanel
            :status="store.voiceStatus"
            :transcripts="store.voiceTranscripts"
            @start-listening="handleStartVoice"
            @stop-listening="handleStopVoice"
          />
        </div>
      </aside>

      <!-- 中栏：视频显示 + 图像采集 -->
      <section class="flex-1 flex flex-col gap-4 min-w-0">
        <!-- 采集图像区域 -->
        <GlowCard :has-header="true" glow="none" class="flex-shrink-0">
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-semibold text-gray-100 flex items-center gap-2">
                <svg class="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                采集图像
              </h3>
              <span class="text-xs text-gray-500 bg-dark-100 px-2 py-0.5 rounded-full">
                总计: {{ store.capturedImages.length }}
              </span>
            </div>
          </template>
          
          <!-- 缩略图行 -->
          <div class="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            <div
              v-for="image in store.capturedImages.slice(0, 10)"
              :key="image.id"
              class="w-16 h-16 flex-shrink-0 rounded-lg bg-dark-100 border border-dark-50 overflow-hidden cursor-pointer hover:border-primary-500/50 hover:scale-105 transition-all duration-200"
            >
              <div class="w-full h-full bg-dark-50 flex items-center justify-center">
                <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div
              v-if="store.capturedImages.length === 0"
              class="flex items-center gap-2 text-sm text-gray-500 py-4"
            >
              <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              暂无采集图像，点击截图按钮开始采集
            </div>
          </div>
        </GlowCard>

        <!-- 视频区域 -->
        <div class="flex-1 min-h-0 rounded-xl overflow-hidden">
          <VideoDisplay
            :show-controls="true"
            @capture="handleCapture"
            @error="handleCaptureError"
          />
        </div>
      </section>

      <!-- 右栏：诊断面板 -->
      <aside class="w-[340px] flex-shrink-0">
        <DiagnosisPanel
          :findings="store.diagnosisInfo.findings"
          :diagnosis="store.diagnosisInfo.diagnosis"
          :critical-value="store.diagnosisInfo.criticalValue"
          :positivity="store.diagnosisInfo.positivity"
          :has-patient="!!store.currentPatient"
          @update:findings="(v) => store.updateDiagnosisInfo({ findings: v })"
          @update:diagnosis="(v) => store.updateDiagnosisInfo({ diagnosis: v })"
          @update:critical-value="(v) => store.updateDiagnosisInfo({ criticalValue: v })"
          @update:positivity="(v) => store.updateDiagnosisInfo({ positivity: v })"
        />
      </aside>
    </main>

    <!-- 底部状态栏 -->
    <footer class="flex-shrink-0 h-8 bg-dark-300/90 backdrop-blur border-t border-dark-50 px-6 flex items-center justify-between text-xs text-gray-500">
      <div class="flex items-center gap-6">
        <span class="font-medium text-gray-400">超声智能体 v1.0.0</span>
        <div class="w-px h-3 bg-dark-50" />
        <ConnectionStatus
          :device-status="store.deviceStatus"
          :ws-status="wsStatus"
          compact
        />
      </div>
      <div class="flex items-center gap-6">
        <div class="flex items-center gap-2">
          <span class="text-gray-600">BroadcastChannel:</span>
          <span :class="broadcastSupported ? 'text-emerald-400' : 'text-red-400'" class="font-medium">
            {{ broadcastSupported ? '已启用' : '不支持' }}
          </span>
        </div>
        <div v-if="pacsConnected" class="flex items-center gap-1.5 text-emerald-400">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>PACS 已同步</span>
        </div>
        <div class="flex items-center gap-2 text-gray-400">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{{ formattedDate }}</span>
          <span class="text-primary-400 font-mono">{{ formattedTime }}</span>
        </div>
      </div>
    </footer>

    <!-- 服务配置弹窗 -->
    <ServiceConfigModal
      v-model:visible="showConfigModal"
      :config="store.serviceConfig"
      @save="handleSaveConfig"
    />
  </div>
</template>
