<template>
  <dialog class="modal" :class="{ 'modal-open': isOpen }">
    <div class="modal-box w-11/12 max-w-5xl bg-base-100">
      <form method="dialog">
        <button aria-label="Cerrar modal" class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" @click="$emit('close')">✕</button>
      </form>
      
      <h3 class="font-bold text-lg mb-1">Detalles de Transacciones: {{ monthLabel }}</h3>
      <p class="text-sm text-base-content/70 mb-4">Cuenta: {{ accountLabel }}</p>

      <!-- Tabla dividida en Debe y Haber -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        <!-- Lado Izquierdo: DEBE -->
        <div class="border rounded-lg overflow-hidden flex flex-col">
          <div class="bg-base-200 p-2 text-center font-bold text-sm border-b">
            DEBE (INGRESOS / DÉBITO)
          </div>
          <div class="overflow-x-auto flex-1">
            <table class="table table-sm table-zebra w-full">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Fecha</th>
                  <th>Concepto</th>
                  <th class="text-right">Monto</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(entry, index) in debeEntries" :key="entry.id">
                  <td class="text-xs">{{ index + 1 }}</td>
                  <td class="text-xs">{{ formatDateStr(entry.created_at) }}</td>
                  <td class="text-xs truncate max-w-[150px]" :title="entry.description || entry.operation_description || 'N/A'">
                    {{ entry.description || entry.operation_description || 'N/A' }}
                  </td>
                  <td class="text-xs text-right font-medium text-success">{{ formatCurrency(entry.amount) }}</td>
                </tr>
                <tr v-if="debeEntries.length === 0">
                  <td colspan="4" class="text-center text-xs py-4 text-base-content/50">No hay movimientos</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="bg-base-200 p-2 flex justify-between font-bold text-sm border-t mt-auto">
            <span>Total Debe</span>
            <span class="text-success">{{ formatCurrency(totalDebe) }}</span>
          </div>
        </div>

        <!-- Lado Derecho: HABER -->
        <div class="border rounded-lg overflow-hidden flex flex-col">
          <div class="bg-base-200 p-2 text-center font-bold text-sm border-b">
            HABER (EGRESOS / CRÉDITO)
          </div>
          <div class="overflow-x-auto flex-1">
            <table class="table table-sm table-zebra w-full">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Fecha</th>
                  <th>Concepto</th>
                  <th class="text-right">Monto</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(entry, index) in haberEntries" :key="entry.id">
                  <td class="text-xs">{{ index + 1 }}</td>
                  <td class="text-xs">{{ formatDateStr(entry.created_at) }}</td>
                  <td class="text-xs truncate max-w-[150px]" :title="entry.description || entry.operation_description || 'N/A'">
                    {{ entry.description || entry.operation_description || 'N/A' }}
                  </td>
                  <td class="text-xs text-right font-medium text-error">{{ formatCurrency(Math.abs(entry.amount)) }}</td>
                </tr>
                <tr v-if="haberEntries.length === 0">
                  <td colspan="4" class="text-center text-xs py-4 text-base-content/50">No hay movimientos</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="bg-base-200 p-2 flex justify-between font-bold text-sm border-t mt-auto">
            <span>Total Haber</span>
            <span class="text-error">{{ formatCurrency(totalHaber) }}</span>
          </div>
        </div>

      </div>

    </div>
    <form method="dialog" class="modal-backdrop">
      <button aria-label="Cerrar modal" @click="$emit('close')">close</button>
    </form>
  </dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { LedgerEntry } from '@/api/ledger.api'
import { formatCurrency } from '@/shared/utils/formatters'

const props = defineProps<{
  isOpen: boolean
  monthLabel: string
  accountLabel: string
  entries: LedgerEntry[]
}>()

defineEmits<{
  (e: 'close'): void
}>()

const debeEntries = computed(() => {
  return props.entries.filter(e => e.amount > 0).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
})

const haberEntries = computed(() => {
  return props.entries.filter(e => e.amount < 0).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
})

const totalDebe = computed(() => {
  return debeEntries.value.reduce((sum, e) => sum + e.amount, 0)
})

const totalHaber = computed(() => {
  return haberEntries.value.reduce((sum, e) => sum + Math.abs(e.amount), 0)
})

// Utilidad para formatear la fecha a un formato corto DD/MM/YY
function formatDateStr(dateString: string | Date): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })
}
</script>
