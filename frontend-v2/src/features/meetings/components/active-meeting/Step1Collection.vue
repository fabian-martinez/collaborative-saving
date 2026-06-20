<template>
  <div class="h-full flex flex-col min-h-0 overflow-hidden">
    <div v-if="isLoadingMembers" class="flex justify-center items-center py-12 flex-1">
      <span class="loading loading-spinner loading-lg text-teal-700"></span>
    </div>

    <div v-if="memberError && !isLoadingMembers" class="alert alert-error mb-4 shadow-sm">
      <WarningTriangle class="shrink-0 h-6 w-6" />
      <span>{{ memberError }}</span>
    </div>

    <div v-if="!isLoadingMembers && !memberError" class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch flex-1 min-h-0 overflow-hidden">
      <!-- Panel Izquierdo (Workspace Principal) - 7 Columnas -->
      <div class="lg:col-span-7 card bg-base-100 border border-base-200 shadow-sm rounded-xl p-4 md:p-5 flex flex-col h-full min-h-0 overflow-hidden">
        <div class="space-y-4 flex-1 flex flex-col min-h-0 overflow-hidden">
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0">
            <div>
              <h2 class="text-lg font-bold text-base-content">Cobranzas (Paso 1)</h2>
              <p class="text-xs text-base-content/60 mt-1">
                Registra los aportes y pagos de préstamos de los socios en esta reunión.
              </p>
            </div>
            <!-- Imprimir Todos los Borradores -->
            <button 
              class="btn btn-outline btn-sm gap-2 font-semibold text-xs rounded-lg border-base-300 hover:bg-base-200 hover:text-base-content hover:border-base-400" 
              @click="isPrintAllModalOpen = true"
              :disabled="membersList.length === 0"
            >
              <Printer class="h-4 w-4" />
              <span>Imprimir Todos los Borradores</span>
            </button>
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

          <!-- Status Filter -->
          <div class="flex items-center gap-2 flex-shrink-0">
            <button 
              @click="statusFilter = 'all'"
              class="btn btn-xs rounded-full font-semibold"
              :class="statusFilter === 'all' ? 'btn-primary' : 'btn-ghost border border-base-300'"
            >
              Todos ({{ totalCount }})
            </button>
            <button 
              @click="statusFilter = 'pending'"
              class="btn btn-xs rounded-full font-semibold"
              :class="statusFilter === 'pending' ? 'btn-warning' : 'btn-ghost border border-base-300'"
            >
              Pendientes ({{ pendingCount }})
            </button>
            <button 
              @click="statusFilter = 'paid'"
              class="btn btn-xs rounded-full font-semibold"
              :class="statusFilter === 'paid' ? 'btn-success' : 'btn-ghost border border-base-300'"
            >
              Pagados ({{ paidCount }})
            </button>
          </div>

          <!-- Table of Members -->
          <div class="overflow-auto w-full border border-base-200 rounded-lg flex-1 min-h-0">
            <table class="table table-zebra w-full text-xs md:text-sm">
              <thead class="sticky top-0 z-10">
                <tr class="bg-base-200/50 text-base-content/70">
                  <th class="py-2 px-3 font-bold text-[11px] uppercase tracking-wider">Socio</th>
                  <th class="py-2 px-3 font-bold text-[11px] uppercase tracking-wider text-center">Estado</th>
                  <th class="py-2 px-3 font-bold text-[11px] uppercase tracking-wider text-right">Total Recaudado</th>
                  <th class="py-2 px-3 font-bold text-[11px] uppercase tracking-wider text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                <tr 
                  v-for="member in filteredMembers" 
                  :key="member.id"
                  class="hover:bg-base-200/30 transition-all border-l-4 border-transparent"
                  :class="{ 'bg-teal-50/40 hover:bg-teal-50/60 border-l-teal-700': selectedMemberValue?.id === member.id }"
                >
                  <td class="py-2.5 px-3">
                    <div class="flex items-center gap-3">
                      <div 
                        class="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0"
                        :style="{ backgroundColor: memberSelection.getMemberColor(member.id) }"
                      >
                        {{ memberSelection.getInitials(member.name) }}
                      </div>
                      <span class="font-semibold text-base-content text-xs">{{ member.name }}</span>
                    </div>
                  </td>
                  <td class="py-2.5 px-3 text-center">
                    <span 
                      v-if="paymentCollection.isMemberPaid(member.id)" 
                      class="badge badge-success badge-sm font-semibold py-2 px-3 text-xs"
                    >
                      Pagado
                    </span>
                    <span 
                      v-else 
                      class="badge badge-warning badge-sm font-semibold py-2 px-3 text-xs"
                    >
                      Pendiente
                    </span>
                  </td>
                  <td class="py-2.5 px-3 text-right">
                    <span class="font-bold text-xs text-emerald-600">{{ formatCurrency(getMemberCollected(member.name)) }}</span>
                  </td>
                  <td class="py-2.5 px-3 text-right">
                    <button 
                      @click="handleSelectMember(member)"
                      class="btn btn-sm text-xs font-semibold rounded-lg animate-none"
                      :class="paymentCollection.isMemberPaid(member.id) ? 'btn-ghost text-teal-750 bg-transparent hover:bg-base-200' : (selectedMemberValue?.id === member.id ? 'btn-neutral' : 'btn-primary')"
                    >
                      {{ paymentCollection.isMemberPaid(member.id) ? 'Ver Recibo' : (selectedMemberValue?.id === member.id ? 'Editando...' : 'Registrar Pago') }}
                    </button>
                  </td>
                </tr>
                <tr v-if="filteredMembers.length === 0">
                  <td colspan="4" class="text-center py-8 text-base-content/50">
                    No se encontraron socios.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Modales -->
        <EditLoanPaymentModal
          :visible="paymentCollection.isLoanModalOpen.value"
          :due="paymentCollection.editingLoanDue.value"
          @close="() => paymentCollection.isLoanModalOpen.value = false"
          @save="paymentCollection.handleLoanPaymentUpdate"
        />
        <EditFineModal
          :visible="paymentCollection.isFineModalOpen.value"
          :initial-data="paymentCollection.editingFineData.value"
          @close="() => paymentCollection.isFineModalOpen.value = false"
          @save="paymentCollection.handleFineUpdate"
        />
        <NoveltyModal
          v-if="paymentCollection.isNoveltyModalOpen.value"
          :visible="paymentCollection.isNoveltyModalOpen.value"
          :available-dues="paymentCollection.memberDues.value"
          @close="() => paymentCollection.isNoveltyModalOpen.value = false"
          @save="paymentCollection.handleNoveltySave"
        />
      </div>

      <!-- Panel Derecho (Sidebar de Resumen / Formulario / Recibo) - 5 Columnas -->
      <div class="lg:col-span-5 card bg-base-100 border border-base-200 shadow-sm rounded-xl p-4 md:p-5 flex flex-col h-full min-h-0 overflow-auto">
        <!-- Vista 1: Formulario de Pago o Detalle (Socio Seleccionado) -->
        <div v-if="hasSelectedMember" class="space-y-4">
          <!-- Back button and Header -->
          <div class="flex items-center justify-between border-b border-base-200 pb-3 mb-2">
            <button 
              @click="memberSelection.clearSelection()"
              class="btn btn-ghost btn-sm gap-2 text-base-content/60 hover:text-base-content font-semibold text-xs normal-case pl-0 bg-transparent hover:bg-transparent"
            >
              <NavArrowLeft class="w-4 h-4" />
              <span>Cerrar Detalles</span>
            </button>
            <span class="text-xs font-bold uppercase tracking-wider text-base-content/40">Registro de Cobro</span>
          </div>

          <!-- Operation Details View -->
          <PaymentReceiptView
            v-if="hasViewedOperations"
            :member-name="selectedMemberValue?.name || ''"
            :print-date="memberSelection.printDate.value"
            :viewed-operations="memberSelection.viewedOperations.value || []"
            :viewed-total="memberSelection.viewedTotal.value"
            @open-print-modal="printReceipt.openPrintModal"
          />
          
          <!-- Payment Form View -->
          <PaymentForm
            v-else
            :member-name="selectedMemberValue?.name || ''"
            :print-date="memberSelection.printDate.value"
            :loading-dues="paymentCollection.loadingDues.value"
            :stock-dues="paymentCollection.stockDues.value"
            :loan-dues="paymentCollection.loanDues.value"
            :other-dues="paymentCollection.otherDues.value"
            :novelty-payments="paymentCollection.noveltyPayments.value"
            :payments="paymentCollection.payments.value"
            :total-to-pay="paymentCollection.totalToPay.value"
            :total-interest="paymentCollection.totalInterest.value"
            :is-submitting="paymentCollection.isSubmitting.value"
            @submit="handlePayment"
            @print="printFormReceipt.printReceipt"
            @edit-payment="paymentCollection.editPayment"
            @delete-payment="paymentCollection.deletePayment"
            @add-fine="paymentCollection.addFine"
            @add-novelty="paymentCollection.addNovelty"
            @delete-novelty="paymentCollection.deleteNovelty"
          />
        </div>

        <!-- Vista 2: Resumen de Cobros (Ningún Socio Seleccionado) -->
        <div v-else class="space-y-4">
          <h3 class="text-sm font-bold text-base-content border-b border-base-200 pb-3 mb-2">Resumen de Cobros</h3>
          
          <!-- Metrics List -->
          <div class="space-y-3.5">
            <div class="flex justify-between items-baseline text-xs">
              <span class="text-base-content/60 font-medium">Recaudo Total:</span>
              <span class="font-bold text-emerald-600 text-sm">{{ formatCurrency(totalCollected) }}</span>
            </div>
            <div class="flex justify-between items-baseline text-xs">
              <span class="text-base-content/60 font-medium">Socios que Pagaron:</span>
              <span class="font-bold text-base-content text-sm">{{ paidCount }} / {{ totalCount }}</span>
            </div>
            <div class="flex justify-between items-baseline text-xs">
              <span class="text-base-content/60 font-medium">Porcentaje Recaudado:</span>
              <span class="font-bold text-base-content text-sm">{{ totalCount > 0 ? ((paidCount / totalCount) * 100).toFixed(0) : 0 }}%</span>
            </div>
          </div>

          <!-- Circular Chart -->
          <div class="flex justify-center py-4">
            <div class="relative w-28 h-28 flex items-center justify-center">
              <svg class="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <!-- Outer circle track -->
                <circle class="text-base-200" stroke-width="8" stroke="currentColor" fill="transparent" r="40" cx="50" cy="50" />
                <!-- Progress circle -->
                <circle class="text-teal-700 transition-all duration-500" stroke-width="8" :stroke-dasharray="251.2" :stroke-dashoffset="251.2 - (251.2 * (totalCount > 0 ? paidCount / totalCount : 0))" stroke-linecap="round" stroke="currentColor" fill="transparent" r="40" cx="50" cy="50" />
              </svg>
              <div class="absolute flex flex-col items-center justify-center text-center">
                <span class="text-xl font-extrabold text-base-content leading-none">{{ paidCount }}</span>
                <span class="text-[10px] text-base-content/50 uppercase font-bold tracking-wider mt-1">Socios Al Día</span>
              </div>
            </div>
          </div>

          <!-- Info Box -->
          <div class="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex gap-3 text-xs leading-relaxed text-blue-800">
            <!-- Info Icon -->
            <InfoCircle class="h-5 w-5 text-blue-600 shrink-0" />
            <p>
              Una vez registrados todos los cobros, haz clic en <strong>'Siguiente Paso'</strong> para proceder con el Paso 2: Cálculo de Revalorización.
            </p>
          </div>

          <!-- Actions -->
          <div class="flex flex-col gap-2.5 pt-2">
            <button 
              class="btn btn-block bg-teal-850 hover:bg-teal-900 text-white font-semibold rounded-lg text-sm border-0" 
              @click="goToNextStep"
            >
              Siguiente Paso: Revalorización
            </button>
            <button 
              class="btn btn-block btn-outline border-base-300 hover:bg-base-200 hover:text-base-content text-sm font-semibold rounded-lg"
              @click="saveDraft"
            >
              Guardar Borrador
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Modales adicionales de impresión -->
    <PrintReceiptModal
      :is-open="printReceipt.isPrintModalOpen.value"
      :member-name="selectedMemberValue?.name || null"
      :print-date="memberSelection.printDate.value"
      :viewed-operations="memberSelection.viewedOperations.value"
      :viewed-total="memberSelection.viewedTotal.value"
      @close="printReceipt.closePrintModal"
      @print="printReceipt.printReceipt"
    />

    <PrintAllDraftsModal
      :is-open="isPrintAllModalOpen"
      :members="membersList"
      :print-date="memberSelection.printDate.value"
      @close="isPrintAllModalOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
// 1. Imports
import { ref, computed, onMounted, watch } from 'vue'
import { WarningTriangle, NavArrowLeft, Printer, Search, InfoCircle } from 'iconoir-vue/regular'
import { useActiveMeetingStore } from '../../stores/activeMeeting'
import { usePaymentCollection } from '../../composables/usePaymentCollection'
import { useMemberSelection } from '../../composables/useMemberSelection'
import { usePrintReceipt } from '@/shared/composables/usePrintReceipt'
import { formatCurrency } from '@/shared/utils/formatters'
import PaymentForm from './collection/PaymentForm.vue'
import PaymentReceiptView from './collection/PaymentReceiptView.vue'
import PrintReceiptModal from '@/shared/components/PrintReceiptModal.vue'
import EditLoanPaymentModal from './EditLoanPaymentModal.vue'
import EditFineModal from './EditFineModal.vue'
import NoveltyModal from './NoveltyModal.vue'
import PrintAllDraftsModal from './collection/PrintAllDraftsModal.vue'
// Estilos de impresión importados
import './Step1Collection.print.css'

// 2. Props y emits
defineEmits<{
  completed: []
}>()

// 3. Composables y stores
const store = useActiveMeetingStore()
const paymentCollection = usePaymentCollection()
const memberSelection = useMemberSelection(paymentCollection)
const printReceipt = usePrintReceipt(
  memberSelection.selectedMember
)
const printFormReceipt = usePrintReceipt(
  memberSelection.selectedMember,
  'payment-form-receipt',
  'payment-receipt-print-container',
  'payment-receipt-print'
)

// 4. Reactive state
const isPrintAllModalOpen = ref(false)
const searchQuery = ref('')
const statusFilter = ref<'all' | 'pending' | 'paid'>('all')

// 5. Computed properties
const totalCollected = computed(() =>
  paymentCollection.completedPayments.value.reduce((sum, p) => sum + p.amount, 0)
)

// Computed para de-enrollar refs para el template
const isLoadingMembers = computed(() => memberSelection.loadingMembers.value)
const memberError = computed(() => memberSelection.error.value)
const membersList = computed(() => memberSelection.members.value)
const selectedMemberValue = computed(() => memberSelection.selectedMember.value)
const hasSelectedMember = computed(() => !!memberSelection.selectedMember.value)
const hasViewedOperations = computed(() => !!memberSelection.viewedOperations.value)

const paidCount = computed(() =>
  membersList.value.filter(m => paymentCollection.isMemberPaid(m.id)).length
)

const pendingCount = computed(() =>
  membersList.value.filter(m => !paymentCollection.isMemberPaid(m.id)).length
)

const totalCount = computed(() =>
  membersList.value.length
)

const filteredMembers = computed(() => {
  let result = membersList.value
  
  // Filter by status
  if (statusFilter.value === 'paid') {
    result = result.filter(m => paymentCollection.isMemberPaid(m.id))
  } else if (statusFilter.value === 'pending') {
    result = result.filter(m => !paymentCollection.isMemberPaid(m.id))
  }
  
  // Filter by search query
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(m => m.name.toLowerCase().includes(query))
  }
  
  return result
})

function getMemberCollected(memberName: string): number {
  const payment = paymentCollection.completedPayments.value.find(
    p => p.memberName === memberName
  )
  return payment?.amount || 0
}

// 6. Methods
async function handleSelectMember(member: any) {
  await memberSelection.selectMember(member)
}

async function handlePayment() {
  try {
    await paymentCollection.handlePayment()
    // Limpiar selección después del pago
    memberSelection.clearSelection()
    // Refrescar pagos de la reunión
    if (store.meetingId) {
      await paymentCollection.fetchMeetingPayments(
        store.meetingId,
        memberSelection.members.value
      )
    }
    // Refrescar la reunión activa para obtener el summary actualizado
    await store.refreshActiveMeeting()
  } catch (error) {
    console.error('Error al registrar pago:', error)
  }
}

function goToNextStep() {
  store.nextStep()
}

function saveDraft() {
  alert('Borrador guardado localmente.')
}

// 7. Lifecycle hooks
onMounted(async () => {
  await memberSelection.loadMembers()
})

// Watcher para cuando el meetingId cambie
watch(
  () => store.meetingId,
  async (newMeetingId, oldMeetingId) => {
    if (newMeetingId && newMeetingId !== oldMeetingId && memberSelection.members.value.length > 0) {
      await paymentCollection.fetchMeetingPayments(
        newMeetingId,
        memberSelection.members.value
      )
    }
  }
)
</script>


<style scoped>
/* Estilos locales si son necesarios */
</style>
