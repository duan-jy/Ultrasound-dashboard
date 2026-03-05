<script setup lang="ts">
/**
 * 语音状态指示器组件
 * 显示语音交互的当前状态
 */
import { computed } from 'vue'
import type { VoiceStatus } from '@/types'

interface Props {
  /** 语音状态 */
  status: VoiceStatus
  /** 是否紧凑模式 */
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  compact: false,
})

/** 状态配置 */
const statusConfig = computed(() => {
  const configs: Record<VoiceStatus, { label: string; color: string; icon: string; animate: boolean }> = {
    idle: {
      label: '待命中',
      color: 'text-gray-400',
      icon: 'mic',
      animate: false,
    },
    listening: {
      label: '聆听中...',
      color: 'text-primary-400',
      icon: 'mic-on',
      animate: true,
    },
    processing: {
      label: '识别中...',
      color: 'text-amber-400',
      icon: 'processing',
      animate: true,
    },
    speaking: {
      label: '播报中...',
      color: 'text-emerald-400',
      icon: 'speaker',
      animate: true,
    },
  }
  return configs[props.status]
})
</script>

<template>
  <div
    :class="[
      'flex items-center gap-3 px-4 py-3 bg-dark-200 border border-dark-50 rounded-lg',
      statusConfig.animate ? 'animate-pulse-slow' : '',
    ]"
  >
    <!-- 图标 -->
    <div
      :class="[
        'relative w-10 h-10 rounded-full flex items-center justify-center',
        status === 'idle' ? 'bg-dark-100' : 'bg-dark-100',
      ]"
    >
      <!-- 麦克风图标 -->
      <svg
        v-if="statusConfig.icon === 'mic' || statusConfig.icon === 'mic-on'"
        :class="['w-5 h-5', statusConfig.color]"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
      
      <!-- 处理图标 -->
      <svg
        v-else-if="statusConfig.icon === 'processing'"
        :class="['w-5 h-5 animate-spin', statusConfig.color]"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      
      <!-- 播放图标 -->
      <svg
        v-else-if="statusConfig.icon === 'speaker'"
        :class="['w-5 h-5', statusConfig.color]"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
      </svg>
      
      <!-- 动态波纹 -->
      <div
        v-if="statusConfig.animate"
        :class="[
          'absolute inset-0 rounded-full opacity-30 animate-ping',
          status === 'listening' ? 'bg-primary-500' : '',
          status === 'processing' ? 'bg-amber-500' : '',
          status === 'speaking' ? 'bg-emerald-500' : '',
        ]"
      />
    </div>

    <!-- 文字信息 -->
    <div v-if="!compact" class="flex-1">
      <p :class="['text-sm font-medium', statusConfig.color]">
        {{ statusConfig.label }}
      </p>
      <p class="text-xs text-gray-500">
        语音助手
      </p>
    </div>

    <!-- 音量条 -->
    <div v-if="status === 'listening'" class="flex items-center gap-0.5 h-6">
      <div
        v-for="i in 5"
        :key="i"
        :class="[
          'w-1 bg-primary-500 rounded-full',
          i % 2 === 0 ? 'animate-pulse' : '',
        ]"
        :style="{ height: `${8 + Math.random() * 16}px`, animationDelay: `${i * 100}ms` }"
      />
    </div>
  </div>
</template>
