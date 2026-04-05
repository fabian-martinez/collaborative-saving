<template>
  <div class="toast toast-top toast-end z-[9999]">
    <div
      v-for="toast in toasts"
      :key="toast.id"
      class="alert shadow-lg transition-all duration-300"
      :class="{
        'alert-info': toast.type === 'info',
        'alert-success': toast.type === 'success',
        'alert-warning': toast.type === 'warning',
        'alert-error': toast.type === 'error',
      }"
    >
      <div class="flex items-center gap-2">
        <span v-if="toast.type === 'success'" class="icon">✅</span>
        <span v-if="toast.type === 'error'" class="icon">❌</span>
        <span v-if="toast.type === 'warning'" class="icon">⚠️</span>
        <span v-if="toast.type === 'info'" class="icon">ℹ️</span>
        <span class="text-white font-medium">{{ toast.message }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useToast } from '@/shared/composables/useToast'

const { toasts } = useToast()
</script>

<style scoped>
.toast {
  pointer-events: none;
}
.alert {
  pointer-events: auto;
}
</style>
