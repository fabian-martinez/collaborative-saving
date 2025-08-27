<script setup lang="ts">
import type { StockChangesSectionData } from '../types'
import { ref, computed } from 'vue'

const props = defineProps<{ data: StockChangesSectionData }>()

const searchType = ref('')
const filteredRevaluation = computed(() => props.data.revaluationHistory.filter(r => r.stockType.toLowerCase().includes(searchType.value.trim().toLowerCase())))
const filteredDividends = computed(() => props.data.dividendsGenerated.filter(d => d.stockType.toLowerCase().includes(searchType.value.trim().toLowerCase())))

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}
</script>

<template>
  <div class="card bg-base-100 shadow">
    <div class="card-body">
      <h2 class="card-title">Cambios en Valores de Acciones</h2>
      <div class="grid md:grid-cols-2 gap-6">
        <div>
          <h3 class="font-semibold mb-2">Revalorización</h3>
          <div class="overflow-x-auto">
            <div class="mb-2">
              <input v-model="searchType" type="text" class="input input-bordered input-sm" placeholder="Filtrar por tipo de acción" />
            </div>
            <table class="table table-sm">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th class="text-right">Anterior</th>
                  <th class="text-right">Nuevo</th>
                  <th class="text-right">Cambio</th>
                  <th class="text-right">% Cambio</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="filteredRevaluation.length === 0">
                  <td colspan="5" class="text-center text-sm text-base-content/60">No hay datos</td>
                </tr>
                <tr v-for="row in filteredRevaluation" :key="row.stockType">
                  <td>{{ row.stockType }}</td>
                  <td class="text-right">{{ formatCurrency(row.previousValue) }}</td>
                  <td class="text-right">{{ formatCurrency(row.newValue) }}</td>
                  <td class="text-right">{{ formatCurrency(row.change) }}</td>
                  <td class="text-right">{{ row.changePercentage }}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <h3 class="font-semibold mb-2">Dividendos Generados</h3>
          <div class="overflow-x-auto">
            <table class="table table-sm">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th class="text-right">Monto</th>
                  <th class="text-right">Beneficiarios</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="filteredDividends.length === 0">
                  <td colspan="3" class="text-center text-sm text-base-content/60">No hay datos</td>
                </tr>
                <tr v-for="row in filteredDividends" :key="row.stockType">
                  <td>{{ row.stockType }}</td>
                  <td class="text-right">{{ formatCurrency(row.amount) }}</td>
                  <td class="text-right">{{ row.beneficiaries }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>


