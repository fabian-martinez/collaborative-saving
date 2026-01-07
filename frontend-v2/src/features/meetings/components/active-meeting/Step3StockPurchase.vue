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
        <!-- Resumen sticky - se mantiene visible al hacer scroll -->
        <PurchaseSummary
          :total-purchased-shares="totalPurchasedShares"
          :total-cash-registered="totalCashRegistered"
          :registered-operations="registeredOperations"
          :show-all-transactions="showAllTransactions"
          :selected-member="selectedMember"
          :member-purchases="selectedMember ? memberRegisteredPurchases(selectedMember.id) : []"
          :is-member-purchases-loading="selectedMember ? isMemberPurchasesLoading(selectedMember.id) : false"
          :member-purchases-error="memberPurchasesError"
          @toggle-transactions="showAllTransactions = !showAllTransactions"
          @show-operation="showOperationDetailFromOperation"
          @show-member-purchase="showMemberPurchaseOperation"
        />
        <MemberList
          :members="members"
          :selected-member="selectedMember"
          :is-member-paid="() => false"
          :has-pending-purchase="hasPendingPurchase"
          :has-completed-purchase="hasCompletedPurchase"
          :get-initials="getInitials"
          :get-member-color="getMemberColor"
          @select-member="selectMemberAndReset"
        />
      </div>

      <!-- Columna derecha: Formulario y recibo local -->
      <div class="md:col-span-2">
        <div class="card bg-base-100 shadow-lg rounded-lg">
          <div class="card-body p-4 md:p-6">
            <div v-if="!selectedMember" class="flex items-center justify-center h-64 text-base-content/60">
              <p class="text-center">Seleccione un socio para registrar una compra.</p>
            </div>
            <div v-else>
              <!-- Operation Details View -->
              <div v-if="operationDetailLoadingId && !selectedOperation" class="alert alert-info text-sm mb-4">
                Cargando detalle de la operación...
              </div>
              <div v-if="selectedOperation">
                <div class="flex justify-between items-center mb-4">
                  <h2 class="text-2xl font-bold">Detalle de operación</h2>
                  <button class="btn btn-outline btn-sm" @click="closeOperationDetail">Regresar</button>
                </div>
                <OperationDetails :operation="selectedOperation" />
              </div>
              
              <!-- Purchase Form View -->
              <div v-else>
                <div class="text-center mb-6">
                  <h2 class="text-2xl font-bold">Registrar compra de acciones</h2>
                  <p class="text-lg text-base-content/80">{{ selectedMember.name }}</p>
                </div>
                <!-- Botón para abrir el modal de compra de acción -->
                <div class="flex justify-end mb-4">
                  <button class="btn btn-primary btn-sm" @click="openBuyModal()">Agregar compra</button>
                </div>
                <!-- Recibo local editable -->
                <div v-if="localLines.length > 0" class="mt-6">
                  <h3 class="text-lg font-semibold mb-2">Detalle de la compra</h3>
                  <div class="space-y-4">
                    <div v-for="(line, idx) in localLines" :key="line.id" class="py-3">
                      <div class="flex items-baseline">
                        <div class="shrink-0">
                          <p class="font-semibold text-xl">{{ stockName(line.stockId) }}</p>
                          <p class="text-sm text-base-content/70">
                            <CopyOnDblClickNumber :value="Number(line.quantity || 0)" /> uds. x 
                            <CopyOnDblClickNumber :value="stocks.find(s => s.id === line.stockId)?.value || 0" /> c/u
                          </p>
                        </div>
                        <div class="grow border-b-2 border-dotted border-base-300/70 mx-4"></div>
                        <div class="shrink-0 flex items-center gap-2">
                          <button class="btn btn-ghost btn-xs" @click="openBuyModal(idx)">Editar</button>
                          <button class="btn btn-ghost btn-xs text-error" @click="removeLine(idx)">Anular</button>
                          <p class="text-right font-mono text-2xl whitespace-nowrap">
                            <span v-if="typeof (line.cashAmount + line.creditAmount) === 'number'">
                              <CopyOnDblClickNumber :value="line.cashAmount + line.creditAmount" />
                            </span>
                            <span v-else>
                              N/D
                            </span>
                          </p>
                        </div>
                      </div>
                      <div class="pl-4 mt-2 space-y-1 text-md text-base-content/80 border-l-2 border-base-300/80">
                        <div class="flex justify-between"><span>Efectivo:</span> <span>
                          <span v-if="typeof line.cashAmount === 'number'">
                            <CopyOnDblClickNumber :value="line.cashAmount" />
                          </span>
                          <span v-else>
                            N/D
                          </span>
                        </span></div>
                        <div class="flex justify-between"><span>Crédito:</span> <span>
                          <span v-if="typeof line.creditAmount === 'number'">
                            <CopyOnDblClickNumber :value="line.creditAmount" />
                          </span>
                          <span v-else>
                            N/D
                          </span>
                        </span></div>
                        <div class="flex justify-between">
                          <span>Interés crédito:</span>
                          <span v-if="line.loanDetails && typeof line.loanDetails.interest_rate === 'number' && line.loanDetails.interest_rate > 0">
                            {{ (line.loanDetails.interest_rate * 100).toFixed(0) }}%
                          </span>
                          <span v-else>-</span>
                        </div>
                      </div>
                    </div>
                    <div class="flex items-baseline text-2xl font-bold">
                      <span class="shrink-0">Total a pagar:</span>
                      <div class="grow border-b-2 border-dotted border-base-300/70 mx-4"></div>
                      <span class="shrink-0 text-primary font-mono">
                        <CopyOnDblClickNumber :value="localLines.reduce((sum, l) => sum + l.cashAmount + l.creditAmount, 0)" />
                      </span>
                    </div>
                  </div>
                  <div class="text-right mt-4">
                    <button class="btn btn-success btn-lg" @click="confirmLocalOperation" :disabled="isRegistering">
                      <span v-if="isRegistering" class="loading loading-spinner loading-xs mr-2"></span>
                      <span v-if="!isRegistering">Confirmar compra</span>
                      <span v-else>Registrando...</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- Modal propio para compra/edición de acción -->
        <EditBuyStockModal
          :visible="showBuyModal"
          :isEditing="isEditingBuy"
          :initialData="buyModalForm"
          :stocks="stocks"
          @save="handleBuyModalSave"
          @cancel="closeBuyModal"
        />
      </div>
    </div>
    <div class="mt-8 pt-4 border-t">
      <div class="text-right mt-4">
        <button class="btn btn-success w-full md:w-auto" @click="$emit('completed')">
          Finalizar registro de compras
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { membersApi, type Member, type MemberPurchase, type PurchaseStockRequest } from '@/api/members.api'
import { stocksApi, type Stock } from '@/api/stocks.api'
import { useActiveMeetingStore } from '../../stores/activeMeeting'
import { meetingsApi, type Operation } from '@/api/meetings.api'
import { ledgerApi } from '@/api/ledger.api'
import EditBuyStockModal from './EditBuyStockModal.vue'
import OperationDetails from '@/shared/components/OperationDetails.vue'
import CopyOnDblClickNumber from '@/shared/components/CopyOnDblClickNumber.vue'
import PurchaseSummary from './collection/PurchaseSummary.vue'
import MemberList from './collection/MemberList.vue'

const emit = defineEmits<{
  completed: []
}>()

const store = useActiveMeetingStore()
const members = ref<Member[]>([])
const stocks = ref<Stock[]>([])
const selectedMember = ref<Member | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

// Estado para compras registradas
const registeredOperations = ref<Operation[]>([])
const memberPurchasesByMember = ref<Record<string, MemberPurchase[]>>({})
const memberPurchasesError = ref<string | null>(null)
const memberPurchasesLoadingMemberId = ref<string | null>(null)

// Estado para recibo local
type LocalLine = {
  id: string
  stockId: string
  quantity: number
  cashAmount: number
  creditAmount: number
  loanDetails?: {
    interest_rate: number
    loan_type: string
  }
}

const localLinesByMember = ref<Record<string, LocalLine[]>>({})
const localLines = computed({
  get() {
    return selectedMember.value ? (localLinesByMember.value[selectedMember.value.id] || []) : []
  },
  set(val) {
    if (selectedMember.value) {
      localLinesByMember.value[selectedMember.value.id] = val
    }
  }
})

// Estado para modal de compra
const showBuyModal = ref(false)
const isEditingBuy = ref(false)
const editingBuyIdx = ref<number | null>(null)
const buyModalForm = ref<LocalLine>({
  id: '',
  stockId: '',
  quantity: 1,
  cashAmount: 0,
  creditAmount: 0
})

// Estado para vista de operaciones
const showAllTransactions = ref(false)
const selectedOperation = ref<Operation | null>(null)
const operationDetailLoadingId = ref<string | null>(null)

// Estado para registro
const isRegistering = ref(false)

// Cálculos de totales
const totalCashRegistered = computed(() => {
  return registeredOperations.value
    .flatMap(op => (op as any).ledger_entries || [])
    .filter((entry: any) => entry && entry.account_type === 'CASH')
    .reduce((sum: number, entry: any) => sum + Number(entry.amount || 0), 0)
})

const totalPurchasedShares = computed(() => {
  return registeredOperations.value
    .flatMap(op => (op as any).ledger_entries || [])
    .filter((entry: any) => entry && entry.account_type === 'STOCK_CAPITAL')
    .reduce((sum: number, entry: any) => sum + Number(entry.amount || 0), 0)
})

// Funciones helper
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function getMemberColor(memberId: string): string {
  const colors = [
    '#3b82f6', // blue
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#f59e0b', // amber
    '#10b981', // green
    '#06b6d4', // cyan
    '#ef4444', // red
    '#6366f1', // indigo
  ]
  let hash = 0
  for (let i = 0; i < memberId.length; i++) {
    hash = memberId.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

function stockName(id: string) {
  const s = stocks.value.find(s => s.id === id)
  return s ? s.type : '-'
}

function hasPendingPurchase(memberId: string) {
  return (localLinesByMember.value[memberId]?.length > 0)
}

function hasCompletedPurchase(memberId: string) {
  if (memberRegisteredPurchases(memberId).length > 0) {
    return true
  }
  return registeredOperations.value.some(op => {
    const opMemberId = (op as any).member_id
    return opMemberId === memberId
  })
}

function memberRegisteredPurchases(memberId: string) {
  return memberPurchasesByMember.value[memberId] || []
}

function isMemberPurchasesLoading(memberId: string) {
  return memberPurchasesLoadingMemberId.value === memberId
}


// Funciones de selección de miembro
function selectMemberAndReset(member: Member) {
  selectedMember.value = member
  selectedOperation.value = null
  void loadMemberPurchases(member.id)
}

// Funciones de carga de datos
async function loadRegisteredOperations() {
  if (!store.meetingId) return
  
  try {
    // Obtener todas las compras de la reunión
    const purchases = await meetingsApi.getMeetingPurchases(store.meetingId)
    
    // Para cada compra, obtener sus ledger_entries
    const operationsWithEntries = await Promise.all(
      purchases.map(async (purchase) => {
        try {
          const entries = await ledgerApi.getLedgerEntriesByOperation(purchase.operation_id)
          return {
            id: purchase.operation_id,
            member_id: '', // No está disponible en MemberPurchase directamente
            meeting_id: purchase.meeting_id,
            type: 'STOCK_PURCHASE',
            description: `Compra de ${purchase.stock_type} - ${purchase.quantity} uds`,
            date: purchase.purchase_date,
            ledger_entries: entries.map(e => ({
              id: e.id,
              operation_id: e.operation_id,
              account_type: e.account_type,
              amount: e.amount,
              description: e.description,
              created_at: e.created_at
            })),
            total_amount: entries
              .filter(e => e.account_type === 'CASH' && e.amount > 0)
              .reduce((sum, e) => sum + e.amount, 0),
            total_debit: entries
              .filter(e => e.account_type === 'CASH' && e.amount > 0)
              .reduce((sum, e) => sum + e.amount, 0)
          } as Operation & { ledger_entries: any[], total_debit: number }
        } catch {
          // Si falla obtener entries, retornar operación sin entries
          return {
            id: purchase.operation_id,
            member_id: '',
            meeting_id: purchase.meeting_id,
            type: 'STOCK_PURCHASE',
            description: `Compra de ${purchase.stock_type} - ${purchase.quantity} uds`,
            date: purchase.purchase_date,
            total_amount: purchase.total_value,
            ledger_entries: [],
            total_debit: purchase.total_value
          } as Operation & { ledger_entries: any[], total_debit: number }
        }
      })
    )
    
    registeredOperations.value = operationsWithEntries
  } catch (e) {
    console.error('Error loading registered operations:', e)
  }
}

async function loadMemberPurchases(memberId: string) {
  if (!memberId || !store.meetingId) {
    return
  }
  
  memberPurchasesLoadingMemberId.value = memberId
  memberPurchasesError.value = null
  
  try {
    const purchases = await membersApi.getMemberPurchases(memberId, { meeting_id: store.meetingId })
    memberPurchasesByMember.value = {
      ...memberPurchasesByMember.value,
      [memberId]: purchases,
    }
  } catch (e) {
    const err = e as { message?: string }
    memberPurchasesError.value = err.message || 'Error al cargar las compras del socio.'
  } finally {
    memberPurchasesLoadingMemberId.value = null
  }
}

// Función para cargar compras de todos los miembros automáticamente
async function fetchAllMemberPurchases() {
  if (!store.meetingId || members.value.length === 0) return
  
  const meetingId = store.meetingId
  
  try {
    const purchasePromises = members.value.map(async (member) => {
      try {
        const purchases = await membersApi.getMemberPurchases(member.id, { 
          meeting_id: meetingId 
        })
        memberPurchasesByMember.value = {
          ...memberPurchasesByMember.value,
          [member.id]: purchases,
        }
      } catch (error) {
        // Ignorar errores individuales
        console.debug(`Error fetching purchases for member ${member.id}:`, error)
      }
    })
    
    await Promise.all(purchasePromises)
  } catch (error) {
    console.error('Error fetching all member purchases', error)
  }
}

// Funciones del modal de compra
function openBuyModal(idx: number | null = null) {
  if (idx !== null) {
    // Editar línea existente
    const line = localLines.value[idx]
    buyModalForm.value = {
      id: line.id,
      stockId: line.stockId,
      quantity: line.quantity,
      cashAmount: line.cashAmount,
      creditAmount: line.creditAmount,
      loanDetails: line.loanDetails
    }
    isEditingBuy.value = true
    editingBuyIdx.value = idx
  } else {
    // Nueva compra
    buyModalForm.value = {
      id: '',
      stockId: '',
      quantity: 1,
      cashAmount: 0,
      creditAmount: 0
    }
    isEditingBuy.value = false
    editingBuyIdx.value = null
  }
  showBuyModal.value = true
}

function closeBuyModal() {
  showBuyModal.value = false
  editingBuyIdx.value = null
}

function handleBuyModalSave(line: Partial<LocalLine> & { stockId: string; quantity: number; cashAmount: number }) {
  const stock_value = stocks.value.find(s => s.id === line.stockId)?.value || 0
  const totalValue = stock_value * line.quantity
  const creditAmount = totalValue - (line.cashAmount || 0)
  
  const newLine: LocalLine = {
    id: (line as LocalLine).id || `${Date.now()}-${Math.random()}`,
    stockId: line.stockId,
    quantity: line.quantity,
    cashAmount: line.cashAmount || 0,
    creditAmount: creditAmount > 0 ? creditAmount : 0,
    loanDetails: line.loanDetails || (creditAmount > 0 ? {
      interest_rate: 0.02,
      loan_type: 'accion',
    } : undefined)
  }
  
  if (isEditingBuy.value && editingBuyIdx.value !== null) {
    const lines = [...localLines.value]
    lines[editingBuyIdx.value] = newLine
    localLines.value = lines
  } else {
    localLines.value = [...localLines.value, newLine]
  }
  closeBuyModal()
}

function removeLine(idx: number) {
  const lines = [...localLines.value]
  lines.splice(idx, 1)
  localLines.value = lines
}

// Funciones de registro
async function confirmLocalOperation() {
  if (localLines.value.length === 0) return
  if (!store.meetingId) {
    alert('No hay reunión activa.')
    return
  }
  const memberId = selectedMember.value?.id
  if (!memberId) {
    alert('Selecciona un socio antes de registrar compras.')
    return
  }
  
  isRegistering.value = true
  
  try {
    for (const line of localLines.value) {
      const payload: PurchaseStockRequest = {
        stock_id: line.stockId,
        quantity: line.quantity,
        cash_amount: line.cashAmount,
        meeting_id: store.meetingId,
      }
      
      if (line.creditAmount > 0 && line.loanDetails) {
        payload.loan_details = {
          interest_rate: line.loanDetails.interest_rate,
          loan_type: line.loanDetails.loan_type,
        }
      }
      
      await membersApi.createStockPurchase(memberId, payload)
    }
    
    localLines.value = []
    
    // Recargar datos
    await Promise.all([
      loadMemberPurchases(memberId),
      loadRegisteredOperations(),
      fetchAllMemberPurchases()
    ])
    
    alert('Compra(s) registrada(s) exitosamente.')
  } catch (e) {
    const err = e as { message?: string }
    alert(err.message || 'Error al registrar la(s) compra(s).')
  } finally {
    isRegistering.value = false
  }
}

// Funciones de vista de operaciones
function showOperationDetailFromOperation(op: Operation) {
  selectedOperation.value = op
}

async function showMemberPurchaseOperation(purchase: MemberPurchase) {
  try {
    operationDetailLoadingId.value = purchase.operation_id
    selectedOperation.value = null
    
    // Obtener ledger entries de la operación
    const entries = await ledgerApi.getLedgerEntriesByOperation(purchase.operation_id)
    
    // Construir operación completa
    const operation: Operation & { ledger_entries: any[] } = {
      id: purchase.operation_id,
      member_id: '',
      meeting_id: purchase.meeting_id,
      type: 'STOCK_PURCHASE',
      description: `Compra de ${purchase.stock_type} - ${purchase.quantity} uds`,
      date: purchase.purchase_date,
      total_amount: entries
        .filter(e => e.account_type === 'CASH' && e.amount > 0)
        .reduce((sum, e) => sum + e.amount, 0),
      ledger_entries: entries.map(e => ({
        id: e.id,
        operation_id: e.operation_id,
        account_type: e.account_type,
        amount: e.amount,
        description: e.description,
        created_at: e.created_at
      }))
    }
    
    selectedOperation.value = operation
  } catch (e) {
    alert('No se pudo cargar el detalle de la operación.')
  } finally {
    operationDetailLoadingId.value = null
  }
}

function closeOperationDetail() {
  selectedOperation.value = null
  operationDetailLoadingId.value = null
}

// Inicialización
onMounted(async () => {
  loading.value = true
  try {
    [members.value, stocks.value] = await Promise.all([
      membersApi.getMembers(),
      stocksApi.getStocks()
    ])
    
    if (store.meetingId) {
      await Promise.all([
        loadRegisteredOperations(),
        fetchAllMemberPurchases()
      ])
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Error al cargar datos'
  } finally {
    loading.value = false
  }
})

// Watcher para cuando el meetingId cambie (similar a Step1Collection)
watch(
  () => store.meetingId,
  async (newMeetingId) => {
    if (newMeetingId && members.value.length > 0) {
      await Promise.all([
        loadRegisteredOperations(),
        fetchAllMemberPurchases()
      ])
    }
  }
)
</script>
