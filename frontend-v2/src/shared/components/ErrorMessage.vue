<template>
  <div class="error-message" v-if="error">
    <div class="error-icon">⚠️</div>
    <div class="error-content">
      <h3>{{ title || 'Error' }}</h3>
      <p>{{ message }}</p>
      <button v-if="retry" @click="retry" class="retry-button">Reintentar</button>
    </div>
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

<style scoped>
.error-message {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background-color: #fee;
  border: 1px solid #fcc;
  border-radius: 4px;
  color: #c33;
}

.error-icon {
  font-size: 1.5rem;
}

.error-content {
  flex: 1;
}

.error-content h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
}

.error-content p {
  margin: 0 0 0.5rem 0;
}

.retry-button {
  background-color: #c33;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

.retry-button:hover {
  background-color: #a22;
}
</style>

