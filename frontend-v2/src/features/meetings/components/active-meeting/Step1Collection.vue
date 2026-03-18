<template>
  <div>
    <div v-if="isLoadingMembers" class="flex justify-center items-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div v-if="memberError && !isLoadingMembers" class="alert alert-error mb-4">
      <span>{{ memberError }}</span>
    </div>

    <div v-if="!isLoadingMembers && !memberError" class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Members List -->
      <div class="md:col-span-1">
        <!-- Resumen sticky - se mantiene visible al hacer scroll -->
        <PaymentSummary
          :total-collected="totalCollected"
          :completed-payments="paymentCollection.completedPayments.value"
        />
        <MemberList
          :members="membersList"
          :selected-member="selectedMemberValue"
          :is-member-paid="paymentCollection.isMemberPaid"
          :get-initials="memberSelection.getInitials"
          :get-member-color="memberSelection.getMemberColor"
          @select-member="handleSelectMember"
        />
      </div>

      <!-- Payment Form / Operation Details -->
      <div class="md:col-span-2">
      <div class="card bg-base-100 shadow-lg rounded-lg">
        <div class="card-body p-4 md:p-6">
            <div v-if="!hasSelectedMember" class="flex items-center justify-center h-64 text-base-content/60">
            <p class="text-center">Seleccione un socio para ver sus deudas o detalles de pago.</p>
          </div>
          
            <!-- Operation Details View -->
            <PaymentReceiptView
              v-else-if="hasViewedOperations"
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
        </div>
      </div>
    </div>
    
    <div class="mt-6 md:mt-8 pt-4 border-t">
      <div class="text-right mt-4">
        <button class="btn btn-success w-full md:w-auto" @click="$emit('completed')">
          Finalizar Solicitud de Aportes
        </button>
      </div>
    </div>

    <!-- Modal de Vista Previa e Impresión -->
    <PrintReceiptModal
      :is-open="printReceipt.isPrintModalOpen.value"
      :member-name="selectedMemberValue?.name || null"
      :print-date="memberSelection.printDate.value"
      :viewed-operations="memberSelection.viewedOperations.value"
      :viewed-total="memberSelection.viewedTotal.value"
      @close="printReceipt.closePrintModal"
      @print="printReceipt.printReceipt"
    />
  </div>
</template>

<script setup lang="ts">
// 1. Imports
import { computed, onMounted, watch } from 'vue'
import { useActiveMeetingStore } from '../../stores/activeMeeting'
import { usePaymentCollection } from '../../composables/usePaymentCollection'
import { useMemberSelection } from '../../composables/useMemberSelection'
import { usePrintReceipt } from '@/shared/composables/usePrintReceipt'
import MemberList from './collection/MemberList.vue'
import PaymentSummary from './collection/PaymentSummary.vue'
import PaymentForm from './collection/PaymentForm.vue'
import PaymentReceiptView from './collection/PaymentReceiptView.vue'
import PrintReceiptModal from '@/shared/components/PrintReceiptModal.vue'
import EditLoanPaymentModal from './EditLoanPaymentModal.vue'
import EditFineModal from './EditFineModal.vue'
import NoveltyModal from './NoveltyModal.vue'
// Estilos de impresión importados
import './Step1Collection.print.css'

// 2. Props y emits
const emit = defineEmits<{
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
// (Todo el estado está en los composables)

// 5. Computed properties
const totalCollected = computed(() =>
  paymentCollection.completedPayments.value.reduce((sum, p) => sum + p.amount, 0)
)

// Computed para desenrollar refs para el template
const isLoadingMembers = computed(() => memberSelection.loadingMembers.value)
const memberError = computed(() => memberSelection.error.value)
const membersList = computed(() => memberSelection.members.value)
const selectedMemberValue = computed(() => memberSelection.selectedMember.value)
const hasSelectedMember = computed(() => !!memberSelection.selectedMember.value)
const hasViewedOperations = computed(() => !!memberSelection.viewedOperations.value)

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
    // El error ya está manejado en el composable
    console.error('Error al registrar pago:', error)
  }
}

// 7. Lifecycle hooks
onMounted(async () => {
  await memberSelection.loadMembers()
})

// Watcher para cuando el meetingId cambie
watch(
  () => store.meetingId,
  async (newMeetingId, oldMeetingId) => {
    // Solo ejecutar si el meetingId realmente cambió y hay miembros cargados
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
