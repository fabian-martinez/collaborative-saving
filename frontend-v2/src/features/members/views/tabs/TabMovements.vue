<template>
  <div class="py-4 space-y-4 w-full max-w-full min-w-0 overflow-x-hidden">
    <!-- Controles: búsqueda, filtro por tipo, switch Pagos / Detalle contable, exportar -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex flex-wrap gap-2 text-xs">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar movimiento..."
          class="input input-bordered input-sm"
        />
        <select v-model="selectedType" class="select select-bordered select-sm">
          <option value="all">Todos los tipos</option>
          <option v-for="typeOpt in availableTypes" :key="typeOpt" :value="typeOpt">
            {{ formatDueOrPaymentType(typeOpt) }}
          </option>
        </select>
      </div>

      <div class="flex items-center gap-2">
        <div class="join">
          <button
            :class="['btn btn-xs join-item', viewMode === 'payments' ? 'btn-primary' : 'btn-ghost border border-base-300']"
            @click="viewMode = 'payments'"
          >
            Pagos
          </button>
          <button
            :class="['btn btn-xs join-item', viewMode === 'accounting' ? 'btn-primary' : 'btn-ghost border border-base-300']"
            @click="viewMode = 'accounting'"
          >
            Detalle contable
          </button>
        </div>

        <button class="btn btn-xs btn-outline" @click="handleExportCSV" :disabled="filteredPayments.length === 0">
          Exportar CSV
        </button>
      </div>
    </div>

    <div
      v-if="filteredPayments.length === 0"
      class="text-center py-8 border border-base-300 rounded-xl text-xs text-base-content/60"
    >
      No hay movimientos que coincidan con los filtros
    </div>

    <div v-else class="overflow-x-auto border border-base-300 rounded-xl">
      <table class="table table-sm w-full text-xs">
        <thead class="bg-base-200 text-base-content/70">
          <tr>
            <th>Fecha</th>
            <th>Concepto</th>
            <th>{{ viewMode === 'accounting' ? 'Operación / Asientos' : 'Descripción' }}</th>
            <th class="text-right">Monto</th>
            <th class="text-right">Acción</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="payment in filteredPayments" :key="payment.operation_id">
            <td class="font-mono text-base-content/70">{{ formatDate(payment.date) }}</td>
            <td class="font-medium text-base-content">{{ formatDueOrPaymentType(payment.type) }}</td>
            <td class="text-base-content/70">
              <template v-if="viewMode === 'accounting'">
                {{ payment.operation_id.slice(0, 8) }} · {{ payment.entries?.length || 0 }} asientos
              </template>
              <template v-else>
                {{ payment.description || '-' }}
              </template>
            </td>
            <td class="text-right font-semibold font-mono">{{ formatCurrency(payment.total_amount) }}</td>
            <td class="text-right">
              <button
                class="btn btn-xs btn-link no-underline"
                @click="$emit('view-payment-detail', payment.operation_id)"
              >
                Ver detalle
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { formatCurrency, formatDate } from '@/shared/utils/formatters'
import { exportToCSV } from '@/shared/utils/export'
import { formatDueOrPaymentType } from '@/features/members/utils/memberLabels'
import type { useMemberDetailStore } from '@/features/members/stores/memberDetail'

const props = defineProps<{
  memberId: string
  store: ReturnType<typeof useMemberDetailStore>
}>()

defineEmits<{
  'view-payment-detail': [paymentId: string]
}>()

const searchQuery = ref('')
const selectedType = ref('all')
const viewMode = ref<'payments' | 'accounting'>('payments')

const availableTypes = computed(() => {
  const set = new Set<string>()
  for (const p of props.store.payments) {
    if (p.type) set.add(p.type)
  }
  return Array.from(set)
})

const filteredPayments = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  return [...props.store.payments]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .filter(p => {
      if (selectedType.value !== 'all' && p.type !== selectedType.value) return false
      if (!query) return true
      const label = formatDueOrPaymentType(p.type).toLowerCase()
      const desc = (p.description || '').toLowerCase()
      return label.includes(query) || desc.includes(query)
    })
})

function handleExportCSV() {
  const rows = filteredPayments.value.map(p => ({
    Fecha: formatDate(p.date),
    Concepto: formatDueOrPaymentType(p.type),
    Descripcion: p.description || '',
    Operacion: p.operation_id,
    Monto: p.total_amount
  }))
  exportToCSV(rows, `movimientos-${props.memberId}`)
}
</script>
