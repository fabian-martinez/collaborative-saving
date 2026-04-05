<template>
  <div class="card bg-base-100 shadow-lg">
    <div class="card-body p-3 sm:p-4">
      <div class="flex items-center gap-2 sm:gap-3 mb-2">
        <component :is="icon" class="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" :class="iconColor" />
        <h3 class="card-title text-sm sm:text-lg truncate min-w-0">{{ title }}</h3>
      </div>
      <p class="text-xl sm:text-2xl lg:text-3xl font-bold break-words overflow-hidden leading-tight" :class="amountColor">
        {{ formatCurrencyCompact(total) }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatCurrencyCompact } from '@/shared/utils/formatters'
import type { Component } from 'vue'

interface Props {
  title: string
  total: number
  icon: Component
  iconColor?: string
  amountColor?: string
}

withDefaults(defineProps<Props>(), {
  iconColor: 'text-primary',
  amountColor: 'text-primary'
})
</script>
