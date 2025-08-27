<script setup lang="ts">
import type { ContributionsResponse } from '../types'
import { RouterLink } from 'vue-router'
import { computed, ref } from 'vue'

const props = defineProps<{ data: ContributionsResponse }>()

// Filters
const search = ref('')
const minTotal = ref<string>('')
const maxTotal = ref<string>('')

// Pagination
const page = ref(1)
const pageSize = ref(10)

const filteredRows = computed(() => {
  const min = Number(minTotal.value)
  const max = Number(maxTotal.value)
  return props.data.data.filter(row => {
    const matchesName = row.memberName.toLowerCase().includes(search.value.trim().toLowerCase())
    const meetsMin = isNaN(min) ? true : row.total >= min
    const meetsMax = isNaN(max) ? true : row.total <= max
    return matchesName && meetsMin && meetsMax
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredRows.value.length / pageSize.value)))
const pagedRows = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredRows.value.slice(start, start + pageSize.value)
})

function goTo(p: number) {
  page.value = Math.min(Math.max(1, p), totalPages.value)
}

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
        <h2 class="card-title">Aportes por Socio</h2>
        <div class="text-sm text-gray-500">Total: <span class="font-semibold">{{ formatCurrency(data.summary.grandTotal) }}</span></div>
      </div>
      <div class="grid md:grid-cols-4 gap-3 mt-2">
        <label class="form-control">
          <div class="label"><span class="label-text">Buscar socio</span></div>
          <input v-model="search" type="text" placeholder="Nombre" class="input input-bordered input-sm" />
        </label>
        <label class="form-control">
          <div class="label"><span class="label-text">Mín. Total</span></div>
          <input v-model="minTotal" type="number" inputmode="numeric" placeholder="0" class="input input-bordered input-sm" />
        </label>
        <label class="form-control">
          <div class="label"><span class="label-text">Máx. Total</span></div>
          <input v-model="maxTotal" type="number" inputmode="numeric" placeholder="" class="input input-bordered input-sm" />
        </label>
        <label class="form-control">
          <div class="label"><span class="label-text">Registros por página</span></div>
          <select v-model.number="pageSize" class="select select-bordered select-sm">
            <option :value="10">10</option>
            <option :value="25">25</option>
            <option :value="50">50</option>
          </select>
        </label>
      </div>
      <div class="overflow-x-auto">
        <table class="table table-zebra table-sm">
          <thead>
            <tr>
              <th>Socio</th>
              <th class="text-right">Obligatorio</th>
              <th class="text-right">Multas</th>
              <th class="text-right">Seguro</th>
              <th class="text-right">Abonos Préstamo</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="pagedRows.length === 0">
              <td colspan="6" class="text-center text-sm text-base-content/60">No hay datos</td>
            </tr>
            <tr v-for="row in pagedRows" :key="row.memberId">
              <td>
                <RouterLink :to="{ name: 'member-details', params: { id: row.memberId } }" class="link link-hover">
                  {{ row.memberName }}
                </RouterLink>
              </td>
              <td class="text-right">{{ formatCurrency(row.mandatoryContribution) }}</td>
              <td class="text-right">{{ formatCurrency(row.fees) }}</td>
              <td class="text-right">{{ formatCurrency(row.insurance) }}</td>
              <td class="text-right">{{ formatCurrency(row.loanPayments) }}</td>
              <td class="text-right font-semibold">{{ formatCurrency(row.total) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="flex items-center justify-between mt-3">
        <div class="text-xs text-base-content/60">Mostrando {{ pagedRows.length }} de {{ filteredRows.length }} registros</div>
        <div class="join">
          <button class="btn btn-sm join-item" @click="goTo(1)" :disabled="page === 1">«</button>
          <button class="btn btn-sm join-item" @click="goTo(page - 1)" :disabled="page === 1">Anterior</button>
          <button class="btn btn-sm join-item" @click="goTo(page + 1)" :disabled="page === totalPages">Siguiente</button>
          <button class="btn btn-sm join-item" @click="goTo(totalPages)" :disabled="page === totalPages">»</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>


