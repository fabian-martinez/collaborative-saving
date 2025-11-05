<script setup lang="ts">
import type { StockOperationsResponse } from '../types'
import { RouterLink } from 'vue-router'
import { ref, computed } from 'vue'

const props = defineProps<{ data: StockOperationsResponse }>()

// Filters
const searchMember = ref('')
const typeFilter = ref<string>('')
const methodFilter = ref<string>('')

// Pagination
const page = ref(1)
const pageSize = ref(10)

function formatCurrency(value: number | undefined | null) {
  if (value == null || isNaN(value)) return '$0';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(date: string | undefined | null) {
  if (!date) return 'N/A';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid Date';
    return d.toLocaleString();
  } catch (error) {
    console.warn('Error formatting date:', date, error);
    return 'Invalid Date';
  }
}

const filtered = computed(() => {
  return props.data.data.filter(op => {
    const matchMember = op.memberName.toLowerCase().includes(searchMember.value.trim().toLowerCase())
    const matchType = typeFilter.value ? op.type === typeFilter.value : true
    const matchMethod = methodFilter.value ? op.paymentMethod === methodFilter.value : true
    return matchMember && matchType && matchMethod
  })
})
const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize.value)))
const paged = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filtered.value.slice(start, start + pageSize.value)
})
function goTo(p: number) { page.value = Math.min(Math.max(1, p), totalPages.value) }
</script>

<template>
  <div class="card bg-base-100 shadow">
    <div class="card-body">
      <div class="flex items-center justify-between">
        <h2 class="card-title">Operaciones de Acciones</h2>
        <div class="text-xs text-gray-500">Compras: {{ data.summary.totalPurchases }} · Retiros: {{ data.summary.totalWithdrawals }} · Modificaciones: {{ data.summary.totalModifications }}</div>
      </div>
      <div class="grid md:grid-cols-5 gap-3 mt-2">
        <label class="form-control md:col-span-2">
          <div class="label"><span class="label-text">Socio</span></div>
          <input v-model="searchMember" type="text" class="input input-bordered input-sm" placeholder="Buscar socio" />
        </label>
        <label class="form-control">
          <div class="label"><span class="label-text">Tipo</span></div>
          <select v-model="typeFilter" class="select select-bordered select-sm">
            <option value="">Todos</option>
            <option value="STOCK_PURCHASE">STOCK_PURCHASE</option>
            <option value="STOCK_WITHDRAWAL">STOCK_WITHDRAWAL</option>
            <option value="STOCK_MODIFICATION">STOCK_MODIFICATION</option>
          </select>
        </label>
        <label class="form-control">
          <div class="label"><span class="label-text">Método</span></div>
          <select v-model="methodFilter" class="select select-bordered select-sm">
            <option value="">Todos</option>
            <option value="cash">cash</option>
            <option value="credit">credit</option>
            <option value="mixed">mixed</option>
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
              <th>Fecha</th>
              <th>Socio</th>
              <th>Tipo</th>
              <th>Acción</th>
              <th class="text-right">Cantidad</th>
              <th class="text-right">Monto</th>
              <th>Método</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="paged.length === 0">
              <td colspan="7" class="text-center text-sm text-base-content/60">No hay datos</td>
            </tr>
            <tr v-for="op in paged" :key="op.id">
              <td>{{ formatDate(op.date) }}</td>
              <td>
                <RouterLink :to="{ name: 'member-details', params: { id: op.memberId } }" class="link link-hover">
                  {{ op.memberName }}
                </RouterLink>
              </td>
              <td>{{ op.type }}</td>
              <td>{{ op.stockType }}</td>
              <td class="text-right">{{ op.quantity }}</td>
              <td class="text-right">{{ formatCurrency(op.amount) }}</td>
              <td>{{ op.paymentMethod }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="flex items-center justify-between mt-3">
        <div class="text-xs text-base-content/60">Mostrando {{ paged.length }} de {{ filtered.length }} registros</div>
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


