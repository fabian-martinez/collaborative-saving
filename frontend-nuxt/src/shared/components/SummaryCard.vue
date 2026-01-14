<template>
  <div :class="['summary-card', { 'clickable': clickable }]" @click="clickable && $emit('click')">
    <div v-if="icon" class="summary-icon">
      <slot name="icon">{{ icon }}</slot>
    </div>
    <div class="summary-content">
      <div class="summary-title">{{ title }}</div>
      <div class="summary-value">{{ formattedValue }}</div>
      <div v-if="subtitle" class="summary-subtitle">{{ subtitle }}</div>
    </div>
    <div v-if="$slots.action || action" class="summary-action">
      <slot name="action">
        <button v-if="action" @click.stop="$emit('action-click')" class="btn btn-sm btn-ghost">
          {{ action }}
        </button>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatCurrency } from '@/shared/utils/formatters'

const props = withDefaults(
  defineProps<{
    title: string
    value: number | string
    subtitle?: string
    icon?: string
    action?: string
    clickable?: boolean
    format?: 'currency' | 'number' | 'text'
  }>(),
  {
    format: 'currency',
    clickable: false
  }
)

const formattedValue = computed(() => {
  if (typeof props.value === 'string') return props.value
  switch (props.format) {
    case 'currency':
      return formatCurrency(props.value)
    case 'number':
      return props.value.toLocaleString()
    default:
      return String(props.value)
  }
})

defineEmits<{
  click: []
  'action-click': []
}>()
</script>

<style scoped>
.summary-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  transition: all 0.2s ease;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.summary-card.clickable {
  cursor: pointer;
}

.summary-card.clickable:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.summary-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f3f4f6;
  border-radius: 0.5rem;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.summary-content {
  flex: 1;
  min-width: 0;
}

.summary-title {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.summary-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.25rem;
  font-family: monospace;
}

.summary-subtitle {
  font-size: 0.75rem;
  color: #9ca3af;
}

.summary-action {
  flex-shrink: 0;
  align-self: flex-start;
}
</style>

