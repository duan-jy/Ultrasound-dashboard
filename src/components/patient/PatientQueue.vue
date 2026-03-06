/**
 * 患者登记列表组件
 * 显示就诊队列，支持选中高亮
 */
<script setup lang="ts">
import { computed } from 'vue'
import type { PatientInfo } from '@/types'
import GlowCard from '../common/GlowCard.vue'

interface Props {
  /** 患者列表 */
  patients: PatientInfo[]
  /** 当前选中的患者ID */
  currentPatientId: string | null
  /** 是否加载中 */
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

const emit = defineEmits<{
  /** 选择患者 */
  (e: 'select', patient: PatientInfo): void
}>()

/** 格式化性别 */
function formatGender(gender: string): string {
  const genders: Record<string, string> = { male: '男', female: '女', unknown: '未知' }
  return genders[gender] || '未知'
}

/** 格式化检查时间 */
function formatTime(time?: string): string {
  if (!time) return '-'
  return new Date(time).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <GlowCard :has-header="true" glow="primary" class="h-full flex flex-col" scrollable>
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-semibold text-gray-100 flex items-center gap-2">
          <svg class="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          就诊人数
          <span class="ml-1 px-1.5 py-0.5 text-xs bg-primary-500/20 text-primary-400 rounded-full">
            {{ patients.length }}
          </span>
        </h3>
        <div class="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 rounded-full">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span class="text-xs text-emerald-400">实时</span>
        </div>
      </div>
    </template>

    <!-- 加载状态 -->
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <div class="flex flex-col items-center gap-3">
        <div class="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        <span class="text-sm text-gray-500">加载中...</span>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else-if="patients.length === 0" class="flex-1 flex items-center justify-center">
      <div class="text-center py-8">
        <svg class="w-12 h-12 text-dark-50 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <p class="text-sm text-gray-500">暂无就诊患者</p>
        <p class="text-xs text-gray-600 mt-1">等待 PACS 系统推送数据</p>
      </div>
    </div>

    <!-- 患者列表 -->
    <div v-else class="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
      <div
        v-for="patient in patients"
        :key="patient.id"
        :class="[
          'p-3 rounded-lg cursor-pointer transition-all duration-200',
          'hover:bg-dark-100',
          patient.id === currentPatientId
            ? 'bg-primary-500/20 border border-primary-500/50 shadow-lg shadow-primary-500/10'
            : 'bg-dark-100/50 border border-transparent',
        ]"
        @click="emit('select', patient)"
      >
        <div class="flex items-center gap-3">
          <!-- 头像 -->
          <div
            :class="[
              'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors',
              patient.id === currentPatientId
                ? 'bg-primary-500 text-white'
                : 'bg-dark-50 text-gray-400',
            ]"
          >
            <span class="text-lg font-semibold">{{ patient.name.charAt(0) }}</span>
          </div>

          <!-- 基本信息 -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between">
              <h4
                :class="[
                  'text-sm font-medium truncate',
                  patient.id === currentPatientId ? 'text-primary-300' : 'text-gray-200',
                ]"
              >
                {{ patient.name }}
              </h4>
              <span class="text-xs text-gray-500 flex-shrink-0 ml-2">
                {{ formatTime(patient.examTime) }}
              </span>
            </div>
            <div class="flex items-center gap-2 mt-1 text-xs text-gray-500">
              <span>{{ formatGender(patient.gender) }}</span>
              <span class="text-dark-50">|</span>
              <span>{{ patient.age }}岁</span>
              <span v-if="patient.examPart" class="text-dark-50">|</span>
              <span v-if="patient.examPart" class="text-primary-400/80 truncate">
                {{ patient.examPart }}
              </span>
            </div>
          </div>

          <!-- 选中指示器 -->
          <div v-if="patient.id === currentPatientId" class="flex-shrink-0">
            <svg class="w-5 h-5 text-primary-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  </GlowCard>
</template>
