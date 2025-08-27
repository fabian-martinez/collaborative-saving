<script setup lang="ts">
import type { LedgerEntriesResponse } from '../types'
import { ref, computed } from 'vue'

const props = defineProps<{ data: LedgerEntriesResponse }>()

// Filters
const accountFilter = ref('')
const searchText = ref('')

// Pagination & sorting
const page = ref(1)
const pageSize = ref(10)
const sortBy = ref<'date' | 'accountType' | 'debit' | 'credit'>('date')
const sortDir = ref<'asc' | 'desc'>('desc')

const filtered = computed(() => {
  return props.data.data.filter(row => {
    const matchAccount = accountFilter.value ? row.accountType === accountFilter.value : true
    const matchText = searchText.value.trim() === ''
      ? true
      : row.description.toLowerCase().includes(searchText.value.trim().toLowerCase())
    return matchAccount && matchText
  })
})

const sorted = computed(() => {
  const arr = [...filtered.value]
  arr.sort((a, b) => {
    const dir = sortDir.value === 'asc' ? 1 : -1
    if (sortBy.value === 'date') return (new Date(a.date).getTime() - new Date(b.date).getTime()) * dir
    if (sortBy.value === 'accountType') return a.accountType.localeCompare(b.accountType) * dir
    if (sortBy.value === 'debit') return ((a.debit || 0) - (b.debit || 0)) * dir
    return ((a.credit || 0) - (b.credit || 0)) * dir
  })
  return arr
})

const totalPages = computed(() => Math.max(1, Math.ceil(sorted.value.length / pageSize.value)))
const paged = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return sorted.value.slice(start, start + pageSize.value)
})

function toggleSort(field: typeof sortBy.value) {
  if (sortBy.value === field) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = field
    sortDir.value = 'asc'
  }
}

function goTo(p: number) { page.value = Math.min(Math.max(1, p), totalPages.value) }

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
        <h2 class="card-title">Asientos Contables</h2>
        <div class="text-xs text-gray-500">Débitos: {{ formatCurrency(data.summary.totalDebits) }} · Créditos: {{ formatCurrency(data.summary.totalCredits) }} · Balance: <span :class="data.summary.balance >= 0 ? 'text-success' : 'text-error'">{{ formatCurrency(data.summary.balance) }}</span></div>
      </div>
      <div class="grid md:grid-cols-5 gap-3 mt-2">
        <label class="form-control">
          <div class="label"><span class="label-text">Cuenta</span></div>
          <input v-model="accountFilter" type="text" class="input input-bordered input-sm" placeholder="p.ej. CASH" />
        </label>
        <label class="form-control md:col-span-2">
          <div class="label"><span class="label-text">Buscar texto</span></div>
          <input v-model="searchText" type="text" class="input input-bordered input-sm" placeholder="Descripción" />
        </label>
        <label class="form-control">
          <div class="label"><span class="label-text">Ordenar por</span></div>
          <select v-model="sortBy" class="select select-bordered select-sm">
            <option value="date">Fecha</option>
            <option value="accountType">Cuenta</option>
            <option value="debit">Débito</option>
            <option value="credit">Crédito</option>
          </select>
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
        <table class="table table-sm">
          <thead>
            <tr>
              <th class="cursor-pointer" @click="toggleSort('date')">Fecha</th>
              <th class="cursor-pointer" @click="toggleSort('accountType')">Cuenta</th>
              <th>Descripción</th>
              <th class="text-right cursor-pointer" @click="toggleSort('debit')">Débito</th>
              <th class="text-right cursor-pointer" @click="toggleSort('credit')">Crédito</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="paged.length === 0">
              <td colspan="5" class="text-center text-sm text-base-content/60">No hay datos</td>
            </tr>
            <tr v-for="row in paged" :key="row.id">
              <td>{{ new Date(row.date).toLocaleString() }}</td>
              <td>{{ row.accountType }}</td>
              <td>{{ row.description }}</td>
              <td class="text-right">{{ formatCurrency(row.debit || 0) }}</td>
              <td class="text-right">{{ formatCurrency(row.credit || 0) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="flex items-center justify-between mt-3">
        <div class="text-xs text-base-content/60">Mostrando {{ paged.length }} de {{ sorted.length }} registros</div>
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


