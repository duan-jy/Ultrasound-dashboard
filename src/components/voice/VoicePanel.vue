/**
 * 语音助手面板组件
 * 包含语音按钮和转换文字区域
 */
<script setup lang="ts">
import { ref, computed } from 'vue'
import type { VoiceStatus } from '@/types'
import GlowCard from '../common/GlowCard.vue'

interface Props {
  /** 语音状态 */
  status: VoiceStatus
  /** 历史识别文本列表 */
  transcripts?: Array<{
    id: string
    text: string
    timestamp: string
    isCommand?: boolean
  }>
}

const props = withDefaults(defineProps<Props>(), {
  transcripts: () => [],
})

const emit = defineEmits<{
  /** 开始录音 */
  (e: 'startListening'): void
  /** 停止录音 */
  (e: 'stopListening'): void
}>()

/** 是否按下录音按钮 */
const isPressed = ref(false)

/** 状态配置 */
const statusConfig = computed(() => {
  const configs: Record<VoiceStatus, { label: string; color: string; bgColor: string }> = {
    idle: { label: '按键开始语音输入', color: 'text-gray-400', bgColor: 'bg-dark-100' },
    listening: { label: '聆听中...', color: 'text-primary-400', bgColor: 'bg-primary-500/20' },
    processing: { label: '识别中...', color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
    speaking: { label: '播报中...', color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' },
  }
  return configs[props.status]
})

/** 处理按下事件 */
function handleMouseDown() {
  isPressed.value = true
  emit('startListening')
}

/** 处理释放事件 */
function handleMouseUp() {
  isPressed.value = false
  emit('stopListening')
}

/** 格式化时间 */
function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}
</script>

<template>
  <GlowCard
    :has-header="true"
    :glow="status === 'listening' ? 'primary' : status === 'speaking' ? 'success' : 'none'"
    class="flex flex-col"
  >
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-semibold text-gray-100 flex items-center gap-2">
          <svg class="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
          语音识别
        </h3>
        <div
          :class="['w-2 h-2 rounded-full', status === 'idle' ? 'bg-gray-500' : 'bg-emerald-400 animate-pulse']"
        />
      </div>
    </template>

    <div class="flex flex-col items-center gap-4">
      <!-- 麦克风按钮 -->
      <div class="relative">
        <!-- 动态波纹效果 -->
        <div
          v-if="status === 'listening'"
          class="absolute inset-0 rounded-full bg-primary-500/30 animate-ping"
        />
        <div
          v-if="status === 'listening'"
          class="absolute -inset-2 rounded-full bg-primary-500/20 animate-pulse"
        />
        
        <button
          :class="[
            'relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200',
            'border-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-200',
            status === 'listening'
              ? 'bg-primary-500 border-primary-400 text-white scale-110 focus:ring-primary-500'
              : status === 'processing'
              ? 'bg-amber-500/20 border-amber-400 text-amber-400 focus:ring-amber-500'
              : status === 'speaking'
              ? 'bg-emerald-500/20 border-emerald-400 text-emerald-400 focus:ring-emerald-500'
              : 'bg-dark-100 border-dark-50 text-gray-400 hover:border-primary-500 hover:text-primary-400 focus:ring-primary-500',
          ]"
          @mousedown="handleMouseDown"
          @mouseup="handleMouseUp"
          @mouseleave="handleMouseUp"
          @touchstart.prevent="handleMouseDown"
          @touchend.prevent="handleMouseUp"
        >
          <!-- 麦克风图标 -->
          <svg
            v-if="status === 'idle' || status === 'listening'"
            class="w-7 h-7"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
          
          <!-- 处理中图标 -->
          <svg
            v-else-if="status === 'processing'"
            class="w-7 h-7 animate-spin"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          
          <!-- 播放中图标 -->
          <svg
            v-else-if="status === 'speaking'"
            class="w-7 h-7"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
        </button>
      </div>

      <!-- 状态文字 -->
      <p :class="['text-sm', statusConfig.color]">
        {{ statusConfig.label }}
      </p>
    </div>

    <!-- 识别文字区域 -->
    <div class="mt-4 flex-1 min-h-[120px] bg-dark-100 rounded-lg border border-dark-50 overflow-hidden">
      <!-- 空状态 -->
      <div
        v-if="transcripts.length === 0"
        class="h-full flex items-center justify-center text-gray-600 text-sm"
      >
        语音识别文字将显示在这里
      </div>
      
      <!-- 文字列表 -->
      <div v-else class="h-full overflow-y-auto p-3 space-y-2">
        <div
          v-for="item in transcripts"
          :key="item.id"
          :class="[
            'p-2 rounded text-sm',
            item.isCommand
              ? 'bg-primary-500/10 border border-primary-500/30 text-primary-300'
              : 'bg-dark-50/50 text-gray-300',
          ]"
        >
          <div class="flex items-start justify-between gap-2">
            <p class="flex-1 leading-relaxed">{{ item.text }}</p>
            <span class="text-xs text-gray-500 flex-shrink-0">
              {{ formatTime(item.timestamp) }}
            </span>
          </div>
          <div v-if="item.isCommand" class="mt-1">
            <span class="text-xs text-primary-400/70">语音命令</span>
          </div>
        </div>
      </div>
    </div>
  </GlowCard>
</template>
