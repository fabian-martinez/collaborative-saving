<script setup lang="ts">
import type { StockDividendItem } from '../types'
import { ref, computed } from 'vue'

const props = defineProps<{ dividends: StockDividendItem[] }>()

const search = ref('')
const filtered = computed(() => props.dividends.filter(d => d.stockType.toLowerCase().includes(search.value.trim().toLowerCase())))

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
      <div class="flex items-center justify-between">
        <h2 class="card-title">Dividendos por Tipo de Acción</h2>
        <div class="form-control w-64">
          <input v-model="search" type="text" class="input input-bordered input-sm" placeholder="Filtrar por tipo" />
        </div>
      </div>
      <div class="overflow-x-auto mt-2">
        <table class="table table-sm">
          <thead>
            <tr>
              <th>Tipo</th>
              <th class="text-right">Monto</th>
              <th class="text-right">Beneficiarios</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filtered.length === 0">
              <td colspan="3" class="text-center text-sm text-base-content/60">No hay datos</td>
            </tr>
            <tr v-for="row in filtered" :key="row.stockType">
              <td>{{ row.stockType }}</td>
              <td class="text-right">{{ formatCurrency(row.amount) }}</td>
              <td class="text-right">{{ row.beneficiaries }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>




