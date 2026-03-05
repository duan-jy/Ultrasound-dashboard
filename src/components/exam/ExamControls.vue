<script setup lang="ts">
/**
 * 检查控制组件
 * 提供开始/结束检查等操作按钮
 */
import { computed } from 'vue'
import type { ExamInfo, ExamStatus } from '@/types'

interface Props {
  /** 当前检查信息 */
  exam: ExamInfo | null
  /** 是否有患者 */
  hasPatient: boolean
  /** 是否加载中 */
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

const emit = defineEmits<{
  (e: 'start'): void
  (e: 'pause'): void
  (e: 'resume'): void
  (e: 'end'): void
}>()

/** 检查状态 */
const examStatus = computed<ExamStatus | null>(() => {
  return props.exam?.status || null
})

/** 是否正在检查 */
const isExamInProgress = computed(() => {
  return examStatus.value === 'in-progress'
})

/** 是否暂停 */
const isExamPaused = computed(() => {
  return examStatus.value === 'paused'
})

/** 检查时长 */
const examDuration = computed(() => {
  if (!props.exam?.startTime) return '00:00'
  
  const start = new Date(props.exam.startTime).getTime()
  const now = Date.now()
  const diff = Math.floor((now - start) / 1000)
  
  const minutes = Math.floor(diff / 60)
  const seconds = diff % 60
  
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})
</script>

<template>
  <div class="flex items-center gap-3">
    <!-- 检查信息 -->
    <div v-if="exam" class="flex items-center gap-3 mr-4">
      <div class="text-right">
        <p class="text-xs text-gray-500">检查类型</p>
        <p class="text-sm text-gray-200">{{ exam.type }}</p>
      </div>
      <div class="w-px h-8 bg-dark-50" />
      <div class="text-right">
        <p class="text-xs text-gray-500">检查时长</p>
        <p class="text-sm text-primary-400 font-mono">{{ examDuration }}</p>
      </div>
    </div>

    <!-- 开始检查按钮 -->
    <button
      v-if="!isExamInProgress && !isExamPaused"
      :disabled="!hasPatient || loading"
      :class="[
        'px-6 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
        hasPatient && !loading
          ? 'bg-primary-600 hover:bg-primary-500 text-white'
          : 'bg-dark-100 text-gray-500 cursor-not-allowed',
      ]"
      @click="emit('start')"
    >
      <svg v-if="loading" class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      开始检查
    </button>

    <!-- 暂停/继续按钮 -->
    <button
      v-if="isExamInProgress"
      :disabled="loading"
      class="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
      @click="emit('pause')"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      暂停
    </button>

    <button
      v-if="isExamPaused"
      :disabled="loading"
      class="px-4 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
      @click="emit('resume')"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      继续
    </button>

    <!-- 结束检查按钮 -->
    <button
      v-if="isExamInProgress || isExamPaused"
      :disabled="loading"
      class="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
      @click="emit('end')"
    >
      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <rect x="6" y="6" width="12" height="12" rx="1" />
      </svg>
      结束检查
    </button>
  </div>
</template>
