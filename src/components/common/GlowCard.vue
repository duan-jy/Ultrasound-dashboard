<script setup lang="ts">
/**
 * 发光卡片组件
 * 带有发光边框效果的卡片容器
 */
import { computed } from 'vue'

type GlowColor = 'primary' | 'success' | 'warning' | 'danger' | 'none'

interface Props {
  /** 发光颜色 */
  glow?: GlowColor
  /** 是否有标题区域 */
  hasHeader?: boolean
  /** 是否紧凑模式 */
  compact?: boolean
  /** 是否需要滚动 */
  scrollable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  glow: 'primary',
  hasHeader: false,
  compact: false,
  scrollable: false,
})

/** 发光边框样式 */
const glowStyle = computed(() => {
  const colors: Record<GlowColor, string> = {
    primary: 'border-primary-500/30 shadow-[0_0_20px_rgba(0,136,230,0.12)] hover:shadow-[0_0_25px_rgba(0,136,230,0.18)]',
    success: 'border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.12)] hover:shadow-[0_0_25px_rgba(16,185,129,0.18)]',
    warning: 'border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.12)] hover:shadow-[0_0_25px_rgba(245,158,11,0.18)]',
    danger: 'border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.12)] hover:shadow-[0_0_25px_rgba(239,68,68,0.18)]',
    none: 'border-dark-50 hover:border-dark-50/80',
  }
  return colors[props.glow]
})
</script>

<template>
  <div
    :class="[
      'bg-dark-200 border rounded-xl overflow-hidden transition-shadow duration-300',
      glowStyle,
      scrollable ? 'flex flex-col' : '',
    ]"
  >
    <!-- 标题区域 -->
    <div
      v-if="hasHeader"
      class="px-4 py-3 border-b border-dark-50 bg-dark-300/50 flex-shrink-0"
    >
      <slot name="header" />
    </div>
    
    <!-- 内容区域 -->
    <div 
      :class="[
        compact ? 'p-3' : 'p-4',
        scrollable ? 'flex-1 min-h-0 overflow-y-auto' : '',
      ]"
    >
      <slot />
    </div>
    
    <!-- 底部区域 -->
    <div
      v-if="$slots.footer"
      class="px-4 py-3 border-t border-dark-50 bg-dark-300/30 flex-shrink-0"
    >
      <slot name="footer" />
    </div>
  </div>
</template>
