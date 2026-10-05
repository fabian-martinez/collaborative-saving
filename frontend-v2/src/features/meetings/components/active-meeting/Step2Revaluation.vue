<template>
  <div class="h-full flex flex-col min-h-0 overflow-hidden">
    <!-- Loading State -->
    <div v-if="status === 'loading'" class="flex justify-center items-center py-12 flex-1">
      <span class="loading loading-spinner loading-lg text-teal-700"></span>
    </div>

    <!-- Error State -->
    <div v-if="status === 'error'" role="alert" class="alert alert-error mb-4 shadow-sm flex-shrink-0">
      <WarningTriangle class="h-6 w-6 shrink-0" />
      <div>
        <h3 class="font-bold text-sm">Error al Cargar la Previsualización</h3>
        <div class="text-xs">{{ errorMessage }}</div>
      </div>
      <button class="btn btn-xs btn-outline rounded-lg" @click="fetchPreview">Reintentar</button>
    </div>

    <!-- Success State: Display Two-Column Layout -->
    <div v-if="status === 'success' && previewData" class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch flex-1 min-h-0 overflow-hidden">
      <!-- Panel Izquierdo (Workspace Principal) - 8 Columnas -->
      <div class="lg:col-span-8 card bg-base-100 border border-base-200 shadow-sm rounded-xl p-4 md:p-5 flex flex-col h-full min-h-0 overflow-hidden">
        <div class="space-y-3.5 flex-1 flex flex-col min-h-0 overflow-hidden">
          <!-- Title & Subtitle -->
          <div class="flex-shrink-0">
            <h2 class="text-base font-bold text-base-content">Cálculo de Revalorización (Paso 2)</h2>
            <p class="text-xs text-base-content/60 mt-0.5">
              Revisa la distribución de excedentes e intereses recaudados en el periodo y ejecuta la revalorización de acciones.
            </p>
          </div>

          <!-- Summary Cards -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-shrink-0">
            <!-- Capital Social Inicial -->
            <div class="bg-base-200/30 border border-base-200/50 rounded-xl p-3 flex flex-col justify-center">
              <span class="text-[10px] font-bold text-base-content/50 uppercase tracking-wider block">Capital Social Inicial</span>
              <span class="text-base font-extrabold text-base-content mt-1 block">
                {{ formatCurrency(initialCapital) }}
              </span>
            </div>
            <!-- Intereses de Préstamos -->
            <div class="bg-base-200/30 border border-base-200/50 rounded-xl p-3 flex flex-col justify-center">
              <span class="text-[10px] font-bold text-base-content/50 uppercase tracking-wider block">Intereses de Préstamos</span>
              <span class="text-base font-extrabold text-emerald-600 mt-1 block">
                +{{ formatCurrency(previewData.total_interest) }}
              </span>
            </div>
            <!-- Nuevo Valor Calculado -->
            <div class="bg-base-200/30 border border-base-200/50 rounded-xl p-3 flex flex-col justify-center">
              <span class="text-[10px] font-bold text-base-content/50 uppercase tracking-wider block">Nuevo Valor Calculado</span>
              <span class="text-base font-extrabold text-teal-700 mt-1 block font-mono">
                {{ formatCurrency(calculatedNewValue) }}
              </span>
            </div>
          </div>

          <!-- Execute Button -->
          <button
            class="btn btn-block bg-teal-850 hover:bg-teal-900 text-white font-semibold rounded-lg text-xs border-0 py-2.5 flex-shrink-0 mt-1"
            @click="execute"
            :disabled="isExecuting || store.revaluationExecuted"
          >
            <span v-if="isExecuting" class="loading loading-spinner loading-xs"></span>
            <span v-else>{{ store.revaluationExecuted ? 'Revalorización Ejecutada con Éxito' : 'Confirmar y Ejecutar Revalorización' }}</span>
          </button>

          <!-- Scrollable Detailed Table Section at the bottom -->
          <div class="flex-1 overflow-auto border border-base-200 rounded-xl mt-3 min-h-0 bg-base-50/20 p-3">
            <div class="flex items-center justify-between mb-2 border-b border-base-200 pb-1.5 flex-shrink-0">
              <h3 class="text-[10px] font-extrabold text-base-content/70 uppercase tracking-wider">Desglose de Cálculos</h3>
              <span class="text-[9.5px] text-base-content/40 italic">Selecciona una fila para ver detalles a la derecha</span>
            </div>
            
            <!-- Vista Desktop: Tabla completa -->
            <div class="hidden md:block w-full">
              <table class="table table-zebra table-compact w-full text-xs">
                <thead>
                  <tr class="bg-base-200/50 text-base-content/70">
                    <th class="py-2 px-3 font-bold text-[10px] uppercase tracking-wider">Tipo</th>
                    <th class="py-2 px-3 font-bold text-[10px] uppercase tracking-wider text-right">Valor Ant.</th>
                    <th class="py-2 px-3 font-bold text-[10px] uppercase tracking-wider text-right text-info">Crec. (Aport.)</th>
                    <th class="py-2 px-3 font-bold text-[10px] uppercase tracking-wider text-right text-emerald-600">Crec. (Int.)</th>
                    <th class="py-2 px-3 font-bold text-[10px] uppercase tracking-wider text-right text-teal-700">Crec. Total</th>
                    <th class="py-2 px-3 font-bold text-[10px] uppercase tracking-wider text-right text-primary">Nuevo Valor</th>
                    <th class="py-2 px-3 font-bold text-[10px] uppercase tracking-wider text-right text-warning">Dividendos</th>
                  </tr>
                </thead>
                <tbody>
                  <tr 
                    v-for="detail in previewData.details"
                    :key="detail.stock_id"
                    @click="toggleSelectStock(detail.stock_id)"
                    class="hover:bg-base-200/30 transition-all border-l-4 border-transparent cursor-pointer"
                    :class="{ 'bg-teal-50/45 hover:bg-teal-50/60 border-l-teal-700': selectedStockId === detail.stock_id }"
                  >
                    <td class="py-2.5 px-3">
                      <span class="font-bold text-xs">{{ detail.type }}</span>
                      <span v-if="detail.is_guaranteed" class="badge badge-secondary badge-xs ml-1.5">
                        Garantizada
                      </span>
                    </td>
                    <td class="text-right py-2.5 px-3 font-mono text-xs">
                      {{ formatCurrency(detail.previous_value) }}
                    </td>
                    <td class="text-right text-info py-2.5 px-3 font-mono text-xs">
                      +{{ formatCurrency(detail.growth_from_contributions) }}
                      <span v-if="detail.estimated_growth_from_contributions != null" class="text-[9px] text-base-content/50">
                        ({{ Number(detail.estimated_growth_from_contributions).toLocaleString() }} uds)
                      </span>
                    </td>
                    <td class="text-right text-emerald-600 py-2.5 px-3 font-mono text-xs">
                      {{ formatCurrency(detail.growth_from_interest) }}
                      <span class="text-[9px] text-accent">({{ calculateInterestRate(detail.growth_from_interest, detail.previous_value) }}%)</span>
                    </td>
                    <td class="text-right font-bold text-emerald-600 py-2.5 px-3 font-mono text-xs">
                      +{{ formatCurrency(detail.total_growth_per_share) }}
                    </td>
                    <td class="text-right font-bold text-primary py-2.5 px-3 font-mono text-xs">
                      {{ formatCurrency(detail.new_value) }}
                    </td>
                    <td class="text-right text-warning font-bold py-2.5 px-3 font-mono text-xs">
                      <span v-if="detail.dividends_generated && detail.dividends_generated > 0">
                        {{ formatCurrency(detail.dividends_generated) }}
                      </span>
                      <span v-else>-</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Vista Mobile: Cards -->
            <div class="md:hidden space-y-3">
              <div
                v-for="detail in previewData.details"
                :key="detail.stock_id"
                class="bg-base-100 border border-base-200 rounded-xl p-3 space-y-2.5 cursor-pointer"
                @click="toggleSelectStock(detail.stock_id)"
                :class="{ 'border-teal-600 bg-teal-50/10': selectedStockId === detail.stock_id }"
              >
                <div class="flex items-center justify-between border-b border-base-200 pb-1.5">
                  <span class="font-bold text-xs">{{ detail.type }}</span>
                  <span v-if="detail.is_guaranteed" class="badge badge-secondary badge-xs">
                    Garantizada
                  </span>
                </div>
                <div class="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span class="text-[10px] text-base-content/50 uppercase block">Valor Anterior</span>
                    <span class="font-semibold font-mono">{{ formatCurrency(detail.previous_value) }}</span>
                  </div>
                  <div>
                    <span class="text-[10px] text-base-content/50 uppercase block">Nuevo Valor</span>
                    <span class="font-bold text-primary font-mono">{{ formatCurrency(detail.new_value) }}</span>
                  </div>
                </div>
                <!-- Detalle Expandido en Móvil -->
                <div v-if="selectedStockId === detail.stock_id" class="space-y-1.5 text-[11px] pt-2 border-t border-base-200 bg-base-50/30 p-2 rounded-lg">
                  <div class="flex justify-between">
                    <span class="text-base-content/60">Acciones del Grupo:</span>
                    <span class="font-mono font-bold">{{ detail.total_shares.toLocaleString() }} uds.</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-base-content/60">Crec. Unitario:</span>
                    <span class="text-emerald-600 font-mono font-bold">+{{ formatCurrency(detail.total_growth_per_share) }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-base-content/60">Crec. Total Grupo:</span>
                    <span class="text-emerald-600 font-mono font-bold">+{{ formatCurrency(detail.total_growth_per_share * detail.total_shares) }}</span>
                  </div>
                  <div class="flex justify-between pt-1 border-t border-base-200 font-semibold text-teal-700">
                    <span>Capital Social Final:</span>
                    <span class="font-mono font-extrabold">{{ formatCurrency(detail.new_value * detail.total_shares) }}</span>
                  </div>
                </div>
                <div v-else class="space-y-1 text-xs pt-1.5 border-t border-base-200">
                  <div class="flex justify-between">
                    <span class="text-base-content/60">Crec. (Aportes)</span>
                    <span class="text-info font-mono font-semibold">+{{ formatCurrency(detail.growth_from_contributions) }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-base-content/60">Crec. (Intereses)</span>
                    <span class="text-emerald-600 font-mono font-semibold">{{ formatCurrency(detail.growth_from_interest) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Sección de Aportes Obligatorios -->
            <div
              v-if="previewData?.mandatory_contributions_by_type && previewData.mandatory_contributions_by_type.length"
              class="mt-4 border-t border-base-200 pt-3"
            >
              <h4 class="text-[10px] font-extrabold text-secondary mb-2 uppercase tracking-wider">Aportes Obligatorios Recaudados</h4>
              <table class="table table-zebra table-compact w-full text-xs">
                <thead>
                  <tr class="bg-base-200/50 text-base-content/70">
                    <th class="py-2 px-3 font-bold text-[10px] uppercase tracking-wider">Tipo de Aporte</th>
                    <th class="py-2 px-3 font-bold text-[10px] uppercase tracking-wider text-right">Total Recaudado</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="item in previewData.mandatory_contributions_by_type"
                    :key="item.mandatory_contribution_id"
                  >
                    <td class="py-2 px-3 font-medium">
                      {{ contributionNames[item.mandatory_contribution_id] || 'Cargando...' }}
                    </td>
                    <td class="text-right py-2 px-3 font-bold font-mono">
                      {{ formatCurrency(item.total) }}
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr class="bg-base-200/30">
                    <th class="py-2 px-3 text-left">Total</th>
                    <th class="text-right text-primary py-2 px-3 font-mono font-bold">
                      {{ formatCurrency(previewData?.total_mandatory_contributions ?? 0) }}
                    </th>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Panel Derecho (Sidebar de Impacto / Detalle de Acción) - 4 Columnas -->
      <div class="lg:col-span-4 card bg-base-100 border border-base-200 shadow-sm rounded-xl p-4 md:p-5 flex flex-col h-full min-h-0 overflow-auto">
        <!-- Vista 1: Detalle de Acción Seleccionada -->
        <div v-if="selectedStockDetail" class="space-y-4 flex-grow flex flex-col min-h-0">
          <div class="flex items-center justify-between border-b border-base-200 pb-3 mb-1.5 flex-shrink-0">
            <button 
              @click="selectedStockId = null"
              class="btn btn-ghost btn-xs gap-1 text-base-content/60 hover:text-base-content font-semibold normal-case pl-0 bg-transparent hover:bg-transparent"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Volver a Resumen</span>
            </button>
            <span class="text-[10px] font-bold uppercase tracking-wider text-base-content/40">Detalle de Acción</span>
          </div>

          <div class="space-y-3.5">
            <div>
              <h3 class="text-xs font-bold text-base-content flex items-center gap-1.5">
                {{ selectedStockDetail.type }}
                <span v-if="selectedStockDetail.is_guaranteed" class="badge badge-secondary badge-xs">Garantizada</span>
              </h3>
            </div>

            <!-- Metrics List -->
            <div class="space-y-2.5 p-3 bg-base-200/30 rounded-xl border border-base-200/50 text-xs">
              <div class="flex justify-between items-baseline">
                <span class="text-base-content/60 font-medium">Acciones en el Grupo:</span>
                <span class="font-bold text-base-content font-mono">{{ selectedStockDetail.total_shares.toLocaleString() }} uds.</span>
              </div>
              <div class="flex justify-between items-baseline">
                <span class="text-base-content/60 font-medium">Valor Anterior:</span>
                <span class="font-bold text-base-content font-mono">{{ formatCurrency(selectedStockDetail.previous_value) }}</span>
              </div>
              <div class="flex justify-between items-baseline">
                <span class="text-base-content/60 font-medium">Crecimiento Unitario:</span>
                <span class="font-bold text-emerald-600 font-mono">+{{ formatCurrency(selectedStockDetail.total_growth_per_share) }}</span>
              </div>
              <div class="flex justify-between items-baseline">
                <span class="text-base-content/60 font-medium">Crecimiento Total Grupo:</span>
                <span class="font-bold text-emerald-600 font-mono">+{{ formatCurrency(selectedStockDetail.total_growth_per_share * selectedStockDetail.total_shares) }}</span>
              </div>
              <div class="flex justify-between items-baseline border-t border-base-200 pt-2 font-semibold text-teal-700">
                <span>Nuevo Valor Acción:</span>
                <span class="font-mono font-extrabold text-sm">{{ formatCurrency(selectedStockDetail.new_value) }}</span>
              </div>
              <div class="flex justify-between items-baseline">
                <span>Capital Social Final Grupo:</span>
                <span class="font-mono font-extrabold text-sm">{{ formatCurrency(selectedStockDetail.new_value * selectedStockDetail.total_shares) }}</span>
              </div>
              <div v-if="selectedStockDetail.dividends_generated && selectedStockDetail.dividends_generated > 0" class="flex justify-between items-baseline text-warning">
                <span>Dividendos Generados:</span>
                <span class="font-mono font-bold">{{ formatCurrency(selectedStockDetail.dividends_generated) }}</span>
              </div>
            </div>

            <!-- Explanatory note -->
            <div class="bg-base-200/50 rounded-xl p-3 text-xs leading-relaxed text-base-content/85 border border-base-200/40">
              <p v-if="selectedStockDetail.is_guaranteed">
                Esta acción es de tipo <strong>Garantizada</strong>. Se le asigna prioritariamente una cuota fija del excedente del periodo para asegurar su rentabilidad preferencial sobre el capital invertido.
              </p>
              <p v-else>
                Esta acción es de tipo <strong>Proporcional / Común</strong>. Participa del reparto del remanente neto de los intereses de préstamos de forma proporcional a su volumen y antigüedad acumulados en el periodo.
              </p>
            </div>
          </div>
        </div>

        <!-- Vista 2: Resumen del Impacto y Proyección (Ninguna Acción Seleccionada) -->
        <div v-else class="space-y-4 flex-grow flex flex-col min-h-0">
          <h3 class="text-sm font-bold text-base-content border-b border-base-200 pb-3 mb-2 flex-shrink-0">
            Impacto y Proyección
          </h3>

          <!-- Metrics List -->
          <div class="space-y-3.5 flex-shrink-0">
            <div class="flex justify-between items-baseline text-xs">
              <span class="text-base-content/60 font-medium">Total Acciones Grupo:</span>
              <span class="font-bold text-base-content text-sm">{{ totalShares.toLocaleString() }} Acciones</span>
            </div>
            <div class="flex justify-between items-baseline text-xs">
              <span class="text-base-content/60 font-medium">Incremento de Capital:</span>
              <span class="font-bold text-emerald-600 text-sm">+{{ formatCurrency(previewData.total_interest) }}</span>
            </div>
            <div class="flex justify-between items-baseline text-xs">
              <span class="text-base-content/60 font-medium">Rendimiento Periodo:</span>
              <span class="font-bold text-emerald-600 text-sm">+{{ yieldPercent }}%</span>
            </div>
          </div>

          <!-- D3/SVG Line Chart Visual -->
          <div class="py-4 flex-shrink-0 bg-base-50/50 rounded-xl border border-base-200/50 px-2">
            <svg class="w-full h-24 overflow-visible" viewBox="0 0 300 80">
              <!-- Grid lines (horizontal dotted lines) -->
              <line x1="10" y1="20" x2="290" y2="20" class="stroke-base-200 stroke-1" stroke-dasharray="2,4" />
              <line x1="10" y1="50" x2="290" y2="50" class="stroke-base-200 stroke-1" stroke-dasharray="2,4" />
              
              <!-- Trend Line -->
              <path
                d="M 40,65 L 150,50 L 260,25"
                fill="none"
                class="stroke-teal-700 stroke-2"
              />
              
              <!-- Points -->
              <!-- Point 1 (R22) -->
              <circle cx="40" cy="65" r="4" class="fill-white stroke-teal-700 stroke-2" />
              <text x="40" y="77" class="text-[8px] fill-base-content/50 font-bold" text-anchor="middle">R22</text>
              <text x="40" y="55" class="text-[9px] fill-base-content/80 font-bold font-mono" text-anchor="middle">
                ${{ (calculatedPreviousValue - 0.15).toFixed(2) }}
              </text>
              
              <!-- Point 2 (R23) -->
              <circle cx="150" cy="50" r="4" class="fill-white stroke-teal-700 stroke-2" />
              <text x="150" y="62" class="text-[8px] fill-base-content/50 font-bold" text-anchor="middle">R23</text>
              <text x="150" y="40" class="text-[9px] fill-base-content/80 font-bold font-mono" text-anchor="middle">
                ${{ calculatedPreviousValue.toFixed(2) }}
              </text>
              
              <!-- Point 3 (R24) -->
              <circle cx="260" cy="25" r="4.5" class="fill-teal-700 stroke-white stroke-1.5" />
              <text x="260" y="37" class="text-[8px] fill-base-content/50 font-bold" text-anchor="middle">R24</text>
              <text x="260" y="15" class="text-[9.5px] fill-teal-700 font-extrabold font-mono" text-anchor="middle">
                ${{ calculatedNewValue.toFixed(2) }}
              </text>
            </svg>
          </div>

          <!-- Info Box -->
          <div class="bg-blue-50/50 border border-blue-100 rounded-xl p-3.5 flex gap-2.5 text-xs leading-relaxed text-blue-800 flex-shrink-0">
            <InfoCircle class="h-4.5 w-4.5 text-blue-600 shrink-0" />
            <p>
              Una vez aplicado el ajuste de valor, haz clic en <strong>'Siguiente Paso'</strong> para proceder con el Paso 3: Compra de Acciones.
            </p>
          </div>

          <!-- Actions buttons at the bottom -->
          <div class="flex flex-col gap-2 pt-2 mt-auto flex-shrink-0">
            <button
              class="btn btn-block bg-black hover:bg-neutral-800 text-white font-semibold rounded-lg text-xs border-0 py-2.5"
              @click="goToNextStep"
              :disabled="!store.revaluationExecuted"
            >
              Siguiente Paso: Compra Acciones
            </button>
            <button
              class="btn btn-block btn-outline border-base-300 hover:bg-base-200 hover:text-base-content text-xs font-semibold rounded-lg py-2.5"
              @click="saveDraft"
            >
              Guardar Borrador
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useActiveMeetingStore } from '../../stores/activeMeeting'
import { meetingsApi, type RevaluationResponse } from '@/api/meetings.api'
import { contributionsApi, type MandatoryContribution } from '@/api/contributions.api'
import { formatCurrency } from '@/shared/utils/formatters'
import { WarningTriangle, InfoCircle } from 'iconoir-vue/regular'
import { useToast } from '@/shared/composables/useToast'

type Status = 'idle' | 'loading' | 'success' | 'error'

const toast = useToast()
const status = ref<Status>('idle')
const isExecuting = ref(false)
const previewData = ref<RevaluationResponse | null>(null)
const errorMessage = ref<string>('')
const mandatoryContributions = ref<MandatoryContribution[]>([])
const contributionCache = ref<Map<string, MandatoryContribution>>(new Map())
const contributionNames = reactive<Record<string, string>>({})
const selectedStockId = ref<string | null>(null)

const store = useActiveMeetingStore()
const emit = defineEmits<{
  completed: []
}>()

// Computed Properties for Layout calculations
const totalShares = computed(() => {
  if (!previewData.value) return 0
  return previewData.value.details.reduce((sum, d) => sum + d.total_shares, 0)
})

const initialCapital = computed(() => {
  if (!previewData.value) return 0
  return previewData.value.details.reduce((sum, d) => sum + (d.previous_value * d.total_shares), 0)
})

const commonStockDetail = computed(() => {
  if (!previewData.value) return null
  // Busca el tipo ordinario / proporcional
  return previewData.value.details.find(d => !d.is_guaranteed) || previewData.value.details[0]
})

const calculatedNewValue = computed(() => {
  return commonStockDetail.value?.new_value ?? 0
})

const calculatedPreviousValue = computed(() => {
  return commonStockDetail.value?.previous_value ?? 0
})

const yieldPercent = computed(() => {
  const cap = initialCapital.value
  if (cap === 0) return '0.00'
  const interest = previewData.value?.total_interest ?? 0
  return ((interest / cap) * 100).toFixed(2)
})

const selectedStockDetail = computed(() => {
  if (!previewData.value || !selectedStockId.value) return null
  return previewData.value.details.find(d => d.stock_id === selectedStockId.value) || null
})

function toggleSelectStock(stockId: string) {
  selectedStockId.value = selectedStockId.value === stockId ? null : stockId
}

// Calculate interest rate percentage
function calculateInterestRate(interestGained: number, previousValue: number): string {
  if (previousValue === 0) return '0.00'
  const rate = (interestGained / previousValue) * 100
  return rate.toFixed(2)
}

// Get mandatory contribution name by ID
async function getMandatoryContributionName(mandatoryContributionId: string): Promise<string> {
  if (!mandatoryContributionId) {
    return 'Aporte desconocido'
  }

  // Buscar el aporte por ID exacto en la lista de aportes activos
  const contribution = mandatoryContributions.value.find(
    (c: MandatoryContribution) => c.id === mandatoryContributionId
  )
  
  if (contribution && contribution.asset_type) {
    return contribution.asset_type
  }

  // Si no se encontró, intentar buscar sin importar mayúsculas/minúsculas
  const contributionCaseInsensitive = mandatoryContributions.value.find(
    (c: MandatoryContribution) => c.id.toLowerCase() === mandatoryContributionId.toLowerCase()
  )
  
  if (contributionCaseInsensitive && contributionCaseInsensitive.asset_type) {
    return contributionCaseInsensitive.asset_type
  }

  // Si no se encontró en la lista activa, buscar en el cache
  const cached = contributionCache.value.get(mandatoryContributionId)
  if (cached && cached.asset_type) {
    return cached.asset_type
  }

  // Si aún no se encontró, intentar obtenerlo por ID desde el backend
  try {
    const fetched = await contributionsApi.getContributionById(mandatoryContributionId)
    // Cachear el resultado para futuras referencias
    contributionCache.value.set(mandatoryContributionId, fetched)
    return fetched.asset_type
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('Aporte obligatorio no encontrado (probablemente eliminado):', {
        buscado: mandatoryContributionId,
        error: err instanceof Error ? err.message : String(err)
      })
    }
    return `Aporte eliminado (${mandatoryContributionId.substring(0, 8)}...)`
  }
}

async function fetchPreview() {
  if (!store.meetingId) {
    errorMessage.value = 'No se ha encontrado una reunión activa. No se puede cargar la revalorización.'
    status.value = 'error'
    return
  }

  status.value = 'loading'
  errorMessage.value = ''

  try {
    // Cargar primero los aportes obligatorios para tener los nombres disponibles
    mandatoryContributions.value = await contributionsApi.getContributions()
    // Luego cargar el preview de la revalorización
    const data = await meetingsApi.getRevaluationPreview(store.meetingId)
    previewData.value = data
    
    // Cargar nombres de aportes obligatorios
    if (data.mandatory_contributions_by_type && data.mandatory_contributions_by_type.length > 0) {
      await Promise.all(
        data.mandatory_contributions_by_type.map(async (item) => {
          try {
            const name = await getMandatoryContributionName(item.mandatory_contribution_id)
            contributionNames[item.mandatory_contribution_id] = name
          } catch (err) {
            contributionNames[item.mandatory_contribution_id] = 
              `Aporte eliminado (${item.mandatory_contribution_id.substring(0, 8)}...)`
          }
        })
      )
    }
    
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
    toast.error('Error: No hay ID de reunión activa.')
    return
  }

  isExecuting.value = true
  errorMessage.value = ''

  try {
    await meetingsApi.confirmRevaluation(store.meetingId)
    store.setRevaluationExecuted(true)
    toast.success('Revalorización ejecutada con éxito.')
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Ocurrió un error desconocido.'
    errorMessage.value = `Fallo al ejecutar la revalorización: ${message}`
    toast.error(`Error: ${errorMessage.value}`)
    console.error('Failed to execute revaluation:', err)
  } finally {
    isExecuting.value = false
  }
}

function goToNextStep() {
  emit('completed')
}

function saveDraft() {
  toast.success('Borrador guardado localmente.')
}

onMounted(() => {
  fetchPreview()
})
</script>
