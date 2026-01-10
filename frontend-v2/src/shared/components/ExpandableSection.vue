<template>
  <div class="expandable-section">
    <button
      :class="['expandable-header', { 'expanded': isExpanded }]"
      @click="toggle"
    >
      <slot name="header">
        <span class="expandable-title">{{ title }}</span>
      </slot>
      <span class="expandable-icon">{{ isExpanded ? '▼' : '▶' }}</span>
    </button>
    <Transition name="expand">
      <div v-if="isExpanded" class="expandable-content">
        <slot></slot>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    title?: string
    defaultExpanded?: boolean
  }>(),
  {
    defaultExpanded: false
  }
)

const emit = defineEmits<{
  'update:expanded': [value: boolean]
}>()

const isExpanded = ref(props.defaultExpanded)

function toggle() {
  isExpanded.value = !isExpanded.value
  emit('update:expanded', isExpanded.value)
}

watch(() => props.defaultExpanded, (newValue) => {
  isExpanded.value = newValue
})
</script>

<style scoped>
.expandable-section {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.expandable-header {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: #f9fafb;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.expandable-header:hover {
  background: #f3f4f6;
}

.expandable-title {
  font-weight: 600;
  color: #1f2937;
  font-size: 1rem;
}

.expandable-icon {
  color: #6b7280;
  font-size: 0.75rem;
  transition: transform 0.2s ease;
}

.expandable-header.expanded .expandable-icon {
  transform: rotate(0deg);
}

.expandable-content {
  padding: 1.5rem;
  background: white;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  overflow-x: hidden;
}

.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.expand-enter-to,
.expand-leave-from {
  max-height: 1000px;
  opacity: 1;
}
</style>

