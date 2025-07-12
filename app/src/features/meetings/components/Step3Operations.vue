<template>
  <div>
    <h2 class="text-xl font-bold mb-4">Paso 3: Nuevas Operaciones - Compra de Acciones</h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Columna izquierda: Socios y resumen global -->
      <div class="md:col-span-1">
        <h3 class="text-lg font-semibold mb-2">Socios</h3>
        <ul class="menu bg-base-200 w-full rounded-box">
          <li v-for="member in members" :key="member.id" @click="selectMemberAndReset(member)">
            <a :class="[ 'transition', selectedMember && selectedMember.id === member.id ? 'bg-primary/20 font-bold text-primary' : 'hover:bg-base-300/40' ]">
              {{ member.name }}
              <span v-if="hasPendingPurchase(member.id)" class="badge badge-warning badge-sm ml-2">Pendiente</span>
            </a>
          </li>
        </ul>
        <div class="mt-4 p-4 bg-base-200 rounded-box space-y-4">
          <div>
            <div class="text-center">
              <div class="text-sm font-light text-base-content/70 uppercase">Total Acciones Compradas</div>
              <div class="text-3xl font-bold text-primary">{{ totalStocksRegistered }}</div>
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
        <div class="mt-4 flex justify-center">
          <button type="button" class="btn btn-sm btn-outline" @click="showNewMember = true">Registrar nuevo socio</button>
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
                      <p class="font-semibold text-xl">{{ stockName(line.stockTypeId) }}</p>
                      <p class="text-sm text-base-content/70">{{ line.quantity }} uds. x ${{ (line.total/line.quantity).toFixed(2) }} c/u</p>
                    </div>
                    <div class="flex-grow border-b-2 border-dotted border-base-300/70 mx-4"></div>
                    <div class="flex-shrink-0 flex items-center gap-2">
                      <button class="btn btn-ghost btn-xs" @click="openBuyModal(idx)">Editar</button>
                      <button class="btn btn-ghost btn-xs text-error" @click="removeLine(idx)">Anular</button>
                      <p class="w-36 text-right font-mono text-2xl">${{ line.total.toFixed(2) }}</p>
                    </div>
                  </div>
                  <div class="pl-4 mt-2 space-y-1 text-md text-base-content/80 border-l-2 border-base-300/80">
                    <div class="flex justify-between"><span>Efectivo:</span> <span>${{ line.cash.toFixed(2) }}</span></div>
                    <div class="flex justify-between"><span>Crédito:</span> <span>${{ line.credit.toFixed(2) }}</span></div>
                    <div class="flex justify-between"><span>Interés crédito:</span> <span v-if="line.credit > 0">2%</span><span v-else>-</span></div>
                  </div>
                </div>
              </div>
              <div class="mt-8 pt-4 border-t-2 border-dashed border-base-300/50 text-right">
                <div class="flex items-baseline text-2xl font-bold">
                  <span class="flex-shrink-0">Total a pagar:</span>
                  <div class="flex-grow border-b-2 border-dotted border-base-300/70 mx-4"></div>
                  <span class="flex-shrink-0 text-primary font-mono">${{ localLines.reduce((sum, l) => sum + l.total, 0).toFixed(2) }}</span>
                </div>
              </div>
              <div class="text-right mt-4">
                <button class="btn btn-success btn-lg" @click="confirmLocalOperation">Confirmar compra</button>
              </div>
            </div>
          </div>
        </div>
        <!-- Modal propio para compra/edición de acción -->
        <dialog v-if="showBuyModal" class="modal" :class="{ 'modal-open': showBuyModal }">
          <div class="modal-box">
            <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" @click="closeBuyModal">✕</button>
            <h3 class="font-bold text-2xl mb-2 text-center">{{ isEditingBuy ? 'Editar compra de acción' : 'Agregar compra de acción' }}</h3>
            <p class="mb-6 text-base-content/70 text-center">
              {{ isEditingBuy ? 'Modifica los datos de la compra de acción seleccionada.' : 'Completa los datos para registrar una nueva compra de acción.' }}
            </p>
            <form @submit.prevent="handleBuyModalSave" class="space-y-4">
              <!-- Tipo de acción -->
              <div class="form-control">
                <label class="label">
                  <span class="label-text text-lg">Tipo de acción</span>
                </label>
                <select v-model="buyModalForm.stockTypeId" class="select select-bordered select-lg w-full">
                  <option disabled value="">Selecciona tipo de acción</option>
                  <option v-for="stock in stocks" :key="stock.id" :value="stock.id">
                    {{ stock.name }} (Valor actual: ${{ stock.currentValue.toFixed(2) }})
                  </option>
                </select>
              </div>
              <!-- Cantidad -->
              <div class="form-control">
                <label class="label">
                  <span class="label-text text-lg">Cantidad</span>
                </label>
                <input v-model.number="buyModalForm.quantity" type="number" min="1" class="input input-bordered input-lg w-full font-mono text-right" required />
              </div>
              <!-- Método de pago -->
              <div class="form-control">
                <label class="label">
                  <span class="label-text text-lg">Método de pago</span>
                </label>
                <select v-model="buyModalForm.paymentMethod" class="select select-bordered select-lg w-full">
                  <option value="cash">Efectivo</option>
                  <option value="credit">Crédito</option>
                  <option value="mixed">Mixto</option>
                </select>
                <div v-if="buyModalForm.paymentMethod === 'mixed'" class="flex gap-2 mt-2">
                  <input v-model.number="buyModalForm.cashAmount" type="number" min="0" :max="buyModalTotalAmount" step="0.01" class="input input-bordered input-lg w-1/2 font-mono text-right" placeholder="Efectivo" />
                  <input v-model.number="buyModalForm.creditAmount" type="number" min="0" :max="buyModalTotalAmount" step="0.01" class="input input-bordered input-lg w-1/2 font-mono text-right" placeholder="Crédito" />
                </div>
                <!-- Mensaje de interés si es crédito o mixto -->
                <div v-if="buyModalForm.paymentMethod === 'credit' || buyModalForm.paymentMethod === 'mixed'" class="mt-2 text-warning text-sm flex items-center gap-1">
                  <span class="font-bold">2% interés fijo</span> sobre el monto a crédito.
                </div>
              </div>
              <!-- Feedback de error -->
              <div v-if="buyModalErrorMsg" class="alert alert-error mt-2">{{ buyModalErrorMsg }}</div>
              <!-- Resumen dinámico de la compra -->
              <div v-if="buyModalForm.stockTypeId && buyModalForm.quantity > 0" class="mt-4 p-4 bg-base-200 rounded-lg space-y-2 text-base-content/90">
                <div class="flex justify-between">
                  <span class="font-semibold">Total a pagar:</span>
                  <span class="font-mono text-lg">${{ buyModalTotalAmount.toFixed(2) }}</span>
                </div>
                <div v-if="buyModalForm.paymentMethod === 'mixed'">
                  <div class="flex justify-between">
                    <span>Efectivo:</span>
                    <span class="font-mono">${{ (buyModalForm.cashAmount || 0).toFixed(2) }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span>Financiado:</span>
                    <span class="font-mono">${{ (buyModalForm.creditAmount || 0).toFixed(2) }}</span>
                  </div>
                </div>
              </div>
              <!-- Acciones -->
              <div class="modal-action flex justify-end gap-2">
                <button type="button" class="btn btn-ghost" @click="closeBuyModal">Cancelar</button>
                <button type="submit" class="btn btn-primary" :disabled="!canSaveBuyModal">
                  {{ isEditingBuy ? 'Guardar Cambios' : 'Agregar' }}
                </button>
              </div>
            </form>
          </div>
          <form method="dialog" class="modal-backdrop">
            <button @click="closeBuyModal">close</button>
          </form>
        </dialog>
      </div>
    </div>
    <!-- Modal para nuevo miembro -->
    <dialog v-if="showNewMember" class="modal modal-open">
      <form method="dialog" class="modal-box" @submit.prevent="handleAddMember">
        <h3 class="font-bold text-lg mb-2">Registrar nuevo socio</h3>
        <input v-model="newMemberName" class="input input-bordered w-full mb-2" placeholder="Nombre completo" required />
        <input v-model="newMemberEmail" type="email" class="input input-bordered w-full mb-2" placeholder="Correo electrónico" required />
        <input v-model="newMemberIdNumber" class="input input-bordered w-full mb-2" placeholder="Número de identificación" required />
        <div class="modal-action">
          <button type="submit" class="btn btn-primary">Guardar y seleccionar</button>
          <button type="button" class="btn" @click="showNewMember = false">Cancelar</button>
        </div>
      </form>
    </dialog>
    <div class="mt-8 pt-4 border-t">
      <div class="text-right mt-4">
        <button class="btn btn-success">Finalizar registro de compras</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import OperationDetails from '@/features/operations/components/operationDetails.vue'

// Datos mockeados
const members = ref([
  { id: '1', name: 'Ana Pérez', email: 'ana.perez@email.com', identificationNumber: '12345678' },
  { id: '2', name: 'Carlos Gómez', email: 'carlos.gomez@email.com', identificationNumber: '87654321' },
  { id: '3', name: 'Lucía Torres', email: 'lucia.torres@email.com', identificationNumber: '11223344' },
])
const stocks = ref([
  { id: 'a', name: 'Acción Garantizada', currentValue: 105.5, history: [ { date: '2024-06-01', value: 102 }, { date: '2024-07-01', value: 104 }, { date: '2024-08-01', value: 105.5 } ] },
  { id: 'b', name: 'Acción Normal', currentValue: 98.2, history: [ { date: '2024-06-01', value: 97 }, { date: '2024-07-01', value: 97.8 }, { date: '2024-08-01', value: 98.2 } ] },
])
const initialCash = 5000
const registeredPurchases = ref<any[]>([
  // Mock: operaciones ya "registradas" en el backend
  {
    id: 'op1',
    member_id: '1',
    type: 'buy_stock',
    description: 'Compra de 3 acciones Garantizadas',
    total_debit: 316.5,
    stockType: 'Acción Garantizada',
    quantity: 3,
    cash: 316.5,
    credit: 0,
    date: '2024-08-01',
    ledger_entries: [
      { account_type: 'INVERSIONES_EN_ACCIONES', amount: 316.5 }
    ]
  },
  {
    id: 'op2',
    member_id: '2',
    type: 'buy_stock',
    description: 'Compra de 2 acciones Normales',
    total_debit: 196.4,
    stockType: 'Acción Normal',
    quantity: 2,
    cash: 100,
    credit: 96.4,
    date: '2024-08-01',
    ledger_entries: [
      { account_type: 'INVERSIONES_EN_ACCIONES', amount: 196.4 }
    ]
  }
])
const selectedMember = ref<any | null>(null)
const showNewMember = ref(false)
const newMemberName = ref('')
const newMemberEmail = ref('')
const newMemberIdNumber = ref('')
const showHistory = ref(false)
const errorMsg = ref('')
// Cambia localLines a un objeto por miembro
const localLinesByMember = ref<Record<string, any[]>>({})
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
const showEditLineModal = ref(false)
const editLineForm = ref<any>({})
const editLineErrorMsg = ref('')
const showAllTransactions = ref(false)
const form = ref({
  stockTypeId: '',
  quantity: 1,
  paymentMethod: 'cash',
  cashAmount: 0,
  creditAmount: 0,
})

const totalStocksRegistered = computed(() => registeredPurchases.value.reduce((sum, p) => sum + (p.quantity || 0), 0))
const totalCashRegistered = computed(() => registeredPurchases.value.reduce((sum, p) => sum + (p.cash || 0), 0))

function memberRegisteredPurchases(memberId: string) {
  return registeredPurchases.value.filter(p => p.member_id === memberId)
}
function selectMember(member: any) {
  selectedMember.value = member
  localLines.value = []
  resetForm()
}
function selectMemberAndReset(member: any) {
  selectedMember.value = member
  selectedOperation.value = null
}
function handleAddMember() {
  if (!newMemberName.value.trim() || !newMemberEmail.value.trim() || !newMemberIdNumber.value.trim()) return
  members.value.push({
    id: (Math.random() * 100000).toFixed(0),
    name: newMemberName.value,
    email: newMemberEmail.value,
    identificationNumber: newMemberIdNumber.value,
  })
  selectedMember.value = members.value[members.value.length - 1]
  newMemberName.value = ''
  newMemberEmail.value = ''
  newMemberIdNumber.value = ''
  showNewMember.value = false
}
function resetForm() {
  form.value.stockTypeId = ''
  form.value.quantity = 1
  form.value.paymentMethod = 'cash'
  form.value.cashAmount = 0
  form.value.creditAmount = 0
  errorMsg.value = ''
  editingLineIdx.value = null
}
const selectedStockHistory = computed(() => {
  const stock = stocks.value.find(s => s.id === form.value.stockTypeId)
  return stock ? stock.history : []
})
const lineTotalAmount = computed(() => {
  const stock = stocks.value.find(s => s.id === form.value.stockTypeId)
  return stock ? (form.value.quantity > 0 ? form.value.quantity * stock.currentValue : 0) : 0
})
const canAddLine = computed(() => {
  return (
    form.value.stockTypeId &&
    form.value.quantity > 0 &&
    Number.isInteger(form.value.quantity) &&
    lineTotalAmount.value > 0 &&
    (form.value.paymentMethod === 'cash' || form.value.paymentMethod === 'credit' || form.value.paymentMethod === 'mixed')
  )
})
function handleAddLine() {
  errorMsg.value = ''
  if (!canAddLine.value) {
    errorMsg.value = 'Completa todos los campos correctamente.'
    return
  }
  if (form.value.quantity < 1 || !Number.isInteger(form.value.quantity)) {
    errorMsg.value = 'Solo se permiten cantidades enteras de acciones.'
    return
  }
  let cash = 0, credit = 0
  if (form.value.paymentMethod === 'cash') {
    cash = lineTotalAmount.value
  } else if (form.value.paymentMethod === 'credit') {
    credit = lineTotalAmount.value
  } else if (form.value.paymentMethod === 'mixed') {
    cash = form.value.cashAmount || 0
    credit = form.value.creditAmount || 0
    if (Math.abs(cash + credit - lineTotalAmount.value) > 0.01) {
      errorMsg.value = 'La suma de efectivo y crédito debe coincidir con el total.'
      return
    }
  }
  localLines.value.push({
    id: Date.now() + Math.random(),
    stockTypeId: form.value.stockTypeId,
    quantity: form.value.quantity,
    total: lineTotalAmount.value,
    cash,
    credit,
  })
  resetForm()
}
function openEditLine(idx: number) {
  const line = localLines.value[idx]
  editLineForm.value = {
    stockTypeId: line.stockTypeId,
    quantity: line.quantity,
    paymentMethod: line.credit > 0 && line.cash > 0 ? 'mixed' : (line.credit > 0 ? 'credit' : 'cash'),
    cashAmount: line.cash,
    creditAmount: line.credit,
  }
  editingLineIdx.value = idx
  showEditLineModal.value = true
  editLineErrorMsg.value = ''
}
function closeEditLineModal() {
  showEditLineModal.value = false
  editingLineIdx.value = null
  editLineErrorMsg.value = ''
}
const editLineTotalAmount = computed(() => {
  const stock = stocks.value.find(s => s.id === editLineForm.value.stockTypeId)
  return stock ? (editLineForm.value.quantity > 0 ? editLineForm.value.quantity * stock.currentValue : 0) : 0
})
const canEditLine = computed(() => {
  return (
    editLineForm.value.stockTypeId &&
    editLineForm.value.quantity > 0 &&
    Number.isInteger(editLineForm.value.quantity) &&
    editLineTotalAmount.value > 0 &&
    (editLineForm.value.paymentMethod === 'cash' || editLineForm.value.paymentMethod === 'credit' || editLineForm.value.paymentMethod === 'mixed')
  )
})
function handleEditLineSave() {
  editLineErrorMsg.value = ''
  if (!canEditLine.value) {
    editLineErrorMsg.value = 'Completa todos los campos correctamente.'
    return
  }
  if (editLineForm.value.quantity < 1 || !Number.isInteger(editLineForm.value.quantity)) {
    editLineErrorMsg.value = 'Solo se permiten cantidades enteras de acciones.'
    return
  }
  let cash = 0, credit = 0
  if (editLineForm.value.paymentMethod === 'cash') {
    cash = editLineTotalAmount.value
  } else if (editLineForm.value.paymentMethod === 'credit') {
    credit = editLineTotalAmount.value
  } else if (editLineForm.value.paymentMethod === 'mixed') {
    cash = editLineForm.value.cashAmount || 0
    credit = editLineForm.value.creditAmount || 0
    if (Math.abs(cash + credit - editLineTotalAmount.value) > 0.01) {
      editLineErrorMsg.value = 'La suma de efectivo y crédito debe coincidir con el total.'
      return
    }
  }
  if (editingLineIdx.value !== null) {
    const lines = [...localLines.value]
    lines[editingLineIdx.value] = {
      ...localLines.value[editingLineIdx.value],
      stockTypeId: editLineForm.value.stockTypeId,
      quantity: editLineForm.value.quantity,
      total: editLineTotalAmount.value,
      cash,
      credit,
    }
    localLines.value = lines
  }
  closeEditLineModal()
}
function removeLine(idx: number) {
  const lines = [...localLines.value]
  lines.splice(idx, 1)
  localLines.value = lines
  resetForm()
}
function confirmLocalOperation() {
  if (localLines.value.length === 0) return
  // Simula registrar una operación de compra (varias líneas de acciones en una sola operación)
  const total = localLines.value.reduce((sum, l) => sum + l.total, 0)
  const cash = localLines.value.reduce((sum, l) => sum + l.cash, 0)
  const credit = localLines.value.reduce((sum, l) => sum + l.credit, 0)
  const description = localLines.value.map(l => `${l.quantity} ${stockName(l.stockTypeId)}`).join(', ')
  registeredPurchases.value.push({
    id: 'op' + (Math.random() * 100000).toFixed(0),
    member_id: selectedMember.value.id,
    type: 'buy_stock',
    description: `Compra de ${description}`,
    total_debit: total,
    stockType: '-',
    quantity: localLines.value.reduce((sum, l) => sum + l.quantity, 0),
    cash,
    credit,
    date: '2024-08-01',
    ledger_entries: [
      { account_type: 'INVERSIONES_EN_ACCIONES', amount: total }
    ]
  })
  localLines.value = []
  resetForm()
}
function stockName(id: string) {
  const s = stocks.value.find(s => s.id === id)
  return s ? s.name : '-'
}

// Estado y lógica para el modal de compra/edición de acción
const showBuyModal = ref(false)
const isEditingBuy = ref(false)
const editingBuyIdx = ref<number|null>(null)
const buyModalForm = ref({
  stockTypeId: '',
  quantity: 1,
  paymentMethod: 'cash',
  cashAmount: 0,
  creditAmount: 0,
})
const buyModalErrorMsg = ref('')

const buyModalTotalAmount = computed(() => {
  const stock = stocks.value.find(s => s.id === buyModalForm.value.stockTypeId)
  return stock ? (buyModalForm.value.quantity > 0 ? buyModalForm.value.quantity * stock.currentValue : 0) : 0
})
const canSaveBuyModal = computed(() => {
  return (
    buyModalForm.value.stockTypeId &&
    buyModalForm.value.quantity > 0 &&
    Number.isInteger(buyModalForm.value.quantity) &&
    buyModalTotalAmount.value > 0 &&
    (buyModalForm.value.paymentMethod === 'cash' || buyModalForm.value.paymentMethod === 'credit' || buyModalForm.value.paymentMethod === 'mixed')
  )
})
function openBuyModal(idx: number|null = null) {
  buyModalErrorMsg.value = ''
  if (idx !== null) {
    // Editar línea existente
    const line = localLines.value[idx]
    buyModalForm.value = {
      stockTypeId: line.stockTypeId,
      quantity: line.quantity,
      paymentMethod: line.credit > 0 && line.cash > 0 ? 'mixed' : (line.credit > 0 ? 'credit' : 'cash'),
      cashAmount: line.cash,
      creditAmount: line.credit,
    }
    isEditingBuy.value = true
    editingBuyIdx.value = idx
  } else {
    // Nueva compra
    buyModalForm.value = {
      stockTypeId: '',
      quantity: 1,
      paymentMethod: 'cash',
      cashAmount: 0,
      creditAmount: 0,
    }
    isEditingBuy.value = false
    editingBuyIdx.value = null
  }
  showBuyModal.value = true
}
function closeBuyModal() {
  showBuyModal.value = false
  editingBuyIdx.value = null
  buyModalErrorMsg.value = ''
}
function handleBuyModalSave() {
  buyModalErrorMsg.value = ''
  if (!canSaveBuyModal.value) {
    buyModalErrorMsg.value = 'Completa todos los campos correctamente.'
    return
  }
  if (buyModalForm.value.quantity < 1 || !Number.isInteger(buyModalForm.value.quantity)) {
    buyModalErrorMsg.value = 'Solo se permiten cantidades enteras de acciones.'
    return
  }
  let cash = 0, credit = 0
  if (buyModalForm.value.paymentMethod === 'cash') {
    cash = buyModalTotalAmount.value
  } else if (buyModalForm.value.paymentMethod === 'credit') {
    credit = buyModalTotalAmount.value
  } else if (buyModalForm.value.paymentMethod === 'mixed') {
    cash = buyModalForm.value.cashAmount || 0
    credit = buyModalForm.value.creditAmount || 0
    if (Math.abs(cash + credit - buyModalTotalAmount.value) > 0.01) {
      buyModalErrorMsg.value = 'La suma de efectivo y crédito debe coincidir con el total.'
      return
    }
  }
  const newLine = {
    id: Date.now() + Math.random(),
    stockTypeId: buyModalForm.value.stockTypeId,
    quantity: buyModalForm.value.quantity,
    total: buyModalTotalAmount.value,
    cash,
    credit,
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
const showOperationModal = ref(false)
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
</script> 