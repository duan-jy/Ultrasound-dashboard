<script setup lang="ts">
/**
 * AI 分析结果列表组件
 * 实时展示 AI 分析结果
 */
import { computed } from 'vue'
import type { AnalysisResultItem, ResultLevel } from '@/types'
import GlowCard from '../common/GlowCard.vue'

interface Props {
  /** 分析结果列表 */
  results: AnalysisResultItem[]
  /** 是否加载中 */
  loading?: boolean
  /** 最大显示数量 */
  maxItems?: number
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  maxItems: 20,
})

/** 显示的结果 */
const displayResults = computed(() => {
  return props.results.slice(0, props.maxItems)
})

/** 结果等级对应的样式 */
function getLevelStyles(level: ResultLevel) {
  const styles: Record<ResultLevel, { bg: string; text: string; border: string; label: string }> = {
    normal: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
      label: '正常',
    },
    attention: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/30',
      label: '注意',
    },
    abnormal: {
      bg: 'bg-red-500/10',
      text: 'text-red-400',
      border: 'border-red-500/30',
      label: '异常',
    },
    critical: {
      bg: 'bg-red-600/20',
      text: 'text-red-300',
      border: 'border-red-500/50',
      label: '危急',
    },
  }
  return styles[level]
}

/** 格式化时间 */
function formatTime(timestamp: string) {
  return new Date(timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

/** 置信度颜色 */
function getConfidenceColor(confidence: number) {
  if (confidence >= 90) return 'text-emerald-400'
  if (confidence >= 70) return 'text-amber-400'
  return 'text-gray-400'
}
</script>

<template>
  <GlowCard :has-header="true" glow="primary">
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-semibold text-gray-100 flex items-center gap-2">
          <svg class="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          AI 分析结果
        </h3>
        <span class="text-xs text-gray-500">
          共 {{ results.length }} 条
        </span>
      </div>
    </template>

    <!-- 加载状态 -->
    <div v-if="loading" class="space-y-3">
      <div v-for="i in 3" :key="i" class="animate-pulse">
        <div class="h-16 bg-dark-50 rounded-lg" />
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else-if="results.length === 0" class="text-center py-8">
      <svg class="w-12 h-12 text-dark-50 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
      <p class="text-sm text-gray-500">暂无分析结果</p>
      <p class="text-xs text-gray-600 mt-1">开始检查后将自动分析</p>
    </div>

    <!-- 结果列表 -->
    <div v-else class="space-y-3 max-h-[400px] overflow-y-auto pr-1">
      <div
        v-for="result in displayResults"
        :key="result.id"
        :class="[
          'p-3 rounded-lg border transition-all hover:scale-[1.01]',
          getLevelStyles(result.level).bg,
          getLevelStyles(result.level).border,
        ]"
      >
        <!-- 标题行 -->
        <div class="flex items-start justify-between gap-2 mb-2">
          <h4 :class="['text-sm font-medium', getLevelStyles(result.level).text]">
            {{ result.title }}
          </h4>
          <span
            :class="[
              'px-2 py-0.5 text-xs rounded-full flex-shrink-0',
              getLevelStyles(result.level).bg,
              getLevelStyles(result.level).text,
            ]"
          >
            {{ getLevelStyles(result.level).label }}
          </span>
        </div>
        
        <!-- 描述 -->
        <p class="text-xs text-gray-400 leading-relaxed mb-2">
          {{ result.description }}
        </p>
        
        <!-- 底部信息 -->
        <div class="flex items-center justify-between text-xs">
          <span class="text-gray-500">
            {{ formatTime(result.timestamp) }}
          </span>
          <span :class="getConfidenceColor(result.confidence)">
            置信度 {{ result.confidence }}%
          </span>
        </div>
      </div>
    </div>
  </GlowCard>
</template>
