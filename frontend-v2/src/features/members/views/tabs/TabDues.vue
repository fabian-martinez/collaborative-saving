<template>
  <div class="py-4 w-full max-w-full overflow-x-hidden">
    <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 sm:gap-0 mb-8">
      <h2 class="text-xl sm:text-2xl font-bold text-base-content mb-0 break-words">Cuotas y Obligaciones</h2>
      <button class="btn btn-primary" @click="$emit('register-payment')">
        Registrar Pago
      </button>
    </div>

    <div v-if="store.dues.length === 0" class="text-center py-16 px-8">
      <div class="text-6xl mb-4">📋</div>
      <div class="text-lg text-base-content/70">No hay cuotas pendientes</div>
    </div>

    <div v-else class="dues-content">
      <!-- Aportes Obligatorios -->
      <div v-if="mandatoryContributions.length > 0" class="mb-8">
        <h3 class="text-base sm:text-lg font-semibold text-base-content/80 mb-4 break-words">Aportes Obligatorios</h3>
        <Card variant="bordered">
          <div class="space-y-3">
            <div
              v-for="due in mandatoryContributions"
              :key="due.reference_id || due.description"
              class="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-0 p-4 border-b border-base-300 last:border-b-0"
            >
              <div class="flex-1 min-w-0">
                <div class="font-medium text-base-content mb-1 text-sm sm:text-base break-words">{{ due.description }}</div>
                <div class="text-base-content/70 text-xs sm:text-sm break-words">
                  <span class="text-sm text-base-content/70">{{ formatDate(due.creation_date || '') }}</span>
                </div>
              </div>
              <div class="text-base sm:text-lg text-base-content ml-0 sm:ml-4 whitespace-nowrap text-right sm:text-left font-mono font-bold">{{ formatCurrency(due.amount) }}</div>
            </div>
          </div>
        </Card>
      </div>

      <!-- Cuotas de Acciones -->
      <div v-if="stockFees.length > 0" class="mb-8">
        <h3 class="text-base sm:text-lg font-semibold text-base-content/80 mb-4 break-words">Cuotas de Acciones</h3>
        <Card variant="bordered">
          <div class="space-y-3">
            <div
              v-for="due in stockFees"
              :key="due.reference_id || due.description"
              class="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-0 p-4 border-b border-base-300 last:border-b-0"
            >
              <div class="flex-1 min-w-0">
                <div class="font-medium text-base-content mb-1 text-sm sm:text-base break-words">{{ due.description }}</div>
                <div class="text-base-content/70 text-xs sm:text-sm break-words">
                  <span v-if="due.stock_quantity" class="text-sm text-base-content/70">
                    {{ due.stock_quantity }} unidades x {{ formatCurrency(due.monthly_contribution || 0) }} c/u
                  </span>
                  <span class="text-sm text-base-content/70 ml-2">{{ formatDate(due.creation_date || '') }}</span>
                </div>
              </div>
              <div class="text-base sm:text-lg text-base-content ml-0 sm:ml-4 whitespace-nowrap text-right sm:text-left font-mono font-bold">{{ formatCurrency(due.amount) }}</div>
            </div>
          </div>
        </Card>
      </div>

      <!-- Pagos de Préstamos -->
      <div v-if="loanPayments.length > 0" class="mb-8">
        <h3 class="text-base sm:text-lg font-semibold text-base-content/80 mb-4 break-words">Pagos de Préstamos</h3>
        <Card variant="bordered">
          <div class="space-y-3">
            <div
              v-for="due in loanPayments"
              :key="due.reference_id || due.description"
              class="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-0 p-4 border-b border-base-300 last:border-b-0"
            >
              <div class="flex-1 min-w-0">
                <div class="font-medium text-base-content mb-1 text-sm sm:text-base break-words">{{ due.description }}</div>
                <div v-if="due.details" class="text-base-content/70 text-xs sm:text-sm break-words">
                  <span class="text-sm text-base-content/70">
                    Interés: {{ formatCurrency(due.details.interest || 0) }},
                    Capital: {{ formatCurrency(due.details.principal || 0) }},
                    Saldo: {{ formatCurrency(due.details.outstanding_balance || 0) }}
                  </span>
                </div>
              </div>
              <div class="text-base sm:text-lg text-base-content ml-0 sm:ml-4 whitespace-nowrap text-right sm:text-left font-mono font-bold">{{ formatCurrency(due.amount) }}</div>
            </div>
          </div>
        </Card>
      </div>

      <!-- Total General -->
      <Card variant="elevated" class="mt-8">
        <div class="text-center p-6">
          <div class="text-base text-base-content/70 mb-2">Total Pendiente</div>
          <div class="text-primary text-3xl sm:text-4xl lg:text-5xl break-words font-mono font-bold">
            {{ formatCurrency(store.totalPendingDues) }}
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Card from '@/shared/components/Card.vue'
import { formatCurrency, formatDate } from '@/shared/utils/formatters'
import type { useMemberDetailStore } from '@/features/members/stores/memberDetail'

const props = defineProps<{
  memberId: string
  store: ReturnType<typeof useMemberDetailStore>
  meetingId?: string | null
}>()

defineEmits<{
  'register-payment': []
}>()

const mandatoryContributions = computed(() => {
  return props.store.dues.filter(due => due.type === 'mandatory_contribution')
})

const stockFees = computed(() => {
  return props.store.dues.filter(due => due.type === 'stock_fee')
})

const loanPayments = computed(() => {
  return props.store.dues.filter(due => due.type === 'loan_payment')
})
</script>









