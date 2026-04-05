<template>
  <div class="tabs tabs-boxed mb-6">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      @click="$emit('tab-change', tab.id)"
      :class="['tab', { 'tab-active': activeTab === tab.id }]"
    >
      {{ tab.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  activeTab: string
}>()

defineEmits<{
  'tab-change': [tabId: string]
}>()

const tabs = [
  { id: 'summary', label: 'Resumen' },
  { id: 'contributions', label: 'Aportes' },
  { id: 'payments', label: 'Pagos' },
  { id: 'loans', label: 'Préstamos' },
  { id: 'stocks', label: 'Acciones' },
  { id: 'entries', label: 'Asientos' },
]
</script>
