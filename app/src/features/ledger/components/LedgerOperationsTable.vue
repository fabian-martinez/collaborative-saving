<template>
  <div class="bg-white rounded-xl shadow border border-blue-100">
    <div class="overflow-x-auto">
      <table class="table table-zebra w-full">
        <thead class="bg-blue-50">
          <tr>
            <th>Date</th>
            <th>Operation</th>
            <th>Member</th>
            <th>Meeting</th>
            <th>Description</th>
            <th class="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading"><td colspan="6" class="text-center">Loading...</td></tr>
          <tr v-else-if="error"><td colspan="6" class="text-center text-error">{{ error }}</td></tr>
          <tr v-else-if="operations.length === 0"><td colspan="6" class="text-center">No operations found.</td></tr>
          <tr v-for="op in operations" :key="op.id">
            <td>{{ formatDate(op.date) }}</td>
            <td>
              <div class="flex flex-col">
                <span class="font-medium">{{ op.type }}</span>
                <span class="text-xs text-gray-500">{{ op.id }}</span>
              </div>
            </td>
            <td>{{ op.memberName || '—' }}</td>
            <td>{{ formatDate(op.meetingDate) }}</td>
            <td>{{ op.description }}</td>
            <td class="text-right">
              <button class="btn btn-sm btn-primary" @click="$emit('open-details', op.id)">Details</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { OperationView } from '@/features/ledger/types'

defineProps<{
  operations: OperationView[]
  loading: boolean
  error: string | null
}>()

defineEmits<{ (e: 'open-details', id: string): void }>()

function formatDate(date: string) {
  const d = new Date(date)
  return d.toLocaleString('es-CO')
}
</script>

<style scoped>
</style>


