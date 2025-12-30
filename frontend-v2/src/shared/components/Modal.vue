<template>
  <dialog v-if="show" class="modal modal-open" @click.self="$emit('close')">
    <div class="modal-box">
      <form method="dialog">
        <button @click="$emit('close')" class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
      </form>
      <h3 class="font-bold text-lg mb-4">{{ title }}</h3>
      <div class="py-4">
        <slot></slot>
      </div>
      <div v-if="$slots.footer" class="modal-action">
        <slot name="footer"></slot>
      </div>
    </div>
  </dialog>
</template>

<script setup lang="ts">
defineProps<{
  show: boolean
  title: string
}>()

defineEmits<{
  close: []
}>()
</script>

