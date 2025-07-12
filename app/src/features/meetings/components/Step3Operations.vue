<template>
  <div>
    <h2 class="text-xl font-bold mb-4">Paso 3: Nuevas Operaciones - Compra de Acciones</h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Columna izquierda: Socios y resumen global -->
      <div class="md:col-span-1">
        <h3 class="text-lg font-semibold mb-2">Socios</h3>
        <ul class="menu bg-base-200 w-full rounded-box">
          <li v-for="member in activeMeetingStore.members" :key="member.id" @click="selectMemberAndReset(member)">
            <a :class="[ 'transition', selectedMember && selectedMember.id === member.id ? 'bg-primary/20 font-bold text-primary' : 'hover:bg-base-300/40' ]">
              {{ member.name }}
              <span v-if="hasPendingPurchase(member.id)" class="badge badge-warning badge-sm ml-2">Pendiente</span>
            </a>
          </li>
        </ul>
        <div class="mt-4 p-4 bg-base-200 rounded-box space-y-4">
          <div>
            <div class="text-center">
              <div class="text-sm font-light text-base-content/70 uppercase">Total En Acciones Compradas</div>
              <div class="text-3xl font-bold text-primary">${{ -totalPurchasedShares.toFixed(2) }}</div>
            </div>
          </div>
          <div class="text-center">
            <div class="text-sm font-light text-base-content/70 uppercase">Total Efectivo Recaudado</div>
            <div class="text-2xl font-bold text-success">${{ totalCashRegistered.toFixed(2) }}</div>
          </div>
          <div class="border-t border-base-300/50"></div>
          <div>
            <h4 class="font-semibold text-center text-base-content/80 mb-2">Compras Registradas</h4>
            <div class="flex justify-center mb-2 gap-2">
              <button class="btn btn-xs btn-outline" :class="{ 'btn-active': !showAllTransactions }" @click="showAllTransactions = false">Solo este socio</button>
              <button class="btn btn-xs btn-outline" :class="{ 'btn-active': showAllTransactions }" @click="showAllTransactions = true">Todas</button>
            </div>
            <div v-if="showAllTransactions">
              <div v-if="registeredPurchases.length > 0" class="space-y-2">
                <div v-for="op in registeredPurchases" :key="op.id" class="bg-base-100/50 p-2 rounded-md text-sm cursor-pointer hover:bg-primary/10 transition"
                  @click="showOperationDetail(op)">
                  <OperationDetails :operation="op" v-if="false" />
                  <!-- Solo resumen, el detalle va en el modal -->
                  <span class="font-semibold">{{ op.description }}</span>
                  <span class="ml-2 text-xs text-base-content/60">${{ op.total_debit.toFixed(2) }}</span>
                </div>
              </div>
              <p v-else class="text-base-content/60 italic text-sm text-center">Sin compras registradas aún.</p>
            </div>
            <div v-else>
              
              <div v-if="memberRegisteredPurchases(selectedMember?.id).length > 0" class="space-y-2">
                <div v-for="op in memberRegisteredPurchases(selectedMember.id)" :key="op.id" class="bg-base-100/50 p-2 rounded-md text-sm cursor-pointer hover:bg-primary/10 transition"
                  @click="showOperationDetail(op)">
                  <OperationDetails :operation="op" v-if="false" />
                  <!-- Solo resumen, el detalle va en el modal -->
                  <span class="font-semibold">{{ op.description }}</span>
                  <span class="ml-2 text-xs text-base-content/60">${{ op.total_debit.toFixed(2) }}</span>
                </div>
              </div>
              <p v-else class="text-base-content/60 italic text-sm text-center">Este socio no ha realizado compras en la reunión.</p>
            </div>
          </div>
        </div>
      </div>
      <!-- Columna derecha: Formulario y recibo local -->
      <div class="md:col-span-2">
        <div v-if="!selectedMember" class="flex items-center justify-center h-full text-gray-500">
          <p class="text-center">Seleccione un socio para registrar una compra.</p>
        </div>
        <div v-else class="bg-base-100 p-6 rounded-2xl shadow-lg font-sans">
          <div v-if="selectedOperation">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-2xl font-bold">Detalle de operación</h2>
              <button class="btn btn-outline btn-sm" @click="closeOperationDetail">Regresar</button>
            </div>
            <OperationDetails :operation="selectedOperation" />
          </div>
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
                    <div class="flex-shrink-0">
                      <p class="font-semibold text-xl">{{ stockName(line.stockId) }}</p>
                      <p class="text-sm text-base-content/70">{{ line.quantity }} uds. x ${{ (stocks.find(s => s.id === line.stockId)?.value || 0).toFixed(2) }} c/u</p>
                    </div>
                    <div class="flex-grow border-b-2 border-dotted border-base-300/70 mx-4"></div>
                    <div class="flex-shrink-0 flex items-center gap-2">
                      <button class="btn btn-ghost btn-xs" @click="openBuyModal(idx)">Editar</button>
                      <button class="btn btn-ghost btn-xs text-error" @click="removeLine(idx)">Anular</button>
                      <p class="w-36 text-right font-mono text-2xl">${{ (line.cashAmount + line.creditAmount).toFixed(2) }}</p>
                    </div>
                  </div>
                  <div class="pl-4 mt-2 space-y-1 text-md text-base-content/80 border-l-2 border-base-300/80">
                    <div class="flex justify-between"><span>Efectivo:</span> <span>${{ line.cashAmount.toFixed(2) }}</span></div>
                    <div class="flex justify-between"><span>Crédito:</span> <span>${{ line.creditAmount.toFixed(2) }}</span></div>
                    <div class="flex justify-between">
                      <span>Interés crédito:</span>
                      <span v-if="line.loanDetails && typeof line.loanDetails.interest_rate === 'number' && line.loanDetails.interest_rate > 0">
                        {{ line.loanDetails.interest_rate }}%
                      </span>
                      <span v-else>-</span>
                    </div>
                  </div>
                <div class="flex items-baseline text-2xl font-bold">
                  <span class="flex-shrink-0">Total a pagar:</span>
                  <div class="flex-grow border-b-2 border-dotted border-base-300/70 mx-4"></div>
                  <span class="flex-shrink-0 text-primary font-mono">${{ localLines.reduce((sum, l) => sum + l.cashAmount + l.creditAmount, 0).toFixed(2) }}</span>
                  </div>
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
        <button class="btn btn-success">Finalizar registro de compras</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import OperationDetails from '@/features/operations/components/operationDetails.vue'
import { useActiveMeetingStore } from '../stores/activeMeeting'
import { meetingsService } from '../services/meetings'
import EditBuyStockModal from './EditBuyStockModal.vue'
import type { Stock, StocksForPurchase } from '@/features/stocks/types'
import { stocksService } from '@/features/stocks/services/stocksService';
import type { Operation } from '@/features/operations/types'
import { operationsService } from '@/features/operations/services/operationsService'

type LocalLine = StocksForPurchase & { id: string, creditAmount: number }
const stocks = ref<Stock[]>([])
const registeredPurchases = ref<Operation[]>([])

const activeMeetingStore = useActiveMeetingStore()

onMounted(async () => {
  await activeMeetingStore.fetchMembers()
  stocks.value = await stocksService.getStocks()
  registeredPurchases.value = (await meetingsService.getStockPurchaseOperations(activeMeetingStore.meetingId || '')).data
})

async function getRegisteredPurchases() {
  return (await meetingsService.getStockPurchaseOperations(activeMeetingStore.meetingId || '')).data
}

// Estado de la UI de la compra de acciones
const selectedMember = ref<any | null>(null)
const errorMsg = ref('')
// Cambia localLines a un objeto por miembro
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
const editingLineIdx = ref<number|null>(null)
const showAllTransactions = ref(false)
const form = ref({
  stockId: '',
  quantity: 1,
  paymentMethod: 'cash',
  cashAmount: 0,
  creditAmount: 0,
})

const totalCashRegistered = computed(() =>
  registeredPurchases.value
    .flatMap(op => op.ledger_entries)
    .filter(entry => entry.account_type === 'CASH')
    .reduce((sum, entry) => sum + Number(entry.amount), 0)
)

const totalPurchasedShares = computed(() =>
  registeredPurchases.value
    .flatMap(op => op.ledger_entries)
    .filter(entry => entry.account_type === 'STOCK_CAPITAL')
    .reduce((sum, entry) => sum + Number(entry.amount), 0)
)

function memberRegisteredPurchases(memberId: string) {
  return registeredPurchases.value.filter(p => p.member_id === memberId)
}
function selectMemberAndReset(member: any) {
  selectedMember.value = member
  selectedOperation.value = null
}
function resetForm() {
  form.value.stockId = ''
  form.value.quantity = 1
  form.value.cashAmount = 0
  errorMsg.value = ''
  editingLineIdx.value = null
}

function removeLine(idx: number) {
  const lines = [...localLines.value]
  lines.splice(idx, 1)
  localLines.value = lines
  resetForm()
}

const isRegistering = ref(false)
async function confirmLocalOperation() {
  if (localLines.value.length === 0) return
  if (!activeMeetingStore.meetingId) {
    alert('No hay reunión activa.');
    return
  }
  isRegistering.value = true
  const meetingId = activeMeetingStore.meetingId
  try {
    for (const line of localLines.value) {
      await meetingsService.buyStocks(meetingId, {
        memberId: selectedMember.value.id,
        stockId: line.stockId,
        quantity: line.quantity,
        cashAmount: line.cashAmount,
        loanDetails: line.loanDetails
      })
    }
    localLines.value = []
    resetForm()
    registeredPurchases.value = await getRegisteredPurchases()
    alert('Compra(s) registrada(s) exitosamente.')
  } catch (e) {
    alert('Error al registrar la(s) compra(s).')
  } finally {
    isRegistering.value = false
  }
}

function stockName(id: string) {
  const s = stocks.value.find(s => s.id === id)
  return s ? s.type : '-'
}

// Estado y lógica para el modal de compra/edición de acción
const showBuyModal = ref(false)
const isEditingBuy = ref(false)
const editingBuyIdx = ref<number|null>(null)
const buyModalForm = ref({
  stockId: '',
  quantity: 1,
  cashAmount: 0,
})
function openBuyModal(idx: number|null = null) {
  if (idx !== null) {
    // Editar línea existente
    const line = localLines.value[idx]
    buyModalForm.value = {
      stockId: line.stockId,
      quantity: line.quantity,
      cashAmount: line.cashAmount,
    }
    isEditingBuy.value = true
    editingBuyIdx.value = idx
  } else {
    // Nueva compra
    buyModalForm.value = {
      stockId: '',
      quantity: 1,
      cashAmount: 0,
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
function handleBuyModalSave(line: Partial<StocksForPurchase>) {
  const stock_value = stocks.value.find(s => s.id === line.stockId)?.value || 0
  const newLine: LocalLine = {
    id: Date.now() + Math.random().toString(),
    cashAmount: line.cashAmount || 0,
    creditAmount: stock_value * (line.quantity || 1) - (line.cashAmount || 0),
    loanDetails: line.loanDetails || undefined,
    quantity: line.quantity || 1,
    stockId: line.stockId || '',
    memberId: selectedMember.value.id || '',
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

// Estado para modal de detalle de operación
const selectedOperation = ref<any>(null)
function showOperationDetail(op: any) {
  selectedOperation.value = op
}
function closeOperationDetail() {
  selectedOperation.value = null
}
function hasPendingPurchase(memberId: string) {
  // Muestra la etiqueta si hay líneas en el recibo local, sin importar compras previas
  return (localLinesByMember.value[memberId]?.length > 0)
}

const members = computed(() => activeMeetingStore.members)

</script> 