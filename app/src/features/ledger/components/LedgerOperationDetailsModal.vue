<template>
  <dialog ref="modal" class="modal" :open="open">
    <div class="modal-box max-w-4xl">
      <h3 class="font-bold text-lg">Operation Details</h3>
      <div v-if="operationInfo" class="mb-4 p-3 bg-base-200 rounded-lg">
        <div class="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span class="font-semibold">Type:</span>
            <span class="ml-2">{{ operationInfo.type }}</span>
          </div>
          <div>
            <span class="font-semibold">Member:</span>
            <span class="ml-2">{{ operationInfo.memberName || 'N/A' }}</span>
          </div>
          <div>
            <span class="font-semibold">Meeting:</span>
            <span class="ml-2">{{ formatDate(operationInfo.meetingDate) }}</span>
          </div>
        </div>
      </div>
      <div class="overflow-x-auto mt-4">
        <table class="table table-zebra w-full">
          <thead>
            <tr>
              <th>Date</th>
              <th>Account</th>
              <th>Description</th>
              <th class="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading"><td colspan="4" class="text-center">Loading...</td></tr>
            <tr v-else-if="rows.length === 0"><td colspan="4" class="text-center">No entries</td></tr>
            <tr v-for="r in rows" :key="r.id">
              <td>{{ formatDate(r.meetingDate || r.createdAt) }}</td>
              <td><span class="badge badge-ghost">{{ accountTypeLabel(r.accountType) }}</span></td>
              <td>{{ r.description }}</td>
              <td class="text-right">{{ formatCOP(r.amount) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="modal-action">
        <button class="btn" @click="$emit('close')">Close</button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button @click="$emit('close')">close</button>
    </form>
  </dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { EntryRow } from '@/features/ledger/types'
import { ACCOUNT_TYPE_LABELS } from '@/features/ledger/types'
import { getEntriesByOperation } from '@/features/ledger/services/ledgerService'

const props = defineProps<{ open: boolean; operationId: string | null }>()
defineEmits<{ (e: 'close'): void }>()

const rows = ref<EntryRow[]>([])
const loading = ref(false)

// Información de la operación extraída de los asientos
const operationInfo = computed(() => {
  if (rows.value.length === 0) return null
  
  const firstEntry = rows.value[0]
  return {
    type: firstEntry.operationType,
    memberName: firstEntry.memberName,
    meetingDate: firstEntry.meetingDate,
  }
})

watch(() => props.operationId, async (id) => {
  if (!id) return
  loading.value = true
  try {
    rows.value = await getEntriesByOperation(id)
  } finally {
    loading.value = false
  }
}, { immediate: true })

function formatDate(date: string) {
  if (!date) return 'N/A'
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) return 'Invalid Date'
    return d.toLocaleString('es-CO')
  } catch (error) {
    console.warn('Error formatting date:', date, error)
    return 'Invalid Date'
  }
}
function formatCOP(value: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value)
}

function accountTypeLabel(accountType: string) {
  return (ACCOUNT_TYPE_LABELS as Record<string, string>)[accountType] || accountType
}
</script>

<style scoped>
</style>


