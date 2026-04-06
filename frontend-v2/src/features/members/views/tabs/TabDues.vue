<template>
  <div class="py-4 w-full max-w-full min-w-0 overflow-x-hidden">
    <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 sm:gap-0 mb-8">
      <h2 class="text-xl sm:text-2xl font-bold text-base-content mb-0 break-words">Cuotas y Obligaciones</h2>
    </div>

    <div v-if="store.dues.length === 0" class="text-center py-16 px-8">
      <div class="text-6xl mb-4">📋</div>
      <div class="text-lg text-base-content/70">No hay cuotas pendientes</div>
    </div>

    <div v-else class="dues-content">
      <!-- Aportes Obligatorios -->
      <div v-if="mandatoryContributions.length > 0" class="mb-8">
        <h3 class="text-base sm:text-lg font-semibold text-base-content/80 mb-4 break-words">Aportes Obligatorios</h3>
        <div class="card bg-base-100 border border-base-300">
          <div class="card-body">
            <div class="space-y-3">
              <div
                v-for="due in mandatoryContributions"
                :key="due.reference_id || due.description"
                class="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-0 p-4 border-b border-base-300 last:border-b-0"
              >
                <div class="flex-1 min-w-0">
                  <div class="font-medium text-base-content mb-1 text-sm sm:text-base break-words">{{ due.description }}</div>
                  <div class="text-base-content/70 text-xs sm:text-sm break-words">
                    <span class="text-sm text-base-content/70">{{ formatDate(due.creation_date) }}</span>
                  </div>
                </div>
                <div class="text-base sm:text-lg text-base-content ml-0 sm:ml-4 text-right sm:text-left font-mono font-bold shrink-0 min-w-0 break-words">{{ formatCurrency(due.amount) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Cuotas de Acciones -->
      <div v-if="stockFees.length > 0" class="mb-8">
        <h3 class="text-base sm:text-lg font-semibold text-base-content/80 mb-4 break-words">Cuotas de Acciones</h3>
        <div class="card bg-base-100 border border-base-300">
          <div class="card-body">
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
                    <span class="text-sm text-base-content/70 ml-2">{{ formatDate(due.creation_date) }}</span>
                  </div>
                </div>
                <div class="text-base sm:text-lg text-base-content ml-0 sm:ml-4 text-right sm:text-left font-mono font-bold shrink-0 min-w-0 break-words">{{ formatCurrency(due.amount) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagos de Préstamos -->
      <div v-if="loanPayments.length > 0" class="mb-8">
        <h3 class="text-base sm:text-lg font-semibold text-base-content/80 mb-4 break-words">Pagos de Préstamos</h3>
        <div class="card bg-base-100 border border-base-300">
          <div class="card-body">
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
                <div class="flex items-center gap-4">
                  <div class="text-base sm:text-lg text-base-content text-right sm:text-left font-mono font-bold shrink-0 min-w-0 break-words">
                    {{ formatCurrency(due.amount) }}
                  </div>
                  <button
                    v-if="due.reference_id"
                    class="btn btn-ghost btn-xs btn-circle"
                    title="Editar condiciones del crédito"
                    aria-label="Editar condiciones del crédito"
                    @click="openEditModal(due)"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Total General -->
      <div class="card bg-base-100 shadow-lg mt-8">
        <div class="card-body">
          <div class="text-center p-6">
            <div class="text-base text-base-content/70 mb-2">Total Pendiente</div>
            <div class="text-primary text-3xl sm:text-4xl lg:text-5xl break-words font-mono font-bold">
              {{ formatCurrency(store.totalPendingDues) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Vista Previa e Impresión -->
    <PrintReceiptModal
      :is-open="printReceipt.isPrintModalOpen.value"
      :member-name="store.member?.name || null"
      :print-date="formatDate(new Date())"
      :viewed-operations="viewedOperations"
      :viewed-total="store.totalPendingDues"
      title="Recibo de Cobro - Obligaciones"
      total-label="Total a Cobrar:"
      modal-id="collection-receipt-print-modal"
      @close="printReceipt.closePrintModal"
      @print="printReceipt.printReceipt"
    />
    <!-- Modal para editar datos del crédito -->
    <Modal
      :show="showEditModal"
      title="Editar Condiciones del Crédito"
      @close="closeEditModal"
    >
      <div v-if="selectedLoan" class="space-y-4 py-2">
        <div class="form-control w-full">
          <label class="label">
            <span class="label-text">Tasa de Interés (%)</span>
          </label>
          <input
            v-model.number="editForm.interest_rate"
            type="number"
            step="0.01"
            class="input input-bordered w-full"
            placeholder="Ej: 1.5"
          />
        </div>

        <div class="form-control w-full">
          <label class="label">
            <span class="label-text">Cuota Mensual</span>
          </label>
          <input
            v-model.number="editForm.monthly_payment_amount"
            type="number"
            class="input input-bordered w-full"
            placeholder="Ej: 150000"
          />
        </div>

        <div class="form-control w-full">
          <label class="label">
            <span class="label-text">Plazo (Meses)</span>
          </label>
          <input
            v-model.number="editForm.term"
            type="number"
            class="input input-bordered w-full"
            placeholder="Ej: 12"
          />
        </div>

        <div v-if="saveError" class="text-error text-sm mt-2">
          {{ saveError }}
        </div>
      </div>

      <template #footer>
        <button class="btn btn-ghost" @click="closeEditModal" :disabled="saving">
          Cancelar
        </button>
        <button
          class="btn btn-primary"
          @click="saveLoanTerms"
          :disabled="saving"
        >
          <span v-if="saving" class="loading loading-spinner"></span>
          Guardar Cambios
        </button>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { formatCurrency, formatDate } from '@/shared/utils/formatters'
import type { useMemberDetailStore } from '@/features/members/stores/memberDetail'
import { usePrintReceipt } from '@/shared/composables/usePrintReceipt'
import PrintReceiptModal from '@/shared/components/PrintReceiptModal.vue'
import { loansApi, type Loan } from '@/api/loans.api'
import Modal from '@/shared/components/Modal.vue'

const props = defineProps<{
  memberId: string
  store: ReturnType<typeof useMemberDetailStore>
  meetingId?: string | null
}>()

const showEditModal = ref(false)
const saving = ref(false)
const saveError = ref<string | null>(null)
const selectedLoan = ref<Loan | null>(null)

const editForm = reactive({
  interest_rate: 0,
  monthly_payment_amount: 0,
  term: 0
})

const mandatoryContributions = computed(() => {
  return props.store.dues.filter(due => due.type === 'mandatory_contribution')
})

const stockFees = computed(() => {
  return props.store.dues.filter(due => due.type === 'stock_fee')
})

const loanPayments = computed(() => {
  return props.store.dues.filter(due => due.type === 'loan_payment')
})

// Lógica de Impresión de Recibo
const printReceipt = usePrintReceipt(
  computed(() => props.store.member),
  'collection-receipt-print-modal',
  'collection-receipt-print-container',
  'collection-receipt-print'
)

const viewedOperations = computed(() => {
  return props.store.dues.map(due => ({
    id: due.reference_id || due.description,
    type: due.type.toUpperCase(),
    description: due.description,
    total_amount: due.amount,
    date: due.creation_date,
    ledger_entries: [
      {
        id: `due-${due.reference_id || due.description}`,
        account_type: due.description,
        amount: due.amount,
        description: '',
        created_at: due.creation_date
      }
    ]
  }))
})
const openEditModal = (due: any) => {
  const loan = props.store.loans.find(l => l.id === due.reference_id)
  if (loan) {
    selectedLoan.value = loan
    editForm.interest_rate = loan.interest_rate
    editForm.monthly_payment_amount = loan.monthly_payment_amount
    editForm.term = loan.term
    saveError.value = null
    showEditModal.value = true
  }
}

const closeEditModal = () => {
  showEditModal.value = false
  selectedLoan.value = null
  saveError.value = null
}

const saveLoanTerms = async () => {
  if (!selectedLoan.value) return

  saving.value = true
  saveError.value = null

  try {
    await loansApi.updateLoanTerms(selectedLoan.value.id, {
      interest_rate: editForm.interest_rate,
      monthly_payment_amount: editForm.monthly_payment_amount,
      term: editForm.term
    })

    // Recargar datos
    await props.store.fetchLoans(props.memberId)
    await props.store.fetchDues(props.memberId)

    closeEditModal()
  } catch (error: any) {
    saveError.value = error.message || 'Error al actualizar las condiciones del crédito'
  } finally {
    saving.value = false
  }
}
</script>









