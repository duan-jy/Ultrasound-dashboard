<script setup lang="ts">
/**
 * 视频显示组件
 * 显示超声视频流或静态图像
 */
import { ref, onMounted, onUnmounted } from 'vue'
import { useMediaCapture } from '@/composables/useMediaCapture'

interface Props {
  /** 是否显示控制按钮 */
  showControls?: boolean
  /** 占位图 */
  placeholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  showControls: true,
  placeholder: '',
})

const emit = defineEmits<{
  (e: 'capture', data: string): void
  (e: 'error', message: string): void
}>()

const { 
  isCapturing, 
  error,
  startCapture, 
  stopCapture, 
  captureFrame,
  setVideoElement,
} = useMediaCapture()

const videoElement = ref<HTMLVideoElement | null>(null)
const isFullscreen = ref(false)

/** 初始化视频元素 */
onMounted(() => {
  if (videoElement.value) {
    setVideoElement(videoElement.value)
  }
})

/** 清理 */
onUnmounted(() => {
  stopCapture()
})

/** 开始捕获 */
async function handleStartCapture(type: 'camera' | 'screen' = 'camera') {
  const success = await startCapture(type)
  if (!success && error.value) {
    emit('error', error.value)
  }
}

/** 停止捕获 */
function handleStopCapture() {
  stopCapture()
}

/** 截图 */
function handleCapture() {
  const imageData = captureFrame()
  if (imageData) {
    emit('capture', imageData)
  } else if (error.value) {
    emit('error', error.value)
  }
}

/** 切换全屏 */
function toggleFullscreen() {
  const container = videoElement.value?.parentElement
  if (!container) return
  
  if (!document.fullscreenElement) {
    container.requestFullscreen?.()
    isFullscreen.value = true
  } else {
    document.exitFullscreen?.()
    isFullscreen.value = false
  }
}

/** 监听全屏变化 */
function handleFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement
}

onMounted(() => {
  document.addEventListener('fullscreenchange', handleFullscreenChange)
})

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
})
</script>

<template>
  <div class="relative w-full h-full bg-black rounded-lg overflow-hidden group">
    <!-- 视频元素 -->
    <video
      ref="videoElement"
      class="w-full h-full object-contain"
      autoplay
      muted
      playsinline
    />
    
    <!-- 占位状态 -->
    <div
      v-if="!isCapturing"
      class="absolute inset-0 flex flex-col items-center justify-center bg-dark-400"
    >
      <svg class="w-20 h-20 text-dark-100 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
      <p class="text-gray-500 text-sm mb-4">视频源未连接</p>
      
      <!-- 启动按钮 -->
      <div v-if="showControls" class="flex gap-3">
        <button
          class="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
          @click="handleStartCapture('screen')"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          采集屏幕
        </button>
        <button
          class="px-4 py-2 bg-dark-100 hover:bg-dark-50 text-gray-300 text-sm rounded-lg transition-colors flex items-center gap-2"
          @click="handleStartCapture('camera')"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          摄像头
        </button>
      </div>
    </div>

    <!-- 控制栏 -->
    <div
      v-if="isCapturing && showControls"
      class="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
    >
      <div class="flex items-center justify-between">
        <!-- 左侧：状态 -->
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span class="text-xs text-gray-300">实时采集中</span>
        </div>
        
        <!-- 右侧：按钮 -->
        <div class="flex items-center gap-2">
          <!-- 截图 -->
          <button
            class="p-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors"
            title="截图"
            @click="handleCapture"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          
          <!-- 全屏 -->
          <button
            class="p-2 bg-dark-100 hover:bg-dark-50 text-gray-300 rounded-lg transition-colors"
            title="全屏"
            @click="toggleFullscreen"
          >
            <svg v-if="!isFullscreen" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
            <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <!-- 停止 -->
          <button
            class="p-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
            title="停止"
            @click="handleStopCapture"
          >
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="1" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- 错误提示 -->
    <div
      v-if="error"
      class="absolute top-4 left-4 right-4 px-4 py-2 bg-red-500/90 text-white text-sm rounded-lg"
    >
      {{ error }}
    </div>
  </div>
</template>
