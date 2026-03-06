<script setup lang="ts">
/**
 * 超声智能体大屏主页面 V2
 * 采用 Geist Design System 风格的简洁现代设计
 */
import { onMounted, computed, ref, onUnmounted } from 'vue'
import { useDashboardStore } from '@/stores/dashboard'
import { useWebSocket } from '@/composables/useWebSocket'
import { useBroadcast } from '@/composables/useBroadcast'
import { generateMockAnalysisResult } from '@/services/mock'
import type { PatientInfo, ServiceConfig } from '@/types'

// 组件
import ServiceConfigModal from '@/components/modals/ServiceConfigModal.vue'

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
    month: '2-digit',
    day: '2-digit',
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
  timeInterval = setInterval(() => {
    currentTime.value = new Date()
  }, 1000)

  await store.initialize()
  await store.loadPatientQueue()
  
  if (store.patientQueue.length > 0 && !store.currentPatient) {
    store.selectPatient(store.patientQueue[0])
  }

  startMockAnalysis()
})

onUnmounted(() => {
  if (timeInterval) clearInterval(timeInterval)
  if (mockAnalysisInterval) clearInterval(mockAnalysisInterval)
})

// 方法
function startMockAnalysis() {
  mockAnalysisInterval = setInterval(() => {
    if (store.hasActiveExam) {
      const result = generateMockAnalysisResult()
      store.addRealtimeResult(result)
    }
  }, 5000)
}

function handleCapture() {
  store.saveCapturedImage('data:image/png;base64,...', `截图 ${store.capturedImages.length + 1}`)
}

function handleSelectPatient(patient: PatientInfo) {
  store.selectPatient(patient)
}

function handleStartVoice() {
  store.setVoiceStatus('listening')
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
</script>

<template>
  <div class="h-screen w-screen flex flex-col overflow-hidden" style="background: hsl(0 0% 4%);">
    <!-- 顶部栏 -->
    <header class="h-14 flex items-center justify-between px-4 border-b" style="background: hsl(0 0% 7%); border-color: hsl(0 0% 15%);">
      <!-- 左侧：Logo -->
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background: hsl(210 100% 50%);">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
          </svg>
        </div>
        <span class="text-sm font-semibold text-white">智能超声辅助检查系统</span>
      </div>

      <!-- 中间：患者信息 -->
      <div v-if="currentPatientDisplay" class="flex items-center gap-6 text-sm">
        <div class="flex items-center gap-2">
          <span style="color: hsl(0 0% 60%);">姓名:</span>
          <span class="font-medium" style="color: hsl(210 100% 60%);">{{ currentPatientDisplay.name }}</span>
        </div>
        <div class="flex items-center gap-2">
          <span style="color: hsl(0 0% 60%);">年龄:</span>
          <span class="text-white font-medium">{{ currentPatientDisplay.age }}岁</span>
        </div>
        <div class="flex items-center gap-2">
          <span style="color: hsl(0 0% 60%);">性别:</span>
          <span class="text-white font-medium">{{ currentPatientDisplay.gender }}</span>
        </div>
        <div class="flex items-center gap-2">
          <span style="color: hsl(0 0% 60%);">检查部位:</span>
          <span class="text-white font-medium">{{ currentPatientDisplay.examPart }}</span>
        </div>
      </div>

      <!-- 右侧：操作按钮 -->
      <div class="flex items-center gap-2">
        <button class="px-3 py-1.5 text-xs font-medium text-white rounded-md transition-opacity hover:opacity-80" style="background: hsl(210 100% 50%);">
          查看报告
        </button>
        <button class="px-3 py-1.5 text-xs font-medium rounded-md border transition-colors hover:bg-white/5" style="color: hsl(210 100% 60%); border-color: hsl(210 100% 50% / 0.3);">
          触动图
        </button>
        <button class="px-3 py-1.5 text-xs font-medium rounded-md border transition-colors hover:bg-white/5" style="color: hsl(0 0% 60%); border-color: hsl(0 0% 15%);">
          使用说明
        </button>
        <button 
          class="px-3 py-1.5 text-xs font-medium rounded-md border transition-colors hover:bg-white/5 flex items-center gap-1.5"
          style="color: hsl(142 76% 45%); border-color: hsl(142 76% 45% / 0.3);"
          @click="showConfigModal = true"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          服务配置
        </button>
      </div>
    </header>

    <!-- 主内容区 -->
    <main class="flex-1 flex min-h-0 p-3 gap-3">
      <!-- 左栏 -->
      <aside class="w-64 flex flex-col gap-3 flex-shrink-0">
        <!-- 就诊人数 -->
        <div class="rounded-lg border overflow-hidden flex flex-col" style="background: hsl(0 0% 7%); border-color: hsl(0 0% 15%); flex: 1.2;">
          <div class="px-3 py-2.5 border-b flex items-center justify-between" style="border-color: hsl(0 0% 15%);">
            <div class="flex items-center gap-2">
              <svg class="w-4 h-4" style="color: hsl(210 100% 50%);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span class="text-xs font-medium text-white">就诊人数 ({{ store.patientQueue.length }})</span>
            </div>
            <div class="w-1.5 h-1.5 rounded-full animate-pulse" style="background: hsl(142 76% 45%);"></div>
          </div>
          <div class="flex-1 overflow-y-auto p-2 space-y-1.5 scrollbar-thin">
            <div
              v-for="patient in store.patientQueue"
              :key="patient.id"
              :class="[
                'p-2.5 rounded-md cursor-pointer transition-all',
                store.currentPatient?.id === patient.id 
                  ? 'border' 
                  : 'hover:bg-white/5'
              ]"
              :style="store.currentPatient?.id === patient.id 
                ? 'background: hsl(210 100% 50% / 0.1); border-color: hsl(210 100% 50% / 0.3);' 
                : ''"
              @click="handleSelectPatient(patient)"
            >
              <div class="flex items-center justify-between mb-1">
                <span class="text-sm font-medium text-white">{{ patient.name }}</span>
                <span class="text-xs" style="color: hsl(0 0% 50%);">
                  {{ patient.gender === 'male' ? '男' : '女' }} {{ patient.age }}岁
                </span>
              </div>
              <div class="text-xs" style="color: hsl(0 0% 50%);">{{ patient.examPart }}</div>
            </div>
          </div>
        </div>

        <!-- 语音识别 -->
        <div class="rounded-lg border overflow-hidden flex flex-col" style="background: hsl(0 0% 7%); border-color: hsl(0 0% 15%); flex: 1;">
          <div class="px-3 py-2.5 border-b flex items-center justify-between" style="border-color: hsl(0 0% 15%);">
            <div class="flex items-center gap-2">
              <svg class="w-4 h-4" style="color: hsl(210 100% 50%);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              <span class="text-xs font-medium text-white">语音识别</span>
            </div>
            <div 
              class="w-1.5 h-1.5 rounded-full"
              :class="store.voiceStatus === 'listening' ? 'animate-pulse' : ''"
              :style="`background: ${store.voiceStatus === 'listening' ? 'hsl(210 100% 50%)' : store.voiceStatus === 'idle' ? 'hsl(0 0% 30%)' : 'hsl(38 92% 50%)'};`"
            ></div>
          </div>
          <div class="flex-1 flex flex-col p-3 gap-3 min-h-0">
            <!-- 麦克风按钮 -->
            <div class="flex flex-col items-center py-3">
              <button
                :class="[
                  'w-14 h-14 rounded-full flex items-center justify-center transition-all',
                  store.voiceStatus === 'listening' ? 'scale-110' : ''
                ]"
                :style="store.voiceStatus === 'listening' 
                  ? 'background: hsl(210 100% 50%); box-shadow: 0 0 30px hsl(210 100% 50% / 0.4);' 
                  : 'background: hsl(0 0% 15%);'"
                @mousedown="handleStartVoice"
                @mouseup="handleStopVoice"
                @mouseleave="handleStopVoice"
              >
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>
              <span class="text-xs mt-2" style="color: hsl(0 0% 50%);">
                {{ store.voiceStatus === 'idle' ? '按键开始语音输入' : store.voiceStatus === 'listening' ? '聆听中...' : '识别中...' }}
              </span>
            </div>
            
            <!-- 转录文字 -->
            <div class="flex-1 rounded-md p-2 overflow-y-auto scrollbar-thin" style="background: hsl(0 0% 4%);">
              <div v-if="store.voiceTranscripts.length === 0" class="text-xs text-center py-4" style="color: hsl(0 0% 40%);">
                语音识别内容将在此显示
              </div>
              <div v-else class="space-y-2">
                <div 
                  v-for="transcript in store.voiceTranscripts" 
                  :key="transcript.id"
                  class="text-xs p-2 rounded"
                  style="background: hsl(0 0% 10%); color: hsl(0 0% 80%);"
                >
                  {{ transcript.text }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <!-- 中栏：视频区 -->
      <section class="flex-1 flex flex-col gap-3 min-w-0">
        <!-- 采集图像 -->
        <div class="rounded-lg border" style="background: hsl(0 0% 7%); border-color: hsl(0 0% 15%);">
          <div class="px-3 py-2.5 border-b flex items-center justify-between" style="border-color: hsl(0 0% 15%);">
            <div class="flex items-center gap-2">
              <svg class="w-4 h-4" style="color: hsl(210 100% 50%);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span class="text-xs font-medium text-white">采集图像</span>
            </div>
            <span class="text-xs px-2 py-0.5 rounded-full" style="background: hsl(0 0% 15%); color: hsl(0 0% 60%);">
              总计: {{ store.capturedImages.length }}
            </span>
          </div>
          <div class="p-2 flex gap-2 overflow-x-auto scrollbar-thin">
            <div
              v-for="n in 8"
              :key="n"
              class="w-14 h-14 flex-shrink-0 rounded-md flex items-center justify-center cursor-pointer transition-all hover:opacity-80"
              style="background: hsl(0 0% 10%); border: 1px solid hsl(0 0% 15%);"
            >
              <svg class="w-5 h-5" style="color: hsl(0 0% 30%);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        <!-- 视频显示区 -->
        <div class="flex-1 rounded-lg border overflow-hidden relative group" style="background: hsl(0 0% 4%); border-color: hsl(0 0% 15%);">
          <!-- 占位内容 -->
          <div class="absolute inset-0 flex flex-col items-center justify-center">
            <div class="relative mb-4">
              <div class="absolute -inset-4 rounded-full blur-2xl animate-pulse" style="background: hsl(210 100% 50% / 0.1);"></div>
              <svg class="relative w-20 h-20" style="color: hsl(0 0% 20%);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <p class="text-sm font-medium" style="color: hsl(0 0% 50%);">视频源未连接</p>
            <p class="text-xs mt-1 mb-4" style="color: hsl(0 0% 35%);">请选择采集方式开始超声图像采集</p>
            <div class="flex gap-3">
              <button class="px-4 py-2 text-sm font-medium text-white rounded-lg transition-opacity hover:opacity-90" style="background: hsl(210 100% 50%);">
                采集屏幕
              </button>
              <button class="px-4 py-2 text-sm font-medium rounded-lg border transition-colors hover:bg-white/5" style="color: hsl(0 0% 70%); border-color: hsl(0 0% 20%);">
                摄像头
              </button>
            </div>
          </div>
          
          <!-- 控制栏（hover显示） -->
          <div class="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2 px-2.5 py-1 rounded-full" style="background: hsl(0 0% 10% / 0.8);">
                <span class="w-1.5 h-1.5 rounded-full" style="background: hsl(0 84% 60%);"></span>
                <span class="text-xs text-white">实时采集中</span>
              </div>
              <div class="flex items-center gap-2">
                <button 
                  class="p-2 rounded-lg transition-colors hover:bg-white/10"
                  style="background: hsl(210 100% 50%);"
                  @click="handleCapture"
                >
                  <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                <button class="p-2 rounded-lg transition-colors" style="background: hsl(0 0% 15%);">
                  <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                </button>
                <button class="p-2 rounded-lg transition-colors" style="background: hsl(0 84% 60%);">
                  <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 右栏：诊断区 -->
      <aside class="w-72 flex flex-col gap-3 flex-shrink-0">
        <!-- 患者画像 -->
        <div class="rounded-lg border" style="background: hsl(0 0% 7%); border-color: hsl(0 0% 15%);">
          <div class="px-3 py-2.5 border-b flex items-center gap-2" style="border-color: hsl(0 0% 15%);">
            <svg class="w-4 h-4" style="color: hsl(210 100% 50%);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span class="text-xs font-medium text-white">患者画像</span>
          </div>
          <div class="p-3">
            <p class="text-xs text-center py-3" style="color: hsl(0 0% 40%);">当前患者暂无历史诊断记录</p>
          </div>
        </div>

        <!-- 检查所见 -->
        <div class="rounded-lg border flex-1 flex flex-col" style="background: hsl(0 0% 7%); border-color: hsl(0 0% 15%);">
          <div class="px-3 py-2.5 border-b flex items-center gap-2" style="border-color: hsl(0 0% 15%);">
            <svg class="w-4 h-4" style="color: hsl(210 100% 50%);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span class="text-xs font-medium text-white">检查所见</span>
          </div>
          <div class="flex-1 p-2">
            <textarea
              v-model="store.diagnosisInfo.findings"
              class="w-full h-full resize-none text-sm rounded-md p-2.5 transition-all focus:outline-none"
              style="background: hsl(0 0% 4%); border: 1px solid hsl(0 0% 15%); color: hsl(0 0% 80%);"
              placeholder="请输入检查所见..."
            />
          </div>
        </div>

        <!-- 检查诊断 -->
        <div class="rounded-lg border flex-1 flex flex-col" style="background: hsl(0 0% 7%); border-color: hsl(0 0% 15%);">
          <div class="px-3 py-2.5 border-b flex items-center gap-2" style="border-color: hsl(0 0% 15%);">
            <svg class="w-4 h-4" style="color: hsl(210 100% 50%);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <span class="text-xs font-medium text-white">检查诊断</span>
          </div>
          <div class="flex-1 p-2">
            <textarea
              v-model="store.diagnosisInfo.diagnosis"
              class="w-full h-full resize-none text-sm rounded-md p-2.5 transition-all focus:outline-none"
              style="background: hsl(0 0% 4%); border: 1px solid hsl(0 0% 15%); color: hsl(0 0% 80%);"
              placeholder="请输入检查诊断..."
            />
          </div>
        </div>

        <!-- 危急值和阴阳性 -->
        <div class="rounded-lg border p-3" style="background: hsl(0 0% 7%); border-color: hsl(0 0% 15%);">
          <div class="flex items-center justify-between gap-4">
            <!-- 危急值 -->
            <div class="flex items-center gap-2">
              <span class="text-xs" style="color: hsl(0 0% 60%);">危急值:</span>
              <div class="flex rounded-md overflow-hidden" style="background: hsl(0 0% 10%);">
                <button
                  :class="['px-3 py-1 text-xs font-medium transition-all', !store.diagnosisInfo.criticalValue ? 'text-white' : '']"
                  :style="!store.diagnosisInfo.criticalValue ? 'background: hsl(0 0% 20%);' : 'color: hsl(0 0% 50%);'"
                  @click="store.updateDiagnosisInfo({ criticalValue: false })"
                >否</button>
                <button
                  :class="['px-3 py-1 text-xs font-medium transition-all']"
                  :style="store.diagnosisInfo.criticalValue ? 'background: hsl(0 84% 60% / 0.3); color: hsl(0 84% 60%);' : 'color: hsl(0 0% 50%);'"
                  @click="store.updateDiagnosisInfo({ criticalValue: true })"
                >是</button>
              </div>
            </div>

            <!-- 阴阳性 -->
            <div class="flex items-center gap-2">
              <span class="text-xs" style="color: hsl(0 0% 60%);">阴阳性:</span>
              <div class="flex rounded-md overflow-hidden" style="background: hsl(0 0% 10%);">
                <button
                  :class="['px-2 py-1 text-xs font-medium transition-all']"
                  :style="store.diagnosisInfo.positivity === null ? 'background: hsl(0 0% 20%); color: white;' : 'color: hsl(0 0% 50%);'"
                  @click="store.updateDiagnosisInfo({ positivity: null })"
                >未选择</button>
                <button
                  :class="['px-2 py-1 text-xs font-medium transition-all']"
                  :style="store.diagnosisInfo.positivity === 'negative' ? 'background: hsl(142 76% 45% / 0.3); color: hsl(142 76% 45%);' : 'color: hsl(0 0% 50%);'"
                  @click="store.updateDiagnosisInfo({ positivity: 'negative' })"
                >阴性</button>
                <button
                  :class="['px-2 py-1 text-xs font-medium transition-all']"
                  :style="store.diagnosisInfo.positivity === 'positive' ? 'background: hsl(0 84% 60% / 0.3); color: hsl(0 84% 60%);' : 'color: hsl(0 0% 50%);'"
                  @click="store.updateDiagnosisInfo({ positivity: 'positive' })"
                >阳性</button>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </main>

    <!-- 底部状态栏 -->
    <footer class="h-7 px-4 flex items-center justify-between text-xs border-t" style="background: hsl(0 0% 7%); border-color: hsl(0 0% 15%);">
      <div class="flex items-center gap-4">
        <span style="color: hsl(0 0% 50%);">超声智能体 v1.0.0</span>
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full" :style="`background: ${wsStatus === 'connected' ? 'hsl(142 76% 45%)' : 'hsl(0 84% 60%)'};`"></span>
            <span style="color: hsl(0 0% 50%);">AI服务: {{ wsStatus === 'connected' ? '已连接' : '未连接' }}</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full" :style="`background: ${pacsConnected ? 'hsl(142 76% 45%)' : 'hsl(0 0% 30%)'};`"></span>
            <span style="color: hsl(0 0% 50%);">PACS: {{ pacsConnected ? '已同步' : '未连接' }}</span>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-4">
        <span style="color: hsl(0 0% 50%);">
          BroadcastChannel: 
          <span :style="`color: ${broadcastSupported ? 'hsl(142 76% 45%)' : 'hsl(0 84% 60%)'};`">
            {{ broadcastSupported ? '支持' : '不支持' }}
          </span>
        </span>
        <span style="color: hsl(0 0% 50%);">{{ formattedDate }} {{ formattedTime }}</span>
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
