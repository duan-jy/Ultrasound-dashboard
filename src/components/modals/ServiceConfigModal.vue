/**
 * 服务配置弹窗组件
 * 配置 WebSocket、AI 服务等连接参数
 */
<script setup lang="ts">
import { ref, watch, computed } from 'vue'

interface ServiceConfig {
  /** WebSocket 服务地址 */
  wsUrl: string
  /** AI 分析服务地址 */
  aiServiceUrl: string
  /** PACS 服务地址 */
  pacsUrl: string
  /** 语音识别服务地址 */
  voiceServiceUrl: string
  /** 自动重连 */
  autoReconnect: boolean
  /** 重连间隔(秒) */
  reconnectInterval: number
  /** 调试模式 */
  debugMode: boolean
}

interface Props {
  /** 是否显示 */
  visible: boolean
  /** 当前配置 */
  config: ServiceConfig
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'save', config: ServiceConfig): void
  (e: 'test', type: 'ws' | 'ai' | 'pacs' | 'voice'): void
}>()

/** 本地配置 */
const localConfig = ref<ServiceConfig>({ ...props.config })

/** 测试状态 */
const testing = ref({
  ws: false,
  ai: false,
  pacs: false,
  voice: false,
})

/** 测试结果 */
const testResults = ref<Record<string, 'success' | 'error' | null>>({
  ws: null,
  ai: null,
  pacs: null,
  voice: null,
})

/** 监听 props 变化 */
watch(() => props.config, (val) => {
  localConfig.value = { ...val }
}, { deep: true })

/** 监听 visible 变化，重置状态 */
watch(() => props.visible, (val) => {
  if (val) {
    localConfig.value = { ...props.config }
    testResults.value = { ws: null, ai: null, pacs: null, voice: null }
  }
})

/** 关闭弹窗 */
function close() {
  emit('update:visible', false)
}

/** 保存配置 */
function save() {
  emit('save', { ...localConfig.value })
  close()
}

/** 测试连接 */
async function testConnection(type: 'ws' | 'ai' | 'pacs' | 'voice') {
  testing.value[type] = true
  testResults.value[type] = null
  
  // 模拟测试
  await new Promise(resolve => setTimeout(resolve, 1500))
  
  // 随机成功/失败（实际应该调用真实的测试接口）
  testResults.value[type] = Math.random() > 0.3 ? 'success' : 'error'
  testing.value[type] = false
  
  emit('test', type)
}

/** 是否有未保存的更改 */
const hasChanges = computed(() => {
  return JSON.stringify(localConfig.value) !== JSON.stringify(props.config)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="visible"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="close"
      >
        <!-- 遮罩层 -->
        <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" />
        
        <!-- 弹窗内容 -->
        <div class="relative w-full max-w-2xl bg-dark-300 border border-dark-50 rounded-xl shadow-2xl">
          <!-- 头部 -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-dark-50">
            <h2 class="text-lg font-semibold text-gray-100 flex items-center gap-2">
              <svg class="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              服务配置
            </h2>
            <button
              class="p-2 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-dark-100 transition-colors"
              @click="close"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <!-- 内容 -->
          <div class="px-6 py-5 space-y-5 max-h-[60vh] overflow-y-auto">
            <!-- WebSocket 配置 -->
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-300">
                WebSocket 服务地址
              </label>
              <div class="flex gap-2">
                <input
                  v-model="localConfig.wsUrl"
                  type="text"
                  class="flex-1 px-4 py-2.5 bg-dark-100 border border-dark-50 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-primary-500/50"
                  placeholder="ws://localhost:8080/ws"
                />
                <button
                  :disabled="testing.ws"
                  :class="[
                    'px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
                    testResults.ws === 'success'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : testResults.ws === 'error'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-dark-100 text-gray-300 border border-dark-50 hover:border-primary-500/50 hover:text-primary-400',
                  ]"
                  @click="testConnection('ws')"
                >
                  <svg
                    v-if="testing.ws"
                    class="w-4 h-4 animate-spin"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>{{ testing.ws ? '测试中' : '测试' }}</span>
                </button>
              </div>
            </div>

            <!-- AI 服务配置 -->
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-300">
                AI 分析服务地址
              </label>
              <div class="flex gap-2">
                <input
                  v-model="localConfig.aiServiceUrl"
                  type="text"
                  class="flex-1 px-4 py-2.5 bg-dark-100 border border-dark-50 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-primary-500/50"
                  placeholder="http://localhost:5000/api"
                />
                <button
                  :disabled="testing.ai"
                  :class="[
                    'px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
                    testResults.ai === 'success'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : testResults.ai === 'error'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-dark-100 text-gray-300 border border-dark-50 hover:border-primary-500/50 hover:text-primary-400',
                  ]"
                  @click="testConnection('ai')"
                >
                  <svg
                    v-if="testing.ai"
                    class="w-4 h-4 animate-spin"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>{{ testing.ai ? '测试中' : '测试' }}</span>
                </button>
              </div>
            </div>

            <!-- PACS 服务配置 -->
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-300">
                PACS 服务地址
              </label>
              <div class="flex gap-2">
                <input
                  v-model="localConfig.pacsUrl"
                  type="text"
                  class="flex-1 px-4 py-2.5 bg-dark-100 border border-dark-50 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-primary-500/50"
                  placeholder="http://localhost:8000/pacs"
                />
                <button
                  :disabled="testing.pacs"
                  :class="[
                    'px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
                    testResults.pacs === 'success'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : testResults.pacs === 'error'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-dark-100 text-gray-300 border border-dark-50 hover:border-primary-500/50 hover:text-primary-400',
                  ]"
                  @click="testConnection('pacs')"
                >
                  <svg
                    v-if="testing.pacs"
                    class="w-4 h-4 animate-spin"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>{{ testing.pacs ? '测试中' : '测试' }}</span>
                </button>
              </div>
            </div>

            <!-- 语音服务配置 -->
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-300">
                语音识别服务地址
              </label>
              <div class="flex gap-2">
                <input
                  v-model="localConfig.voiceServiceUrl"
                  type="text"
                  class="flex-1 px-4 py-2.5 bg-dark-100 border border-dark-50 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-primary-500/50"
                  placeholder="ws://localhost:8081/voice"
                />
                <button
                  :disabled="testing.voice"
                  :class="[
                    'px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
                    testResults.voice === 'success'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : testResults.voice === 'error'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-dark-100 text-gray-300 border border-dark-50 hover:border-primary-500/50 hover:text-primary-400',
                  ]"
                  @click="testConnection('voice')"
                >
                  <svg
                    v-if="testing.voice"
                    class="w-4 h-4 animate-spin"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>{{ testing.voice ? '测试中' : '测试' }}</span>
                </button>
              </div>
            </div>

            <!-- 其他选项 -->
            <div class="pt-4 border-t border-dark-50 space-y-4">
              <h3 class="text-sm font-medium text-gray-300">其他设置</h3>
              
              <!-- 自动重连 -->
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-gray-300">自动重连</p>
                  <p class="text-xs text-gray-500">断开连接后自动尝试重新连接</p>
                </div>
                <button
                  :class="[
                    'relative w-11 h-6 rounded-full transition-colors',
                    localConfig.autoReconnect ? 'bg-primary-500' : 'bg-dark-50',
                  ]"
                  @click="localConfig.autoReconnect = !localConfig.autoReconnect"
                >
                  <span
                    :class="[
                      'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow',
                      localConfig.autoReconnect ? 'left-6' : 'left-1',
                    ]"
                  />
                </button>
              </div>

              <!-- 重连间隔 -->
              <div v-if="localConfig.autoReconnect" class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-gray-300">重连间隔</p>
                  <p class="text-xs text-gray-500">每次重连的等待时间</p>
                </div>
                <div class="flex items-center gap-2">
                  <input
                    v-model.number="localConfig.reconnectInterval"
                    type="number"
                    min="1"
                    max="60"
                    class="w-20 px-3 py-1.5 bg-dark-100 border border-dark-50 rounded-lg text-sm text-gray-200 text-center focus:outline-none focus:border-primary-500/50"
                  />
                  <span class="text-sm text-gray-500">秒</span>
                </div>
              </div>

              <!-- 调试模式 -->
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-gray-300">调试模式</p>
                  <p class="text-xs text-gray-500">在控制台输出详细日志</p>
                </div>
                <button
                  :class="[
                    'relative w-11 h-6 rounded-full transition-colors',
                    localConfig.debugMode ? 'bg-primary-500' : 'bg-dark-50',
                  ]"
                  @click="localConfig.debugMode = !localConfig.debugMode"
                >
                  <span
                    :class="[
                      'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow',
                      localConfig.debugMode ? 'left-6' : 'left-1',
                    ]"
                  />
                </button>
              </div>
            </div>
          </div>
          
          <!-- 底部按钮 -->
          <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-dark-50">
            <button
              class="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-gray-200 hover:bg-dark-100 transition-colors"
              @click="close"
            >
              取消
            </button>
            <button
              :disabled="!hasChanges"
              :class="[
                'px-5 py-2.5 rounded-lg text-sm font-medium transition-all',
                hasChanges
                  ? 'bg-primary-500 text-white hover:bg-primary-600'
                  : 'bg-dark-100 text-gray-500 cursor-not-allowed',
              ]"
              @click="save"
            >
              保存配置
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .relative,
.modal-leave-active .relative {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.modal-enter-from .relative,
.modal-leave-to .relative {
  transform: scale(0.95);
  opacity: 0;
}
</style>
