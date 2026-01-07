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
                
                <PaymentReceiptView
                  v-if="hasDisbursementsForMember(selectedMember.id)"
                  :member-name="selectedMember.name"
                  :print-date="formatDate(new Date())"
                  :viewed-operations="memberOperations"
                  :viewed-total="memberTotalDisburse"
                  title="Detalle de Desembolsos"
                  total-label="Total a Entregar:"
                  receipt-id="disbursement-receipt"
                  @open-print-modal="openPrintModal"
                />

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
              
              <!-- Lista de ediciones (para poder borrar/editar lo que se agrega localmente) -->
              <div v-if="localDisbursementsForMember.length > 0" class="mt-8">
                <h4 class="font-semibold mb-3 text-sm uppercase text-base-content/70">Desembolsos Agregados (Pendientes de Aplicar)</h4>
                <div class="space-y-3">
                   <div 
                    v-for="(item, idx) in localDisbursementsForMember" 
                    :key="idx" 
                    class="flex items-center justify-between p-3 bg-base-200 rounded-lg"
                   >
                     <div>
                       <div class="font-medium">{{ getDisbursementLabel(item) }}</div>
                       <div class="text-sm text-base-content/70">{{ item.description }}</div>
                     </div>
                     <div class="flex items-center gap-3">
                       <span class="font-mono font-bold">{{ formatCurrency(item.amount) }}</span>
                       <button class="btn btn-ghost btn-xs text-error" @click="removeLocalDisbursement(item)">
                         <TrashIcon class="w-4 h-4" />
                       </button>
                     </div>
                   </div>
                </div>
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
      @save="handleLoanSave"
      @cancel="showLoanModal = false"
    />

    <StockWithdrawalModal
      :show="showWithdrawalModal"
      :member="selectedMember"
      :member-stocks="memberStocksForWithdrawal"
      @save="handleWithdrawalSave"
      @cancel="showWithdrawalModal = false"
    />

    <OtherDisbursementModal
      :show="showOtherModal"
      :initial-data="null"
      @save="handleOtherSave"
      @cancel="showOtherModal = false"
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
import PaymentReceiptView from './collection/PaymentReceiptView.vue'
import PrintReceiptModal from './collection/PrintReceiptModal.vue'
import LoanModal from './LoanModal.vue'
import StockWithdrawalModal from './StockWithdrawalModal.vue'
import OtherDisbursementModal from './OtherDisbursementModal.vue'
import type { MemberStockForWithdrawal } from './StockWithdrawalModal.vue'

const store = useActiveMeetingStore()
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
    .map(item => ({
      id: item.member_id + item.type + item.amount, // Temporary ID
      type: item.type.toUpperCase(),
      description: item.description || getDisbursementLabel(item),
      total_amount: item.amount,
      entries: [] // Details not needed for simple view
    }))

  // Local items
  const localItems = localDisbursements.value
    .filter(item => item.member_id === selectedMember.value!.id)
    .map(item => ({
      id: 'local-' + Math.random(),
      type: item.type.toUpperCase(),
      description: item.description || getDisbursementLabel(item),
      total_amount: item.amount,
      entries: []
    }))

  return [...planItems, ...localItems]
})

const memberTotalDisburse = computed(() => {
  return memberOperations.value.reduce((sum, op) => sum + op.total_amount, 0)
})

const localDisbursementsForMember = computed(() => {
  if (!selectedMember.value) return []
  return localDisbursements.value.filter(item => item.member_id === selectedMember.value!.id)
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
  
  // Add to local disbursements
  localDisbursements.value.push({
    member_id: selectedMember.value.id,
    type: 'loan',
    amount: loanData.delivered,
    description: `Préstamo ${loanData.type} - Aprobado: ${loanData.approved}`,
  })
  
  showLoanModal.value = false
}

function handleWithdrawalSave(withdrawalData: any) {
  if (!selectedMember.value) return
  
  // withdrawalData contains { withdrawals: [...], deliveredAmount: ... }
  
  localDisbursements.value.push({
    member_id: selectedMember.value.id,
    type: 'withdrawal',
    amount: withdrawalData.deliveredAmount,
    description: `Retiro de acciones. Pendiente: ${withdrawalData.pending}`,
    // TODO: Pass structured withdrawal data to backend
  })
  showWithdrawalModal.value = false
}

function handleOtherSave(data: any) {
  if (!selectedMember.value) return
  localDisbursements.value.push({
    member_id: selectedMember.value.id,
    type: 'other',
    amount: data.amount,
    description: data.description
  })
  showOtherModal.value = false
}

function removeLocalDisbursement(item: DisbursementPlanItem) {
  const idx = localDisbursements.value.indexOf(item)
  if (idx !== -1) {
    localDisbursements.value.splice(idx, 1)
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
    
    // Here we should probably map local items to the correct backend structure if needed
    // But assuming the API accepts flexible notes/description for now or generic items
    
    await meetingsApi.executeDisbursementPlan(store.meetingId, { plan: allItems })
    
    // Close meeting
    await meetingsApi.closeMeeting(store.meetingId)
    
    applySuccess.value = true
    isApplying.value = false // Stop loading state
    
    // Emit completed event or redirect (parent handles this likely via router or store)
    // store.refreshActiveMeeting() // if needed
    
  } catch (e) {
    applyError.value = e instanceof Error ? e.message : 'Error al aplicar desembolsos'
    isApplying.value = false
  }
}
</script>
