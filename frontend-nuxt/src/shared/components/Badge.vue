<template>
  <span :class="['badge', variant, size]">
    <slot></slot>
  </span>
</template>

<script setup lang="ts">
defineProps<{
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral'
  size?: 'sm' | 'md' | 'lg'
}>()
</script>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  border-radius: 0.375rem;
  padding: 0.25rem 0.75rem;
}

.badge.sm {
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
}

.badge.md {
  font-size: 0.875rem;
  padding: 0.25rem 0.75rem;
}

.badge.lg {
  font-size: 1rem;
  padding: 0.375rem 1rem;
}

.badge.success {
  background-color: #d1fae5;
  color: #065f46;
}

.badge.warning {
  background-color: #fef3c7;
  color: #92400e;
}

.badge.error {
  background-color: #fee2e2;
  color: #991b1b;
}

.badge.info {
  background-color: #dbeafe;
  color: #1e40af;
}

.badge.neutral {
  background-color: #f3f4f6;
  color: #374151;
}
</style>

