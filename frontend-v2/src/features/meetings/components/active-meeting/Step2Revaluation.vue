<template>
  <div>
    <!-- Loading State -->
    <div v-if="status === 'loading'" class="flex justify-center items-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <!-- Error State -->
    <div v-if="status === 'error' && !loading" role="alert" class="alert alert-error mb-4">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-6 w-6 shrink-0 stroke-current"
        fill="none"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <div>
        <h3 class="font-bold">Error al Cargar la Previsualización</h3>
        <div class="text-xs">{{ errorMessage }}</div>
      </div>
      <button class="btn btn-sm" @click="fetchPreview">Reintentar</button>
    </div>

    <!-- Success State: Display Preview -->
    <div v-if="status === 'success' && previewData" class="card bg-base-100 shadow-lg rounded-lg w-full">
      <div class="card-body p-4 md:p-6 w-full max-w-full">
        <h3 class="card-title text-lg md:text-xl font-bold mb-4">Previsualización de la Revalorización</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-6">
          <div class="stat bg-base-100 rounded-lg p-3 md:p-4 min-w-0 overflow-hidden">
            <div class="stat-title text-xs font-medium text-base-content/70 uppercase mb-1 truncate">Aportes Recaudados</div>
            <div class="stat-value text-base md:text-lg lg:text-xl font-bold text-success truncate">
              {{ formatCurrency(previewData.total_contributions) }}
            </div>
          </div>
          <div class="stat bg-base-100 rounded-lg p-3 md:p-4 min-w-0 overflow-hidden">
            <div class="stat-title text-xs font-medium text-base-content/70 uppercase mb-1 truncate">Intereses Recaudados</div>
            <div class="stat-value text-base md:text-lg lg:text-xl font-bold text-success truncate">
              {{ formatCurrency(previewData.total_interest) }}
            </div>
          </div>
          <div class="stat bg-base-100 rounded-lg p-3 md:p-4 min-w-0 overflow-hidden">
            <div class="stat-title text-xs font-medium text-base-content/70 uppercase mb-1 truncate">Total a Distribuir</div>
            <div class="stat-value text-base md:text-lg lg:text-xl font-bold text-primary truncate">
              {{ formatCurrency(previewData.total_to_distribute) }}
            </div>
          </div>
        </div>

        <!-- Vista Desktop: Tabla completa -->
        <div class="hidden md:block mt-4 w-full">
          <div class="overflow-x-auto w-full" style="max-width: 100%;">
            <table class="table table-zebra table-compact w-full text-sm" style="min-width: 700px;">
              <thead>
                <tr>
                  <th class="whitespace-nowrap px-2">Tipo</th>
                  <th class="text-right whitespace-nowrap px-2">Valor Ant.</th>
                  <th class="text-right text-info whitespace-nowrap px-2">Crec. (Aport.)</th>
                  <th class="text-right text-info whitespace-nowrap px-2">Crec. (Int.)</th>
                  <th class="text-right text-success whitespace-nowrap px-2">Crec. Total</th>
                  <th class="text-right text-primary whitespace-nowrap px-2">Nuevo Valor</th>
                  <th class="text-right text-warning whitespace-nowrap px-2">Dividendos</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="detail in previewData.details" :key="detail.stock_id">
                  <td class="px-2">
                    <div class="font-bold text-xs">{{ detail.type }}</div>
                    <div v-if="detail.is_guaranteed" class="badge badge-secondary badge-xs mt-1">
                      Garantizada
                    </div>
                  </td>
                  <td class="text-right px-2 text-xs">{{ formatCurrency(detail.previous_value) }}</td>
                  <td class="text-right text-info px-2 text-xs">
                    +{{ formatCurrency(detail.growth_from_contributions) }}
                  </td>
                  <td class="text-right text-success px-2 text-xs">
                    {{ formatCurrency(detail.growth_from_interest) }}
                  </td>
                  <td class="text-right font-bold text-success px-2 text-xs">
                    +{{ formatCurrency(detail.total_growth_per_share) }}
                  </td>
                  <td class="text-right font-bold text-primary px-2 text-xs">
                    {{ formatCurrency(detail.new_value) }}
                  </td>
                  <td class="text-right text-warning font-bold px-2 text-xs">
                    <span v-if="detail.dividends_generated && detail.dividends_generated > 0">
                      {{ formatCurrency(detail.dividends_generated) }}
                    </span>
                    <span v-else>-</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Vista Mobile: Cards -->
        <div class="md:hidden mt-4 space-y-4">
          <div
            v-for="detail in previewData.details"
            :key="detail.stock_id"
            class="card bg-base-100 shadow-lg rounded-lg"
          >
            <div class="card-body p-4 space-y-3">
              <!-- Header: Tipo de Acción -->
              <div class="flex items-center justify-between border-b border-base-300 pb-2">
                <div>
                  <h4 class="font-bold text-lg">{{ detail.type }}</h4>
                  <div v-if="detail.is_guaranteed" class="badge badge-secondary badge-sm mt-1">
                    Garantizada
                  </div>
                </div>
              </div>

              <!-- Valores principales -->
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <div class="text-xs text-base-content/70 uppercase">Valor Anterior</div>
                  <div class="font-semibold text-base">{{ formatCurrency(detail.previous_value) }}</div>
                </div>
                <div>
                  <div class="text-xs text-base-content/70 uppercase">Nuevo Valor</div>
                  <div class="font-bold text-primary text-base">{{ formatCurrency(detail.new_value) }}</div>
                </div>
              </div>

              <!-- Crecimientos -->
              <div class="space-y-2 pt-2 border-t border-base-300">
                <div class="flex justify-between items-center">
                  <span class="text-sm text-base-content/70">Crecimiento (Aportes)</span>
                  <span class="text-info font-semibold">+{{ formatCurrency(detail.growth_from_contributions) }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm text-base-content/70">Crecimiento (Intereses)</span>
                  <span class="text-success font-semibold">{{ formatCurrency(detail.growth_from_interest) }}</span>
                </div>
                <div class="flex justify-between items-center pt-2 border-t border-base-300">
                  <span class="text-sm font-semibold">Crecimiento Total</span>
                  <span class="text-success font-bold">+{{ formatCurrency(detail.total_growth_per_share) }}</span>
                </div>
              </div>

              <!-- Dividendos -->
              <div v-if="detail.dividends_generated && detail.dividends_generated > 0" class="pt-2 border-t border-base-300">
                <div class="flex justify-between items-center">
                  <span class="text-sm text-base-content/70">Dividendos Generados</span>
                  <span class="text-warning font-bold">{{ formatCurrency(detail.dividends_generated) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-6 flex justify-end">
          <button 
            class="btn btn-primary w-full md:w-auto md:btn-lg" 
            @click="execute" 
            :disabled="isExecuting || store.revaluationExecuted"
          >
            <span v-if="isExecuting" class="loading loading-spinner"></span>
            <span v-else>{{ store.revaluationExecuted ? 'Revalorización Ejecutada' : 'Confirmar y Ejecutar Revalorización' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useActiveMeetingStore } from '../../stores/activeMeeting'
import { meetingsApi, type RevaluationResponse } from '@/api/meetings.api'
import { formatCurrency } from '@/shared/utils/formatters'

type Status = 'idle' | 'loading' | 'success' | 'error'

const status = ref<Status>('idle')
const isExecuting = ref(false)
const previewData = ref<RevaluationResponse | null>(null)
const errorMessage = ref<string>('')

const store = useActiveMeetingStore()
const emit = defineEmits<{
  completed: []
}>()

async function fetchPreview() {
  if (!store.meetingId) {
    errorMessage.value = 'No se ha encontrado una reunión activa. No se puede cargar la revalorización.'
    status.value = 'error'
    return
  }

  status.value = 'loading'
  errorMessage.value = ''

  try {
    const data = await meetingsApi.getRevaluationPreview(store.meetingId)
    previewData.value = data
    status.value = 'success'
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Ocurrió un error desconocido.'
    errorMessage.value = `Error: ${message}`
    console.error('Failed to fetch revaluation preview:', err)
    status.value = 'error'
  }
}

async function execute() {
  if (!store.meetingId) {
    alert('Error: No hay ID de reunión activa.')
    return
  }

  isExecuting.value = true
  errorMessage.value = ''

  try {
    // Simular ejecución (actualizar estado local)
    await meetingsApi.confirmRevaluation(store.meetingId)
    store.setRevaluationExecuted(true)
    alert('Revalorización ejecutada con éxito.')
    emit('completed')
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Ocurrió un error desconocido.'
    errorMessage.value = `Fallo al ejecutar la revalorización: ${message}`
    alert(`Error: ${errorMessage.value}`)
    console.error('Failed to execute revaluation:', err)
  } finally {
    isExecuting.value = false
  }
}

onMounted(() => {
  fetchPreview()
})
</script>
