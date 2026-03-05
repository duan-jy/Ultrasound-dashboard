<script setup lang="ts">
/**
 * 状态指示器组件
 * 显示各种连接状态和系统状态
 */
import { computed } from 'vue'

type StatusType = 'online' | 'offline' | 'processing' | 'warning' | 'error'

interface Props {
  /** 状态类型 */
  status: StatusType
  /** 标签文本 */
  label?: string
  /** 是否显示脉冲动画 */
  pulse?: boolean
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  label: '',
  pulse: true,
  size: 'md',
})

/** 状态对应的颜色类 */
const statusColorClass = computed(() => {
  const colors: Record<StatusType, string> = {
    online: 'bg-emerald-500',
    offline: 'bg-gray-500',
    processing: 'bg-amber-500',
    warning: 'bg-amber-500',
    error: 'bg-red-500',
  }
  return colors[props.status]
})

/** 尺寸类 */
const sizeClass = computed(() => {
  const sizes: Record<string, string> = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
  }
  return sizes[props.size]
})

/** 是否应该显示脉冲 */
const shouldPulse = computed(() => {
  return props.pulse && (props.status === 'online' || props.status === 'processing')
})
</script>

<template>
  <div class="flex items-center gap-2">
    <span
      :class="[
        'rounded-full',
        sizeClass,
        statusColorClass,
        shouldPulse ? 'animate-pulse' : '',
      ]"
    />
    <span v-if="label" class="text-xs text-gray-400">{{ label }}</span>
  </div>
</template>
