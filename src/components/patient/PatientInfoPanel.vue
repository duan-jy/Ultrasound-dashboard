<script setup lang="ts">
/**
 * 患者信息面板组件
 * 显示当前患者的详细信息
 */
import { computed } from 'vue'
import type { PatientInfo } from '@/types'
import GlowCard from '../common/GlowCard.vue'

interface Props {
  /** 患者信息 */
  patient: PatientInfo | null
  /** 是否加载中 */
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

/** 性别显示文本 */
const genderText = computed(() => {
  if (!props.patient) return '-'
  const genders = { male: '男', female: '女', unknown: '未知' }
  return genders[props.patient.gender]
})

/** 格式化检查时间 */
const formattedExamTime = computed(() => {
  if (!props.patient?.examTime) return '-'
  return new Date(props.patient.examTime).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
})
</script>

<template>
  <GlowCard :has-header="true" glow="primary">
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-semibold text-gray-100 flex items-center gap-2">
          <svg class="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          患者信息
        </h3>
        <span v-if="patient" class="text-xs text-primary-400 font-mono">
          {{ patient.patientNo }}
        </span>
      </div>
    </template>

    <!-- 加载状态 -->
    <div v-if="loading" class="space-y-3 animate-pulse">
      <div class="h-6 bg-dark-50 rounded w-1/2" />
      <div class="h-4 bg-dark-50 rounded w-3/4" />
      <div class="h-4 bg-dark-50 rounded w-2/3" />
    </div>

    <!-- 空状态 -->
    <div v-else-if="!patient" class="text-center py-8">
      <svg class="w-12 h-12 text-dark-50 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
      </svg>
      <p class="text-sm text-gray-500">暂无患者信息</p>
      <p class="text-xs text-gray-600 mt-1">等待 PACS 系统推送数据</p>
    </div>

    <!-- 患者信息 -->
    <div v-else class="space-y-4">
      <!-- 基础信息 -->
      <div class="flex items-start gap-4">
        <!-- 头像 -->
        <div class="w-14 h-14 rounded-lg bg-dark-100 flex items-center justify-center flex-shrink-0 border border-dark-50">
          <span class="text-2xl font-semibold text-primary-400">
            {{ patient.name.charAt(0) }}
          </span>
        </div>
        
        <!-- 名字和基本信息 -->
        <div class="flex-1 min-w-0">
          <h4 class="text-lg font-semibold text-gray-100 truncate">
            {{ patient.name }}
          </h4>
          <div class="flex items-center gap-3 mt-1 text-sm text-gray-400">
            <span>{{ genderText }}</span>
            <span class="text-dark-50">|</span>
            <span>{{ patient.age }}岁</span>
            <span v-if="patient.bedNo" class="text-dark-50">|</span>
            <span v-if="patient.bedNo">{{ patient.bedNo }}</span>
          </div>
        </div>
      </div>

      <!-- 详细信息列表 -->
      <div class="grid grid-cols-2 gap-3">
        <div>
          <p class="info-label">科室</p>
          <p class="info-value">{{ patient.department || '-' }}</p>
        </div>
        <div>
          <p class="info-label">检查部位</p>
          <p class="info-value">{{ patient.examPart || '-' }}</p>
        </div>
        <div>
          <p class="info-label">检查时间</p>
          <p class="info-value">{{ formattedExamTime }}</p>
        </div>
        <div>
          <p class="info-label">住院号</p>
          <p class="info-value font-mono text-xs">{{ patient.patientNo }}</p>
        </div>
      </div>

      <!-- 主诉 -->
      <div v-if="patient.chiefComplaint">
        <p class="info-label">主诉</p>
        <p class="info-value text-gray-300 leading-relaxed">
          {{ patient.chiefComplaint }}
        </p>
      </div>

      <!-- 临床诊断 -->
      <div v-if="patient.clinicalDiagnosis">
        <p class="info-label">临床诊断</p>
        <p class="info-value text-amber-400/90 leading-relaxed">
          {{ patient.clinicalDiagnosis }}
        </p>
      </div>
    </div>
  </GlowCard>
</template>
