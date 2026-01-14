<template>
  <div class="ledger-view space-y-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div class="flex gap-2">
        <button @click="handleExport" class="btn btn-outline">
          <Download class="w-5 h-5" />
          Exportar
        </button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs tabs-boxed">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="activeTab = tab.id"
        :class="['tab', { 'tab-active': activeTab === tab.id }]"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Tab Content -->
    <div>
      <BalanceTab ref="balanceTabRef" v-if="activeTab === 'balance'" />
      <OperationsTab ref="operationsTabRef" v-if="activeTab === 'operations'" />
      <JournalTab ref="journalTabRef" v-if="activeTab === 'journal'" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Download } from 'iconoir-vue/regular'
import BalanceTab from '../components/BalanceTab.vue'
import OperationsTab from '../components/OperationsTab.vue'
import JournalTab from '../components/JournalTab.vue'
import type { ComponentPublicInstance } from 'vue'

const activeTab = ref<'balance' | 'operations' | 'journal'>('balance')

const balanceTabRef = ref<ComponentPublicInstance & { exportData?: () => Promise<void> }>()
const operationsTabRef = ref<ComponentPublicInstance & { exportData?: () => Promise<void> }>()
const journalTabRef = ref<ComponentPublicInstance & { exportData?: () => Promise<void> }>()

const tabs = [
  { id: 'balance' as const, label: 'Balance' },
  { id: 'operations' as const, label: 'Operaciones' },
  { id: 'journal' as const, label: 'Libro Diario' }
]

async function handleExport() {
  if (activeTab.value === 'balance' && balanceTabRef.value?.exportData) {
    await balanceTabRef.value.exportData()
  } else if (activeTab.value === 'operations' && operationsTabRef.value?.exportData) {
    await operationsTabRef.value.exportData()
  } else if (activeTab.value === 'journal' && journalTabRef.value?.exportData) {
    await journalTabRef.value.exportData()
  }
}
</script>

<style scoped>
.ledger-view {
  padding: 2rem;
}
</style>
