<template>
  <div v-if="loading" class="flex flex-col items-center justify-center p-8">
    <span class="loading loading-spinner loading-lg text-primary"></span>
    <p v-if="message" class="mt-4 text-base-content/60">{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  loading: boolean
  message?: string
}>()
</script>

