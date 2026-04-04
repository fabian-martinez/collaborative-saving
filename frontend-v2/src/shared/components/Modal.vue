<template>
  <dialog v-if="show" class="modal" :class="{ 'modal-open': show }" @click.self="$emit('close')">
    <div class="modal-box w-full max-w-full min-w-0" @click.stop>
      <form method="dialog">
        <button @click="$emit('close')" class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" aria-label="Cerrar modal">✕</button>
      </form>
      <h3 class="font-bold text-lg mb-4">{{ title }}</h3>
      <div class="w-full max-w-full min-w-0 overflow-x-hidden">
        <slot></slot>
      </div>
      <div v-if="$slots.footer" class="modal-action">
        <slot name="footer"></slot>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop" @click="$emit('close')">
      <button aria-label="Cerrar modal">Cerrar</button>
    </form>
  </dialog>
</template>

<script setup lang="ts">
import { watch, onUnmounted } from 'vue'

const props = defineProps<{
  show: boolean
  title: string
}>()

const emit = defineEmits<{
  close: []
}>()

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.show) {
    emit('close')
  }
}

watch(() => props.show, (val: boolean) => {
  if (val) {
    window.addEventListener('keydown', handleKeydown)
  } else {
    window.removeEventListener('keydown', handleKeydown)
  }
}, { immediate: true })

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>
