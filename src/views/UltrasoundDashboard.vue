<script setup lang="ts">
/**
 * 超声智能体大屏 - 全新设计
 * 深色专业主题，紫蓝渐变高光
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useDashboardStore } from '@/stores/dashboard'
import type { PatientInfo, Positivity } from '@/types'

const store = useDashboardStore()

// 状态
const currentTime = ref(new Date())
const showConfig = ref(false)
const findings = ref('')
const diagnosis = ref('')
const criticalValue = ref(false)
const positivity = ref<Positivity>(null)

let timer: number

onMounted(() => {
  store.initialize()
  timer = window.setInterval(() => {
    currentTime.value = new Date()
  }, 1000)
})

onUnmounted(() => clearInterval(timer))

const timeStr = computed(() => currentTime.value.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }))
const patient = computed(() => store.currentPatient)
const queue = computed(() => store.patientQueue)
const voiceStatus = computed(() => store.voiceStatus)

function selectPatient(p: PatientInfo) {
  store.selectPatient(p)
}

function startVoice() {
  store.setVoiceStatus('listening')
}

function stopVoice() {
  if (voiceStatus.value === 'listening') {
    store.setVoiceStatus('processing')
    setTimeout(() => {
      store.addVoiceTranscript('肝脏大小正常，回声均匀', false)
      store.setVoiceStatus('idle')
    }, 800)
  }
}
</script>

<template>
  <div class="h-screen w-screen flex flex-col overflow-hidden bg-[#0a0a0f]">
    <!-- Header -->
    <header class="h-14 flex-shrink-0 flex items-center justify-between px-5 border-b border-white/[0.08] bg-[#0d0d14]">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
          </svg>
        </div>
        <div>
          <h1 class="text-white font-semibold">智能超声辅助检查系统</h1>
          <p class="text-[11px] text-white/40">AI-Powered Ultrasound Assistant</p>
        </div>
      </div>

      <!-- 患者信息 -->
      <div v-if="patient" class="flex items-center gap-5 px-5 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
        <div>
          <span class="text-[10px] text-white/40 uppercase tracking-wider">患者</span>
          <p class="text-sm font-medium text-violet-400">{{ patient.name }}</p>
        </div>
        <div class="w-px h-8 bg-white/[0.06]" />
        <div>
          <span class="text-[10px] text-white/40 uppercase tracking-wider">年龄</span>
          <p class="text-sm font-medium text-white">{{ patient.age }}岁</p>
        </div>
        <div class="w-px h-8 bg-white/[0.06]" />
        <div>
          <span class="text-[10px] text-white/40 uppercase tracking-wider">性别</span>
          <p class="text-sm font-medium text-white">{{ patient.gender === 'male' ? '男' : '女' }}</p>
        </div>
        <div class="w-px h-8 bg-white/[0.06]" />
        <div>
          <span class="text-[10px] text-white/40 uppercase tracking-wider">检查部位</span>
          <p class="text-sm font-medium text-cyan-400">{{ patient.examPart }}</p>
        </div>
      </div>

      <!-- 操作 -->
      <div class="flex items-center gap-3">
        <button class="h-9 px-4 rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 text-white text-sm font-medium hover:opacity-90 transition-opacity shadow-lg shadow-violet-500/20">
          查看报告
        </button>
        <button class="h-9 px-4 rounded-lg bg-white/[0.05] text-white/70 text-sm font-medium border border-white/[0.08] hover:bg-white/[0.08] transition-colors">
          触动图
        </button>
        <button 
          class="h-9 px-4 rounded-lg bg-white/[0.05] text-white/70 text-sm font-medium border border-white/[0.08] hover:bg-white/[0.08] transition-colors flex items-center gap-2"
          @click="showConfig = true"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          设置
        </button>
        <div class="text-white/50 text-sm font-mono pl-3 border-l border-white/[0.08]">{{ timeStr }}</div>
      </div>
    </header>

    <!-- Main -->
    <main class="flex-1 flex min-h-0 p-4 gap-4">
      <!-- 左侧 -->
      <aside class="w-[280px] flex-shrink-0 flex flex-col gap-4">
        <!-- 就诊队列 -->
        <div class="flex-[1.3] flex flex-col rounded-2xl bg-[#12121a] border border-white/[0.06] overflow-hidden">
          <div class="h-12 flex items-center justify-between px-4 border-b border-white/[0.06]">
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 rounded-full bg-violet-500 shadow-lg shadow-violet-500/50" />
              <span class="text-sm font-medium text-white">就诊队列</span>
            </div>
            <span class="px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 text-xs font-medium">{{ queue.length }} 人</span>
          </div>
          <div class="flex-1 overflow-y-auto p-3 space-y-2">
            <div
              v-for="p in queue"
              :key="p.id"
              :class="[
                'p-3 rounded-xl cursor-pointer transition-all',
                patient?.id === p.id
                  ? 'bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/30'
                  : 'bg-white/[0.02] border border-transparent hover:bg-white/[0.04] hover:border-white/[0.06]'
              ]"
              @click="selectPatient(p)"
            >
              <div class="flex items-center justify-between mb-1">
                <span class="font-medium text-white">{{ p.name }}</span>
                <span class="text-xs text-white/40">{{ p.gender === 'male' ? '男' : '女' }} {{ p.age }}岁</span>
              </div>
              <div class="text-xs text-white/50">{{ p.examPart }}</div>
            </div>
            <div v-if="queue.length === 0" class="flex flex-col items-center justify-center py-12 text-white/30">
              <svg class="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span class="text-xs">暂无等待患者</span>
            </div>
          </div>
        </div>

        <!-- 语音识别 -->
        <div class="flex-1 flex flex-col rounded-2xl bg-[#12121a] border border-white/[0.06] overflow-hidden">
          <div class="h-12 flex items-center justify-between px-4 border-b border-white/[0.06]">
            <div class="flex items-center gap-2">
              <div :class="['w-2 h-2 rounded-full transition-all', voiceStatus === 'listening' ? 'bg-green-500 shadow-lg shadow-green-500/50 animate-pulse' : 'bg-white/20']" />
              <span class="text-sm font-medium text-white">语音识别</span>
            </div>
            <span class="text-xs text-white/40">{{ voiceStatus === 'idle' ? '待命' : voiceStatus === 'listening' ? '聆听中' : '处理中' }}</span>
          </div>
          <div class="flex-1 flex flex-col p-4 gap-4 min-h-0">
            <!-- 麦克风 -->
            <div class="flex flex-col items-center py-4">
              <button
                :class="[
                  'w-16 h-16 rounded-full flex items-center justify-center transition-all',
                  voiceStatus === 'listening'
                    ? 'bg-gradient-to-br from-violet-500 to-blue-500 shadow-[0_0_40px_rgba(139,92,246,0.4)] scale-110'
                    : 'bg-white/[0.05] border border-white/[0.1] hover:bg-white/[0.08]'
                ]"
                @mousedown="startVoice"
                @mouseup="stopVoice"
                @mouseleave="stopVoice"
              >
                <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>
              <span class="text-xs text-white/40 mt-3">按住说话</span>
            </div>
            <!-- 转录 -->
            <div class="flex-1 rounded-xl bg-black/30 p-3 overflow-y-auto min-h-0">
              <div v-if="store.voiceTranscripts.length === 0" class="h-full flex items-center justify-center text-xs text-white/20">
                语音内容显示在此处
              </div>
              <div v-else class="space-y-2">
                <div 
                  v-for="t in store.voiceTranscripts.slice(0, 10)" 
                  :key="t.id"
                  class="text-xs p-2 rounded-lg bg-white/[0.03] text-white/70"
                >
                  {{ t.text }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <!-- 中间 - 视频区 -->
      <section class="flex-1 flex flex-col gap-4 min-w-0">
        <!-- 采集图像 -->
        <div class="rounded-2xl bg-[#12121a] border border-white/[0.06]">
          <div class="h-11 flex items-center justify-between px-4 border-b border-white/[0.06]">
            <div class="flex items-center gap-2">
              <svg class="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span class="text-sm font-medium text-white">采集图像</span>
            </div>
            <span class="text-xs text-white/40">{{ store.capturedImages.length }} 张</span>
          </div>
          <div class="p-3 flex gap-2 overflow-x-auto">
            <div
              v-for="i in 10"
              :key="i"
              class="w-14 h-14 flex-shrink-0 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center hover:border-violet-500/30 transition-colors cursor-pointer"
            >
              <svg class="w-5 h-5 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        <!-- 视频 -->
        <div class="flex-1 rounded-2xl bg-[#0a0a0f] border border-white/[0.06] overflow-hidden relative group">
          <!-- 渐变背景 -->
          <div class="absolute inset-0 bg-gradient-to-b from-violet-500/5 via-transparent to-transparent" />
          
          <!-- 占位 -->
          <div class="absolute inset-0 flex flex-col items-center justify-center">
            <div class="relative mb-6">
              <div class="absolute -inset-10 bg-violet-500/10 rounded-full blur-3xl" />
              <svg class="relative w-24 h-24 text-white/10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="0.75" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <p class="text-white/50 font-medium mb-1">视频源未连接</p>
            <p class="text-white/30 text-sm mb-6">选择采集方式开始超声图像采集</p>
            <div class="flex gap-3">
              <button class="h-10 px-5 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white text-sm font-medium hover:opacity-90 transition-opacity shadow-lg shadow-violet-500/25 flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                采集屏幕
              </button>
              <button class="h-10 px-5 rounded-xl bg-white/[0.05] text-white/70 text-sm font-medium border border-white/[0.1] hover:bg-white/[0.08] transition-colors flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                摄像头
              </button>
            </div>
          </div>

          <!-- 控制栏 -->
          <div class="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur">
                <span class="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span class="text-xs text-white/80">实时采集中</span>
              </div>
              <div class="flex items-center gap-2">
                <button class="w-10 h-10 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 flex items-center justify-center hover:opacity-90 transition-opacity">
                  <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                <button class="w-10 h-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center hover:bg-white/20 transition-colors">
                  <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                </button>
                <button class="w-10 h-10 rounded-xl bg-red-500/80 flex items-center justify-center hover:bg-red-500 transition-colors">
                  <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 右侧 - 诊断 -->
      <aside class="w-[300px] flex-shrink-0 flex flex-col gap-4">
        <!-- 患者画像 -->
        <div class="rounded-2xl bg-[#12121a] border border-white/[0.06]">
          <div class="h-11 flex items-center gap-2 px-4 border-b border-white/[0.06]">
            <svg class="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span class="text-sm font-medium text-white">患者画像</span>
          </div>
          <div class="p-4">
            <p class="text-xs text-white/30 text-center py-2">当前患者暂无历史诊断记录</p>
          </div>
        </div>

        <!-- 检查所见 -->
        <div class="flex-1 flex flex-col rounded-2xl bg-[#12121a] border border-white/[0.06] overflow-hidden min-h-0">
          <div class="h-11 flex items-center gap-2 px-4 border-b border-white/[0.06] flex-shrink-0">
            <svg class="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span class="text-sm font-medium text-white">检查所见</span>
          </div>
          <div class="flex-1 p-3 min-h-0">
            <textarea
              v-model="findings"
              class="w-full h-full resize-none rounded-xl bg-black/30 border border-white/[0.06] p-3 text-sm text-white/80 placeholder-white/20 focus:outline-none focus:border-violet-500/50 transition-colors"
              placeholder="请输入检查所见..."
            />
          </div>
        </div>

        <!-- 检查诊断 -->
        <div class="flex-1 flex flex-col rounded-2xl bg-[#12121a] border border-white/[0.06] overflow-hidden min-h-0">
          <div class="h-11 flex items-center gap-2 px-4 border-b border-white/[0.06] flex-shrink-0">
            <svg class="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <span class="text-sm font-medium text-white">检查诊断</span>
          </div>
          <div class="flex-1 p-3 min-h-0">
            <textarea
              v-model="diagnosis"
              class="w-full h-full resize-none rounded-xl bg-black/30 border border-white/[0.06] p-3 text-sm text-white/80 placeholder-white/20 focus:outline-none focus:border-violet-500/50 transition-colors"
              placeholder="请输入检查诊断..."
            />
          </div>
        </div>

        <!-- 危急值 & 阴阳性 -->
        <div class="rounded-2xl bg-[#12121a] border border-white/[0.06] p-4">
          <div class="flex items-center justify-between">
            <!-- 危急值 -->
            <div class="flex items-center gap-3">
              <span class="text-sm text-white/50">危急值</span>
              <div class="flex rounded-lg bg-black/30 p-0.5">
                <button
                  :class="['px-3 py-1.5 text-xs font-medium rounded-md transition-all', !criticalValue ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60']"
                  @click="criticalValue = false"
                >否</button>
                <button
                  :class="['px-3 py-1.5 text-xs font-medium rounded-md transition-all', criticalValue ? 'bg-red-500/20 text-red-400' : 'text-white/40 hover:text-white/60']"
                  @click="criticalValue = true"
                >是</button>
              </div>
            </div>
            <!-- 阴阳性 -->
            <div class="flex items-center gap-3">
              <span class="text-sm text-white/50">阴阳性</span>
              <div class="flex rounded-lg bg-black/30 p-0.5">
                <button
                  :class="['px-2 py-1.5 text-xs font-medium rounded-md transition-all', positivity === null ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60']"
                  @click="positivity = null"
                >未选</button>
                <button
                  :class="['px-2 py-1.5 text-xs font-medium rounded-md transition-all', positivity === 'negative' ? 'bg-green-500/20 text-green-400' : 'text-white/40 hover:text-white/60']"
                  @click="positivity = 'negative'"
                >阴性</button>
                <button
                  :class="['px-2 py-1.5 text-xs font-medium rounded-md transition-all', positivity === 'positive' ? 'bg-red-500/20 text-red-400' : 'text-white/40 hover:text-white/60']"
                  @click="positivity = 'positive'"
                >阳性</button>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </main>

    <!-- Footer -->
    <footer class="h-8 flex-shrink-0 flex items-center justify-between px-5 border-t border-white/[0.06] bg-[#0d0d14] text-xs">
      <div class="flex items-center gap-5 text-white/40">
        <span>超声智能体 v1.0</span>
        <div class="flex items-center gap-2">
          <span class="w-1.5 h-1.5 rounded-full bg-green-500 shadow-sm shadow-green-500/50" />
          <span>AI服务: 已连接</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-1.5 h-1.5 rounded-full bg-green-500 shadow-sm shadow-green-500/50" />
          <span>PACS: 已同步</span>
        </div>
      </div>
      <div class="text-white/40">
        BroadcastChannel: <span class="text-green-400">已启用</span>
      </div>
    </footer>

    <!-- 设置弹窗 -->
    <Teleport to="body">
      <div v-if="showConfig" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="showConfig = false" />
        <div class="relative w-full max-w-md rounded-2xl bg-[#12121a] border border-white/[0.1] shadow-2xl overflow-hidden">
          <div class="flex items-center justify-between p-5 border-b border-white/[0.06]">
            <h3 class="text-lg font-semibold text-white">服务配置</h3>
            <button class="p-1.5 rounded-lg hover:bg-white/[0.05] transition-colors" @click="showConfig = false">
              <svg class="w-5 h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div class="p-5 space-y-4">
            <div>
              <label class="block text-sm text-white/50 mb-2">WebSocket 服务地址</label>
              <input type="text" class="w-full h-10 px-3 rounded-lg bg-black/30 border border-white/[0.1] text-white text-sm focus:outline-none focus:border-violet-500/50" placeholder="ws://localhost:8080/ws" />
            </div>
            <div>
              <label class="block text-sm text-white/50 mb-2">AI 分析服务地址</label>
              <input type="text" class="w-full h-10 px-3 rounded-lg bg-black/30 border border-white/[0.1] text-white text-sm focus:outline-none focus:border-violet-500/50" placeholder="http://localhost:5000/api" />
            </div>
            <div>
              <label class="block text-sm text-white/50 mb-2">PACS 服务地址</label>
              <input type="text" class="w-full h-10 px-3 rounded-lg bg-black/30 border border-white/[0.1] text-white text-sm focus:outline-none focus:border-violet-500/50" placeholder="http://localhost:8000/pacs" />
            </div>
          </div>
          <div class="flex justify-end gap-3 p-5 border-t border-white/[0.06]">
            <button class="h-9 px-4 rounded-lg text-white/60 text-sm font-medium hover:bg-white/[0.05] transition-colors" @click="showConfig = false">取消</button>
            <button class="h-9 px-4 rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 text-white text-sm font-medium hover:opacity-90 transition-opacity">保存</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
