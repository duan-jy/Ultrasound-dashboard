/**
 * Media Capture Composable
 * 处理视频流和图像截取
 * 兼容 Chrome 109+ (Win7)
 */
import { ref, onUnmounted } from 'vue'
import { useDashboardStore } from '@/stores/dashboard'

/**
 * 媒体捕获组合式函数
 */
export function useMediaCapture() {
  const store = useDashboardStore()
  
  /** 视频元素引用 */
  const videoRef = ref<HTMLVideoElement | null>(null)
  
  /** 媒体流 */
  const mediaStream = ref<MediaStream | null>(null)
  
  /** 是否正在捕获 */
  const isCapturing = ref(false)
  
  /** 错误信息 */
  const error = ref<string | null>(null)

  /**
   * 开始视频捕获
   * 支持摄像头或屏幕捕获
   */
  async function startCapture(
    type: 'camera' | 'screen' = 'camera',
    constraints?: MediaStreamConstraints
  ): Promise<boolean> {
    error.value = null
    
    try {
      let stream: MediaStream
      
      if (type === 'camera') {
        // 摄像头捕获
        stream = await navigator.mediaDevices.getUserMedia(
          constraints || {
            video: {
              width: { ideal: 1920 },
              height: { ideal: 1080 },
              facingMode: 'environment',
            },
            audio: false,
          }
        )
      } else {
        // 屏幕捕获 (Chrome 72+ 支持)
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        })
      }
      
      mediaStream.value = stream
      isCapturing.value = true
      
      // 如果有视频元素，设置源
      if (videoRef.value) {
        videoRef.value.srcObject = stream
      }
      
      // 监听流结束事件
      stream.getVideoTracks()[0]?.addEventListener('ended', () => {
        stopCapture()
      })
      
      store.updateDeviceStatus({ camera: true })
      return true
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : '未知错误'
      error.value = `无法启动视频捕获: ${errMsg}`
      console.error('[MediaCapture] 启动失败:', e)
      store.updateDeviceStatus({ camera: false })
      return false
    }
  }

  /**
   * 停止视频捕获
   */
  function stopCapture(): void {
    if (mediaStream.value) {
      mediaStream.value.getTracks().forEach(track => {
        track.stop()
      })
      mediaStream.value = null
    }
    
    if (videoRef.value) {
      videoRef.value.srcObject = null
    }
    
    isCapturing.value = false
    store.updateDeviceStatus({ camera: false })
  }

  /**
   * 截取当前帧
   * @param quality JPEG 质量 (0-1)
   */
  function captureFrame(quality: number = 0.92): string | null {
    if (!videoRef.value || !isCapturing.value) {
      error.value = '没有可用的视频流'
      return null
    }
    
    const video = videoRef.value
    
    // 创建 canvas
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      error.value = '无法创建 Canvas 上下文'
      return null
    }
    
    // 绘制当前帧
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    
    // 导出为 base64
    try {
      return canvas.toDataURL('image/jpeg', quality)
    } catch (e) {
      error.value = '截图失败'
      console.error('[MediaCapture] 截图失败:', e)
      return null
    }
  }

  /**
   * 截图并保存
   */
  async function captureAndSave(remark?: string): Promise<boolean> {
    const imageData = captureFrame()
    
    if (!imageData) {
      return false
    }
    
    try {
      await store.saveCapturedImage(imageData, remark)
      return true
    } catch (e) {
      error.value = '保存截图失败'
      console.error('[MediaCapture] 保存失败:', e)
      return false
    }
  }

  /**
   * 设置视频元素
   */
  function setVideoElement(element: HTMLVideoElement | null): void {
    videoRef.value = element
    
    // 如果已有流，设置到新元素
    if (element && mediaStream.value) {
      element.srcObject = mediaStream.value
    }
  }

  /**
   * 获取可用设备列表
   */
  async function getAvailableDevices(): Promise<MediaDeviceInfo[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      return devices.filter(device => device.kind === 'videoinput')
    } catch (e) {
      console.error('[MediaCapture] 获取设备列表失败:', e)
      return []
    }
  }

  // 组件卸载时清理
  onUnmounted(() => {
    stopCapture()
  })

  return {
    videoRef,
    mediaStream,
    isCapturing,
    error,
    startCapture,
    stopCapture,
    captureFrame,
    captureAndSave,
    setVideoElement,
    getAvailableDevices,
  }
}
