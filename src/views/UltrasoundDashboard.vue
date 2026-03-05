<script setup lang="ts">
/**
 * 超声智能体大屏主页面
 * 三栏布局：左侧患者信息 | 中间视频区 | 右侧AI分析
 */
import { onMounted, computed, ref, onUnmounted } from 'vue'
import { useDashboardStore } from '@/stores/dashboard'
import { useWebSocket } from '@/composables/useWebSocket'
import { useBroadcast } from '@/composables/useBroadcast'
import { generateMockAnalysisResult } from '@/services/mock'

// 组件
import PatientInfoPanel from '@/components/patient/PatientInfoPanel.vue'
import VideoDisplay from '@/components/media/VideoDisplay.vue'
import AnalysisResultList from '@/components/analysis/AnalysisResultList.vue'
import VoiceIndicator from '@/components/voice/VoiceIndicator.vue'
import ConnectionStatus from '@/components/status/ConnectionStatus.vue'
import ImageGallery from '@/components/media/ImageGallery.vue'
import ExamControls from '@/components/exam/ExamControls.vue'
import GlowCard from '@/components/common/GlowCard.vue'

// Store
const store = useDashboardStore()

// Composables
const { status: wsStatus, connect: connectWs } = useWebSocket()
const { isSupported: broadcastSupported, pacsConnected } = useBroadcast()

// 本地状态
const currentTime = ref(new Date())
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

// 初始化
onMounted(async () => {
  // 更新时间
  timeInterval = setInterval(() => {
    currentTime.value = new Date()
  }, 1000)

  // 初始化数据
  await store.initialize()

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

function handleStartExam() {
  store.startExam('腹部超声')
}

function handleEndExam() {
  store.endExam()
}
</script>

<template>
  <div class="h-screen w-screen bg-dark-400 flex flex-col overflow-hidden">
    <!-- 顶部栏 -->
    <header class="flex-shrink-0 h-16 bg-dark-300 border-b border-dark-50 px-6 flex items-center justify-between">
      <!-- 左侧：Logo 和标题 -->
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-primary-600 flex items-center justify-center">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h1 class="text-lg font-semibold text-white">超声智能体</h1>
            <p class="text-xs text-gray-500">AI 辅助诊断系统</p>
          </div>
        </div>

        <!-- 连接状态 -->
        <ConnectionStatus
          :device-status="store.deviceStatus"
          :ws-status="wsStatus"
          class="ml-8"
        />
      </div>

      <!-- 右侧：时间和控制 -->
      <div class="flex items-center gap-6">
        <!-- 检查控制 -->
        <ExamControls
          :exam="store.currentExam"
          :has-patient="!!store.currentPatient"
          :loading="store.loading.exam"
          @start="handleStartExam"
          @end="handleEndExam"
        />

        <!-- 时间显示 -->
        <div class="text-right">
          <p class="text-2xl font-mono text-white tracking-wider">{{ formattedTime }}</p>
          <p class="text-xs text-gray-500">{{ formattedDate }}</p>
        </div>
      </div>
    </header>

    <!-- 主内容区 -->
    <main class="flex-1 flex gap-4 p-4 min-h-0">
      <!-- 左栏：患者信息 -->
      <aside class="w-80 flex-shrink-0 flex flex-col gap-4">
        <!-- 患者信息 -->
        <PatientInfoPanel
          :patient="store.currentPatient"
          :loading="store.loading.patient"
        />

        <!-- 语音助手 -->
        <VoiceIndicator :status="store.voiceStatus" />

        <!-- 截图画廊 -->
        <GlowCard :has-header="false" glow="none" class="flex-1 min-h-0 overflow-hidden">
          <div class="h-full overflow-y-auto">
            <ImageGallery :images="store.capturedImages" />
          </div>
        </GlowCard>
      </aside>

      <!-- 中栏：视频显示 -->
      <section class="flex-1 flex flex-col gap-4 min-w-0">
        <!-- 视频区域 -->
        <div class="flex-1 min-h-0">
          <VideoDisplay
            :show-controls="true"
            @capture="handleCapture"
            @error="handleCaptureError"
          />
        </div>

        <!-- 底部信息栏 -->
        <div class="flex-shrink-0 h-20 bg-dark-200 border border-dark-50 rounded-lg p-4 flex items-center justify-between">
          <!-- 检查信息 -->
          <div class="flex items-center gap-6">
            <div>
              <p class="info-label">检查部位</p>
              <p class="info-value">{{ store.currentPatient?.examPart || '-' }}</p>
            </div>
            <div>
              <p class="info-label">检查设备</p>
              <p class="info-value">{{ store.currentExam?.device || '-' }}</p>
            </div>
            <div>
              <p class="info-label">操作医生</p>
              <p class="info-value">{{ store.currentExam?.doctor || '-' }}</p>
            </div>
          </div>

          <!-- 统计信息 -->
          <div class="flex items-center gap-6">
            <div class="text-center">
              <p class="text-2xl font-semibold text-primary-400">{{ store.realtimeResults.length }}</p>
              <p class="text-xs text-gray-500">分析结果</p>
            </div>
            <div class="text-center">
              <p class="text-2xl font-semibold text-amber-400">{{ store.attentionResultCount }}</p>
              <p class="text-xs text-gray-500">需关注</p>
            </div>
            <div class="text-center">
              <p class="text-2xl font-semibold text-red-400">{{ store.abnormalResultCount }}</p>
              <p class="text-xs text-gray-500">异常</p>
            </div>
            <div class="text-center">
              <p class="text-2xl font-semibold text-gray-300">{{ store.capturedImages.length }}</p>
              <p class="text-xs text-gray-500">截图</p>
            </div>
          </div>
        </div>
      </section>

      <!-- 右栏：AI 分析结果 -->
      <aside class="w-96 flex-shrink-0 flex flex-col gap-4">
        <!-- 分析结果列表 -->
        <div class="flex-1 min-h-0 overflow-hidden">
          <AnalysisResultList
            :results="store.realtimeResults"
            :loading="store.loading.analysis"
          />
        </div>

        <!-- AI 总结 -->
        <GlowCard
          v-if="store.analysisReport?.conclusion"
          :has-header="true"
          glow="success"
        >
          <template #header>
            <h3 class="text-sm font-semibold text-gray-100 flex items-center gap-2">
              <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              AI 分析总结
            </h3>
          </template>

          <div class="space-y-3">
            <p class="text-sm text-gray-300 leading-relaxed">
              {{ store.analysisReport.conclusion }}
            </p>
            <div v-if="store.analysisReport.suggestion" class="pt-3 border-t border-dark-50">
              <p class="text-xs text-gray-500 mb-1">建议</p>
              <p class="text-sm text-amber-400/90">
                {{ store.analysisReport.suggestion }}
              </p>
            </div>
          </div>
        </GlowCard>
      </aside>
    </main>

    <!-- 底部状态栏 -->
    <footer class="flex-shrink-0 h-8 bg-dark-300 border-t border-dark-50 px-6 flex items-center justify-between text-xs text-gray-500">
      <div class="flex items-center gap-4">
        <span>超声智能体 v1.0.0</span>
        <span class="text-dark-50">|</span>
        <span>
          BroadcastChannel: 
          <span :class="broadcastSupported ? 'text-emerald-400' : 'text-red-400'">
            {{ broadcastSupported ? '支持' : '不支持' }}
          </span>
        </span>
        <span v-if="pacsConnected" class="text-emerald-400">PACS 已同步</span>
      </div>
      <div>
        <span>Chrome 109+ 兼容</span>
      </div>
    </footer>
  </div>
</template>
