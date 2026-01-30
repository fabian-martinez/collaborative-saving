<template>
  <div class="settings-view space-y-6">
    <div class="mb-6">
      <h1 class="text-3xl font-bold">Configuración</h1>
      <p class="text-base-content/70">Administra los tipos de préstamos, acciones y su distribución de intereses.</p>
    </div>

    <Tabs :tabs="settingsTabs">
      <template #content-loan-types>
        <LoanTypeManagement />
      </template>
      <template #content-stock-types>
        <StockTypeManagement />
      </template>
      <template #content-distribution>
        <InterestDistributionManagement />
      </template>
    </Tabs>
  </div>
</template>

<script setup lang="ts">
import Tabs from '@/shared/components/Tabs.vue'
import type { Tab } from '@/shared/components/Tabs.vue'
import LoanTypeManagement from '../components/LoanTypeManagement.vue'
import StockTypeManagement from '../components/StockTypeManagement.vue'
import InterestDistributionManagement from '../components/InterestDistributionManagement.vue'

const settingsTabs: Tab[] = [
  { id: 'loan-types', label: 'Tipos de Préstamo' },
  { id: 'stock-types', label: 'Tipos de Acciones' },
  { id: 'distribution', label: 'Distribución de Intereses' }
]
</script>
