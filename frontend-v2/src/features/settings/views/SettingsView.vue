<!--
  Copyright 2026 Collaborative Saving Project.
  All rights reserved.
-->
<template>
  <div class="settings-view p-6 max-w-7xl mx-auto space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold tracking-tight">Configuración del Sistema</h1>
      <p class="text-base-content/70 mt-1">
        Administración de parámetros operativos, líneas de crédito, tipos de acción y políticas financieras.
      </p>
    </div>

    <!-- Navigation Tabs -->
    <div class="tabs tabs-boxed bg-base-200 p-1 rounded-xl w-fit">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="activeTab = tab.id"
        :class="['tab tab-md rounded-lg font-medium transition-all', { 'tab-active bg-primary text-primary-content shadow-sm': activeTab === tab.id }]"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Tab Panels -->
    <div class="mt-4">
      <div v-if="activeTab === 'loan-types'">
        <LoanTypeManagement />
      </div>

      <div v-else-if="activeTab === 'stock-types'">
        <StockTypeManagement />
      </div>

      <div v-else-if="activeTab === 'penalties'" class="card bg-base-100 shadow-sm border border-base-200 p-8 text-center space-y-3">
        <div class="text-4xl">⚖️</div>
        <h3 class="text-lg font-bold">Penalizaciones y Moras</h3>
        <p class="text-sm text-base-content/60 max-w-md mx-auto">
          Módulo en desarrollo para la parametrización de multas por inasistencia y moras en cuotas de préstamo.
        </p>
        <span class="badge badge-neutral mx-auto">Próximamente</span>
      </div>

      <div v-else-if="activeTab === 'general'" class="card bg-base-100 shadow-sm border border-base-200 p-8 text-center space-y-3">
        <div class="text-4xl">⚙️</div>
        <h3 class="text-lg font-bold">Parámetros Generales</h3>
        <p class="text-sm text-base-content/60 max-w-md mx-auto">
          Módulo en desarrollo para configuración de valor nominal de acción, porcentajes de fondo de reserva y períodos fiscales.
        </p>
        <span class="badge badge-neutral mx-auto">Próximamente</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import LoanTypeManagement from '../components/LoanTypeManagement.vue'
import StockTypeManagement from '../components/StockTypeManagement.vue'

type TabType = 'loan-types' | 'stock-types' | 'penalties' | 'general'

const activeTab = ref<TabType>('loan-types')

const tabs = [
  { id: 'loan-types' as const, label: 'Tipos de Préstamo' },
  { id: 'stock-types' as const, label: 'Tipos de Acciones' },
  { id: 'penalties' as const, label: 'Penalizaciones y Moras' },
  { id: 'general' as const, label: 'Parámetros Generales' }
]
</script>

<style scoped>
.settings-view {
  width: 100%;
}
</style>
