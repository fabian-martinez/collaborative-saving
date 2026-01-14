<template>
  <div>
    <div v-if="loading" class="flex justify-center items-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div v-if="error && !loading" class="alert alert-error mb-4">
      <span>{{ error }}</span>
    </div>

    <div v-if="!loading && !error" class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Columna izquierda: Resumen y lista de socios -->
      <div class="md:col-span-1">
        <!-- Resumen sticky -->
        <DisbursementSummary
          :available-cash="availableCash"
          :total-to-disburse="totalToDisburse"
        />
        <MemberList
          :members="members"
          :selected-member="selectedMember"
          :is-member-paid="() => false"
          :get-initials="getInitials"
          :get-member-color="getMemberColor"
          :has-disbursement="hasDisbursement"
          @select-member="selectMember"
        />
      </div>

      <!-- Columna derecha: Panel de desembolsos -->
      <div class="md:col-span-2">
        <div class="card bg-base-100 shadow-lg rounded-lg">
          <div class="card-body p-4 md:p-6">
            <div v-if="!selectedMember" class="flex items-center justify-center h-64 text-base-content/60">
              <p class="text-center">Seleccione un socio para gestionar desembolsos.</p>
            </div>
            
            <div v-else>
              <!-- Recibo de Desembolsos -->
              <div class="mb-6">
                <div class="flex justify-between items-center mb-4">
                  <h3 class="text-xl font-bold">Desembolsos para {{ selectedMember.name }}</h3>
                </div>
                
                <div
                  v-if="hasDisbursementsForMember(selectedMember.id)"
                  id="disbursement-receipt"
                  class="bg-base-100 p-4 md:p-6 rounded-2xl shadow-lg font-sans print-container"
                >
                  <div class="flex justify-between items-start mb-4 md:mb-6 no-print">
                    <div class="flex-1 text-center">
                      <h2 class="text-xl md:text-2xl font-bold">Detalle de Desembolsos</h2>
                      <p class="text-base md:text-lg text-base-content/80 wrap-break-word">
                        {{ selectedMember.name }}
                      </p>
                    </div>
                    <button
                      @click="openPrintModal"
                      class="btn btn-outline btn-secondary btn-sm ml-4"
                      title="Vista previa e imprimir recibo"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-5 w-5 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                        />
                      </svg>
                      Imprimir
                    </button>
                  </div>
                  <div class="print-header print-only">
                    <h2 class="text-2xl font-bold text-center mb-2">Detalle de Desembolsos</h2>
                    <p class="text-lg text-center mb-1">{{ selectedMember.name }}</p>
                    <p class="text-sm text-center text-base-content/70">{{ formatDate(new Date()) }}</p>
                  </div>
                  <div class="space-y-3 md:space-y-4">
                    <div
                      v-for="op in memberOperations"
                      :key="op.id"
                      class="relative"
                    >
                      <OperationDetails :operation="op" />
                      <!-- Botones de acción para operaciones pendientes -->
                      <div
                        v-if="((op as any).isPending || (op as any).isPendingPayment) && (op as any).originalItem"
                        class="mt-2 flex gap-2 justify-end no-print"
                      >
                        <button
                          class="btn btn-ghost btn-xs text-primary hover:bg-primary/10"
                          @click="editDisbursement(op)"
                          title="Editar desembolso"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Editar
                        </button>
                        <button
                          class="btn btn-ghost btn-xs text-error hover:bg-error/10"
                          @click="removeDisbursement(op)"
                          title="Eliminar desembolso"
                        >
                          <TrashIcon class="w-4 h-4 mr-1" />
                          Eliminar
                        </button>
                      </div>
                    </div>
                    <div
                      class="mt-6 md:mt-8 pt-4 border-t-2 border-dashed border-base-300/50 print-total"
                    >
                      <div
                        class="flex items-baseline justify-between text-lg md:text-xl lg:text-2xl font-bold gap-2"
                      >
                        <span class="shrink-0">Total a Entregar:</span>
                        <div
                          class="hidden md:block print-show grow border-b-2 border-dotted border-base-300/70 mx-2 md:mx-4"
                        ></div>
                        <span
                          class="shrink-0 text-primary font-mono text-base md:text-xl lg:text-2xl whitespace-nowrap no-print"
                        >
                          <CopyOnDblClickNumber :value="memberTotalDisburse" />
                        </span>
                        <span
                          class="shrink-0 text-primary font-mono text-base md:text-xl lg:text-2xl whitespace-nowrap print-only"
                        >
                          {{ formatCurrency(memberTotalDisburse) }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div v-else class="text-center py-8 text-base-content/60 italic bg-base-200/50 rounded-lg">
                  No hay desembolsos registrados para este socio.
                </div>
              </div>

              <!-- Botones de Acción -->
              <div class="flex flex-col sm:flex-row gap-3 justify-end mt-6 pt-4 border-t border-base-200">
                 <button class="btn btn-primary" @click="openLoanModal">
                  Solicitar Préstamo
                </button>
                <button class="btn btn-secondary" @click="openWithdrawalModal">
                  Retiro de Acciones
                </button>
                <button class="btn btn-accent" @click="openOtherModal">
                  Otro Desembolso
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <LoanModal
      :show="showLoanModal"
      :member="selectedMember"
      :max-capacity="maxCapacity"
      :prev-loan="editingDisbursement?.loanData || (editingDisbursement?.operation?.originalItem?.type === 'loan' ? {
        type: (() => {
          const notes = editingDisbursement.operation.originalItem.notes || ''
          const match = notes.match(/Préstamo\s+(\w+)/)
          return match ? match[1] : 'corriente'
        })(),
        approved: (() => {
          const notes = editingDisbursement.operation.originalItem.notes || ''
          const match = notes.match(/Aprobado:\s*(\d+)/)
          return match ? parseFloat(match[1]) : editingDisbursement.operation.originalItem.amount
        })(),
        delivered: editingDisbursement.operation.originalItem.amount
      } : null)"
      @save="handleLoanSave"
      @cancel="() => { showLoanModal = false; editingDisbursement = null }"
    />

    <StockWithdrawalModal
      :show="showWithdrawalModal"
      :member="selectedMember"
      :member-stocks="memberStocksForWithdrawal"
      @save="handleWithdrawalSave"
      @cancel="() => { showWithdrawalModal = false; editingDisbursement = null }"
    />

    <OtherDisbursementModal
      :show="showOtherModal"
      :initial-data="editingDisbursement?.operation?.originalItem?.type === 'other' ? {
        description: editingDisbursement.operation.originalItem.notes || '',
        amount: editingDisbursement.operation.originalItem.amount
      } : null"
      @save="handleOtherSave"
      @cancel="() => { showOtherModal = false; editingDisbursement = null }"
    />
    
    <!-- Print Modal -->
    <PrintReceiptModal
      :is-open="printModalOpen"
      :member-name="selectedMember?.name || ''"
      :print-date="formatDate(new Date())"
      :viewed-operations="memberOperations"
      :viewed-total="memberTotalDisburse"
      title="Recibo de Desembolso"
      total-label="Total Entregado:"
      modal-id="disbursement-print-modal"
      @close="printModalOpen = false"
      @print="handlePrint"
    />

    <div v-if="hasAnyDisbursement" class="mt-8 pt-4 border-t flex flex-col items-center">
      <button 
        class="btn btn-primary btn-lg w-full md:w-auto px-12" 
        :disabled="isApplying" 
        @click="applyDisbursements"
      >
        <span v-if="isApplying" class="loading loading-spinner"></span>
        {{ isApplying ? 'Aplicando...' : 'Finalizar y Aplicar Desembolsos' }}
      </button>
      <div v-if="applyError" class="alert alert-error mt-4 max-w-2xl">{{ applyError }}</div>
      <div v-if="applySuccess" class="alert alert-success mt-4 max-w-2xl">
        ¡Desembolsos aplicados y reunión cerrada correctamente!
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Trash as TrashIcon } from 'iconoir-vue/regular'
import { membersApi, type Member, type StockSubscription } from '@/api/members.api'
import { stocksApi, type Stock } from '@/api/stocks.api'
import { loansApi, type Loan } from '@/api/loans.api'
import { meetingsApi, type DisbursementPlanItem, type DisbursementPlanPreview } from '@/api/meetings.api'
import { useActiveMeetingStore } from '../../stores/activeMeeting'
import { formatCurrency, formatDate } from '@/shared/utils/formatters'

// Components
import MemberList from './collection/MemberList.vue'
import DisbursementSummary from './collection/DisbursementSummary.vue'
import OperationDetails from '@/shared/components/OperationDetails.vue'
import CopyOnDblClickNumber from '@/shared/components/CopyOnDblClickNumber.vue'
import PrintReceiptModal from './collection/PrintReceiptModal.vue'
import LoanModal from './LoanModal.vue'
import StockWithdrawalModal from './StockWithdrawalModal.vue'
import OtherDisbursementModal from './OtherDisbursementModal.vue'
import type { MemberStockForWithdrawal } from './StockWithdrawalModal.vue'

const store = useActiveMeetingStore()
const router = useRouter()
const members = ref<Member[]>([])
const selectedMember = ref<Member | null>(null)
const disbursementPlan = ref<DisbursementPlanPreview | null>(null)
const localDisbursements = ref<DisbursementPlanItem[]>([])

const loading = ref(false)
const error = ref<string | null>(null)
const isApplying = ref(false)
const applyError = ref<string | null>(null)
const applySuccess = ref(false)

// Modals state
const showLoanModal = ref(false)
const showWithdrawalModal = ref(false)
const showOtherModal = ref(false)
const printModalOpen = ref(false)

// Estado para edición
const editingDisbursement = ref<{
  operation: any
  isPlanItem: boolean
  loanData?: {
    type: string
    approved: number
    delivered: number
    loanInfo?: {
      disbursed: number
      pending: number
      creationDate: string | Date
      status: string
    }
  }
} | null>(null)

// Data for modals
const memberSubscriptions = ref<StockSubscription[]>([])
const memberLoans = ref<Loan[]>([])
const stocks = ref<Stock[]>([])

// Computed
const availableCash = computed(() => disbursementPlan.value?.available_cash || 0)

const totalToDisburse = computed(() => {
  const planTotal = disbursementPlan.value?.total_to_disburse || 0
  const localTotal = localDisbursements.value.reduce((sum, item) => sum + item.amount, 0)
  return planTotal + localTotal
})

const hasAnyDisbursement = computed(() => {
  return (disbursementPlan.value?.plan.length || 0) > 0 || localDisbursements.value.length > 0
})

// Member specific computations
const memberOperations = computed(() => {
  if (!selectedMember.value) return []
  
  // Backend plan items converted to operation-like structure for receipt view
  const planItems = (disbursementPlan.value?.plan || [])
    .filter(item => item.member_id === selectedMember.value!.id)
    .map(item => {
      // Determinar el account_type según el tipo de desembolso
      let accountType = 'FEE_INCOME' // Por defecto para "other"
      if (item.type === 'loan') {
        accountType = 'LOAN_PORTFOLIO'
      } else if (item.type === 'withdrawal') {
        accountType = 'STOCK_PORTFOLIO'
      } else if (item.type === 'dividend') {
        accountType = 'ACCUMULATED_SURPLUS'
      }
      
      // Si tiene pending_member_payment_id, es un pago pendiente
      const isPendingPayment = !!item.pending_member_payment_id
      
      return {
        id: item.member_id + item.type + item.amount + (item.pending_member_payment_id || ''), // Temporary ID
        type: item.type.toUpperCase(),
        description: item.notes || getDisbursementLabel(item),
        total_amount: item.amount,
        date: new Date(),
        isPendingPayment: isPendingPayment, // Marcar si es un pago pendiente
        originalItem: item, // Guardar referencia al item original
        ledger_entries: [{
          id: `plan-entry-${item.member_id}-${item.type}`,
          account_type: accountType,
          amount: -item.amount, // Negativo porque es una salida
          description: item.notes || getDisbursementLabel(item),
          created_at: new Date()
        }]
      }
    })

  // Local items (pendientes) - usar la misma estructura que pendingDisbursementsOperations
  const localItems = localDisbursements.value
    .filter(item => item.member_id === selectedMember.value!.id)
    .map((item, index) => {
      // Determinar el account_type según el tipo de desembolso
      let accountType = 'FEE_INCOME' // Por defecto para "other"
      if (item.type === 'loan') {
        accountType = 'LOAN_PORTFOLIO'
      } else if (item.type === 'withdrawal') {
        accountType = 'STOCK_PORTFOLIO'
      } else if (item.type === 'dividend') {
        accountType = 'ACCUMULATED_SURPLUS'
      }
      
      // Crear ID estable basado en los datos del item
      const stableId = `pending-${selectedMember.value!.id}-${item.type}-${index}-${Math.round(item.amount * 100)}`
      
      return {
        id: stableId,
        type: item.type.toUpperCase(),
        description: item.notes || getDisbursementLabel(item),
        total_amount: item.amount,
        date: new Date(),
        isPending: true, // Marcar como pendiente para poder eliminarlo
        originalItem: item, // Guardar referencia al item original para poder eliminarlo
        ledger_entries: [{
          id: `pending-entry-${stableId}`,
          account_type: accountType,
          amount: -item.amount, // Negativo porque es una salida (se mostrará en rojo)
          description: item.notes || getDisbursementLabel(item),
          created_at: new Date()
        }]
      }
    })

  return [...planItems, ...localItems]
})

const memberTotalDisburse = computed(() => {
  return memberOperations.value.reduce((sum, op) => sum + op.total_amount, 0)
})


// Calculations for Loan Capacities
const maxCapacity = computed(() => {
  const totalStockValue = memberSubscriptions.value
    .filter(sub => sub.status === 'active')
    .reduce((sum, sub) => {
      // Find stock value from stocks list
      const stock = stocks.value.find(s => s.id === sub.stock_id)
      return sum + (Number(sub.quantity) * (stock?.value || 0))
    }, 0)
    
  const totalNonStockLoans = memberLoans.value
    .filter(loan => loan.loan_type !== 'accion')
    .reduce((sum, loan) => sum + Number(loan.approved_amount), 0)
    
  // 200% of stock value minus existing loans
  const max = (totalStockValue * 2.0) - totalNonStockLoans
  return max > 0 ? max : 0
})

const memberStocksForWithdrawal = computed<MemberStockForWithdrawal[]>(() => {
  return memberSubscriptions.value
    .filter(sub => sub.status === 'active' && sub.quantity > 0)
    .map(sub => {
      const stock = stocks.value.find(s => s.id === sub.stock_id)
      return {
        stockId: sub.stock_id,
        stockType: sub.stock_type || stock?.type || 'Acción',
        quantity: Number(sub.quantity),
        currentValue: stock?.value || 0
      }
    })
})


// Methods
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function getMemberColor(memberId: string): string {
   const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#ef4444', '#6366f1']
   let hash = 0
   for (let i = 0; i < memberId.length; i++) {
     hash = memberId.charCodeAt(i) + ((hash << 5) - hash)
   }
   return colors[Math.abs(hash) % colors.length]
}

function hasDisbursement(memberId: string) {
  const planHas = disbursementPlan.value?.plan.some(item => item.member_id === memberId)
  const localHas = localDisbursements.value.some(item => item.member_id === memberId)
  return planHas || localHas
}

function hasDisbursementsForMember(memberId: string) {
  return hasDisbursement(memberId)
}

function getDisbursementLabel(item: any) {
  const labels: Record<string, string> = {
    loan: 'Préstamo',
    withdrawal: 'Retiro de Acciones',
    dividend: 'Dividendo',
    other: 'Otro'
  }
  return labels[item.type] || item.type
}

async function selectMember(member: Member) {
  selectedMember.value = member
  // Load extra data when selecting
  if (member) {
    try {
      const [subs, loans] = await Promise.all([
        membersApi.getMemberStockSubscriptions(member.id),
        loansApi.getMemberLoans(member.id)
      ])
      memberSubscriptions.value = subs
      memberLoans.value = loans
    } catch (e) {
      console.error('Error loading member details', e)
    }
  }
}

// Modal Openers
function openLoanModal() {
  if (!selectedMember.value) return
  showLoanModal.value = true
}

function openWithdrawalModal() {
  if (!selectedMember.value) return
  showWithdrawalModal.value = true
}

function openOtherModal() {
  if (!selectedMember.value) return
  showOtherModal.value = true
}

function openPrintModal() {
  printModalOpen.value = true
}

// Handlers
function handleLoanSave(loanData: any) {
  if (!selectedMember.value) return
  
  // Si es un préstamo nuevo (no tiene loan_id), crear new_loan_request
  // Si es un préstamo existente (tiene loan_id), usar loan_id
  const isNewLoan = !editingDisbursement.value?.operation?.originalItem?.loan_id
  
  const newItem: DisbursementPlanItem = {
    member_id: selectedMember.value.id,
    type: 'loan',
    amount: loanData.delivered,
    notes: `Préstamo ${loanData.type} - Aprobado: ${loanData.approved}`,
  }
  
  // Si es un préstamo nuevo, agregar new_loan_request
  if (isNewLoan) {
    const interestRate = loanData.type === 'corriente' ? 0.015 : 0.02
    // Calcular cuota mensual aproximada (puede ser ajustada)
    const monthlyPayment = loanData.approved * interestRate * 0.1 // Aproximación simple
    newItem.new_loan_request = {
      member_id: selectedMember.value.id,
      amount: loanData.approved,
      loan_type: loanData.type,
      approved_amount: loanData.approved,
      monthly_payment_amount: monthlyPayment,
      interest_rate: interestRate,
      notes: `Préstamo ${loanData.type}`
    }
  }
  
  // Si estamos editando, reemplazar el item existente
  if (editingDisbursement.value) {
    const originalItem = editingDisbursement.value.operation.originalItem as DisbursementPlanItem
    
    if (editingDisbursement.value.isPlanItem && disbursementPlan.value) {
      // Reemplazar en el plan
      const planIndex = disbursementPlan.value.plan.findIndex(
        item => item.member_id === originalItem.member_id &&
                item.type === originalItem.type &&
                item.amount === originalItem.amount &&
                item.pending_member_payment_id === originalItem.pending_member_payment_id
      )
      if (planIndex !== -1) {
        disbursementPlan.value.plan[planIndex] = {
          ...newItem,
          pending_member_payment_id: originalItem.pending_member_payment_id,
          loan_id: originalItem.loan_id
        }
        // Recalcular total
        disbursementPlan.value.total_to_disburse = disbursementPlan.value.plan.reduce(
          (sum, item) => sum + item.amount, 0
        )
      }
    } else {
      // Reemplazar en localDisbursements
      const localIndex = localDisbursements.value.indexOf(originalItem)
      if (localIndex !== -1) {
        localDisbursements.value[localIndex] = newItem
      }
    }
  } else {
    // Agregar nuevo
    localDisbursements.value.push(newItem)
  }
  
  showLoanModal.value = false
  editingDisbursement.value = null
}

function handleWithdrawalSave(withdrawalData: any) {
  if (!selectedMember.value) return
  
  // Obtener todos los withdrawals con cantidad > 0
  const withdrawalsWithQuantity = (withdrawalData.withdrawals || []).filter((w: any) => w.quantity > 0)
  
  if (withdrawalsWithQuantity.length === 0) {
    applyError.value = 'Debe seleccionar al menos una acción para retirar'
    setTimeout(() => { applyError.value = null }, 5000)
    return
  }
  
  // Calcular el monto total estimado y el monto entregado
  const totalEstimated = withdrawalData.estimatedTotal
  const totalDelivered = withdrawalData.deliveredAmount
  
  // Si estamos editando, eliminar los items existentes primero
  if (editingDisbursement.value) {
    const originalItem = editingDisbursement.value.operation.originalItem as DisbursementPlanItem
    
    if (editingDisbursement.value.isPlanItem && disbursementPlan.value) {
      // Eliminar del plan
      const planIndex = disbursementPlan.value.plan.findIndex(
        item => item.member_id === originalItem.member_id &&
                item.type === originalItem.type &&
                item.amount === originalItem.amount &&
                item.pending_member_payment_id === originalItem.pending_member_payment_id
      )
      if (planIndex !== -1) {
        disbursementPlan.value.plan.splice(planIndex, 1)
        disbursementPlan.value.total_to_disburse = disbursementPlan.value.plan.reduce(
          (sum, item) => sum + item.amount, 0
        )
      }
    } else {
      // Eliminar de localDisbursements
      const localIndex = localDisbursements.value.indexOf(originalItem)
      if (localIndex !== -1) {
        localDisbursements.value.splice(localIndex, 1)
      }
    }
  }
  
  // Crear un item por cada tipo de acción retirada
  withdrawalsWithQuantity.forEach((withdrawal: any) => {
    if (!selectedMember.value) return
    const stock = memberStocksForWithdrawal.value.find(s => s.stockId === withdrawal.stockId)
    const stockValue = stock?.currentValue || 0
    const withdrawalValue = withdrawal.quantity * stockValue
    
    // Calcular el monto proporcional a desembolsar
    const proportionalAmount = totalEstimated > 0 
      ? (withdrawalValue / totalEstimated) * totalDelivered
      : 0
    
    const pendingAmount = withdrawalValue - proportionalAmount
    
    const newItem: DisbursementPlanItem = {
      member_id: selectedMember.value.id,
      type: 'withdrawal',
      amount: proportionalAmount,
      notes: `Retiro de ${withdrawal.quantity} acciones ${stock?.stockType || ''}. Pendiente: ${formatCurrency(pendingAmount)}`,
      disbursement_stock_request: {
        stock_id: withdrawal.stockId,
        stock_withdrawal_quantity: withdrawal.quantity
      }
    }
    
    // Si estamos editando y había pending_member_payment_id, preservarlo solo en el primer item
    if (editingDisbursement.value && withdrawalsWithQuantity.indexOf(withdrawal) === 0) {
      const originalItem = editingDisbursement.value.operation.originalItem as DisbursementPlanItem
      if (originalItem.pending_member_payment_id) {
        newItem.pending_member_payment_id = originalItem.pending_member_payment_id
      }
    }
    
    // Agregar al plan o a localDisbursements
    if (editingDisbursement.value?.isPlanItem && disbursementPlan.value) {
      disbursementPlan.value.plan.push(newItem)
      disbursementPlan.value.total_to_disburse = disbursementPlan.value.plan.reduce(
        (sum, item) => sum + item.amount, 0
      )
    } else {
      localDisbursements.value.push(newItem)
    }
  })
  
  showWithdrawalModal.value = false
  editingDisbursement.value = null
}

function handleOtherSave(data: any) {
  if (!selectedMember.value) return
  
  const newItem: DisbursementPlanItem = {
    member_id: selectedMember.value.id,
    type: 'other',
    amount: data.amount,
    notes: data.description
  }
  
  // Si estamos editando, reemplazar el item existente
  if (editingDisbursement.value) {
    const originalItem = editingDisbursement.value.operation.originalItem as DisbursementPlanItem
    
    if (editingDisbursement.value.isPlanItem && disbursementPlan.value) {
      // Reemplazar en el plan
      const planIndex = disbursementPlan.value.plan.findIndex(
        item => item.member_id === originalItem.member_id &&
                item.type === originalItem.type &&
                item.amount === originalItem.amount &&
                item.pending_member_payment_id === originalItem.pending_member_payment_id
      )
      if (planIndex !== -1) {
        disbursementPlan.value.plan[planIndex] = {
          ...newItem,
          pending_member_payment_id: originalItem.pending_member_payment_id
        }
        // Recalcular total
        disbursementPlan.value.total_to_disburse = disbursementPlan.value.plan.reduce(
          (sum, item) => sum + item.amount, 0
        )
      }
    } else {
      // Reemplazar en localDisbursements
      const localIndex = localDisbursements.value.indexOf(originalItem)
      if (localIndex !== -1) {
        localDisbursements.value[localIndex] = newItem
      }
    }
  } else {
    // Agregar nuevo
    localDisbursements.value.push(newItem)
  }
  
  showOtherModal.value = false
  editingDisbursement.value = null
}

function removeLocalDisbursement(item: DisbursementPlanItem) {
  const idx = localDisbursements.value.indexOf(item)
  if (idx !== -1) {
    localDisbursements.value.splice(idx, 1)
  }
}

function removeDisbursement(operation: any) {
  const originalItem = operation.originalItem as DisbursementPlanItem
  if (!originalItem) return
  
  // Si es un item local, eliminarlo de localDisbursements
  if (operation.isPending) {
    removeLocalDisbursement(originalItem)
  } 
  // Si es un item del plan, eliminarlo del plan
  else if (operation.isPendingPayment && disbursementPlan.value) {
    const planIndex = disbursementPlan.value.plan.findIndex(
      item => item.member_id === originalItem.member_id &&
              item.type === originalItem.type &&
              item.amount === originalItem.amount &&
              item.pending_member_payment_id === originalItem.pending_member_payment_id
    )
    if (planIndex !== -1) {
      disbursementPlan.value.plan.splice(planIndex, 1)
      // Recalcular total_to_disburse
      disbursementPlan.value.total_to_disburse = disbursementPlan.value.plan.reduce(
        (sum, item) => sum + item.amount, 0
      )
    }
  }
}

async function editDisbursement(operation: any) {
  const originalItem = operation.originalItem as DisbursementPlanItem
  if (!originalItem) return
  
  editingDisbursement.value = {
    operation,
    isPlanItem: !!operation.isPendingPayment
  }
  
  // Abrir el modal apropiado según el tipo
  if (originalItem.type === 'loan') {
    // Si tiene loan_id, cargar los datos del préstamo
    if (originalItem.loan_id) {
      try {
        const loan = await loansApi.getLoanById(originalItem.loan_id)
        
        // Calcular el pendiente por entregar
        const pendingAmount = loan.approved_amount - loan.disbursed_amount
        
        // Preparar los datos para el modal
        // El valor aprobado viene del préstamo
        // El valor entregado sugerido es el pendiente (lo que falta por desembolsar)
        const loanData = {
          type: loan.loan_type,
          approved: loan.approved_amount,
          delivered: pendingAmount > 0 ? pendingAmount : loan.disbursed_amount, // Si hay pendiente, mostrar pendiente; si no, mostrar lo ya desembolsado
          loanInfo: {
            disbursed: loan.disbursed_amount,
            pending: pendingAmount,
            creationDate: loan.creation_date,
            status: loan.status
          }
        }
        
        // Guardar los datos del préstamo en editingDisbursement para pasarlos al modal
        editingDisbursement.value.loanData = loanData
        
        showLoanModal.value = true
      } catch (error) {
        console.error('Error al cargar datos del préstamo:', error)
        // Fallback: usar los datos parseados de la descripción
        showLoanModal.value = true
      }
    } else {
      // Si no tiene loan_id, usar el método actual (parsear descripción)
      showLoanModal.value = true
    }
  } else if (originalItem.type === 'withdrawal') {
    // Para retiros, abrir modal de retiro
    // TODO: Implementar edición de retiros cuando el modal lo soporte
    showWithdrawalModal.value = true
  } else {
    // Para otros, abrir modal de otro desembolso con datos iniciales
    showOtherModal.value = true
  }
}

function handlePrint() {
  window.print()
}

// Initialization
onMounted(async () => {
  if (!store.meetingId) return
  loading.value = true
  try {
    const [fetchedMembers, fetchedStocks, plan] = await Promise.all([
      membersApi.getMembers(),
      stocksApi.getStocks(),
      meetingsApi.getDisbursementPlan(store.meetingId)
    ])
    members.value = fetchedMembers
    stocks.value = fetchedStocks
    disbursementPlan.value = plan
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Error al cargar datos'
  } finally {
    loading.value = false
  }
})

async function applyDisbursements() {
  if (!store.meetingId) return
  
  isApplying.value = true
  applyError.value = null
  applySuccess.value = false
  
  try {
    const allItems = [
      ...(disbursementPlan.value?.plan || []),
      ...localDisbursements.value
    ]
    
    // Identificar items de withdrawal que necesitan stock_id
    const withdrawalsNeedingStockId = allItems.filter(
      item => item.type === 'withdrawal' && !item.disbursement_stock_request
    )
    
    // Si hay withdrawals que necesitan stock_id, obtenerlo desde las suscripciones
    if (withdrawalsNeedingStockId.length > 0) {
      await Promise.all(
        withdrawalsNeedingStockId.map(async (item) => {
          if (item.stock_subscription_id) {
            try {
              // Usar el nuevo endpoint para obtener la suscripción (incluso si está inactiva)
              const subscription = await membersApi.getStockSubscriptionById(
                item.member_id,
                item.stock_subscription_id
              )
              
              item.disbursement_stock_request = {
                stock_id: subscription.stock_id,
                stock_withdrawal_quantity: undefined
              }
            } catch (e) {
              throw new Error(
                `No se pudo obtener el stock_id para el retiro de acciones del socio ${item.member_id}. ` +
                `Suscripción ID: ${item.stock_subscription_id}. ` +
                `Por favor, edite el desembolso para agregar la información faltante.`
              )
            }
          } else {
            throw new Error(
              `El desembolso de retiro de acciones del socio ${item.member_id} no tiene información de stock. ` +
              `Por favor, edite el desembolso para agregar la información faltante.`
            )
          }
        })
      )
    }
    
    await meetingsApi.executeDisbursementPlan(store.meetingId, { plan: allItems })
    
    // Close meeting
    await meetingsApi.closeMeeting(store.meetingId)
    
    applySuccess.value = true
    isApplying.value = false // Stop loading state
    
    // Navegar a la vista de detalle de la reunión
    if (store.meetingId) {
      router.push({ name: 'meeting-detail', params: { id: store.meetingId } })
    }
    
  } catch (e) {
    applyError.value = e instanceof Error ? e.message : 'Error al aplicar desembolsos'
    isApplying.value = false
  }
}
</script>
