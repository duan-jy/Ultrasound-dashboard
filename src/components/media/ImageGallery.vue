<script setup lang="ts">
/**
 * 图像画廊组件
 * 显示检查过程中截取的图像
 */
import { ref } from 'vue'
import type { CapturedImage } from '@/types'

interface Props {
  /** 图像列表 */
  images: CapturedImage[]
  /** 是否可选择 */
  selectable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  selectable: false,
})

const emit = defineEmits<{
  (e: 'select', image: CapturedImage): void
  (e: 'delete', imageId: string): void
}>()

/** 选中的图像 ID */
const selectedId = ref<string | null>(null)

/** 预览的图像 */
const previewImage = ref<CapturedImage | null>(null)

/** 格式化时间 */
function formatTime(timestamp: string) {
  return new Date(timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

/** 选择图像 */
function handleSelect(image: CapturedImage) {
  if (props.selectable) {
    selectedId.value = image.id
    emit('select', image)
  } else {
    previewImage.value = image
  }
}

/** 关闭预览 */
function closePreview() {
  previewImage.value = null
}

/** 删除图像 */
function handleDelete(imageId: string, event: Event) {
  event.stopPropagation()
  emit('delete', imageId)
}
</script>

<template>
  <div class="space-y-3">
    <!-- 标题 -->
    <div class="flex items-center justify-between">
      <h4 class="text-sm font-medium text-gray-300 flex items-center gap-2">
        <svg class="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        截图 ({{ images.length }})
      </h4>
    </div>

    <!-- 空状态 -->
    <div v-if="images.length === 0" class="text-center py-6 text-gray-500 text-sm">
      暂无截图
    </div>

    <!-- 图像网格 -->
    <div v-else class="grid grid-cols-3 gap-2">
      <div
        v-for="image in images"
        :key="image.id"
        :class="[
          'relative aspect-video bg-dark-100 rounded-lg overflow-hidden cursor-pointer group',
          'border-2 transition-all',
          selectedId === image.id ? 'border-primary-500' : 'border-transparent hover:border-dark-50',
        ]"
        @click="handleSelect(image)"
      >
        <!-- 图像 -->
        <img
          v-if="image.data.startsWith('data:') || image.data.startsWith('http') || image.data.startsWith('/')"
          :src="image.data"
          :alt="image.remark || '超声截图'"
          class="w-full h-full object-cover"
        />
        <div v-else class="w-full h-full flex items-center justify-center">
          <svg class="w-8 h-8 text-dark-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>

        <!-- 悬浮信息 -->
        <div class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <div class="absolute bottom-0 left-0 right-0 p-2">
            <p class="text-xs text-white truncate">
              {{ image.remark || formatTime(image.timestamp) }}
            </p>
          </div>
          
          <!-- 删除按钮 -->
          <button
            class="absolute top-1 right-1 p-1 bg-red-500/80 hover:bg-red-500 text-white rounded transition-colors"
            @click="handleDelete(image.id, $event)"
          >
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- 选中标记 -->
        <div
          v-if="selectedId === image.id"
          class="absolute top-1 left-1 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center"
        >
          <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>
    </div>

    <!-- 图像预览弹窗 -->
    <Teleport to="body">
      <div
        v-if="previewImage"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
        @click="closePreview"
      >
        <div class="relative max-w-4xl max-h-[90vh] p-4">
          <img
            :src="previewImage.data"
            :alt="previewImage.remark || '超声截图'"
            class="max-w-full max-h-full object-contain rounded-lg"
            @click.stop
          />
          
          <!-- 信息 -->
          <div class="absolute bottom-8 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/80 rounded-lg text-white text-sm">
            <p>{{ previewImage.remark || '超声截图' }}</p>
            <p class="text-xs text-gray-400 mt-1">{{ formatTime(previewImage.timestamp) }}</p>
          </div>
          
          <!-- 关闭按钮 -->
          <button
            class="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors"
            @click="closePreview"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>
