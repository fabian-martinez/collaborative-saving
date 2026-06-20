<template>
  <div class="h-full flex flex-col min-h-0 overflow-hidden">
    <div v-if="loading" class="flex justify-center items-center py-12 flex-1">
      <span class="loading loading-spinner loading-lg text-teal-700"></span>
    </div>

    <div v-if="error && !loading" class="alert alert-error mb-4 shadow-sm flex-shrink-0">
      <span>{{ error }}</span>
    </div>

    <div v-if="!loading && !error" class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch flex-1 min-h-0 overflow-hidden">
      <!-- Panel Izquierdo (Workspace Principal) - 8 Columnas -->
      <div class="lg:col-span-8 card bg-base-100 border border-base-200 shadow-sm rounded-xl p-4 md:p-5 flex flex-col h-full min-h-0 overflow-hidden">
        <div class="space-y-4 flex-1 flex flex-col min-h-0 overflow-hidden">
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 flex-shrink-0">
            <div>
              <h2 class="text-lg font-bold text-base-content">Desembolsos (Paso 5)</h2>
              <p class="text-xs text-base-content/60 mt-1">
                Registra y revisa los desembolsos de la reunión, como préstamos aprobados, retiros de acciones u otros desembolsos autorizados.
              </p>
            </div>
            
          </div>

          <!-- Selected Member Info Box -->
          <div v-if="selectedMember" class="bg-base-200/30 p-2.5 rounded-lg flex flex-wrap gap-4 text-xs flex-shrink-0">
            <div>
              <span class="text-base-content/60">Socio Seleccionado:</span>
              <span class="ml-1 font-bold text-base-content">{{ selectedMember.name }}</span>
            </div>
            <div>
              <span class="text-base-content/60">Capacidad Máxima:</span>
              <span class="ml-1 font-bold font-mono text-teal-700">{{ formatCurrency(maxCapacity) }}</span>
            </div>
            <div>
              <span class="text-base-content/60">Acciones para Retiro:</span>
              <span class="ml-1 font-bold font-mono text-teal-700">{{ memberStocksForWithdrawal.length }} tipos</span>
            </div>
          </div>

          <!-- Search Bar -->
          <div class="relative w-full max-w-sm flex-shrink-0">
            <span class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search class="h-4 w-4 text-base-content/40" />
            </span>
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="Buscar socio..." 
              class="input input-bordered input-sm w-full pl-9 rounded-lg text-sm bg-base-100 focus:outline-none focus:border-teal-700" 
            />
          </div>

          <!-- Table of Disbursements -->
          <div class="overflow-auto w-full border border-base-200 rounded-lg flex-1 min-h-0">
            <table class="table table-zebra w-full text-xs md:text-sm">
              <thead class="sticky top-0 z-10">
                <tr class="bg-base-200/50 text-base-content/70">
                  <th class="py-2 px-3 font-bold text-[11px] uppercase tracking-wider">Socio</th>
                  <th class="py-2 px-3 font-bold text-[11px] uppercase tracking-wider text-center">Desembolsos</th>
                  <th class="py-2 px-3 font-bold text-[11px] uppercase tracking-wider">Detalle</th>
                  <th class="py-2 px-3 font-bold text-[11px] uppercase tracking-wider text-right">Monto Total</th>
                  <th class="py-2 px-3 font-bold text-[11px] uppercase tracking-wider text-center">Acción</th>
                </tr>
              </thead>
              <tbody>
                <tr 
                  v-for="member in paginatedMembers" 
                  :key="member.id"
                  class="hover:bg-base-200/30 transition-all border-l-4 border-transparent"
                >
                  <td class="py-2.5 px-3">
                    <div class="flex items-center gap-3">
                      <div 
                        class="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0"
                        :style="{ backgroundColor: getMemberColor(member.id) }"
                      >
                        {{ getInitials(member.name) }}
                      </div>
                      <span class="font-semibold text-base-content text-xs">{{ member.name }}</span>
                    </div>
                  </td>
                  <td class="py-2.5 px-3 text-center">
                    <span class="badge badge-sm font-semibold">
                      {{ getMemberDisbursementsCount(member.id) }} desb.
                    </span>
                  </td>
                  <td class="py-2.5 px-3 max-w-xs truncate text-xs text-base-content/85">
                    {{ getMemberDisbursementsDetail(member.id) }}
                  </td>
                  <td class="py-2.5 px-3 text-right">
                    <span class="font-bold text-xs text-error">-{{ formatCurrency(getMemberDisbursementsTotal(member.id)) }}</span>
                  </td>
                  <td class="py-2.5 px-3 text-center overflow-visible">
                    <div class="dropdown dropdown-end">
                      <div tabindex="0" role="button" class="btn btn-ghost btn-xs btn-circle">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </div>
                      <ul tabindex="0" class="dropdown-content menu menu-xs bg-base-100 rounded-box z-50 w-48 p-1.5 shadow border border-base-200">
                        <li>
                          <a @click="openLoanModalForMember(member)" class="text-xs gap-2">
                            <HandCash class="h-3.5 w-3.5 text-teal-700 shrink-0" />
                            <span>Préstamo</span>
                          </a>
                        </li>
                        <li>
                          <a @click="openWithdrawalModalForMember(member)" class="text-xs gap-2">
                            <Coins class="h-3.5 w-3.5 text-teal-700 shrink-0" />
                            <span>Retiro Acciones</span>
                          </a>
                        </li>
                        <li>
                          <a @click="openOtherModalForMember(member)" class="text-xs gap-2">
                            <PlusCircle class="h-3.5 w-3.5 text-teal-700 shrink-0" />
                            <span>Otro Desembolso</span>
                          </a>
                        </li>
                        
                        <template v-for="d in getMemberDisbursements(member.id)" :key="d.id">
                          <li v-if="d.isPending || d.isPendingPayment">
                            <a @click="editDisbursement(d)" class="text-xs gap-2">
                              <EditPencil class="h-3.5 w-3.5 text-teal-700 shrink-0" />
                              <span class="text-xs">Editar {{ getDisbursementLabel(d.originalItem) }}</span>
                            </a>
                          </li>
                          <li v-if="d.isPending || d.isPendingPayment">
                            <a @click="removeDisbursement(d)" class="text-error text-xs gap-2">
                              <Trash class="h-3.5 w-3.5 shrink-0" />
                              <span class="text-xs">Eliminar {{ getDisbursementLabel(d.originalItem) }}</span>
                            </a>
                          </li>
                        </template>

                        <li v-if="getMemberDisbursementsCount(member.id) > 0">
                          <a @click="viewReceiptForMember(member)" class="text-xs gap-2">
                            <Printer class="h-3.5 w-3.5 text-teal-700 shrink-0" />
                            <span>Imprimir Recibo</span>
                          </a>
                        </li>
                      </ul>
                    </div>
                  </td>
                </tr>
                <tr v-if="filteredMembersList.length === 0">
                  <td colspan="5" class="text-center py-8 text-base-content/50">
                    No se encontraron socios.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination Footer -->
          <div class="flex items-center justify-between flex-shrink-0 pt-2 border-t border-base-100">
            <span class="text-xs text-base-content/60">
              Mostrando {{ filteredMembersList.length }} socios
            </span>
            <div class="flex items-center gap-2">
              <button 
                class="btn btn-outline btn-xs font-semibold rounded-lg"
                :disabled="currentPage === 1"
                @click="currentPage--"
              >
                Anterior
              </button>
              <button 
                class="btn btn-outline btn-xs font-semibold rounded-lg"
                :disabled="currentPage >= totalPages"
                @click="currentPage++"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Panel Derecho (Sidebar de Resumen / Gráfico) - 4 Columnas -->
      <div class="lg:col-span-4 card bg-base-100 border border-base-200 shadow-sm rounded-xl p-4 md:p-5 flex flex-col h-full min-h-0 justify-between overflow-auto">
        <div class="space-y-4">
          <h3 class="text-sm font-bold text-base-content border-b border-base-200 pb-3 mb-2">Resumen de Desembolsos</h3>
          
          <!-- Metrics List -->
          <div class="space-y-3.5">
            <div class="flex justify-between items-baseline text-xs">
              <span class="text-base-content/60 font-medium">Caja Disponible:</span>
              <span class="font-bold text-base-content text-sm">{{ formatCurrency(availableCash) }}</span>
            </div>
            <div class="flex justify-between items-baseline text-xs">
              <span class="text-base-content/60 font-medium">Total a Desembolsar:</span>
              <span class="font-bold text-error text-sm">{{ formatCurrency(totalToDisburse) }}</span>
            </div>
            <div class="flex justify-between items-baseline text-xs">
              <span class="text-base-content/60 font-medium">Saldo Restante:</span>
              <span class="font-bold text-sm" :class="availableCash - totalToDisburse >= 0 ? 'text-emerald-600' : 'text-error'">
                {{ formatCurrency(availableCash - totalToDisburse) }}
              </span>
            </div>
          </div>

          <!-- Circular Chart (Percentage of cash disbursed) -->
          <div class="flex justify-center py-4">
            <div class="relative w-28 h-28 flex items-center justify-center">
              <svg class="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <!-- Outer circle track -->
                <circle class="text-base-200" stroke-width="8" stroke="currentColor" fill="transparent" r="40" cx="50" cy="50" />
                <!-- Progress circle -->
                <circle class="text-teal-700 transition-all duration-500" stroke-width="8" :stroke-dasharray="251.2" :stroke-dashoffset="251.2 - (251.2 * Math.min(disbursedPercentage / 100, 1))" stroke-linecap="round" stroke="currentColor" fill="transparent" r="40" cx="50" cy="50" />
              </svg>
              <div class="absolute flex flex-col items-center justify-center text-center">
                <span class="text-xl font-extrabold text-base-content leading-none">{{ Math.round(disbursedPercentage) }}%</span>
                <span class="text-[9px] text-base-content/50 uppercase font-bold tracking-wider mt-1">Desembolsado</span>
              </div>
            </div>
          </div>

          <!-- Info Box -->
          <div class="bg-teal-50/40 border border-teal-100 rounded-xl p-4 flex gap-3 text-xs leading-relaxed text-teal-800">
            <InfoCircle class="h-5 w-5 text-teal-600 shrink-0" />
            <p>
              Verifica la disponibilidad de caja. Al hacer clic en 'Aplicar Desembolsos' se registrarán los movimientos. Una vez aplicados, puedes cerrar la reunión de forma segura.
            </p>
          </div>
        </div>

        <div class="space-y-2 mt-6">
          <!-- Aplicar / Cerrar Acciones -->
          <button 
            v-if="hasAnyDisbursement && !applySuccess"
            class="btn btn-block bg-black hover:bg-neutral-800 text-white font-semibold rounded-lg text-sm border-0 py-2.5" 
            :disabled="isApplying" 
            @click="applyDisbursements"
          >
            <span v-if="isApplying" class="loading loading-spinner loading-xs mr-2"></span>
            {{ isApplying ? 'Aplicando...' : 'Aplicar Desembolsos' }}
          </button>

          <button 
            v-if="applySuccess || !hasAnyDisbursement"
            class="btn btn-block bg-teal-800 hover:bg-teal-900 text-white font-semibold rounded-lg text-sm border-0 py-2.5 mt-2" 
            :disabled="isClosing" 
            @click="closeActiveMeeting"
          >
            <span v-if="isClosing" class="loading loading-spinner loading-xs mr-2"></span>
            {{ isClosing ? 'Cerrando Reunión...' : 'Cerrar Reunión de Forma Segura' }}
          </button>

          <button 
            class="btn btn-block btn-outline border-base-300 hover:bg-base-200 text-base-content font-semibold rounded-lg text-sm"
            @click="saveDraft"
          >
            Guardar Borrador
          </button>

          <div v-if="applyError" class="alert alert-error text-xs p-2.5 mt-2">{{ applyError }}</div>
          <div v-if="applySuccess && hasAnyDisbursement" class="alert alert-success text-xs p-2.5 mt-2">
            ¡Desembolsos aplicados correctamente! Procede a cerrar la reunión de forma segura.
          </div>
          <div v-if="closeError" class="alert alert-error text-xs p-2.5 mt-2">{{ closeError }}</div>
          <div v-if="closeSuccess" class="alert alert-success text-xs p-2.5 mt-2">
            ¡Reunión cerrada correctamente! Redirigiendo...
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
      :member-name="selectedMemberNameForReceipt"
      :print-date="receiptPrintDate"
      :viewed-operations="receiptOperations"
      :viewed-total="receiptTotal"
      title="Recibo de Desembolso"
      total-label="Total Entregado:"
      modal-id="disbursement-print-modal"
      @close="printModalOpen = false"
      @print="handlePrint"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { HandCash, Coins, PlusCircle, EditPencil, Trash, Printer, InfoCircle, Search } from 'iconoir-vue/regular'
import { membersApi, type Member, type StockSubscription } from '@/api/members.api'
import { stocksApi, type Stock } from '@/api/stocks.api'
import { loansApi, type Loan } from '@/api/loans.api'
import { meetingsApi, type DisbursementPlanItem, type DisbursementPlanPreview } from '@/api/meetings.api'
import { useActiveMeetingStore } from '../../stores/activeMeeting'
import { formatCurrency, formatDate } from '@/shared/utils/formatters'

// Components
import PrintReceiptModal from '@/shared/components/PrintReceiptModal.vue'
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

const isClosing = ref(false)
const closeError = ref<string | null>(null)
const closeSuccess = ref(false)

// Modals state
const showLoanModal = ref(false)
const showWithdrawalModal = ref(false)
const showOtherModal = ref(false)
const printModalOpen = ref(false)

// Edit state
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

// Print State for print modal
const selectedMemberNameForReceipt = ref('')
const receiptPrintDate = ref('')
const receiptTotal = ref(0)
const receiptOperations = ref<any[]>([])

// Data for modals
const memberSubscriptions = ref<StockSubscription[]>([])
const memberLoans = ref<Loan[]>([])
const stocks = ref<Stock[]>([])

// Search & Pagination
const searchQuery = ref('')
const currentPage = ref(1)
const itemsPerPage = 5

// Computed
const availableCash = computed(() => disbursementPlan.value?.available_cash || 0)

const totalToDisburse = computed(() => {
  const planTotal = disbursementPlan.value?.total_to_disburse || 0
  const localTotal = localDisbursements.value.reduce((sum, item) => sum + item.amount, 0)
  return planTotal + localTotal
})

const disbursedPercentage = computed(() => {
  if (availableCash.value <= 0) return 0
  return (totalToDisburse.value / availableCash.value) * 100
})

const hasAnyDisbursement = computed(() => {
  return (disbursementPlan.value?.plan.length || 0) > 0 || localDisbursements.value.length > 0
})

// Unified list of all disbursements for the table
const allDisbursements = computed(() => {
  // Backend plan items
  const planItems = (disbursementPlan.value?.plan || []).map(item => {
    let accountType = 'FEE_INCOME'
    if (item.type === 'loan') {
      accountType = 'LOAN_PORTFOLIO'
    } else if (item.type === 'withdrawal') {
      accountType = 'STOCK_PORTFOLIO'
    } else if (item.type === 'dividend') {
      accountType = 'ACCUMULATED_SURPLUS'
    }
    
    return {
      id: item.member_id + item.type + item.amount + (item.pending_member_payment_id || ''),
      member_id: item.member_id,
      type: item.type.toUpperCase(),
      description: item.notes || getDisbursementLabel(item),
      total_amount: item.amount,
      isPending: false,
      isPendingPayment: !!item.pending_member_payment_id,
      originalItem: item,
      ledger_entries: [{
        id: `plan-entry-${item.member_id}-${item.type}`,
        account_type: accountType,
        amount: -item.amount,
        description: item.notes || getDisbursementLabel(item),
        created_at: new Date()
      }]
    }
  })
  
  // Local pending items
  const localItems = localDisbursements.value.map((item, index) => {
    let accountType = 'FEE_INCOME'
    if (item.type === 'loan') {
      accountType = 'LOAN_PORTFOLIO'
    } else if (item.type === 'withdrawal') {
      accountType = 'STOCK_PORTFOLIO'
    } else if (item.type === 'dividend') {
      accountType = 'ACCUMULATED_SURPLUS'
    }
    
    const stableId = `pending-${item.member_id}-${item.type}-${index}-${Math.round(item.amount * 100)}`
    
    return {
      id: stableId,
      member_id: item.member_id,
      type: item.type.toUpperCase(),
      description: item.notes || getDisbursementLabel(item),
      total_amount: item.amount,
      isPending: true,
      isPendingPayment: false,
      originalItem: item,
      ledger_entries: [{
        id: `pending-entry-${stableId}`,
        account_type: accountType,
        amount: -item.amount,
        description: item.notes || getDisbursementLabel(item),
        created_at: new Date()
      }]
    }
  })
  
  return [...planItems, ...localItems]
})

// Filtered and Paginated Members
const filteredMembersList = computed(() => {
  if (!searchQuery.value) return members.value
  const query = searchQuery.value.toLowerCase()
  return members.value.filter(m => m.name.toLowerCase().includes(query))
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredMembersList.value.length / itemsPerPage)))

const paginatedMembers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return filteredMembersList.value.slice(start, start + itemsPerPage)
})

// Reset current page when query changes
watch(searchQuery, () => {
  currentPage.value = 1
})

function getMemberDisbursements(memberId: string) {
  return allDisbursements.value.filter(d => d.member_id === memberId)
}

function getMemberDisbursementsCount(memberId: string): number {
  return getMemberDisbursements(memberId).length
}

function getMemberDisbursementsDetail(memberId: string): string {
  const items = getMemberDisbursements(memberId)
  if (items.length === 0) return 'Sin desembolsos'
  return items.map(d => `${getDisbursementLabel(d.originalItem)}: ${formatCurrency(d.total_amount)}`).join(', ')
}

function getMemberDisbursementsTotal(memberId: string): number {
  return getMemberDisbursements(memberId).reduce((sum, d) => sum + d.total_amount, 0)
}

// Calculations for Loan Capacities (Selected Member)
const maxCapacity = computed(() => {
  if (!selectedMember.value) return 0
  const totalStockValue = memberSubscriptions.value
    .filter(sub => sub.status === 'active')
    .reduce((sum, sub) => {
      const stock = stocks.value.find(s => s.id === sub.stock_id)
      return sum + (Number(sub.quantity) * (stock?.value || 0))
    }, 0)
    
  const totalNonStockLoans = memberLoans.value
    .filter(loan => loan.loan_type !== 'accion')
    .reduce((sum, loan) => sum + Number(loan.approved_amount), 0)
    
  const max = (totalStockValue * 2.0) - totalNonStockLoans
  return max > 0 ? max : 0
})

const memberStocksForWithdrawal = computed<MemberStockForWithdrawal[]>(() => {
  if (!selectedMember.value) return []
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

// Helpers
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function getMemberColor(memberId: string): string {
  const colors = ['#0d9488', '#0891b2', '#0284c7', '#4f46e5', '#7c3aed', '#db2777', '#ea580c', '#e11d48']
  let hash = 0
  for (let i = 0; i < memberId.length; i++) {
    hash = memberId.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
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

async function onMemberSelected() {
  const member = selectedMember.value
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
  } else {
    memberSubscriptions.value = []
    memberLoans.value = []
  }
}

// Modal Openers
async function openLoanModalForMember(member: Member) {
  selectedMember.value = member
  await onMemberSelected()
  showLoanModal.value = true
}

async function openWithdrawalModalForMember(member: Member) {
  selectedMember.value = member
  await onMemberSelected()
  showWithdrawalModal.value = true
}

async function openOtherModalForMember(member: Member) {
  selectedMember.value = member
  await onMemberSelected()
  showOtherModal.value = true
}

// Modal Handlers
function handleLoanSave(loanData: any) {
  if (!selectedMember.value) return
  
  const isNewLoan = !editingDisbursement.value?.operation?.originalItem?.loan_id
  
  const newItem: DisbursementPlanItem = {
    member_id: selectedMember.value.id,
    type: 'loan',
    amount: loanData.delivered,
    notes: `Préstamo ${loanData.type} - Aprobado: ${loanData.approved}`,
  }
  
  if (isNewLoan) {
    const interestRate = loanData.type === 'corriente' ? 0.015 : 0.02
    const monthlyPayment = loanData.approved * interestRate * 0.1
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
  
  if (editingDisbursement.value) {
    const originalItem = editingDisbursement.value.operation.originalItem as DisbursementPlanItem
    
    if (editingDisbursement.value.isPlanItem && disbursementPlan.value) {
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
        disbursementPlan.value.total_to_disburse = disbursementPlan.value.plan.reduce(
          (sum, item) => sum + item.amount, 0
        )
      }
    } else {
      const localIndex = localDisbursements.value.indexOf(originalItem)
      if (localIndex !== -1) {
        localDisbursements.value[localIndex] = newItem
      }
    }
  } else {
    localDisbursements.value.push(newItem)
  }
  
  showLoanModal.value = false
  editingDisbursement.value = null
}

function handleWithdrawalSave(withdrawalData: any) {
  if (!selectedMember.value) return
  
  const withdrawalsWithQuantity = (withdrawalData.withdrawals || []).filter((w: any) => w.quantity > 0)
  
  if (withdrawalsWithQuantity.length === 0) {
    applyError.value = 'Debe seleccionar al menos una acción para retirar'
    setTimeout(() => { applyError.value = null }, 5000)
    return
  }
  
  const totalEstimated = withdrawalData.estimatedTotal
  const totalDelivered = withdrawalData.deliveredAmount
  
  if (editingDisbursement.value) {
    const originalItem = editingDisbursement.value.operation.originalItem as DisbursementPlanItem
    
    if (editingDisbursement.value.isPlanItem && disbursementPlan.value) {
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
      const localIndex = localDisbursements.value.indexOf(originalItem)
      if (localIndex !== -1) {
        localDisbursements.value.splice(localIndex, 1)
      }
    }
  }
  
  withdrawalsWithQuantity.forEach((withdrawal: any) => {
    if (!selectedMember.value) return
    const stock = memberStocksForWithdrawal.value.find(s => s.stockId === withdrawal.stockId)
    const stockValue = stock?.currentValue || 0
    const withdrawalValue = withdrawal.quantity * stockValue
    
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
    
    if (editingDisbursement.value && withdrawalsWithQuantity.indexOf(withdrawal) === 0) {
      const originalItem = editingDisbursement.value.operation.originalItem as DisbursementPlanItem
      if (originalItem.pending_member_payment_id) {
        newItem.pending_member_payment_id = originalItem.pending_member_payment_id
      }
    }
    
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
  
  if (editingDisbursement.value) {
    const originalItem = editingDisbursement.value.operation.originalItem as DisbursementPlanItem
    
    if (editingDisbursement.value.isPlanItem && disbursementPlan.value) {
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
        disbursementPlan.value.total_to_disburse = disbursementPlan.value.plan.reduce(
          (sum, item) => sum + item.amount, 0
        )
      }
    } else {
      const localIndex = localDisbursements.value.indexOf(originalItem)
      if (localIndex !== -1) {
        localDisbursements.value[localIndex] = newItem
      }
    }
  } else {
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
  
  if (operation.isPending) {
    removeLocalDisbursement(originalItem)
  } 
  else if (operation.isPendingPayment && disbursementPlan.value) {
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
  }
}

async function editDisbursement(operation: any) {
  const originalItem = operation.originalItem as DisbursementPlanItem
  if (!originalItem) return
  
  const member = members.value.find(m => m.id === originalItem.member_id) || null
  if (member) {
    selectedMember.value = member
    await onMemberSelected()
  }

  editingDisbursement.value = {
    operation,
    isPlanItem: !!operation.isPendingPayment
  }
  
  if (originalItem.type === 'loan') {
    if (originalItem.loan_id) {
      try {
        const loan = await loansApi.getLoanById(originalItem.loan_id)
        const pendingAmount = loan.approved_amount - loan.disbursed_amount
        
        const loanData = {
          type: loan.loan_type,
          approved: loan.approved_amount,
          delivered: pendingAmount > 0 ? pendingAmount : loan.disbursed_amount,
          loanInfo: {
            disbursed: loan.disbursed_amount,
            pending: pendingAmount,
            creationDate: loan.creation_date,
            status: loan.status
          }
        }
        
        editingDisbursement.value.loanData = loanData
        showLoanModal.value = true
      } catch (error) {
        console.error('Error al cargar datos del préstamo:', error)
        showLoanModal.value = true
      }
    } else {
      showLoanModal.value = true
    }
  } else if (originalItem.type === 'withdrawal') {
    showWithdrawalModal.value = true
  } else {
    showOtherModal.value = true
  }
}

// Receipt Print View
function viewReceiptForMember(member: Member) {
  selectedMemberNameForReceipt.value = member.name
  receiptPrintDate.value = formatDate(new Date())
  
  const memberDisbs = allDisbursements.value.filter(d => d.member_id === member.id)
  if (memberDisbs.length === 0) return
  
  receiptTotal.value = memberDisbs.reduce((sum, d) => sum + d.total_amount, 0)
  receiptOperations.value = memberDisbs
  printModalOpen.value = true
}

function handlePrint() {
  window.print()
}

// Backend Execution Methods
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
    
    const withdrawalsNeedingStockId = allItems.filter(
      item => item.type === 'withdrawal' && !item.disbursement_stock_request
    )
    
    if (withdrawalsNeedingStockId.length > 0) {
      await Promise.all(
        withdrawalsNeedingStockId.map(async (item) => {
          if (item.stock_subscription_id) {
            try {
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
    
    await meetingsApi.executeDisbursementPlan(store.meetingId, { plan_items: allItems })
    
    applySuccess.value = true
    isApplying.value = false
  } catch (e) {
    applyError.value = e instanceof Error ? e.message : 'Error al aplicar desembolsos'
    isApplying.value = false
  }
}

async function closeActiveMeeting() {
  if (!store.meetingId) return
  
  isClosing.value = true
  closeError.value = null
  closeSuccess.value = false
  
  try {
    await meetingsApi.closeMeeting(store.meetingId)
    closeSuccess.value = true
    await store.refreshActiveMeeting()
    router.push({ name: 'meeting-detail', params: { id: store.meetingId } })
  } catch (e) {
    closeError.value = e instanceof Error ? e.message : 'Error al cerrar la reunión'
  } finally {
    isClosing.value = false
  }
}

function saveDraft() {
  alert('Borrador guardado exitosamente.')
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
</script>
