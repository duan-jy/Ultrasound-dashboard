/**
 * 诊断面板组件
 * 包含检查所见、检查诊断、危急值、阴阳性选择
 */
<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import GlowCard from '../common/GlowCard.vue'

interface Props {
  /** 检查所见 */
  findings?: string
  /** 检查诊断 */
  diagnosis?: string
  /** 危急值 */
  criticalValue?: boolean
  /** 阴阳性 */
  positivity?: 'positive' | 'negative' | null
  /** 是否只读 */
  readonly?: boolean
  /** 是否有患者 */
  hasPatient?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  findings: '',
  diagnosis: '',
  criticalValue: false,
  positivity: null,
  readonly: false,
  hasPatient: false,
})

const emit = defineEmits<{
  (e: 'update:findings', value: string): void
  (e: 'update:diagnosis', value: string): void
  (e: 'update:criticalValue', value: boolean): void
  (e: 'update:positivity', value: 'positive' | 'negative' | null): void
}>()

/** 本地状态 */
const localFindings = ref(props.findings)
const localDiagnosis = ref(props.diagnosis)
const localCriticalValue = ref(props.criticalValue)
const localPositivity = ref<'positive' | 'negative' | null>(props.positivity)

/** 监听 props 变化 */
watch(() => props.findings, (val) => { localFindings.value = val })
watch(() => props.diagnosis, (val) => { localDiagnosis.value = val })
watch(() => props.criticalValue, (val) => { localCriticalValue.value = val })
watch(() => props.positivity, (val) => { localPositivity.value = val })

/** 更新检查所见 */
function updateFindings(e: Event) {
  const value = (e.target as HTMLTextAreaElement).value
  localFindings.value = value
  emit('update:findings', value)
}

/** 更新检查诊断 */
function updateDiagnosis(e: Event) {
  const value = (e.target as HTMLTextAreaElement).value
  localDiagnosis.value = value
  emit('update:diagnosis', value)
}

/** 切换危急值 */
function toggleCriticalValue(value: boolean) {
  localCriticalValue.value = value
  emit('update:criticalValue', value)
}

/** 设置阴阳性 */
function setPositivity(value: 'positive' | 'negative' | null) {
  localPositivity.value = value
  emit('update:positivity', value)
}

/** 阴阳性显示文本 */
const positivityText = computed(() => {
  if (localPositivity.value === 'positive') return '阳性'
  if (localPositivity.value === 'negative') return '阴性'
  return '未选择'
})
</script>

<template>
  <div class="flex flex-col gap-4 h-full overflow-hidden">
    <!-- 患者画像/历史 -->
    <GlowCard :has-header="true" glow="none" class="flex-shrink-0" compact>
      <template #header>
        <h3 class="text-sm font-semibold text-gray-100 flex items-center gap-2">
          <svg class="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          患者画像
        </h3>
      </template>
      
      <div v-if="!hasPatient" class="text-center py-3">
        <svg class="w-8 h-8 text-dark-50 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p class="text-xs text-gray-500">当前患者暂无历史诊断记录</p>
      </div>
      <div v-else class="text-sm text-gray-400 leading-relaxed">
        <slot name="patientHistory">
          当前患者暂无历史诊断记录
        </slot>
      </div>
    </GlowCard>

    <!-- 检查所见 -->
    <GlowCard :has-header="true" glow="none" class="flex-1 min-h-0 flex flex-col" scrollable compact>
      <template #header>
        <h3 class="text-sm font-semibold text-gray-100 flex items-center gap-2">
          <svg class="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          检查所见
        </h3>
      </template>
      
      <textarea
        :value="localFindings"
        :readonly="readonly"
        :class="[
          'flex-1 w-full min-h-[80px] bg-dark-100 border border-dark-50 rounded-lg p-3 text-sm text-gray-300',
          'placeholder-gray-600 resize-none focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20',
          'transition-all scrollbar-thin',
          readonly ? 'cursor-not-allowed opacity-70' : '',
        ]"
        placeholder="请输入检查所见..."
        @input="updateFindings"
      />
    </GlowCard>

    <!-- 检查诊断 -->
    <GlowCard :has-header="true" glow="none" class="flex-1 min-h-0 flex flex-col" scrollable compact>
      <template #header>
        <h3 class="text-sm font-semibold text-gray-100 flex items-center gap-2">
          <svg class="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          检查诊断
        </h3>
      </template>
      
      <textarea
        :value="localDiagnosis"
        :readonly="readonly"
        :class="[
          'flex-1 w-full min-h-[80px] bg-dark-100 border border-dark-50 rounded-lg p-3 text-sm text-gray-300',
          'placeholder-gray-600 resize-none focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20',
          'transition-all scrollbar-thin',
          readonly ? 'cursor-not-allowed opacity-70' : '',
        ]"
        placeholder="请输入检查诊断..."
        @input="updateDiagnosis"
      />
    </GlowCard>

    <!-- 危急值和阴阳性 -->
    <div class="flex-shrink-0 bg-dark-200 border border-dark-50 rounded-xl p-4">
      <div class="flex items-center justify-between gap-4">
        <!-- 危急值 -->
        <div class="flex items-center gap-3">
          <span class="text-sm text-gray-400 font-medium">危急值</span>
          <div class="flex items-center bg-dark-100 rounded-lg p-0.5">
            <button
              :class="[
                'px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200',
                !localCriticalValue
                  ? 'bg-dark-50 text-gray-200 shadow-sm'
                  : 'text-gray-500 hover:text-gray-400',
              ]"
              :disabled="readonly"
              @click="toggleCriticalValue(false)"
            >
              否
            </button>
            <button
              :class="[
                'px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200',
                localCriticalValue
                  ? 'bg-red-500/30 text-red-400 shadow-sm shadow-red-500/20'
                  : 'text-gray-500 hover:text-gray-400',
              ]"
              :disabled="readonly"
              @click="toggleCriticalValue(true)"
            >
              是
            </button>
          </div>
        </div>

        <!-- 阴阳性 -->
        <div class="flex items-center gap-3">
          <span class="text-sm text-gray-400 font-medium">阴阳性</span>
          <div class="flex items-center bg-dark-100 rounded-lg p-0.5">
            <button
              :class="[
                'px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200',
                localPositivity === null
                  ? 'bg-dark-50 text-gray-200 shadow-sm'
                  : 'text-gray-500 hover:text-gray-400',
              ]"
              :disabled="readonly"
              @click="setPositivity(null)"
            >
              未选择
            </button>
            <button
              :class="[
                'px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200',
                localPositivity === 'negative'
                  ? 'bg-emerald-500/30 text-emerald-400 shadow-sm shadow-emerald-500/20'
                  : 'text-gray-500 hover:text-gray-400',
              ]"
              :disabled="readonly"
              @click="setPositivity('negative')"
            >
              阴性
            </button>
            <button
              :class="[
                'px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200',
                localPositivity === 'positive'
                  ? 'bg-red-500/30 text-red-400 shadow-sm shadow-red-500/20'
                  : 'text-gray-500 hover:text-gray-400',
              ]"
              :disabled="readonly"
              @click="setPositivity('positive')"
            >
              阳性
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
