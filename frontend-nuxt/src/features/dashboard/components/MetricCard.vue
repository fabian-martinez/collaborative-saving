<script setup lang="ts">
import { computed } from 'vue'
import type { Component } from 'vue'

const props = defineProps<{
  title: string
  value: string | number
  subtitle?: string
  changePercent?: number
  icon?: Component
  bgColor?: 'default' | 'primary' | 'warning'
}>()

const cardClasses = computed(() => {
  const base = 'card shadow-lg'
  switch (props.bgColor) {
    case 'primary':
      return `${base} bg-primary text-primary-content`
    case 'warning':
      return `${base} bg-warning text-warning-content`
    default:
      return `${base} bg-base-100`
  }
})

const changeColor = computed(() => {
  if (!props.changePercent) return ''
  return props.changePercent >= 0 ? 'text-success' : 'text-error'
})

const changeIcon = computed(() => {
  if (!props.changePercent) return ''
  return props.changePercent >= 0 ? '↑' : '↓'
})
</script>

<template>
  <div :class="cardClasses">
    <div class="card-body">
      <div class="flex items-center justify-between">
        <div class="flex-1">
          <h3 class="text-sm font-medium opacity-70">{{ title }}</h3>
          <p class="text-3xl font-bold mt-2">{{ value }}</p>
          <div v-if="subtitle" class="text-sm opacity-70 mt-1">{{ subtitle }}</div>
          <div v-if="changePercent !== undefined" :class="['text-sm mt-1', changeColor]">
            {{ changeIcon }}{{ Math.abs(changePercent) }}%
          </div>
        </div>
        <div v-if="icon" class="ml-4">
          <component :is="icon" class="w-8 h-8 opacity-70" />
        </div>
      </div>
    </div>
  </div>
</template>
