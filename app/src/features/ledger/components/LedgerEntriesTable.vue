<template>
  <div class="bg-white rounded-xl shadow border border-blue-100">
    <div class="overflow-x-auto">
      <table class="table table-pin-rows table-zebra w-full">
        <thead class="bg-blue-50">
          <tr>
            <th>
              <button class="btn btn-ghost btn-xs" @click="toggleAll" :disabled="rows.length===0">
                {{ allSelected ? 'Unselect All' : 'Select All' }}
              </button>
            </th>
            <th>Date</th>
            <th>Member</th>
            <th>Account</th>
            <th>Description</th>
            <th class="text-right">Amount</th>
            <th>Operation</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading"><td colspan="7" class="text-center">Loading...</td></tr>
          <tr v-else-if="error"><td colspan="7" class="text-center text-error">{{ error }}</td></tr>
          <tr v-else-if="rows.length === 0"><td colspan="7" class="text-center">No entries found.</td></tr>
          <tr v-for="row in rows" :key="row.id" :class="isSelected(row.id) ? 'bg-blue-50' : ''">
            <td>
              <input type="checkbox" class="checkbox checkbox-primary" :checked="isSelected(row.id)" @change="toggle(row)" />
            </td>
            <td>{{ formatDate(row.createdAt) }}</td>
            <td>{{ row.memberName || '—' }}</td>
            <td><span class="badge badge-ghost">{{ accountTypeLabel(row.accountType) }}</span></td>
            <td>{{ row.description }}</td>
            <td class="text-right">{{ formatCOP(row.amount) }}</td>
            <td>
              <div class="text-xs text-gray-600 flex flex-col">
                <span>{{ row.operationType }}</span>
                <span class="text-[10px]">{{ row.operationId }}</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { EntryRow } from '@/features/ledger/types'
import { ACCOUNT_TYPE_LABELS } from '@/features/ledger/types'

const props = defineProps<{
  rows: EntryRow[]
  loading: boolean
  error: string | null
}>()

const emits = defineEmits<{ (e: 'update:selected', ids: string[]): void }>()

const selected = ref<string[]>([])
const allSelected = computed(() => props.rows.length > 0 && selected.value.length === props.rows.length)

function toggle(row: EntryRow) {
  const idx = selected.value.indexOf(row.id)
  if (idx >= 0) selected.value.splice(idx, 1)
  else selected.value.push(row.id)
  emits('update:selected', selected.value)
}

function isSelected(id: string) {
  return selected.value.includes(id)
}

function toggleAll() {
  if (allSelected.value) {
    selected.value = []
  } else {
    selected.value = props.rows.map(r => r.id)
  }
  emits('update:selected', selected.value)
}

function formatDate(date: string | undefined | null) {
  if (!date) return 'N/A';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid Date';
    return d.toLocaleString('es-CO');
  } catch (error) {
    console.warn('Error formatting date:', date, error);
    return 'Invalid Date';
  }
}

function formatCOP(value: number | undefined | null) {
  if (value == null || isNaN(value)) return '$0';
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
}

function accountTypeLabel(v: string) {
  return (ACCOUNT_TYPE_LABELS as Record<string, string>)[v] || v
}
</script>

<style scoped>
</style>


