<template>
  <div class="progress-bar-container">
    <div v-if="label" class="progress-label">
      <span>{{ label }}</span>
      <span v-if="showPercentage" class="progress-percentage">{{ percentage }}%</span>
    </div>
    <div class="progress-bar">
      <div
        :class="['progress-fill', variant]"
        :style="{ width: `${percentage}%` }"
        :aria-valuenow="percentage"
        aria-valuemin="0"
        aria-valuemax="100"
        role="progressbar"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    value: number
    max?: number
    label?: string
    showPercentage?: boolean
    variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
  }>(),
  {
    max: 100,
    showPercentage: true,
    variant: 'default'
  }
)

const percentage = computed(() => {
  if (props.max === 0) return 0
  const pct = (props.value / props.max) * 100
  return Math.min(Math.max(pct, 0), 100)
})
</script>

<style scoped>
.progress-bar-container {
  width: 100%;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.progress-percentage {
  font-weight: 600;
  color: #374151;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background-color: #e5e7eb;
  border-radius: 9999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  transition: width 0.3s ease;
  border-radius: 9999px;
}

.progress-fill.default {
  background-color: #3498db;
}

.progress-fill.success {
  background-color: #27ae60;
}

.progress-fill.warning {
  background-color: #f39c12;
}

.progress-fill.error {
  background-color: #e74c3c;
}

.progress-fill.info {
  background-color: #3498db;
}
</style>
