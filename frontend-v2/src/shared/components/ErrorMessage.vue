<template>
  <div v-if="error" role="alert" class="alert alert-error shadow-sm">
    <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <div class="flex-1">
      <h3 v-if="title" class="font-bold text-sm">{{ title }}</h3>
      <div class="text-sm">{{ message }}</div>
    </div>
    <button v-if="retry" @click="retry" class="btn btn-sm btn-ghost">Reintentar</button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  error: string | Error | null
  title?: string
  retry?: () => void
}>()

const message = computed(() => {
  if (!props.error) return ''
  if (typeof props.error === 'string') return props.error
  return props.error.message || 'Error desconocido'
})
</script>
