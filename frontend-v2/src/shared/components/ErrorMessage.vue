<template>
  <div v-if="error" class="alert alert-error">
    <span>{{ message }}</span>
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

