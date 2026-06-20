<template>
  <div class="h-full flex flex-col min-h-0 overflow-hidden">
    <div v-if="loading" class="flex justify-center items-center py-12 flex-1">
      <span class="loading loading-spinner loading-lg text-teal-700"></span>
    </div>

    <div v-if="error && !loading" class="alert alert-error mb-4 shadow-sm flex-shrink-0">
      <WarningTriangle class="shrink-0 h-6 w-6" />
      <span>{{ error }}</span>
    </div>

    <div v-if="!loading && !error" class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch flex-1 min-h-0 overflow-hidden">
      <!-- Panel Izquierdo (Workspace Principal) - 8 Columnas -->
      <div class="lg:col-span-8 card bg-base-100 border border-base-200 shadow-sm rounded-xl p-4 md:p-5 flex flex-col h-full min-h-0 overflow-hidden">
        <div class="space-y-4 flex-1 flex flex-col min-h-0 overflow-hidden">
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0">
            <div>
              <h2 class="text-lg font-bold text-base-content">Compra de Acciones (Paso 3)</h2>
              <p class="text-xs text-base-content/60 mt-1">
                Registra las acciones compradas por los socios en esta reunión. Cada acción tiene un valor nominal de $10.00.
              </p>
            </div>
          </div>

          <!-- Search Bar -->
          <div class="relative w-full max-w-sm flex-shrink-0">
            <span class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search class="w-4 h-4 text-base-content/40" />
            </span>
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="Buscar socio..." 
              class="input input-bordered input-sm w-full pl-9 rounded-lg text-sm bg-base-100 focus:outline-none focus:border-teal-700" 
            />
          </div>

          <!-- Table of Transactions -->
          <div class="overflow-auto w-full border border-base-200 rounded-lg flex-1 min-h-0">
            <table class="table table-zebra w-full text-xs md:text-sm">
              <thead class="sticky top-0 z-10">
                <tr class="bg-base-200/50 text-base-content/70">
                  <th class="py-2 px-3 font-bold text-[11px] uppercase tracking-wider">Socio</th>
                  <th class="py-2 px-3 font-bold text-[11px] uppercase tracking-wider text-center">Acciones Compradas</th>
                  <th class="py-2 px-3 font-bold text-[11px] uppercase tracking-wider text-right">Inversión</th>
                  <th class="py-2 px-3 font-bold text-[11px] uppercase tracking-wider text-right">Total Acumulado</th>
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
                    <span class="font-medium text-xs">
                      {{ getMemberPurchasedShares(member.id) }} acciones
                    </span>
                  </td>
                  <td class="py-2.5 px-3 text-right">
                    <span class="font-bold text-xs text-emerald-600">
                      {{ formatCurrency(getMemberTotalInvestment(member.id)) }}
                    </span>
                  </td>
                  <td class="py-2.5 px-3 text-right">
                    <span class="text-xs text-base-content/70">
                      {{ accumulatedSharesByMember[member.id] || 0 }} acumuladas
                    </span>
                  </td>
                  <td class="py-2.5 px-3 text-center overflow-visible">
                    <div class="dropdown dropdown-end">
                      <div tabindex="0" role="button" class="btn btn-ghost btn-xs btn-circle">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </div>
                      <ul tabindex="0" class="dropdown-content menu bg-base-100 rounded-box z-50 w-48 p-2 shadow border border-base-200">
                        <li>
                          <a @click="openBuyModal(member)">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-teal-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                            </svg>
                            <span>Agregar Compra</span>
                          </a>
                        </li>
                        <li>
                          <a @click="openCdtModal(member)">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-teal-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Crear CDT</span>
                          </a>
                        </li>
                        <li v-if="getMemberTotalInvestment(member.id) > 0">
                          <a @click="viewReceiptForMember(member)">
                            <Printer class="h-4 w-4 text-teal-700" />
                            <span>Imprimir Recibo</span>
                          </a>
                        </li>
                      </ul>
                    </div>
                  </td>
                </tr>
                <tr v-if="filteredMembers.length === 0">
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
              Mostrando {{ filteredMembers.length }} socios
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
          <h3 class="text-sm font-bold text-base-content border-b border-base-200 pb-3 mb-2">Resumen de Compra</h3>
          
          <!-- Metrics List -->
          <div class="space-y-3.5">
            <div class="flex justify-between items-baseline text-xs">
              <span class="text-base-content/60 font-medium">Total Acciones Compradas:</span>
              <span class="font-bold text-base-content text-sm">{{ totalStocksPurchased }} Acciones</span>
            </div>
            <div class="flex justify-between items-baseline text-xs">
              <span class="text-base-content/60 font-medium">Capital Recaudado:</span>
              <span class="font-bold text-emerald-600 text-sm">{{ formatCurrency(totalCapitalCollected) }}</span>
            </div>
            <div class="flex justify-between items-baseline text-xs">
              <span class="text-base-content/60 font-medium">Valor de Acción Nominal:</span>
              <span class="font-bold text-base-content text-sm">$10.00</span>
            </div>
          </div>

          <!-- Circular Chart -->
          <div class="flex justify-center py-4">
            <div class="relative w-28 h-28 flex items-center justify-center">
              <svg class="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <!-- Outer circle track -->
                <circle class="text-base-200" stroke-width="8" stroke="currentColor" fill="transparent" r="40" cx="50" cy="50" />
                <!-- Progress circle -->
                <circle class="text-teal-700 transition-all duration-500" stroke-width="8" :stroke-dasharray="251.2" :stroke-dashoffset="251.2 - (251.2 * Math.min(totalStocksPurchased / 100, 1))" stroke-linecap="round" stroke="currentColor" fill="transparent" r="40" cx="50" cy="50" />
              </svg>
              <div class="absolute flex flex-col items-center justify-center text-center">
                <span class="text-xl font-extrabold text-base-content leading-none">{{ totalStocksPurchased }}</span>
                <span class="text-[9px] text-base-content/50 uppercase font-bold tracking-wider mt-1">Acciones</span>
              </div>
            </div>
          </div>

          <!-- Info Box -->
          <div class="bg-teal-50/40 border border-teal-100 rounded-xl p-4 flex gap-3 text-xs leading-relaxed text-teal-800">
            <InfoCircle class="h-5 w-5 text-teal-600 shrink-0" />
            <p>
              Una vez registradas todas las acciones compradas, haz clic en 'Siguiente Paso' para proceder con el Paso 4 de Modificación.
            </p>
          </div>
        </div>

        <div class="space-y-2 mt-6">
          <button 
            class="btn btn-block bg-black hover:bg-neutral-800 text-white font-semibold rounded-lg text-sm border-0 py-2.5"
            @click="$emit('completed')"
          >
            Siguiente Paso: Modificar
          </button>
          <button 
            class="btn btn-block btn-outline border-base-300 hover:bg-base-200 text-base-content font-semibold rounded-lg text-sm"
            @click="saveDraft"
          >
            Guardar Borrador
          </button>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <EditBuyStockModal
      :visible="showBuyModal"
      :isEditing="isEditingBuy"
      :initialData="buyModalForm"
      :stocks="stocks"
      :members="members"
      @save="handleBuyModalSave"
      @cancel="closeBuyModal"
    />

    <CreateCdtModal
      :visible="showCdtModal"
      :members="members"
      :memberId="selectedMember?.id"
      @save="handleCdtModalSave"
      @cancel="closeCdtModal"
    />

    <PrintReceiptModal
      :is-open="printReceipt.isPrintModalOpen.value"
      :member-name="selectedMemberName"
      :print-date="purchasePrintDate"
      :viewed-operations="viewedPurchaseOperations"
      :viewed-total="purchaseTotal"
      title="Detalle de Compras"
      total-label="Total:"
      modal-id="purchase-receipt-print-modal"
      @close="printReceipt.closePrintModal"
      @print="printReceipt.printReceipt"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { WarningTriangle, Search, InfoCircle, Printer } from 'iconoir-vue/regular'
import { membersApi, type Member, type PurchaseStockRequest } from '@/api/members.api'
import { stocksApi, type Stock } from '@/api/stocks.api'
import { useActiveMeetingStore } from '../../stores/activeMeeting'
import { meetingsApi, type Operation } from '@/api/meetings.api'
import { formatCurrency } from '@/shared/utils/formatters'
import { usePrintReceipt } from '@/shared/composables/usePrintReceipt'
import EditBuyStockModal from './EditBuyStockModal.vue'
import CreateCdtModal from './CreateCdtModal.vue'
import PrintReceiptModal from '@/shared/components/PrintReceiptModal.vue'

defineEmits<{
  completed: []
}>()

const store = useActiveMeetingStore()
const members = ref<Member[]>([])
const stocks = ref<Stock[]>([])
const registeredOperations = ref<Operation[]>([])
const accumulatedSharesByMember = ref<Record<string, number>>({})

const loading = ref(false)
const error = ref<string | null>(null)

// Search & Pagination
const searchQuery = ref('')
const currentPage = ref(1)
const itemsPerPage = 5

// Modals State
const showBuyModal = ref(false)
const isEditingBuy = ref(false)
const buyModalForm = ref<{
  memberId?: string
  stockId: string
  quantity: number
  cashAmount: number
}>({
  stockId: '',
  quantity: 1,
  cashAmount: 0
})

const showCdtModal = ref(false)

// Print State
const selectedMember = ref<Member | null>(null)
const selectedMemberName = computed(() => selectedMember.value?.name || '')
const purchasePrintDate = ref('')
const viewedPurchaseOperations = ref<any[]>([])
const purchaseTotal = ref(0)

const printReceipt = usePrintReceipt(
  selectedMember,
  'purchase-receipt-print-modal',
  'purchase-receipt-print-container',
  'purchase-receipt-print'
)

// Computed Properties for Summary
const totalStocksPurchased = computed(() => {
  return registeredOperations.value.reduce((sum, op) => sum + getQuantityFromOperation(op), 0)
})

const totalCapitalCollected = computed(() => {
  return registeredOperations.value.reduce((sum, op) => sum + (op.total_amount || 0), 0)
})

// Filtered and Paginated Members
const filteredMembers = computed(() => {
  if (!searchQuery.value) return members.value
  const query = searchQuery.value.toLowerCase()
  return members.value.filter(m => m.name.toLowerCase().includes(query))
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredMembers.value.length / itemsPerPage)))

const paginatedMembers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return filteredMembers.value.slice(start, start + itemsPerPage)
})

// Reset current page when query changes
watch(searchQuery, () => {
  currentPage.value = 1
})

function getMemberPurchasedShares(memberId: string): number {
  return registeredOperations.value
    .filter(op => op.member_id === memberId && !op.description?.includes('CDT'))
    .reduce((sum, op) => sum + getQuantityFromOperation(op), 0)
}

function getMemberTotalInvestment(memberId: string): number {
  return registeredOperations.value
    .filter(op => op.member_id === memberId)
    .reduce((sum, op) => sum + (op.total_amount || 0), 0)
}



function getQuantityFromOperation(operation: Operation): number {
  if (operation.description?.includes('CDT')) return 0
  const match = operation.description?.match(/(\d+)\s+uds/)
  if (match) {
    return parseInt(match[1], 10)
  }
  return Math.round(operation.total_amount / 10)
}

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

// Fetch Functions
async function loadRegisteredOperations() {
  if (!store.meetingId) return
  try {
    const operations = await meetingsApi.getMeetingPurchases(store.meetingId)
    registeredOperations.value = operations
  } catch (e) {
    console.error('Error loading registered operations:', e)
  }
}

async function loadAccumulatedShares() {
  await Promise.all(
    members.value.map(async (member) => {
      try {
        const subs = await membersApi.getMemberStockSubscriptions(member.id)
        const total = subs.reduce((sum, sub) => sum + (sub.quantity || 0), 0)
        accumulatedSharesByMember.value[member.id] = total
      } catch (e) {
        console.error(`Error loading subscriptions for member ${member.id}:`, e)
        accumulatedSharesByMember.value[member.id] = 0
      }
    })
  )
}

// Modal actions
function openBuyModal(member: Member) {
  selectedMember.value = member
  buyModalForm.value = {
    memberId: member.id,
    stockId: '',
    quantity: 1,
    cashAmount: 0
  }
  isEditingBuy.value = false
  showBuyModal.value = true
}

function closeBuyModal() {
  showBuyModal.value = false
}

function openCdtModal(member: Member) {
  selectedMember.value = member
  showCdtModal.value = true
}

function closeCdtModal() {
  showCdtModal.value = false
}

async function handleBuyModalSave(line: any) {
  if (!store.meetingId) return
  loading.value = true
  try {
    const payload: PurchaseStockRequest = {
      stock_id: line.stockId,
      quantity: line.quantity,
      cash_amount: line.cashAmount,
      meeting_id: store.meetingId,
    }
    
    if (line.loanDetails) {
      payload.loan_details = {
        interest_rate: line.loanDetails.interest_rate,
        loan_type: line.loanDetails.loan_type,
      }
    }
    
    await membersApi.createStockPurchase(line.memberId, payload)
    closeBuyModal()
    
    await loadRegisteredOperations()
    await loadAccumulatedShares()
    alert('Compra registrada exitosamente.')
  } catch (e) {
    alert(e instanceof Error ? e.message : 'Error al registrar la compra.')
  } finally {
    loading.value = false
  }
}

async function handleCdtModalSave(line: any) {
  loading.value = true
  try {
    await stocksApi.createCdt({
      member_id: line.memberId,
      amount: line.amount,
      term_months: line.termMonths,
    })
    closeCdtModal()
    
    await loadRegisteredOperations()
    await loadAccumulatedShares()
    alert('CDT creado exitosamente.')
  } catch (e) {
    alert(e instanceof Error ? e.message : 'Error al crear el CDT.')
  } finally {
    loading.value = false
  }
}

// Receipt Print View
function viewReceiptForMember(member: Member) {
  selectedMember.value = member
  const memberOps = registeredOperations.value.filter(op => op.member_id === member.id)
  if (memberOps.length === 0) return
  purchasePrintDate.value = new Date(memberOps[0].date).toLocaleDateString()
  viewedPurchaseOperations.value = memberOps.map(op => ({
    id: op.id,
    description: op.description || (op.description?.includes('CDT') ? 'Creación de CDT' : 'Compra de acciones'),
    total_amount: op.total_amount
  }))
  purchaseTotal.value = memberOps.reduce((sum, op) => sum + op.total_amount, 0)
  printReceipt.openPrintModal()
}

function saveDraft() {
  alert('Borrador guardado exitosamente.')
}

// Initialization
onMounted(async () => {
  loading.value = true
  try {
    const [fetchedMembers, fetchedStocks] = await Promise.all([
      membersApi.getMembers(),
      stocksApi.getStocks()
    ])
    members.value = fetchedMembers
    stocks.value = fetchedStocks
    
    if (store.meetingId) {
      await Promise.all([
        loadRegisteredOperations(),
        loadAccumulatedShares()
      ])
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Error al cargar los datos'
  } finally {
    loading.value = false
  }
})

// Watcher for meetingId
watch(
  () => store.meetingId,
  async (newMeetingId) => {
    if (newMeetingId && members.value.length > 0) {
      await Promise.all([
        loadRegisteredOperations(),
        loadAccumulatedShares()
      ])
    }
  }
)
</script>
