<script setup lang="ts">
import type { StockChangesSectionData } from '../types'
import { ref, computed } from 'vue'

const props = defineProps<{ data: StockChangesSectionData }>()

const searchType = ref('')
const filteredRevaluation = computed(() => props.data.revaluationHistory.filter(r => r.stockType.toLowerCase().includes(searchType.value.trim().toLowerCase())))

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
      <div class="grid md:grid-cols-1 gap-6">
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
                  <th class="text-right">Cantidad</th>
                  <th class="text-right">Total (antes)</th>
                  <th class="text-right">Total (después)</th>
                  <th class="text-right">Cambio Total</th>
                  <th class="text-right">% Cambio Total</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="filteredRevaluation.length === 0">
                  <td colspan="10" class="text-center text-sm text-base-content/60">No hay datos</td>
                </tr>
                <tr v-for="row in filteredRevaluation" :key="row.stockType">
                  <td>{{ row.stockType }}</td>
                  <td class="text-right">{{ formatCurrency(row.previousValue) }}</td>
                  <td class="text-right">{{ formatCurrency(row.newValue) }}</td>
                  <td class="text-right">{{ formatCurrency(row.change) }}</td>
                  <td class="text-right">{{ row.changePercentage }}%</td>
                  <td class="text-right">{{ row.totalShares ?? '-' }}</td>
                  <td class="text-right">{{ row.previousTotalValue != null ? formatCurrency(row.previousTotalValue) : '-' }}</td>
                  <td class="text-right">{{ row.newTotalValue != null ? formatCurrency(row.newTotalValue) : '-' }}</td>
                  <td class="text-right">{{ row.totalChange != null ? formatCurrency(row.totalChange) : '-' }}</td>
                  <td class="text-right">{{ row.totalChangePercentage != null ? row.totalChangePercentage + '%' : '-' }}</td>
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


