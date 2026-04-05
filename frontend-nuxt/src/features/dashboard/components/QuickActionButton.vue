<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  title: string
  description: string
  icon: Component
  onClick?: () => void
}>()
</script>

<template>
  <button
    @click="onClick"
    class="btn btn-outline btn-lg h-auto flex flex-col items-start p-4 hover:btn-primary transition-colors"
  >
    <div class="flex items-center gap-3 w-full mb-2">
      <component :is="icon" class="w-6 h-6" />
      <span class="font-semibold text-left">{{ title }}</span>
    </div>
    <span class="text-xs opacity-70 text-left">{{ description }}</span>
  </button>
</template>
