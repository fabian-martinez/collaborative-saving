<script setup lang="ts">
import type { DisbursementsResponse } from '../types'
import { RouterLink } from 'vue-router'
import { ref, computed } from 'vue'

const props = defineProps<{ data: DisbursementsResponse }>()

// Filters
const searchMember = ref('')
const typeFilter = ref<string>('')
const statusFilter = ref<string>('')
const fromDate = ref<string>('')
const toDate = ref<string>('')

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
  const from = fromDate.value ? new Date(fromDate.value).getTime() : null
  const to = toDate.value ? new Date(toDate.value).getTime() : null
  return props.data.data.filter(row => {
    const matchMember = row.memberName.toLowerCase().includes(searchMember.value.trim().toLowerCase())
    const matchType = typeFilter.value ? row.type === typeFilter.value : true
    const matchStatus = statusFilter.value ? row.status === statusFilter.value : true
    const ts = new Date(row.date).getTime()
    const matchFrom = from === null ? true : ts >= from
    const matchTo = to === null ? true : ts <= to
    return matchMember && matchType && matchStatus && matchFrom && matchTo
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
        <h2 class="card-title">Desembolsos</h2>
        <div class="text-sm text-gray-500">Total: <span class="font-semibold">{{ formatCurrency(data.summary.grandTotal) }}</span></div>
      </div>
      <div class="grid md:grid-cols-6 gap-3 mt-2">
        <label class="form-control md:col-span-2">
          <div class="label"><span class="label-text">Socio</span></div>
          <input v-model="searchMember" type="text" class="input input-bordered input-sm" placeholder="Buscar socio" />
        </label>
        <label class="form-control">
          <div class="label"><span class="label-text">Tipo</span></div>
          <select v-model="typeFilter" class="select select-bordered select-sm">
            <option value="">Todos</option>
            <option value="LOAN">LOAN</option>
            <option value="DIVIDEND">DIVIDEND</option>
            <option value="WITHDRAWAL">WITHDRAWAL</option>
            <option value="OTHER">OTHER</option>
          </select>
        </label>
        <label class="form-control">
          <div class="label"><span class="label-text">Estado</span></div>
          <select v-model="statusFilter" class="select select-bordered select-sm">
            <option value="">Todos</option>
            <option value="completed">completed</option>
            <option value="partial">partial</option>
          </select>
        </label>
        <label class="form-control">
          <div class="label"><span class="label-text">Desde</span></div>
          <input v-model="fromDate" type="date" class="input input-bordered input-sm" />
        </label>
        <label class="form-control">
          <div class="label"><span class="label-text">Hasta</span></div>
          <input v-model="toDate" type="date" class="input input-bordered input-sm" />
        </label>
      </div>
      <div class="overflow-x-auto">
        <table class="table table-sm">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Socio</th>
              <th>Tipo</th>
              <th>Descripción</th>
              <th class="text-right">Monto</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="paged.length === 0">
              <td colspan="6" class="text-center text-sm text-base-content/60">No hay datos</td>
            </tr>
            <tr v-for="row in paged" :key="row.id">
              <td>{{ formatDate(row.date) }}</td>
              <td>
                <RouterLink :to="{ name: 'member-details', params: { id: row.memberId } }" class="link link-hover">
                  {{ row.memberName }}
                </RouterLink>
              </td>
              <td>{{ row.type }}</td>
              <td>{{ row.description }}</td>
              <td class="text-right">{{ formatCurrency(row.amount) }}</td>
              <td>
                <span :class="['badge', row.status === 'completed' ? 'badge-success' : 'badge-warning']">{{ row.status }}</span>
              </td>
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


