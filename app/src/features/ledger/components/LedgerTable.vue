<template>
  <div class="overflow-x-auto bg-white rounded-xl shadow border border-blue-100">
    <table class="table table-zebra w-full">
      <thead class="bg-blue-50">
        <tr>
          <th>Group</th>
          <th>Date</th>
          <th>Operation</th>
          <th>Description</th>
          <th>Account</th>
          <th class="text-right">Amount</th>
          <th>Refs</th>
        </tr>
      </thead>
      <tbody>
        <template v-if="loading">
          <tr><td colspan="7" class="text-center">Loading...</td></tr>
        </template>
        <template v-else-if="error">
          <tr><td colspan="7" class="text-center text-error">{{ error }}</td></tr>
        </template>
        <template v-else-if="groups.length === 0">
          <tr><td colspan="7" class="text-center">No entries found.</td></tr>
        </template>
        <template v-else>
          <template v-for="group in pageGroups" :key="group.id">
            <tr class="bg-gray-50">
              <td colspan="7" class="font-semibold">
                <div class="flex flex-wrap items-center gap-4">
                  <span>{{ group.title }}</span>
                </div>
              </td>
            </tr>
            <tr v-for="entry in group.entries" :key="entry.id">
              <td>{{ group.title }}</td>
              <td>{{ formatDate(entry.createdAt) }}</td>
              <td>
                <div class="flex flex-col">
                  <span class="text-sm font-medium">{{ entry.operationType }}</span>
                  <span class="text-xs text-gray-500">{{ entry.operationId }}</span>
                </div>
              </td>
              <td>{{ entry.description }}</td>
              <td>
                <span class="badge badge-ghost">{{ accountTypeLabel(entry.accountType) }}</span>
              </td>
              <td class="text-right">{{ formatCOP(entry.amount) }}</td>
              <td>
                <div class="text-xs text-gray-600 flex flex-col">
                  <span v-if="entry.memberName">👤 {{ entry.memberName }}</span>
                  <span v-if="entry.loanId">💳 {{ entry.loanId }}</span>
                  <span v-if="entry.stockId">📈 {{ entry.stockId }}</span>
                </div>
              </td>
            </tr>
          </template>
        </template>
      </tbody>
    </table>
  </div>
  <div class="flex items-center justify-between mt-4">
    <div class="text-sm text-gray-500">Page {{ page }} of {{ totalPages }}</div>
    <div class="join">
      <button class="btn join-item" :disabled="page===1" @click="$emit('update:page', page-1)">Prev</button>
      <button class="btn join-item" :disabled="page===totalPages" @click="$emit('update:page', page+1)">Next</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { AccountType, LedgerUITableGroup } from '@/features/ledger/types'
import { ACCOUNT_TYPE_LABELS } from '@/features/ledger/types'

const props = defineProps<{
  groups: LedgerUITableGroup[]
  loading: boolean
  error: string | null
  page: number
  pageSize: number
}>()

defineEmits<{
  (e: 'update:page', value: number): void
}>()

const totalPages = computed(() => Math.max(1, Math.ceil(props.groups.length / props.pageSize)))
const pageGroups = computed(() => props.groups.slice((props.page-1)*props.pageSize, (props.page-1)*props.pageSize + props.pageSize))

function formatDate(date: string) {
  const d = new Date(date)
  return d.toLocaleString('es-CO')
}

function formatCOP(value: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value)
}

function accountTypeLabel(t: AccountType) {
  return ACCOUNT_TYPE_LABELS[t]
}
</script>

<style scoped>
</style>


