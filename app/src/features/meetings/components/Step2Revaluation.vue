<template>
  <div class="space-y-6">
    <div class="prose">
      <h2 class="text-xl font-bold">Paso 2: Revalorización de Activos</h2>
      <p>
        En este paso, el sistema calcula el nuevo valor de las acciones distribuyendo las
        ganancias (intereses y cuotas) recaudados. Revisa los resultados y confirma para
        hacerlos permanentes.
      </p>
    </div>

    <!-- Loading State -->
    <div v-if="status === 'loading'" class="flex justify-center items-center py-16">
      <span class="loading loading-spinner loading-lg"></span>
      <p class="ml-4">Cargando previsualización de la revalorización...</p>
    </div>

    <!-- Error State -->
    <div v-if="status === 'error'" role="alert" class="alert alert-error">
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
    <div v-if="status === 'success' && previewData" class="card border bg-base-100 shadow-xl">
      <div class="card-body">
        <h3 class="card-title text-primary">Previsualización de la Revalorización</h3>
        <div class="stats stats-vertical shadow-inner md:stats-horizontal my-4">
          <div class="stat">
            <div class="stat-title">Aportes Recaudados</div>
            <div class="stat-value text-success">
              ${{ previewData.total_contributions.toFixed(2) }}
            </div>
          </div>
          <div class="stat">
            <div class="stat-title">Intereses y Multas Generadas</div>
            <div class="stat-value text-success">
              ${{ previewData.total_interest.toFixed(2) }}
            </div>
          </div>
          <div class="stat">
            <div class="stat-title">Total a Distribuir</div>
            <div class="stat-value text-primary">
              ${{ previewData.total_to_distribute.toFixed(2) }}
            </div>
          </div>
        </div>

        <div class="mt-4 overflow-x-auto">
          <table class="table-zebra table w-full">
            <thead>
              <tr>
                <th>Tipo de Acción</th>
                <th class="text-right">Valor Anterior</th>
                <th class="text-right text-info">Crecimiento (Aportes)</th>
                <th class="text-right text-info">Crecimiento (Intereses)</th>
                <th class="text-right text-success">Crecimiento Total</th>
                <th class="text-right text-primary">Nuevo Valor</th>
                <th class="text-right text-warning">Dividendos Generados</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="detail in previewData.details" :key="detail.stock_id">
                <td>
                  <div class="font-bold">{{ detail.type }}</div>
                  <div v-if="detail.is_guaranteed" class="badge badge-secondary badge-sm">
                    Garantizada
                  </div>
                </td>
                <td class="text-right">${{ Number(detail.previous_value).toFixed(2) }}</td>
                <td class="text-right text-info">
                  +${{ Number(detail.growth_from_contributions).toFixed(2) }}
                  ({{ Number(detail.estimated_growth_from_contributions) }})
                </td>
                <td class="text-right text-info">
                  +${{ Number(detail.growth_from_interest).toFixed(2) }}
                </td>
                <td class="text-right font-bold text-success">
                  +${{ Number(detail.total_growth_per_share).toFixed(2) }}
                </td>
                <td class="text-right font-bold text-primary">
                  ${{ Number(detail.new_value).toFixed(2) }}
                </td>
                <td class="text-right text-warning font-bold">
                  <span v-if="typeof detail.dividends_generated === 'number' && detail.dividends_generated > 0">
                    ${{ Number(detail.dividends_generated).toFixed(2) }}
                  </span>
                  <span v-else>-</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div
          v-if="previewData?.mandatory_contributions_by_type && previewData.mandatory_contributions_by_type.length"
          class="mt-8 card border bg-base-100 shadow-xl"
        >
          <div class="card-body">
            <h3 class="card-title text-secondary">Aportes Obligatorios Recaudados</h3>
            <div class="overflow-x-auto mt-2">
              <table class="table-zebra table w-full">
                <thead>
                  <tr>
                    <th>Tipo de Aporte</th>
                    <th class="text-right">Total Recaudado</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="item in previewData.mandatory_contributions_by_type"
                    :key="item.mandatory_contribution_id"
                  >
                    <td>
                      {{
                        (mandatoryContributions.find(
                          (c: MandatoryContribution) => c.id === item.mandatory_contribution_id
                        )?.asset_type) || item.mandatory_contribution_id
                      }}
                    </td>
                    <td class="text-right font-bold">
                      ${{ item.total.toFixed(2) }}
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <th>Total</th>
                    <th class="text-right text-primary">
                      ${{ (previewData?.total_mandatory_contributions ?? 0).toFixed(2) }}
                    </th>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        <div class="card-actions mt-6 justify-end">
          <button class="btn btn-primary btn-wide" @click="execute" :disabled="isExecuting">
            <span v-if="isExecuting" class="loading loading-spinner"></span>
            {{ isExecuting ? 'Procesando...' : 'Confirmar y Ejecutar Revalorización' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useActiveMeetingStore } from '../stores/activeMeeting'
import { assetRevaluationService } from '../services/assetRevaluationService'
import type { RevaluationPreviewResult } from '../types'
import { contributionsService } from '@/features/contributions/services/contributionsService'
import type { MandatoryContribution } from '@/features/contributions/types'

type Status = 'idle' | 'loading' | 'success' | 'error'

const status = ref<Status>('idle')
const isExecuting = ref(false)
const previewData = ref<RevaluationPreviewResult | null>(null)
const errorMessage = ref<string>('')
const mandatoryContributions = ref<MandatoryContribution[]>([])

const activeMeetingStore = useActiveMeetingStore()
const emit = defineEmits(['completed'])

async function fetchPreview() {
  if (!activeMeetingStore.meetingId) {
    errorMessage.value =
      'No se ha encontrado una reunión activa. No se puede cargar la revalorización.'
    status.value = 'error'
    return
  }

  status.value = 'loading'
  errorMessage.value = ''

  try {
    const data = await assetRevaluationService.getPreview(activeMeetingStore.meetingId)
    console.log(data)
    previewData.value = data
    // Cargar los nombres de los aportes obligatorios
    mandatoryContributions.value = await contributionsService.getContributions()
    status.value = 'success'
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Ocurrió un error desconocido.'
    errorMessage.value = `Error: ${message}`
    console.error('Failed to fetch revaluation preview:', err)
    status.value = 'error'
  }
}

async function execute() {
  if (!activeMeetingStore.meetingId) {
    // This should not happen if the button is only shown when there's a meetingId
    alert('Error: No hay ID de reunión activa.')
    return
  }

  isExecuting.value = true
  errorMessage.value = ''

  try {
    await assetRevaluationService.execute(activeMeetingStore.meetingId)
    alert('Revalorización ejecutada con éxito.')
    emit('completed')
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Ocurrió un error desconocido.'
    errorMessage.value = `Fallo al ejecutar la revalorización: ${message}`
    // Maybe show an error toast/modal here
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