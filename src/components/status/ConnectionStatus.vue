<script setup lang="ts">
/**
 * 连接状态组件
 * 显示各设备和服务的连接状态
 */
import type { DeviceStatus, WebSocketStatus } from '@/types'
import StatusIndicator from '../common/StatusIndicator.vue'

interface Props {
  /** 设备状态 */
  deviceStatus: DeviceStatus
  /** WebSocket 状态 */
  wsStatus: WebSocketStatus
}

defineProps<Props>()

/** WebSocket 状态映射 */
function getWsStatusType(status: WebSocketStatus) {
  const map: Record<WebSocketStatus, 'online' | 'offline' | 'processing' | 'warning' | 'error'> = {
    connected: 'online',
    disconnected: 'offline',
    connecting: 'processing',
    reconnecting: 'warning',
    error: 'error',
  }
  return map[status]
}

/** WebSocket 状态文本 */
function getWsStatusText(status: WebSocketStatus) {
  const texts: Record<WebSocketStatus, string> = {
    connected: '已连接',
    disconnected: '未连接',
    connecting: '连接中',
    reconnecting: '重连中',
    error: '连接错误',
  }
  return texts[status]
}
</script>

<template>
  <div class="flex items-center gap-4 px-4 py-2 bg-dark-200 border border-dark-50 rounded-lg">
    <!-- AI 服务 -->
    <StatusIndicator
      :status="wsStatus === 'connected' ? 'online' : getWsStatusType(wsStatus)"
      :label="`AI服务: ${getWsStatusText(wsStatus)}`"
      size="sm"
    />
    
    <div class="w-px h-4 bg-dark-50" />
    
    <!-- 超声设备 -->
    <StatusIndicator
      :status="deviceStatus.ultrasound ? 'online' : 'offline'"
      :label="`超声: ${deviceStatus.ultrasound ? '已连接' : '未连接'}`"
      size="sm"
    />
    
    <div class="w-px h-4 bg-dark-50" />
    
    <!-- 摄像头 -->
    <StatusIndicator
      :status="deviceStatus.camera ? 'online' : 'offline'"
      :label="`采集: ${deviceStatus.camera ? '运行中' : '未启动'}`"
      size="sm"
    />
    
    <div class="w-px h-4 bg-dark-50" />
    
    <!-- PACS -->
    <StatusIndicator
      :status="deviceStatus.pacs ? 'online' : 'offline'"
      :label="`PACS: ${deviceStatus.pacs ? '已同步' : '未连接'}`"
      size="sm"
    />
  </div>
</template>
