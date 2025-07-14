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
            </a>
          </li>
        </ul>
        <div class="mt-4 p-4 bg-base-200 rounded-box space-y-4">
          <div>
            <div class="text-center">
              <div class="text-sm font-light text-base-content/70 uppercase">Efectivo disponible</div>
              <div class="text-3xl font-bold text-success">${{ efectivoDisponible.toFixed(2) }}</div>
            </div>
          </div>
          <div class="text-center">
            <div class="text-sm font-light text-base-content/70 uppercase">Total prestado</div>
            <div class="text-2xl font-bold text-primary">${{ totalPrestado.toFixed(2) }}</div>
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
                  <td class="text-sm text-right font-bold text-primary">${{ summary.total.toFixed(2) }}</td>
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
          <div v-if="localLoans.length > 0 || localWithdrawals.length > 0 || pendingTransactions.length > 0 || selectedMemberDividends.length > 0">
            <div class="space-y-4">
              <!-- Transacciones pendientes -->
              <div v-for="(pending, idx) in pendingTransactions" :key="`pending-${idx}`" class="py-4 rounded opacity-95">
                <div class="flex items-baseline">
                  <div class="flex-shrink-0">
                    <p class="font-semibold text-lg text-yellow-800">{{ pending.description }} (Pendiente)</p>
                    <p class="text-sm text-yellow-700">Monto original: ${{ pending.originalAmount.toFixed(2) }}</p>
                  </div>
                  <div class="flex-grow border-b-2 border-dotted border-yellow-300 mx-4"></div>
                  <div class="flex-shrink-0 flex items-center gap-2">
                    <button class="btn btn-ghost btn-xs text-yellow-800" @click="editPendingTransaction(pending, idx)">Editar</button>
                    <button class="btn btn-ghost btn-xs text-error" @click="postponePending(idx)">Aplazar</button>
                    <p class="w-36 text-right font-mono text-2xl text-yellow-800">${{ pending.pendingAmount.toFixed(2) }}</p>
                  </div>
                </div>
                <div class="pl-4 mt-2 space-y-1 text-md text-yellow-700 border-l-2 border-yellow-300 flex gap-4 items-center">
                  <span><b>Tipo:</b> {{ pending.type === 'loan' ? 'Préstamo' : 'Retiro de Acciones' }}</span>
                  <span><b>Estado:</b> <span class="text-yellow-800">Pendiente de entrega</span></span>
                </div>
              </div>
              
              <!-- Nuevos desembolsos (localLoans/localWithdrawals): sin fondo, verde en texto/acento -->
              <div v-for="(loan, idx) in localLoans" :key="idx" class="py-4 rounded">
                <div class="flex items-baseline">
                  <div class="flex-shrink-0">
                    <p class="font-semibold text-lg text-green-800">{{ loan.type === 'corriente' ? 'Préstamo Corriente' : 'Préstamo Ágil' }}</p>
                    <p class="text-sm text-green-700">Aprobado: ${{ loan.approved.toFixed(2) }}</p>
                  </div>
                  <div class="flex-grow border-b-2 border-dotted border-green-300 mx-4"></div>
                  <div class="flex-shrink-0 flex items-center gap-2">
                    <button class="btn btn-ghost btn-xs text-green-800" @click="editLoan(idx)">Editar</button>
                    <button class="btn btn-ghost btn-xs text-error" @click="removeLoan(idx)">Anular</button>
                    <p class="w-36 text-right font-mono text-2xl text-green-800">${{ loan.delivered.toFixed(2) }}</p>
                  </div>
                </div>
                <div class="pl-4 mt-2 space-y-1 text-md text-green-700 border-l-2 border-green-300 flex gap-4 items-center">
                  <span><b>Tasa de interés:</b> <span>{{ loan.type === 'corriente' ? '1.5%' : '2%' }}</span></span>
                  <span><b>Capacidad máxima:</b> <span>${{ selectedMember.maxCapacity.toFixed(2) }}</span></span>
                </div>
              </div>
              <!-- Retiros de acciones -->
              <div v-for="(withdrawal, idx) in localWithdrawals" :key="`withdrawal-${idx}`" class="py-4 rounded">
                <div class="flex items-baseline">
                  <div class="flex-shrink-0">
                    <p class="font-semibold text-lg text-green-800">Retiro de Acciones {{ withdrawal.stockType }}</p>
                    <p class="text-sm text-green-700">Cantidad: {{ withdrawal.quantity }} | Valor estimado: ${{ withdrawal.estimatedValue.toFixed(2) }}</p>
                  </div>
                  <div class="flex-grow border-b-2 border-dotted border-green-300 mx-4"></div>
                  <div class="flex-shrink-0 flex items-center gap-2">
                    <button class="btn btn-ghost btn-xs text-error" @click="removeWithdrawal(idx)">Anular</button>
                    <p class="w-36 text-right font-mono text-2xl text-green-800">${{ withdrawal.deliveredAmount.toFixed(2) }}</p>
                  </div>
                </div>
                <div class="pl-4 mt-2 space-y-1 text-md text-green-700 border-l-2 border-green-300 flex gap-4 items-center">
                  <span><b>Valor por acción:</b> <span>${{ (withdrawal.estimatedValue / withdrawal.quantity).toFixed(2) }}</span></span>
                  <span><b>Pendiente por entregar:</b> <span class="text-green-800">${{ withdrawal.pending.toFixed(2) }}</span></span>
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
                    <p class="w-36 text-right font-mono text-2xl text-blue-800">${{ dividend.amount.toFixed(2) }}</p>
                  </div>
                </div>
                <div class="pl-4 mt-2 space-y-1 text-md text-blue-700 border-l-2 border-blue-300 flex gap-4 items-center">
                  <span><b>Tipo:</b> Dividendo</span>
                  <span><b>Estado:</b> <span class="text-blue-800">Pendiente de entrega</span></span>
                </div>
              </div>
              <div class="flex items-baseline text-2xl font-bold mt-6">
                <span class="flex-shrink-0">Total a entregar:</span>
                <div class="flex-grow border-b-2 border-dotted border-base-300/70 mx-4"></div>
                <span class="flex-shrink-0 text-primary font-mono">${{ (localLoans.reduce((sum, l) => sum + l.delivered, 0) + localWithdrawals.reduce((sum, w) => sum + w.deliveredAmount, 0) + pendingTransactions.reduce((sum, p) => sum + p.pendingAmount, 0) + selectedMemberDividends.reduce((sum, d) => sum + d.amount, 0)).toFixed(2) }}</span>
              </div>
            </div>
          </div>
          <div v-else class="mb-4 text-base-content/60 italic">No hay préstamos, retiros ni transacciones pendientes para este socio.</div>
          <div v-else class="space-y-4">
            <!-- Solo retiros de acciones -->
            <div v-for="(withdrawal, idx) in localWithdrawals" :key="`withdrawal-${idx}`" class="py-4">
              <div class="flex items-baseline">
                <div class="flex-shrink-0">
                  <p class="font-semibold text-lg">Retiro de Acciones {{ withdrawal.stockType }}</p>
                  <p class="text-sm text-base-content/70">Cantidad: {{ withdrawal.quantity }} | Valor estimado: ${{ withdrawal.estimatedValue.toFixed(2) }}</p>
                </div>
                <div class="flex-grow border-b-2 border-dotted border-base-300/70 mx-4"></div>
                <div class="flex-shrink-0 flex items-center gap-2">
                  <button class="btn btn-ghost btn-xs text-error" @click="removeWithdrawal(idx)">Anular</button>
                  <p class="w-36 text-right font-mono text-2xl text-secondary">${{ withdrawal.deliveredAmount.toFixed(2) }}</p>
                </div>
              </div>
              <div class="pl-4 mt-2 space-y-1 text-md text-base-content/80 border-l-2 border-base-300/80">
                <div class="flex justify-between"><span>Valor por acción:</span> <span>${{ (withdrawal.estimatedValue / withdrawal.quantity).toFixed(2) }}</span></div>
                <div class="flex justify-between"><span>Pendiente por entregar:</span> <span class="text-warning">${{ withdrawal.pending.toFixed(2) }}</span></div>
              </div>
            </div>
            <!-- Transacciones pendientes (solo retiros) -->
            <div v-for="(pending, idx) in pendingTransactions" :key="`pending-${idx}`" class="py-4 opacity-75">
              <div class="flex items-baseline">
                <div class="flex-shrink-0">
                  <p class="font-semibold text-lg text-warning">{{ pending.description }} (Pendiente)</p>
                  <p class="text-sm text-base-content/70">Monto original: ${{ pending.originalAmount.toFixed(2) }}</p>
                </div>
                <div class="flex-grow border-b-2 border-dotted border-warning/30 mx-4"></div>
                <div class="flex-shrink-0 flex items-center gap-2">
                  <span class="badge badge-warning badge-sm">API</span>
                  <p class="w-36 text-right font-mono text-2xl text-warning">${{ pending.pendingAmount.toFixed(2) }}</p>
                </div>
              </div>
              <div class="pl-4 mt-2 space-y-1 text-md text-base-content/60 border-l-2 border-warning/30">
                <div class="flex justify-between"><span>Tipo:</span> <span>{{ pending.type === 'loan' ? 'Préstamo' : 'Retiro de Acciones' }}</span></div>
                <div class="flex justify-between"><span>Estado:</span> <span class="text-warning">Pendiente de entrega</span></div>
              </div>
            </div>
            <div class="flex items-baseline text-2xl font-bold mt-6">
              <span class="flex-shrink-0">Total a entregar:</span>
              <div class="flex-grow border-b-2 border-dotted border-base-300/70 mx-4"></div>
              <span class="flex-shrink-0 text-primary font-mono">${{ (localWithdrawals.reduce((sum, w) => sum + w.deliveredAmount, 0) + pendingTransactions.reduce((sum, p) => sum + p.pendingAmount, 0)).toFixed(2) }}</span>
            </div>
          </div>
          <div class="flex gap-4 mt-6">
            <button class="btn btn-primary" @click="openModal">Solicitar/Editar Préstamo</button>
            <button class="btn btn-secondary" @click="openStockWithdrawalModal">Solicitar Retiro de Acciones</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Préstamo -->
    <LoanFormModal
      :show="showModal"
      :member="selectedMember"
      :prevLoan="getPrevLoanData()"
      @save="handleSaveLoan"
      @cancel="closeModal"
    />
    <StockWithdrawalModal
      :show="showStockWithdrawalModal"
      :member="selectedMember"
      :memberStocks="mockMemberStocks"
      @save="handleSaveStockWithdrawal"
      @cancel="closeStockWithdrawalModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import LoanFormModal from './LoanFormModal.vue'
import StockWithdrawalModal from './StockWithdrawalModal.vue'

// Mock de socios (IDs como string)
const members = ref([
  { id: '1', name: 'Juan Pérez', maxCapacity: 5000 },
  { id: '2', name: 'Ana Gómez', maxCapacity: 3000 },
  { id: '3', name: 'Luis Torres', maxCapacity: 4000 },
])

const isLoading = ref(false)
const error = ref('')
const selectedMember = ref<{ id: string; name: string; maxCapacity: number } | null>(null)

const showModal = ref(false)
const editingLoanIdx = ref<number|null>(null)

const showStockWithdrawalModal = ref(false)

const editingPendingIdx = ref<number | null>(null)
const editingPendingType = ref<'loan' | 'withdrawal' | null>(null)

// Recibo local de préstamos por socio
const localLoansByMember = ref<Record<string, Array<{ type: string; approved: number; delivered: number }>>>({})
// Recibo local de retiros de acciones por socio
const localWithdrawalsByMember = ref<Record<string, Array<{ stockType: string; quantity: number; estimatedValue: number; deliveredAmount: number; pending: number }>>>({})
// Transacciones pendientes mock (en el futuro vendrán del API)
const pendingTransactionsByMember = ref<Record<string, Array<{ type: 'loan' | 'withdrawal'; description: string; pendingAmount: number; originalAmount: number }>>>({
  '1': [
    { type: 'loan', description: 'Préstamo Corriente', pendingAmount: 500, originalAmount: 2000 },
    { type: 'withdrawal', description: 'Retiro Acciones Ordinarias', pendingAmount: 300, originalAmount: 800 }
  ],
  '2': [
    { type: 'loan', description: 'Préstamo Ágil', pendingAmount: 1200, originalAmount: 1200 }
  ]
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

const mockMemberStocks = computed(() => {
  if (!selectedMember.value) return []
  return [
    { stockId: 'a1', stockType: 'Ordinaria', quantity: 10, currentValue: 100 },
    { stockId: 'a2', stockType: 'Preferente', quantity: 5, currentValue: 150 }
  ]
})

// Mock: efectivo disponible (puedes ajustar la lógica según la integración real)
const efectivoDisponible = computed(() => 10000 - totalPrestado.value)
const totalPrestado = computed(() => {
  // Suma todos los préstamos locales de todos los socios
  const totalLoans = Object.values(localLoansByMember.value).flat().reduce((sum, l) => sum + l.delivered, 0)
  const totalWithdrawals = Object.values(localWithdrawalsByMember.value).flat().reduce((sum, w) => sum + w.deliveredAmount, 0)
  return totalLoans + totalWithdrawals
})

function selectMember(member: { id: string; name: string; maxCapacity: number }) {
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
  
  // Si estamos editando una transacción pendiente
  if (editingPendingIdx.value !== null && editingPendingType.value === 'loan') {
    const transactions = [...pendingTransactions.value]
    transactions[editingPendingIdx.value] = {
      type: 'loan',
      description: loan.type === 'corriente' ? 'Préstamo Corriente' : 'Préstamo Ágil',
      pendingAmount: loan.delivered,
      originalAmount: loan.approved
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

function confirmDisbursements() {
  alert('Desembolsos confirmados para ' + selectedMember.value?.name + ': $' + localLoans.value.reduce((sum, l) => sum + l.delivered, 0).toFixed(2))
  // Aquí iría la lógica real de envío al backend
  localLoans.value = []
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

function openStockWithdrawalModal() {
  showStockWithdrawalModal.value = true
}
function closeStockWithdrawalModal() {
  showStockWithdrawalModal.value = false
  editingPendingIdx.value = null
  editingPendingType.value = null
}
function handleSaveStockWithdrawal(withdrawalData: any) {
  if (!selectedMember.value) return
  
  // Si estamos editando una transacción pendiente
  if (editingPendingIdx.value !== null && editingPendingType.value === 'withdrawal') {
    const transactions = [...pendingTransactions.value]
    transactions[editingPendingIdx.value] = {
      type: 'withdrawal',
      description: 'Retiro de Acciones (Editado)',
      pendingAmount: withdrawalData.deliveredAmount,
      originalAmount: withdrawalData.estimatedTotal
    }
    pendingTransactions.value = transactions
    closeStockWithdrawalModal()
    return
  }
  
  const withdrawals = [...localWithdrawals.value]
  
  // Convertir los retiros a formato para el recibo
  const formattedWithdrawals = withdrawalData.withdrawals
    .filter((w: any) => w.quantity > 0)
    .map((w: any) => {
      const stock = mockMemberStocks.value.find(s => s.stockId === w.stockId)
      return {
        stockType: stock?.stockType || 'Desconocido',
        quantity: w.quantity,
        estimatedValue: w.quantity * (stock?.currentValue || 0),
        deliveredAmount: withdrawalData.deliveredAmount,
        pending: withdrawalData.pending
      }
    })
  
  withdrawals.push(...formattedWithdrawals)
  localWithdrawals.value = withdrawals
  closeStockWithdrawalModal()
}

function editPendingTransaction(pending: { type: 'loan' | 'withdrawal'; description: string; pendingAmount: number; originalAmount: number }, idx: number) {
  if (!selectedMember.value) return
  editingPendingIdx.value = idx
  editingPendingType.value = pending.type
  
  if (pending.type === 'loan') {
    showModal.value = true
  } else {
    showStockWithdrawalModal.value = true
  }
}

function getPrevLoanData() {
  // Si estamos editando una transacción pendiente
  if (editingPendingIdx.value !== null && editingPendingType.value === 'loan') {
    const pending = pendingTransactions.value[editingPendingIdx.value]
    const loanType = pending.description.includes('Ágil') ? 'agil' : 'corriente'
    return {
      type: loanType,
      approved: pending.originalAmount,
      delivered: pending.pendingAmount
    }
  }
  // Si estamos editando un préstamo normal
  if (editingLoanIdx.value !== null && editingLoanIdx.value >= 0) {
    return localLoans.value[editingLoanIdx.value]
  }
  return null
}

// Función para calcular el total a entregar a un socio (préstamos + retiros + dividendos + pendientes)
function getTotalToDeliver(memberId: string) {
  const loans = localLoansByMember.value[memberId]?.reduce((sum, l) => sum + l.delivered, 0) || 0
  const withdrawals = localWithdrawalsByMember.value[memberId]?.reduce((sum, w) => sum + w.deliveredAmount, 0) || 0
  const pending = pendingTransactionsByMember.value[memberId]?.reduce((sum, t) => sum + t.pendingAmount, 0) || 0
  // Solo sumar dividendos que siguen en mockDividends
  const dividends = mockDividends.value.filter(d => d.member_id === memberId).reduce((sum, d) => sum + d.amount, 0)
  return loans + withdrawals + pending + dividends
}

// Computed para el resumen de entregas
const deliverySummary = computed(() => {
  return members.value
    .map(member => ({
      id: member.id,
      name: member.name,
      total: getTotalToDeliver(member.id)
    }))
    .filter(summary => summary.total > 0)
})

// Mock de dividendos pendientes
// Los member_id coinciden exactamente con los ids de los socios mock
const mockDividends = ref([
  {
    id: 'd1',
    member_id: '1', // Juan Pérez
    meeting_id: 'm1',
    type: 'dividendo',
    amount: 120.5,
    status: 'pending',
    notes: 'Dividendo generado por acción Ordinaria',
    stock_id: 'a1',
    created_at: '2024-07-01T10:00:00Z',
    stockType: 'Ordinaria',
  },
  {
    id: 'd2',
    member_id: '1', // Juan Pérez
    meeting_id: 'm1',
    type: 'dividendo',
    amount: 80.0,
    status: 'pending',
    notes: 'Dividendo generado por acción Preferente',
    stock_id: 'a2',
    created_at: '2024-07-01T10:00:00Z',
    stockType: 'Preferente',
  },
  {
    id: 'd3',
    member_id: '2', // Ana Gómez
    meeting_id: 'm1',
    type: 'dividendo',
    amount: 50.0,
    status: 'pending',
    notes: 'Dividendo generado por acción Ordinaria',
    stock_id: 'a1',
    created_at: '2024-07-01T10:00:00Z',
    stockType: 'Ordinaria',
  },
])

// Computed para obtener los dividendos del socio seleccionado
const selectedMemberDividends = computed(() => {
  const member = selectedMember.value;
  if (!member || !member.id) return [];
  return mockDividends.value.filter(d => d.member_id === member.id);
});

// Función para aplazar/cancelar un pendiente
function postponePending(idx: number) {
  if (confirm('¿Seguro que deseas aplazar este pendiente para la siguiente reunión?')) {
    const arr = [...pendingTransactions.value]
    arr.splice(idx, 1)
    pendingTransactions.value = arr
  }
}
// Función para aplazar/cancelar un dividendo
function postponeDividend(idx: number) {
  if (confirm('¿Seguro que deseas aplazar este dividendo para la siguiente reunión?')) {
    const arr = [...selectedMemberDividends.value]
    arr.splice(idx, 1)
    // Como selectedMemberDividends es un computed, hay que eliminarlo del mockDividends
    const toRemove = selectedMemberDividends.value[idx]
    if (toRemove) {
      const i = mockDividends.value.findIndex(d => d.id === toRemove.id)
      if (i !== -1) mockDividends.value.splice(i, 1)
    }
  }
}
</script> 