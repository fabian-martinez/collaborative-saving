<template>
  <span
    @dblclick="copyToClipboard"
    :title="copied ? '¡Copiado!' : 'Doble click para copiar'"
    style="cursor: pointer; user-select: all;"
    class="transition-colors duration-200"
    :class="copied ? 'bg-success/20' : ''"
  >
    <slot>{{ formatted }}</slot>
  </span>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { formatNumber } from '@/shared/formatters'

const props = defineProps<{
  value: number | string
  options?: Intl.NumberFormatOptions
}>()

const copied = ref(false)
const formatted = computed(() => {
  if (typeof props.value === 'number') return formatNumber(props.value, props.options)
  // Si es string, intenta parsear a número
  const num = Number(props.value)
  return isNaN(num) ? props.value : formatNumber(num, props.options)
})

function copyToClipboard() {
  navigator.clipboard.writeText(formatted.value.toString())
  copied.value = true
  setTimeout(() => copied.value = false, 1000)
}
</script> 