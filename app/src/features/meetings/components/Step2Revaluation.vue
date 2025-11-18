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
              <CopyOnDblClickNumber :value="previewData.totalContributions" />
            </div>
          </div>
          <div class="stat">
            <div class="stat-title">Intereses Recaudados</div>
            <div class="stat-value text-success">
              <CopyOnDblClickNumber :value="previewData.totalInterest" />
            </div>
          </div>
          <div class="stat">
            <div class="stat-title">Total a Distribuir</div>
            <div class="stat-value text-primary">
              <CopyOnDblClickNumber :value="previewData.totalToDistribute" />
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
              <tr v-for="detail in previewData.details" :key="detail.stockId">
                <td>
                  <div class="font-bold">{{ detail.type }}</div>
                  <div v-if="detail.isGuaranteed" class="badge badge-secondary badge-sm">
                    Garantizada
                  </div>
                </td>
                <td class="text-right">$<CopyOnDblClickNumber :value="detail.previousValue" /></td>
                <td class="text-right text-info">
                  +<CopyOnDblClickNumber :value="detail.growthFromContributions" /> 
                  <span v-if="detail.estimatedGrowthFromContributions != null">
                    ({{ Number(detail.estimatedGrowthFromContributions).toLocaleString() }})
                  </span>
                </td>
                <td class="text-right text-success">
                  $<CopyOnDblClickNumber :value="detail.growthFromInterest" /> 
                  <span class="text-sm text-accent">({{ calculateInterestRate(detail.growthFromInterest, detail.previousValue) }}%)</span>
                </td>
                <td class="text-right font-bold text-success">
                  +<CopyOnDblClickNumber :value="detail.totalGrowthPerShare" />
                </td>
                <td class="text-right font-bold text-primary">$<CopyOnDblClickNumber :value="detail.newValue" /></td>
                <td class="text-right text-warning font-bold">
                  <span v-if="typeof detail.dividendsGenerated === 'number' && detail.dividendsGenerated > 0">$<CopyOnDblClickNumber :value="detail.dividendsGenerated" /></span><span v-else>-</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div
          v-if="previewData?.mandatoryContributionsByType && previewData.mandatoryContributionsByType.length"
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
                    v-for="item in previewData.mandatoryContributionsByType"
                    :key="item.mandatoryContributionId"
                  >
                    <td>
                      {{
                        getMandatoryContributionName(item.mandatoryContributionId)
                      }}
                    </td>
                    <td class="text-right font-bold">
                      <CopyOnDblClickNumber :value="item.total" />
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <th>Total</th>
                    <th class="text-right text-primary">
                      <CopyOnDblClickNumber :value="previewData?.totalMandatoryContributions ?? 0" />
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
import CopyOnDblClickNumber from '@/shared/components/CopyOnDblClickNumber.vue'

type Status = 'idle' | 'loading' | 'success' | 'error'

const status = ref<Status>('idle')
const isExecuting = ref(false)
const previewData = ref<RevaluationPreviewResult | null>(null)
const errorMessage = ref<string>('')
const mandatoryContributions = ref<MandatoryContribution[]>([])

const activeMeetingStore = useActiveMeetingStore()
const emit = defineEmits(['completed'])

// Calculate interest rate percentage
function calculateInterestRate(interestGained: number, previousValue: number): string {
  if (previousValue === 0) return '0.00'
  const rate = (interestGained / previousValue) * 100
  return rate.toFixed(2)
}

// Get mandatory contribution name by ID
function getMandatoryContributionName(mandatoryContributionId: string): string {
  const contribution = mandatoryContributions.value.find(
    (c: MandatoryContribution) => c.id === mandatoryContributionId
  )
  if (contribution && contribution.asset_type) {
    return contribution.asset_type
  }
  // Fallback: return a formatted version of the ID if not found
  return `Aporte ${mandatoryContributionId.substring(0, 8)}...`
}

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
    // Cargar primero los aportes obligatorios para tener los nombres disponibles
    mandatoryContributions.value = await contributionsService.getContributions()
    // Luego cargar el preview de la revalorización
    const data = await assetRevaluationService.getPreview(activeMeetingStore.meetingId)
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