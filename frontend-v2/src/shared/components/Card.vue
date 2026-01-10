<template>
  <div :class="['card', variant, { 'card-hover': hover }]">
    <div v-if="$slots.header || title" class="card-header">
      <slot name="header">
        <h3 v-if="title" class="card-title">{{ title }}</h3>
      </slot>
    </div>
    <div class="card-body">
      <slot></slot>
    </div>
    <div v-if="$slots.footer" class="card-footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title?: string
  variant?: 'default' | 'bordered' | 'elevated'
  hover?: boolean
}>()
</script>

<style scoped>
.card {
  background: white;
  border-radius: 8px;
  padding: 0;
  transition: all 0.2s ease;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.card.bordered {
  border: 1px solid #e5e7eb;
}

.card.elevated {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.card-hover:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.card-header {
  padding: 1.5rem 1.5rem 0;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 1rem;
}

.card-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

.card-body {
  padding: 1.5rem;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  overflow-x: hidden;
}

.card-footer {
  padding: 0 1.5rem 1.5rem;
  border-top: 1px solid #e5e7eb;
  margin-top: 1rem;
  padding-top: 1rem;
}
</style>

