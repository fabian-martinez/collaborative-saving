<template>
  <div>
    <h2 class="text-xl font-bold mb-4">Paso 5: Desembolsos y Cierre</h2>

    <div v-if="isLoading" class="flex justify-center items-center my-8">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div v-if="error" class="alert alert-error my-4">
      <span>{{ error }}</span>
    </div>

    <div v-if="!isLoading && !error" class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Lista de Socios -->
      <div class="md:col-span-1">
        <h3 class="text-lg font-semibold mb-2">Socios</h3>
        <ul class="menu bg-base-200 w-full rounded-box">
          <li v-for="member in members" :key="member.id" @click="selectMember(member)">
            <a :class="[ 'transition', selectedMember && selectedMember.id === member.id ? 'bg-primary/20 font-bold text-primary' : 'hover:bg-base-300/40' ]">
              {{ member.name }}
              <span v-if="hasAssignedLoan(member.id)" class="badge badge-info badge-sm ml-2">Assigned</span>
              <span v-if="hasPendingTransactions(member.id)" class="badge badge-warning badge-sm ml-2">Pending</span>
              <span v-if="hasDividends(member.id)" class="badge badge-success badge-sm ml-2">Dividends</span>
            </a>
          </li>
        </ul>
        <div class="mt-4 p-4 bg-base-200 rounded-box space-y-4">
          <div>
            <div class="text-center">
              <div class="text-sm font-light text-base-content/70 uppercase">Efectivo disponible</div>
              <div class="text-3xl font-bold text-success"><CopyOnDblClickNumber :value="efectivoDisponibleNeto" /></div>
            </div>
          </div>
          <div class="text-center">
            <div class="text-sm font-light text-base-content/70 uppercase">Total prestado</div>
            <div class="text-2xl font-bold text-primary"><CopyOnDblClickNumber :value="totalPrestado" /></div>
          </div>
        </div>
        
        <!-- Resumen de entregas -->
        <div class="mt-4 p-4 bg-base-200 rounded-box" v-if="deliverySummary.length > 0">
          <h4 class="font-semibold mb-2 text-center">Resumen de Entregas</h4>
          <div class="overflow-x-auto">
            <table class="table table-compact w-full">
              <thead>
                <tr>
                  <th class="text-xs">Socio</th>
                  <th class="text-xs text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="summary in deliverySummary" :key="summary.id">
                  <td class="text-sm">{{ summary.name }}</td>
                  <td class="text-sm text-right font-bold text-primary"><CopyOnDblClickNumber :value="summary.total" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <!-- Recibo de préstamos/desembolsos -->
      <div class="md:col-span-2">
        <div v-if="!selectedMember" class="flex items-center justify-center h-full text-gray-500">
          <p class="text-center">Seleccione un socio para registrar un préstamo.</p>
        </div>
        <div v-else class="bg-base-100 p-8 rounded-2xl shadow-lg font-sans">
          <h3 class="text-xl font-bold mb-4">Recibo de Desembolsos para {{ selectedMember.name }}</h3>
          <div v-if="localLoans.length > 0
            || localWithdrawals.length > 0
            || pendingTransactions.length > 0
            || selectedMemberDividends.length > 0
            || localOtherDisbursements.length > 0"
          >
            <div class="space-y-4">
              <!-- Transacciones pendientes -->
              <div v-for="(pending, idx) in pendingTransactions" :key="`pending-${idx}`" class="py-4 rounded opacity-95">
                <div class="flex items-baseline">
                  <div class="flex-shrink-0">
                    <p class="font-semibold text-lg text-yellow-800">{{ pending.description || 'Sin descripción' }} (Pendiente)</p>
                    <p class="text-sm text-yellow-700">Monto original: <CopyOnDblClickNumber :value="pending.originalAmount || 0" /></p>
                  </div>
                  <div class="flex-grow border-b-2 border-dotted border-yellow-300 mx-4"></div>
                  <div class="flex-shrink-0 flex items-center gap-2">
                    <button class="btn btn-ghost btn-xs text-yellow-800" @click="editPendingTransaction(pending, idx)">Editar</button>
                    <button class="btn btn-ghost btn-xs text-error" @click="postponePending(idx)">Aplazar</button>
                    <p class="w-36 text-right font-mono text-2xl whitespace-nowrap text-yellow-800"><CopyOnDblClickNumber :value="pending.amount ?? 0" /></p>
                  </div>
                </div>
                <div class="pl-4 mt-2 space-y-1 text-md text-yellow-700 border-l-2 border-yellow-300 flex gap-4 items-center">
                  <span><b>Tipo:</b> {{ (pending.type === 'loan') ? 'Préstamo' : 'Retiro de Acciones' }}</span>
                  <span><b>Estado:</b> <span class="text-yellow-800">Pendiente de entrega</span></span>
                </div>
              </div>
              
              <!-- Nuevos desembolsos (localLoans/localWithdrawals): sin fondo, verde en texto/acento -->
              <div v-for="(loan, idx) in localLoans" :key="idx" class="py-4 rounded">
                <div class="flex items-baseline">
                  <div class="flex-shrink-0">
                    <p class="font-semibold text-lg text-green-800">Prestamo tipo:{{ loan.type }}</p>
                    <p class="text-sm text-green-700">Aprobado: <CopyOnDblClickNumber :value="loan.approved || 0" /></p>
                  </div>
                  <div class="flex-grow border-b-2 border-dotted border-green-300 mx-4"></div>
                  <div class="flex-shrink-0 flex items-center gap-2">
                    <button class="btn btn-ghost btn-xs text-green-800" @click="editLoan(idx)">Editar</button>
                    <button class="btn btn-ghost btn-xs text-error" @click="removeLoan(idx)">Anular</button>
                    <p class="w-36 text-right font-mono text-2xl whitespace-nowrap text-green-800"><CopyOnDblClickNumber :value="loan.delivered ?? 0" /></p>
                  </div>
                </div>
                <div class="pl-4 mt-2 space-y-1 text-md text-green-700 border-l-2 border-green-300 flex gap-4 items-center">
                  <span><b>Tasa de interés:</b> <span>{{ loan.type === 'corriente' ? '1.5%' : '2%' }}</span></span>
                  <span><b>Capacidad máxima:</b> <span v-if="typeof maxCapacity === 'number'">$
                    <CopyOnDblClickNumber :value="maxCapacity" />
                  </span><span v-else>N/D</span></span>
                </div>
              </div>
              <!-- Retiros de acciones -->
              <div v-for="(withdrawal, idx) in localWithdrawals" :key="`withdrawal-${idx}`" class="py-4 rounded">
                <div class="flex items-baseline">
                  <div class="flex-shrink-0">
                    <p class="font-semibold text-lg text-green-800">Retiro de Acciones {{ withdrawal.stockType }}</p>
                    <p class="text-sm text-green-700">Cantidad: {{ withdrawal.quantity }} | Valor estimado: <CopyOnDblClickNumber :value="withdrawal.estimatedValue || 0" /></p>
                  </div>
                  <div class="flex-grow border-b-2 border-dotted border-green-300 mx-4"></div>
                  <div class="flex-shrink-0 flex items-center gap-2">
                    <button class="btn btn-ghost btn-xs text-error" @click="removeWithdrawal(idx)">Anular</button>
                    <p class="w-36 text-right font-mono text-2xl whitespace-nowrap text-green-800"><CopyOnDblClickNumber :value="withdrawal.deliveredAmount ?? 0" /></p>
                  </div>
                </div>
                <div class="pl-4 mt-2 space-y-1 text-md text-green-700 border-l-2 border-green-300 flex gap-4 items-center">
                  <span><b>Valor por acción:</b> <span><CopyOnDblClickNumber :value="withdrawal.quantity ? (withdrawal.estimatedValue || 0) / withdrawal.quantity : 0" /></span></span>
                  <span><b>Pendiente por entregar:</b> <span class="text-green-800"><CopyOnDblClickNumber :value="withdrawal.pending ?? 0" /></span></span>
                </div>
              </div>
              <!-- Dividendos integrados con color diferenciado solo en texto/acento -->
              <div v-for="(dividend, idx) in selectedMemberDividends" :key="'dividend-' + dividend.id" class="py-4 rounded opacity-95">
                <div class="flex items-baseline">
                  <div class="flex-shrink-0">
                    <p class="font-semibold text-lg text-blue-800">Dividendo (Pendiente)</p>
                    <p class="text-sm text-blue-700">Acción: {{ dividend.stockType }}</p>
                  </div>
                  <div class="flex-grow border-b-2 border-dotted border-blue-300 mx-4"></div>
                  <div class="flex-shrink-0 flex items-center gap-2">
                    <button class="btn btn-ghost btn-xs text-error" @click="postponeDividend(idx)">Aplazar</button>
                    <p class="w-36 text-right font-mono text-2xl whitespace-nowrap text-blue-800"><CopyOnDblClickNumber :value="dividend.amount ?? 0" /></p>
                  </div>
                </div>
                <div class="pl-4 mt-2 space-y-1 text-md text-blue-700 border-l-2 border-blue-300 flex gap-4 items-center">
                  <span><b>Tipo:</b> Dividendo</span>
                  <span><b>Estado:</b> <span class="text-blue-800">Pendiente de entrega</span></span>
                </div>
              </div>
              <!-- Otros desembolsos -->
              <div v-for="(other, idx) in localOtherDisbursements" :key="'other-' + idx" class="py-4 rounded opacity-95">
                <div class="flex items-baseline">
                  <div class="flex-shrink-0">
                    <p class="font-semibold text-lg text-purple-800">Otro Desembolso</p>
                    <p class="text-sm text-purple-700">{{ other.description }}</p>
                  </div>
                  <div class="flex-grow border-b-2 border-dotted border-purple-300 mx-4"></div>
                  <div class="flex-shrink-0 flex items-center gap-2">
                    <button class="btn btn-ghost btn-xs text-error" @click="removeOtherDisbursement(idx)">Anular</button>
                    <button class="btn btn-ghost btn-xs text-purple-800" @click="editOtherDisbursement(idx)">Editar</button>
                    <p class="w-36 text-right font-mono text-2xl whitespace-nowrap text-purple-800"><CopyOnDblClickNumber :value="other.amount ?? 0" /></p>
                  </div>
                </div>
                <div class="pl-4 mt-2 space-y-1 text-md text-purple-700 border-l-2 border-purple-300 flex gap-4 items-center">
                  <span><b>Tipo:</b> Otro</span>
                </div>
              </div>
              <div class="flex items-baseline text-2xl font-bold mt-6">
                <span class="flex-shrink-0">Total a entregar:</span>
                <div class="flex-grow border-b-2 border-dotted border-base-300/70 mx-4"></div>
                <span class="flex-shrink-0 text-primary font-mono">
                  <CopyOnDblClickNumber 
                    :value="
                      localLoans.reduce((sum: number, l: any) => sum + l.delivered, 0)
                      + localWithdrawals.reduce((sum: number, w: any) => sum + w.deliveredAmount, 0)
                      + pendingTransactions.reduce((sum: number, p: any) => sum + p.amount, 0)
                      + selectedMemberDividends.reduce((sum: number, d: any) => sum + d.amount, 0)
                      + localOtherDisbursements.reduce((sum: number, o: any) => sum + o.amount, 0)" />
                </span>
              </div>
            </div>
          </div>
          <div v-else class="mb-4 text-base-content/60 italic">No hay préstamos, retiros ni transacciones pendientes para este socio.</div>
          <div v-if="localWithdrawals.length > 0 || pendingTransactions.length > 0" class="space-y-4">
            <!-- Solo retiros de acciones -->
            <div v-for="(withdrawal, idx) in localWithdrawals" :key="`withdrawal-${idx}`" class="py-4">
              <div class="flex items-baseline">
                <div class="flex-shrink-0">
                  <p class="font-semibold text-lg">Retiro de Acciones {{ withdrawal.stockType }}</p>
                  <p class="text-sm text-base-content/70">Cantidad: {{ withdrawal.quantity }} | Valor estimado: <CopyOnDblClickNumber :value="withdrawal.estimatedValue || 0" /></p>
                </div>
                <div class="flex-grow border-b-2 border-dotted border-base-300/70 mx-4"></div>
                <div class="flex-shrink-0 flex items-center gap-2">
                  <button class="btn btn-ghost btn-xs text-error" @click="removeWithdrawal(idx)">Anular</button>
                  <p class="w-36 text-right font-mono text-2xl whitespace-nowrap text-secondary"><CopyOnDblClickNumber :value="withdrawal.deliveredAmount ?? 0" /></p>
                </div>
              </div>
              <div class="pl-4 mt-2 space-y-1 text-md text-base-content/80 border-l-2 border-base-300/80">
                <div class="flex justify-between"><span>Valor por acción:</span> <span><CopyOnDblClickNumber :value="withdrawal.quantity ? (withdrawal.estimatedValue || 0) / withdrawal.quantity : 0" /></span></div>
                <div class="flex justify-between"><span>Pendiente por entregar:</span> <span class="text-warning"><CopyOnDblClickNumber :value="withdrawal.pending ?? 0" /></span></div>
              </div>
            </div>
            <!-- Transacciones pendientes (solo retiros) -->
            <div v-for="(pending, idx) in pendingTransactions" :key="`pending-${idx}`" class="py-4 opacity-75">
              <div class="flex items-baseline">
                <div class="flex-shrink-0">
                  <p class="font-semibold text-lg text-warning">{{ pending.description || 'Sin descripción' }} (Pendiente)</p>
                  <p class="text-sm text-base-content/70">Monto original: <CopyOnDblClickNumber :value="pending.originalAmount || 0" /></p>
                </div>
                <div class="flex-grow border-b-2 border-dotted border-warning/30 mx-4"></div>
                <div class="flex-shrink-0 flex items-center gap-2">
                  <span class="badge badge-warning badge-sm">API</span>
                  <p class="w-36 text-right font-mono text-2xl whitespace-nowrap text-warning"><CopyOnDblClickNumber :value="pending.amount ?? 0" /></p>
                </div>
              </div>
              <div class="pl-4 mt-2 space-y-1 text-md text-base-content/60 border-l-2 border-warning/30">
                <div class="flex justify-between"><span>Tipo:</span> <span>{{ (pending.type === 'loan') ? 'Préstamo' : 'Retiro de Acciones' }}</span></div>
                <div class="flex justify-between"><span>Estado:</span> <span class="text-warning">Pendiente de entrega</span></div>
              </div>
            </div>
            <div class="flex items-baseline text-2xl font-bold mt-6">
              <span class="flex-shrink-0">Total a entregar:</span>
              <div class="flex-grow border-b-2 border-dotted border-base-300/70 mx-4"></div>
              <span class="flex-shrink-0 text-primary font-mono">
                <CopyOnDblClickNumber :value="localWithdrawals.reduce(
                  (sum: number, w: any) => sum + w.deliveredAmount, 0) 
                  + pendingTransactions.reduce(
                    (sum: number, p: any) => sum + p.amount, 0
                    ) + localOtherDisbursements.reduce((sum: number, o: any) => sum + o.amount, 0)" />
              </span>
            </div>
          </div>
          <div class="flex gap-4 mt-6">
            <button class="btn btn-primary" @click="openModal">Solicitar/Editar Préstamo</button>
            <button class="btn btn-secondary" @click="openStockWithdrawalModal">Solicitar Retiro de Acciones</button>
            <button class="btn btn-accent" @click="openOtherDisbursementModal">Registrar Otro Desembolso</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Préstamo -->
    <LoanFormModal
      v-if="selectedMember"
      :show="showModal"
      :member="selectedMember"
      :maxCapacity="maxCapacity"
      :prevLoan="prevLoanDataComputed"
      @save="handleSaveLoan"
      @cancel="closeModal"
    />
    <StockWithdrawalModal
      v-if="selectedMember"
      :show="showStockWithdrawalModal"
      :member="selectedMember"
      :memberStocks="memberStocksForWithdrawal"
      @save="handleSaveStockWithdrawal"
      @cancel="closeStockWithdrawalModal"
    />
    <EditFineModal
      :visible="showOtherDisbursementModal"
      :initialData="editingOtherDisbursementIdx !== null ? localOtherDisbursements[editingOtherDisbursementIdx] : null"
      @close="closeOtherDisbursementModal"
      @save="handleSaveOtherDisbursement"
    />
    <div v-if="hayDesembolsosPendientes()" class="mt-8 flex flex-col items-center">
      <button class="btn btn-primary btn-lg" :disabled="isApplying" @click="aplicarDesembolsos">
        <span v-if="isApplying" class="loading loading-spinner"></span>
        Aplicar Desembolsos
      </button>
      <div v-if="applyError" class="alert alert-error mt-4">{{ applyError }}</div>
      <div v-if="applySuccess" class="alert alert-success mt-4">¡Desembolsos aplicados correctamente!</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useActiveMeetingStore } from '@/features/meetings/stores/activeMeeting'
import disbursementsService from '../services/disbursementsService'
import LoanFormModal from './LoanFormModal.vue'
import StockWithdrawalModal from './StockWithdrawalModal.vue'
import { stocksService, type StockSubscription } from '@/features/stocks/services/stocksService'
import { loansService } from '@/features/loans/services/loansService'
import { api } from '@/services/api'
import type { Member } from '@/features/members/types'
import { useRouter } from 'vue-router'
import { meetingsService } from '@/features/meetings/services/meetings'
import EditFineModal from './EditFineModal.vue'
import type { DisbursementPlan } from '../types'
import CopyOnDblClickNumber from '@/shared/components/CopyOnDblClickNumber.vue'

// Tipos para transacciones pendientes y dividendos
interface PendingTransaction {
  id: string
  type: 'loan' | 'withdrawal'
  description: string
  amount: number
  originalAmount: number
  memberId: string
  loanId?: string
}

interface BackendPlanItem {
  memberId: string
  type: string
  amount: number
  status?: string
  notes?: string
  loanId?: string
  stockSubscriptionId?: string
  pendingMemberPaymentId?: string
  disbursementStockRequest?: {
    stockId: string
    stockWithdrawalQuantity?: number
  }
  newLoanRequest?: {
    memberId: string
    amount: number
    loanType: string
    approvedAmount: number
    monthlyPaymentAmount: number
    interestRate: number
    notes: string
  }
}

interface Dividend {
  id: string
  type: 'dividend'
  stockType: string
  amount: number
  memberId: string
}

interface LoanData {
  type: string
  approved: number
  delivered: number
  interestRate?: number
  loanId?: string
}

interface Loan {
  loan_type: string
  approved_amount: number
}

const activeMeetingStore = useActiveMeetingStore()
const meetingId = computed(() => activeMeetingStore.meetingId)
// Cargar miembros
const members = computed(() => activeMeetingStore.members)
const isLoading = ref(true)
const error = ref('')
const efectivoDisponible = ref(0)
const pendingTransactionsByMember = ref<Record<string, PendingTransaction[]>>({})
const dividendsByMember = ref<Record<string, Dividend[]>>({})

const selectedMember = ref<Member | null>(null)
const showModal = ref(false)
const editingLoanIdx = ref<number|null>(null)
const showStockWithdrawalModal = ref(false)
const editingPendingIdx = ref<number | null>(null)
const editingPendingType = ref<'loan' | 'withdrawal' | 'dividend' | 'other' | null>(null)
// Estado local para préstamos y retiros NO confirmados
const localLoansByMember = ref<Record<string, Array<{ type: string; approved: number; delivered: number }>>>({})
const localWithdrawalsByMember = ref<Record<string, Array<{ stockType: string; quantity: number; estimatedValue: number; deliveredAmount: number; pending: number; stockId?: string; withdrawals?: Array<{ stockId: string; quantity: number }> }>>>({})

const memberStockSubscriptions = ref<StockSubscription[]>([])
const memberLoans = ref<Loan[]>([])

watch(selectedMember, async (newMember) => {
  if (newMember && newMember.id) {
    // Cargar acciones y préstamos activos del socio
    memberStockSubscriptions.value = await stocksService.getStockSubscriptionsByMember(newMember.id)
    memberLoans.value = await loansService.getActiveLoansByMember(newMember.id)
  } else {
    memberStockSubscriptions.value = []
    memberLoans.value = []
  }
}, { immediate: true })

const maxCapacity = computed(() => {
  // Suma el valor de todas las acciones activas del socio
  const totalStockValue = memberStockSubscriptions.value
    .filter(sub => sub.stock && sub.status === 'active')
    .reduce((sum, sub) => sum + (Number(sub.quantity) * Number(sub.stock!.value)), 0)
  // Suma de todos los préstamos activos que NO sean de tipo 'accion'
  const totalNonStockLoans = memberLoans.value
    .filter(loan => loan.loan_type !== 'accion')
    .reduce((sum, loan) => sum + Number(loan.approved_amount), 0)
  // El máximo disponible es la diferencia
  const max = (totalStockValue * 2.0) - totalNonStockLoans
  return max > 0 ? max : 0
})

// Convertir suscripciones de acciones al formato esperado por el modal de retiro
const memberStocksForWithdrawal = computed(() => {
  return memberStockSubscriptions.value
    .filter(sub => sub.stock && sub.status === 'active' && sub.quantity > 0)
    .map(sub => ({
      stockId: sub.stockId, // Usar el stockId (ID del tipo de acción), no sub.id (ID de la suscripción)
      stockType: sub.stock!.type || 'accion',
      quantity: Number(sub.quantity),
      currentValue: Number(sub.stock!.value)
    }))
})

const router = useRouter()

onMounted(async () => {
  if (!meetingId.value) {
    error.value = 'No hay reunión activa.'
    isLoading.value = false
    return
  }
  isLoading.value = true
  error.value = ''
  try {
    // Obtener el plan de desembolso y efectivo disponible
    const resp = await disbursementsService.getDisbursementPlanPreview(meetingId.value) as { plan?: BackendPlanItem[], availableCash?: number }
    const plan: BackendPlanItem[] = resp.plan || []
    console.log('Backend response plan:', plan)
    efectivoDisponible.value = resp.availableCash || 0
    // Agrupar pendientes y dividendos por miembro
    pendingTransactionsByMember.value = {}
    dividendsByMember.value = {}
    for (const item of plan) {
      // Agrupar dividendos
      if (item.type === 'dividend') {
        if (!dividendsByMember.value[item.memberId]) {
          dividendsByMember.value[item.memberId] = []
        }
        const dividend: Dividend = {
          id: item.pendingMemberPaymentId || '',
          type: 'dividend',
          stockType: 'accion', // Valor por defecto
          amount: item.amount || 0,
          memberId: item.memberId
        }
        dividendsByMember.value[item.memberId].push(dividend)
      } else {
        // Agrupar otros pendientes (retiros, préstamos, etc.)
        if (!pendingTransactionsByMember.value[item.memberId]) {
          pendingTransactionsByMember.value[item.memberId] = []
        }
        // Mapear los datos del endpoint a la estructura esperada
        const pendingTransaction: PendingTransaction = {
          id: item.pendingMemberPaymentId || '',
          type: item.type as 'loan' | 'withdrawal',
          description: item.notes || 'Sin descripción',
          amount: item.amount || 0,
          originalAmount: item.amount || 0,
          memberId: item.memberId,
          loanId: item.loanId // Agregar loanId para obtener más detalles
        }
        pendingTransactionsByMember.value[item.memberId].push(pendingTransaction)
      }
    }
  } catch (e: unknown) {
    const errorObj = e as { message?: string };
    error.value = errorObj.message || 'Error al cargar los datos de desembolsos.'
  } finally {
    isLoading.value = false
  }
})

const localLoans = computed({
  get() {
    return selectedMember.value ? (localLoansByMember.value[selectedMember.value.id] || []) : []
  },
  set(val) {
    if (selectedMember.value) {
      localLoansByMember.value[selectedMember.value.id] = val
    }
  }
})
const localWithdrawals = computed({
  get() {
    return selectedMember.value ? (localWithdrawalsByMember.value[selectedMember.value.id] || []) : []
  },
  set(val) {
    if (selectedMember.value) {
      localWithdrawalsByMember.value[selectedMember.value.id] = val
    }
  }
})
const pendingTransactions = computed({
  get() {
    return selectedMember.value ? (pendingTransactionsByMember.value[selectedMember.value.id] || []) : []
  },
  set(val) {
    if (selectedMember.value) {
      pendingTransactionsByMember.value[selectedMember.value.id] = val
    }
  }
})
const selectedMemberDividends = computed(() => {
  const member = selectedMember.value;
  if (!member || !member.id) return [];
  return dividendsByMember.value[member.id] || [];
});

const totalPrestado = computed(() => {
  // Suma todos los préstamos y retiros locales de todos los socios
  const totalLoans = Object.values(localLoansByMember.value).flat().reduce((sum, l) => sum + l.delivered, 0)
  const totalWithdrawals = Object.values(localWithdrawalsByMember.value).flat().reduce((sum, w) => sum + w.deliveredAmount, 0)
  return totalLoans + totalWithdrawals
})

const efectivoDisponibleNeto = computed(() => {
  const totalAEntregar = members.value.reduce((sum, member) => sum + getTotalToDeliver(member.id), 0)
  return (efectivoDisponible.value || 0) - totalAEntregar
})

function selectMember(member: Member) {
  selectedMember.value = member
  editingLoanIdx.value = null
}
function openModal() {
  showModal.value = true
  editingLoanIdx.value = null
}
function editLoan(idx: number) {
  editingLoanIdx.value = idx
  showModal.value = true
}
function closeModal() {
  showModal.value = false
  editingLoanIdx.value = null
  editingPendingIdx.value = null
  editingPendingType.value = null
}
function handleSaveLoan(loan: { type: string; approved: number; delivered: number }) {
  if (!selectedMember.value) return
  if (editingPendingIdx.value !== null && editingPendingType.value === 'loan') {
    const transactions = [...pendingTransactions.value]
    const originalTransaction = transactions[editingPendingIdx.value]
    transactions[editingPendingIdx.value] = {
      id: originalTransaction.id,
      memberId: selectedMember.value.id,
      type: 'loan',
      description: loan.type,
      amount: loan.delivered,
      originalAmount: loan.approved,
      loanId: originalTransaction.loanId // Preservar el loanId
    }
    pendingTransactions.value = transactions
    closeModal()
    return
  }
  const loans = [...localLoans.value]
  if (editingLoanIdx.value !== null) {
    loans[editingLoanIdx.value] = { ...loan }
  } else {
    loans.push({ ...loan })
  }
  localLoans.value = loans
  closeModal()
}
function removeLoan(idx: number) {
  const loans = [...localLoans.value]
  loans.splice(idx, 1)
  localLoans.value = loans
}
function removeWithdrawal(idx: number) {
  const withdrawals = [...localWithdrawals.value]
  withdrawals.splice(idx, 1)
  localWithdrawals.value = withdrawals
}
function hasAssignedLoan(memberId: string) {
  const hasLoans = localLoansByMember.value[memberId]?.length > 0
  const hasWithdrawals = localWithdrawalsByMember.value[memberId]?.length > 0
  const hasPending = pendingTransactionsByMember.value[memberId]?.length > 0
  return hasLoans || hasWithdrawals || hasPending
}
function hasPendingTransactions(memberId: string) {
  return pendingTransactionsByMember.value[memberId]?.length > 0
}
function hasDividends(memberId: string) {
  return dividendsByMember.value[memberId]?.length > 0
}
function openStockWithdrawalModal() {
  if (!selectedMember.value) {
    return
  }
  showStockWithdrawalModal.value = true
}
function closeStockWithdrawalModal() {
  showStockWithdrawalModal.value = false
  editingPendingIdx.value = null
  editingPendingType.value = null
}
function handleSaveStockWithdrawal(withdrawalData: { deliveredAmount: number; estimatedTotal: number; withdrawals: Array<{ stockId: string; stockType: string; quantity: number; currentValue: number }>; pending: number }) {
  if (!selectedMember.value) return
  if (editingPendingIdx.value !== null && editingPendingType.value === 'withdrawal') {
    const transactions = [...pendingTransactions.value]
    const originalTransaction = transactions[editingPendingIdx.value]
    transactions[editingPendingIdx.value] = {
      id: originalTransaction.id,
      memberId: selectedMember.value.id,
      type: 'withdrawal',
      description: 'Retiro de Acciones (Editado)',
      amount: withdrawalData.deliveredAmount,
      originalAmount: withdrawalData.estimatedTotal,
      loanId: originalTransaction.loanId // Preservar el loanId si existe
    }
    pendingTransactions.value = transactions
    closeStockWithdrawalModal()
    return
  }
  const withdrawals = [...localWithdrawals.value]
  // Guardar cada retiro individualmente con la estructura completa incluyendo stockId y el array withdrawals
  const formattedWithdrawals = withdrawalData.withdrawals
    .filter((w: { quantity: number }) => w.quantity > 0)
    .map((w: { stockId: string; stockType: string; quantity: number; currentValue: number }) => ({
      stockType: w.stockType || 'Desconocido',
      quantity: w.quantity,
      estimatedValue: w.quantity * (w.currentValue || 0),
      deliveredAmount: withdrawalData.deliveredAmount,
      pending: withdrawalData.pending,
      stockId: w.stockId, // Agregar stockId para el caso legacy
      withdrawals: [{
        stockId: w.stockId,
        quantity: w.quantity
      }] // Array con este retiro específico
    }))
  withdrawals.push(...formattedWithdrawals)
  localWithdrawals.value = withdrawals
  closeStockWithdrawalModal()
}
async function editPendingTransaction(pending: { type?: 'loan' | 'withdrawal'; description?: string; amount?: number; originalAmount?: number; loanId?: string }, idx: number) {
  if (!selectedMember.value) return
  editingPendingIdx.value = idx
  editingPendingType.value = pending.type || null
  
  if (pending.type === 'loan') {
    // Cargar datos del préstamo si está disponible
    if (pending.loanId) {
      isLoadingLoanData.value = true
      try {
        const loanDetails = await api.get(`/loans/${pending.loanId}`) as Record<string, unknown>
        
        prevLoanData.value = {
          type: (loanDetails.loan_type as string) === 'agil' ? 'agil' : 'corriente',
          approved: (loanDetails.approved_amount as number) || pending.originalAmount || 0,
          delivered: pending.amount || 0,
          interestRate: (loanDetails.interest_rate as number) || ((loanDetails.loan_type as string) === 'agil' ? 1.5 : 1.0),
          loanId: pending.loanId
        }
      } catch (error) {
        console.error('Error al obtener detalles del préstamo:', error)
        // Fallback a datos básicos
        prevLoanData.value = {
          type: (pending.description && pending.description.includes('Ágil')) ? 'agil' : 'corriente',
          approved: pending.originalAmount || 0,
          delivered: pending.amount || 0
        }
      } finally {
        isLoadingLoanData.value = false
      }
    } else {
      // Datos básicos sin loanId
      prevLoanData.value = {
        type: (pending.description && pending.description.includes('Ágil')) ? 'agil' : 'corriente',
        approved: pending.originalAmount || 0,
        delivered: pending.amount || 0
      }
    }
    showModal.value = true
  } else {
    showStockWithdrawalModal.value = true
  }
}
function getTotalToDeliver(memberId: string) {
  const loans = localLoansByMember.value[memberId]?.reduce((sum: number, l: { delivered: number }) => sum + (l.delivered || 0), 0) || 0
  const withdrawals = localWithdrawalsByMember.value[memberId]?.reduce((sum: number, w: { deliveredAmount: number }) => sum + (w.deliveredAmount || 0), 0) || 0
  const pending = pendingTransactionsByMember.value[memberId]?.reduce((sum: number, t: { amount: number }) => sum + (t.amount || 0), 0) || 0
  const dividends = dividendsByMember.value[memberId]?.reduce((sum: number, d: { amount: number }) => sum + (d.amount || 0), 0) || 0
  const others = localOtherDisbursementsByMember.value[memberId]?.reduce((sum: number, o: { amount: number }) => sum + (o.amount || 0), 0) || 0
  return loans + withdrawals + pending + dividends + others
}
const deliverySummary = computed(() => {
  return members.value
    .map(member => ({
      id: member.id,
      name: member.name,
      total: getTotalToDeliver(member.id)
    }))
    .filter(summary => summary.total > 0)
})
function postponePending(idx: number) {
  if (confirm('¿Seguro que deseas aplazar este pendiente para la siguiente reunión?')) {
    const arr = [...pendingTransactions.value]
    arr.splice(idx, 1)
    pendingTransactions.value = arr
  }
}
function postponeDividend(idx: number) {
  if (confirm('¿Seguro que deseas aplazar este dividendo para la siguiente reunión?')) {
    const arr = [...selectedMemberDividends.value]
    arr.splice(idx, 1)
    const toRemove = selectedMemberDividends.value[idx]
    if (toRemove && selectedMember.value?.id) {
      const memberId = selectedMember.value.id
      const memberDividends = dividendsByMember.value[memberId]
      if (memberDividends) {
        const i = memberDividends.findIndex((d: { id: string }) => d.id === toRemove.id)
        if (i !== -1) memberDividends.splice(i, 1)
      }
    }
  }
}

// Estado para feedback
const isApplying = ref(false)
const applyError = ref('')
const applySuccess = ref(false)

function hayDesembolsosPendientes() {
  return members.value.some(member => getTotalToDeliver(member.id) > 0)
}

async function aplicarDesembolsos() {
  if (!meetingId.value) return
  isApplying.value = true
  applyError.value = ''
  applySuccess.value = false
  try {
    // Construir el plan a enviar
    const plan: DisbursementPlan[] = []
    for (const member of members.value) {
      // Préstamos
      if (localLoansByMember.value[member.id]) {
        for (const loan of localLoansByMember.value[member.id]) {
          const loanAmount = Number(loan.delivered);
          // Validar que el monto sea válido
          if (loanAmount <= 0) {
            console.warn(`Skipping loan with invalid amount: ${loanAmount}`, loan);
            continue;
          }
          
          let interestRate = 0;
          if (loan.type === 'corriente') interestRate = 0.015;
          else if (loan.type === 'agil' || loan.type === 'prioritario') interestRate = 0.02;
          
          const planItem: DisbursementPlan = {
            memberId: member.id,
            type: 'loan',
            amount: loanAmount,
            status: 'pending',
            newLoanRequest: {
              memberId: member.id,
              amount: loanAmount,
              loanType: loan.type as 'corriente' | 'agil' | 'accion' | 'prioritario',
              approvedAmount: Number(loan.approved) || loanAmount,
              monthlyPaymentAmount: 0,
              interestRate: interestRate,
              notes: ''
            }
          }
          plan.push(planItem)
        }
      }
      // Retiros (enviar cada retiro individualmente)
      if (localWithdrawalsByMember.value[member.id]) {
        for (const withdrawal of localWithdrawalsByMember.value[member.id]) {
          const withdrawalAmount = Number(withdrawal.deliveredAmount);
          // Validar que el monto sea válido
          if (withdrawalAmount <= 0) {
            console.warn(`Skipping withdrawal with invalid amount: ${withdrawalAmount}`, withdrawal);
            continue;
          }
          
          const withdrawalWithDetails = withdrawal as { withdrawals?: Array<{ stockId: string; quantity: number }> };
          if (typeof withdrawalWithDetails.withdrawals !== 'undefined' && Array.isArray(withdrawalWithDetails.withdrawals)) {
            for (const w of withdrawalWithDetails.withdrawals) {
              if (!w.stockId) {
                console.warn(`Skipping withdrawal with missing stockId`, w);
                continue;
              }
              
              const planItem: DisbursementPlan = {
                memberId: member.id,
                type: 'withdrawal',
                amount: withdrawalAmount,
                status: 'pending',
                disbursementStockRequest: {
                  stockId: w.stockId,
                  stockWithdrawalQuantity: Math.round(w.quantity || 0)
                }
              }
              plan.push(planItem)
            }
          } else {
            // Caso legacy: solo un retiro
            // Validar que haya stockId disponible (requerido por v2)
            const legacyStockId = (withdrawal as { stockId?: string }).stockId;
            if (!legacyStockId) {
              console.warn(`Skipping legacy withdrawal with missing stockId`, withdrawal);
              continue;
            }
            
            const planItem: DisbursementPlan = {
              memberId: member.id,
              type: 'withdrawal',
              amount: withdrawalAmount,
              status: 'pending',
              disbursementStockRequest: {
                stockId: legacyStockId,
                stockWithdrawalQuantity: Math.round(withdrawal.quantity || 0)
              }
            }
            plan.push(planItem)
          }
        }
      }
      // Pendientes
      if (pendingTransactionsByMember.value[member.id]) {
        for (const pending of pendingTransactionsByMember.value[member.id]) {
          let typeApi: 'loan' | 'withdrawal' | 'dividend' | 'other' = 'other';
          const amountApi = Number(pending.amount || 0);
          if (pending.type === 'loan') typeApi = 'loan';
          else if (pending.type === 'withdrawal') typeApi = 'withdrawal';
          else if (pending.type === 'dividend') typeApi = 'dividend';
          
          // Validar que el monto sea válido
          if (amountApi <= 0) {
            console.warn(`Skipping pending transaction with invalid amount: ${amountApi}`, pending);
            continue;
          }
          
          const planItem: DisbursementPlan = {
            memberId: member.id,
            type: typeApi,
            amount: amountApi,
            status: 'pending',
            ...(pending.description && { notes: pending.description }),
            ...(pending.loanId && { loanId: pending.loanId }),
            ...(pending.id && pending.id !== '' && { pendingMemberPaymentId: pending.id })
          }
          plan.push(planItem)
        }
      }
      // Dividendos
      if (dividendsByMember.value[member.id]) {
        for (const dividend of dividendsByMember.value[member.id]) {
          const dividendAmount = Number(dividend.amount);
          // Validar que el monto sea válido
          if (dividendAmount <= 0) {
            console.warn(`Skipping dividend with invalid amount: ${dividendAmount}`, dividend);
            continue;
          }
          
          const planItem: DisbursementPlan = {
            memberId: member.id,
            type: 'dividend',
            amount: dividendAmount,
            status: 'pending'
          }
          plan.push(planItem)
        }
      }
      // Otros desembolsos
      if (localOtherDisbursementsByMember.value[member.id]) {
        for (const other of localOtherDisbursementsByMember.value[member.id]) {
          const otherAmount = Number(other.amount);
          // Validar que el monto sea válido
          if (otherAmount <= 0) {
            console.warn(`Skipping other disbursement with invalid amount: ${otherAmount}`, other);
            continue;
          }
          
          const planItem: DisbursementPlan = {
            memberId: member.id,
            type: 'other',
            amount: otherAmount,
            status: 'pending',
            ...(other.description && { notes: other.description })
          }
          plan.push(planItem)
        }
      }
    }
    await disbursementsService.executeDisbursementPlan(meetingId.value, plan)
    // Cerrar la reunión
    await meetingsService.close(meetingId.value)
    // Limpiar el store activo
    activeMeetingStore.$reset()
    // Redirigir a la lista de reuniones
    router.push('/meetings')
    applySuccess.value = true
    // Opcional: limpiar estados locales
    // localLoansByMember.value = {}
    // localWithdrawalsByMember.value = {}
    // pendingTransactionsByMember.value = {}
    // dividendsByMember.value = {}
  } catch (e: unknown) {
    const error = e as { message?: string };
    applyError.value = error.message || 'Error al aplicar los desembolsos.'
  } finally {
    isApplying.value = false
  }
}

const showOtherDisbursementModal = ref(false)
const editingOtherDisbursementIdx = ref<number|null>(null)
const localOtherDisbursementsByMember = ref<Record<string, Array<{ description: string; amount: number }>>>({})

const prevLoanData = ref<LoanData | null>(null)
const isLoadingLoanData = ref(false)

// Computed property para cargar datos del préstamo cuando sea necesario
const prevLoanDataComputed = computed(() => {
  if (editingPendingIdx.value !== null && editingPendingType.value === 'loan') {
    return prevLoanData.value
  }
  if (editingLoanIdx.value !== null && editingLoanIdx.value >= 0) {
    return localLoans.value[editingLoanIdx.value]
  }
  return null
})

const localOtherDisbursements = computed<Array<{ description: string; amount: number }>>({
  get() {
    return selectedMember.value ? (localOtherDisbursementsByMember.value[selectedMember.value.id] || []) : []
  },
  set(val) {
    if (selectedMember.value) {
      localOtherDisbursementsByMember.value[selectedMember.value.id] = val
    }
  }
})

function openOtherDisbursementModal() {
  showOtherDisbursementModal.value = true
  editingOtherDisbursementIdx.value = null
}
function editOtherDisbursement(idx: number) {
  editingOtherDisbursementIdx.value = idx
  showOtherDisbursementModal.value = true
}
function closeOtherDisbursementModal() {
  showOtherDisbursementModal.value = false
  editingOtherDisbursementIdx.value = null
}
function handleSaveOtherDisbursement(data: { description: string; amount: number }) {
  if (!selectedMember.value) return
  const disbursements = [...localOtherDisbursements.value]
  if (editingOtherDisbursementIdx.value !== null) {
    disbursements[editingOtherDisbursementIdx.value] = { ...data }
  } else {
    disbursements.push({ ...data })
  }
  localOtherDisbursements.value = disbursements
  closeOtherDisbursementModal()
}
function removeOtherDisbursement(idx: number) {
  const disbursements = [...localOtherDisbursements.value]
  disbursements.splice(idx, 1)
  localOtherDisbursements.value = disbursements
}
</script> 