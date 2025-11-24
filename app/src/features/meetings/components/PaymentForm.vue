<template>
  <EditLoanPaymentModal
    :visible="isLoanModalOpen"
    :due="editingLoanDue"
    @close="isLoanModalOpen = false"
    @save="handleLoanPaymentUpdate"
  />
  <EditFineModal
    :visible="isFineModalOpen"
    :initial-data="editingFineData"
    @close="isFineModalOpen = false"
    @save="handleFineUpdate"
  />

  <div v-if="isDuesLoading" class="flex items-center justify-center h-96">
    <span class="loading loading-spinner loading-lg"></span>
  </div>
  <div v-else-if="duesError" class="alert alert-error">
    <span>{{ duesError }}</span>
  </div>
  <div v-else class="bg-base-100 p-6 rounded-2xl shadow-lg font-sans">
    <div class="text-center mb-6">
      <h2 class="text-2xl font-bold">Recibo de Pago</h2>
      <p class="text-lg text-base-content/80">{{ member.name }}</p>
    </div>

    <form @submit.prevent="handleRecordTransaction">
      <div class="space-y-6">
        <!-- Acciones -->
        <div v-if="stockDues.length > 0">
          <h2 class="text-2xl font-semibold mb-3 pb-2 border-b-2 border-base-300/70">Acciones</h2>
          <div v-for="due in stockDues" :key="due.originalIndex" class="flex items-baseline py-3">
            <div class="flex-shrink-0">
              <p class="font-semibold text-xl">{{ due.description }}</p>
              <p v-if="due.stockQuantity" class="text-sm text-base-content/70">
                {{ formatNumber(Number(due.stockQuantity || 0)) }} uds. x {{ formatNumber(due.monthlyContribution || 0) }} c/u
              </p>
            </div>
            <div class="flex-grow border-b-2 border-dotted border-base-300/70 mx-4"></div>
            <div class="flex-shrink-0">
              <p class="w-48 text-right font-mono text-2xl">{{ formatNumber(payments[due.originalIndex].amount) }}</p>
            </div>
          </div>
        </div>

        <!-- Préstamos -->
        <div v-if="loanDues.length > 0">
          <h4 class="text-2xl font-semibold mb-3 pb-2 border-b-2 border-base-300/70">Préstamos</h4>
          <div v-for="due in loanDues" :key="due.originalIndex" class="py-3">
            <div class="flex items-baseline">
              <p class="font-semibold text-xl flex-shrink-0">{{ due.description }}</p>
              <div class="flex-grow border-b-2 border-dotted border-base-300/70 mx-4"></div>
              <div class="flex-shrink-0 flex items-center gap-2 min-w-0">
                <button type="button" @click="editPayment(due.originalIndex)" class="btn btn-ghost btn-xs">Editar</button>
                <p class="text-right font-mono text-2xl whitespace-nowrap">{{ formatNumber(payments[due.originalIndex].amount) }}</p>
              </div>
            </div>
            <div v-if="due.details" class="w-full pl-4 mt-2 space-y-1 text-md text-base-content/80 border-l-2 border-base-300/80">
              <div class="flex justify-between"><span>Saldo actual:</span> <span>{{ formatNumber(due.details.outstandingBalance ?? due.details.outstanding_balance ?? 0) }}</span></div>
              <div class="flex justify-between"><span>Abono Capital:</span> <span>{{ formatNumber(payments[due.originalIndex].amount - due.details.interest) }}</span></div>
              <div class="flex justify-between"><span>Intereses:</span> <span class="font-semibold text-accent">{{ formatNumber(due.details.interest) }}</span></div>
              <div v-if="due.creationDate" class="flex justify-between text-sm text-base-content/60"><span>Fecha préstamo:</span> <span>{{ formatDate(due.creationDate) }}</span></div>
            </div>
          </div>
        </div>

        <!-- Otros Aportes -->
        <div>
          <div class="flex justify-between items-center">
            <h4 class="text-2xl font-semibold mb-3 pb-2 border-b-2 border-base-300/70">Otros Aportes</h4>
            <button type="button" @click="addFine" class="btn btn-sm btn-outline btn-accent">+ Otro pago</button>
          </div>
          <div v-if="otherDues.length > 0">
            <div v-for="due in otherDues" :key="due.originalIndex" class="flex items-baseline py-3">
              <p class="font-semibold text-xl flex-shrink-0">{{ due.description }}</p>
              <div class="flex-grow border-b-2 border-dotted border-base-300/70 mx-4"></div>
              <div class="flex-shrink-0 flex items-center gap-2">
                <div class="w-32 text-right">
                  <template v-if="due.type === 'fee'">
                    <button type="button" @click="editPayment(due.originalIndex)" class="btn btn-ghost btn-xs">Editar</button>
                    <button type="button" @click="deletePayment(due.originalIndex)" class="btn btn-ghost btn-xs text-error">Borrar</button>
                  </template>
                </div>
                <p class="w-36 text-right font-mono text-2xl">{{ formatNumber(payments[due.originalIndex].amount) }}</p>
              </div>
            </div>
          </div>
          <p v-else class="text-sm text-base-content/50 italic mt-2">Sin aportes adicionales.</p>
        </div>

        <!-- Novedades -->
        <div class="mt-8">
          <div class="flex justify-between items-center">
            <h4 class="text-2xl font-semibold mb-3 pb-2 border-b-2 border-base-300/70 text-error">Novedades</h4>
            <button type="button" @click="addNovelty" class="btn btn-sm btn-outline btn-error">+ Novedad</button>
          </div>
          <div v-if="noveltyPayments.length > 0">
            <div v-for="(novelty, idx) in noveltyPayments" :key="idx" class="flex items-baseline py-3 text-error">
              <div class="flex-grow">
                <p class="font-semibold text-xl">{{ novelty.description }}</p>
                <p v-if="novelty.noveltyComment" class="text-sm italic">{{ novelty.noveltyComment }}</p>
              </div>
              <div class="flex-grow border-b-2 border-dotted border-error/40 mx-4"></div>
              <div class="flex-shrink-0 flex items-center gap-2">
                <button type="button" @click="deleteNovelty(idx)" class="btn btn-ghost btn-xs text-error">Borrar</button>
                <p class="w-36 text-right font-mono text-2xl">-{{ formatNumber(novelty.amount) }}</p>
              </div>
            </div>
          </div>
          <p v-else class="text-sm text-error/50 italic mt-2">Sin novedades registradas.</p>
        </div>

        <!-- Modal Novedad -->
        <NoveltyModal v-if="isNoveltyModalOpen" :visible="isNoveltyModalOpen" @close="isNoveltyModalOpen = false" @save="handleNoveltySave" />
      </div>

      <div v-if="payments.length === 0 && otherDues.length === 0" class="text-center my-8 text-base-content/60">
        <p>Este socio no tiene deudas pendientes para esta reunión.</p>
      </div>

      <!-- Totales -->
      <div class="mt-8 pt-4 border-t-2 border-dashed border-base-300/50 space-y-3">
        <div class="flex items-baseline text-2xl font-bold">
          <span class="flex-shrink-0">Total a Pagar:</span>
          <div class="flex-grow border-b-2 border-dotted border-base-300/70 mx-4"></div>
          <span class="flex-shrink-0 text-primary font-mono">{{ formatNumber(totalToPay) }}</span>
        </div>
        <div v-if="totalInterest > 0" class="flex items-baseline text-lg text-base-content/80">
          <span class="flex-shrink-0">Total Intereses:</span>
          <div class="flex-grow border-b-2 border-dotted border-base-300/70 mx-4"></div>
          <span class="flex-shrink-0 font-mono">{{ formatNumber(totalInterest) }}</span>
        </div>
      </div>
      
      <div class="mt-8 flex justify-between items-center">
        <button type="button" @click="printReceipt" class="btn btn-outline btn-secondary no-print">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Imprimir Recibo
        </button>
        <button type="submit" class="btn btn-primary btn-lg no-print" :disabled="isSubmitting || payments.length === 0">
          <span v-if="isSubmitting" class="loading loading-spinner"></span>
          Confirmar Pago
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { Member } from '@/features/members/types';
import type { MemberDue, Payment } from '../types';
import { meetingsService } from '@/features/meetings/services/meetings';
// Store not used in current implementation
// import { useActiveMeetingStore } from '../stores/activeMeeting';
import EditLoanPaymentModal from './EditLoanPaymentModal.vue';
import EditFineModal from './EditFineModal.vue';
import { formatNumber } from '@/shared/formatters'

// Función para formatear fecha
function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}
import NoveltyModal from './NoveltyModal.vue';

const props = defineProps<{
  member: Member;
}>();

const emit = defineEmits(['success']);

// Store not used in current implementation
// const activeMeetingStore = useActiveMeetingStore();

const memberDues = ref<MemberDue[]>([]);
const payments = ref<Payment[]>([]);

const isDuesLoading = ref(false);
const isSubmitting = ref(false);
const duesError = ref<string | null>(null);
const submissionError = ref<string | null>(null);

const isLoanModalOpen = ref(false);
const editingLoanIndex = ref<number | null>(null);

const isFineModalOpen = ref(false);
const editingFineData = ref<{ description: string, amount: number } | null>(null);
const editingFineIndex = ref<number | null>(null);

const editingLoanDue = computed(() => {
    if(editingLoanIndex.value === null) return null;
    return indexedDues.value.find(due => due.originalIndex === editingLoanIndex.value) || null;
});

const indexedDues = computed(() => 
  memberDues.value.map((due, index) => ({...due, originalIndex: index}))
);

const stockDues = computed(() => 
  indexedDues.value.filter(due => due.type === 'stock_fee')
);

const otherDues = computed(() =>
  indexedDues.value.filter(
    due =>
      (due.type === 'mandatory_contribution' ||
        due.type === 'fee' ||
        due.type === 'insurance') && due.amount > 0,
  )
);

const loanDues = computed(() =>
  indexedDues.value.filter(due => due.type === 'loan_payment')
);

const totalToPay = computed(() => {
    if (!payments.value) return 0;
    return payments.value.reduce((sum, payment) => {
      if (payment.type === 'novelty') {
        return sum - Number(payment.amount || 0);
      }
      return sum + Number(payment.amount || 0);
    }, 0);
});

const totalInterest = computed(() => {
  return loanDues.value.reduce((sum, due) => sum + (due.details?.interest || 0), 0);
});

function handleFineUpdate(data: { description: string, amount: number }) {
    const amount = Number(data.amount) || 0; // Asegurar que amount sea un número válido
    if (editingFineIndex.value !== null) {
        const index = editingFineIndex.value;
        memberDues.value[index].description = data.description;
        memberDues.value[index].amount = amount;
        payments.value[index].amount = amount;
        payments.value[index].description = data.description;
    } else {
        const fineDue: MemberDue = {
            type: 'fee',
            description: data.description,
            amount: amount,
        };
        memberDues.value.push(fineDue);
        const finePayment: Payment = {
            type: 'fee',
            description: data.description,
            amount: amount,
        };
        payments.value.push(finePayment);
    }
    isFineModalOpen.value = false;
    editingFineIndex.value = null;
    editingFineData.value = null;
}

async function handleLoanPaymentUpdate(newAmount: number) {
    const amount = Number(newAmount) || 0; // Asegurar que amount sea un número válido
    if(editingLoanIndex.value !== null) {
        payments.value[editingLoanIndex.value].amount = amount;
    }
    isLoanModalOpen.value = false;
    await recalculateInsurance();
    editingLoanIndex.value = null;
}

function deletePayment(index: number) {
    const originalDueIndex = indexedDues.value.findIndex(d => d.originalIndex === index);
    if (originalDueIndex > -1) {
        memberDues.value.splice(originalDueIndex, 1);
        payments.value.splice(originalDueIndex, 1);
    }
}

function editPayment(index: number) {
    const dueType = memberDues.value[index].type;
    if (dueType === 'loan_payment') {
        editingLoanIndex.value = index;
        isLoanModalOpen.value = true;
    } else if (dueType === 'fee') {
        editingFineIndex.value = index;
        editingFineData.value = {
            description: memberDues.value[index].description,
            amount: payments.value[index].amount,
        };
        isFineModalOpen.value = true;
    }
}

function addFine() {
    editingFineIndex.value = null;
    editingFineData.value = null; // Use null to signal creation
    isFineModalOpen.value = true;
}

async function handleRecordTransaction() {
  if (!props.member || !payments.value) {
    alert('No hay un socio seleccionado o datos de pago.');
    return;
  }
  const processedPayments = payments.value.flatMap((payment, index) => {
    // Convertir amount a número y validar que sea positivo
    const amount = Number(payment.amount);
    if (isNaN(amount) || amount <= 0) {
      return [];
    }
    
    const due = memberDues.value[index];
    let description = payment.description;
    const noveltyComment = payment.noveltyComment;
    if (due) {
      if (due.type === 'stock_fee' && due.stockQuantity && due.monthlyContribution) {
        description = `${due.description}, ${Number(due.stockQuantity).toFixed(2)} uds. x ${due.monthlyContribution.toFixed(2)} c/u`;
      } else if (due.type === 'loan_payment' && due.details) {
        const interest = due.details.interest || 0;
        const principal = amount - interest;
        description = `${due.description}, Abono Capital: ${principal.toFixed(2)}, Intereses: ${interest.toFixed(2)}`;
      }
    }
    
    // Asegurar que amount sea un número válido en el objeto de respuesta
    const processedPayment: Payment = {
      ...payment,
      amount: amount, // Asegurar que es un número válido
      description,
    };
    
    if (payment.type === 'novelty') {
      processedPayment.noveltyComment = noveltyComment;
    }
    
    return [processedPayment];
  });
  
  const payload: { memberId: string, payments: Payment[] } = {
    memberId: props.member.id,
    payments: processedPayments,
  };

  try {
    isSubmitting.value = true;
    submissionError.value = null;
    await meetingsService.recordMonthlyPayment(payload);
    alert(`Pago de ${totalToPay.value.toFixed(2)} registrado para ${props.member.name}.`);
    emit('success');
  } catch (err: unknown) {
    const error = err as { response?: { data?: { message?: string } } };
    submissionError.value = error.response?.data?.message || 'Error al registrar el pago.';
    alert(`Error: ${submissionError.value}`);
  } finally {
    isSubmitting.value = false;
  }
}

async function recalculateInsurance() {
  if (!props.member) return;
  let totalCapitalPayment = 0;
  payments.value.forEach((payment, index) => {
    const due = memberDues.value[index];
    if (due && due.type === 'loan_payment' && due.details) {
      const capitalPortion = payment.amount - due.details.interest;
      totalCapitalPayment += capitalPortion > 0 ? capitalPortion : 0;
    }
  });

  try {
    const { insuranceAmount } = await meetingsService.calculateInsurance(
      props.member.id,
      totalCapitalPayment,
    );
    const insuranceDueIndex = memberDues.value.findIndex((d) => d.type === 'insurance');
    if (insuranceDueIndex !== -1) {
      const amount = Number(insuranceAmount) || 0; // Asegurar que amount sea un número válido
      memberDues.value[insuranceDueIndex].amount = amount;
      payments.value[insuranceDueIndex].amount = amount;
    } else if (insuranceAmount > 0) {
      const amount = Number(insuranceAmount) || 0; // Asegurar que amount sea un número válido
      const insuranceDue: MemberDue = { type: 'insurance', description: 'Seguro de deuda', amount: amount };
      memberDues.value.push(insuranceDue);
      payments.value.push({ type: 'insurance', description: 'Seguro de deuda', amount: amount });
    }
  } catch (error) {
    console.error('Error recalculating insurance:', error);
  }
}

async function fetchDues(member: Member) {
  if (!member) return;
  isDuesLoading.value = true;
  duesError.value = null;
  memberDues.value = [];
  payments.value = [];
  
  try {
    const dues = await meetingsService.getMemberDues(member.id);
    const capitalPayment = dues.filter(due => due.type === 'loan_payment').reduce((sum, due) => sum + (due.details?.principal || 0), 0);
    const { insuranceAmount } = await meetingsService.calculateInsurance(member.id, capitalPayment);
    if (insuranceAmount > 0) {
      dues.push({
        type: 'insurance',
        description: 'Seguro de deuda',
        amount: insuranceAmount,
      });
    }

    memberDues.value = dues;
    payments.value = dues.map(due => ({
      type: due.type,
      description: due.description,
      amount: Number(due.amount) || 0, // Asegurar que amount sea un número válido
      referenceId: due.referenceId,
    }));
  } catch (err: unknown) {
     const error = err as { response?: { data?: { message?: string } } };
     console.error("Error fetching member dues:", err);
     duesError.value = error.response?.data?.message || 'Error al cargar las deudas del socio.';
  } finally {
    isDuesLoading.value = false;
  }
}

watch(() => props.member, (newMember) => {
  if (newMember) {
    fetchDues(newMember);
  }
}, { immediate: true });

// Novedades
const isNoveltyModalOpen = ref(false);
const noveltyForm = ref<{ amount: number | null, comment: string }>({ amount: null, comment: '' });
const noveltyPayments = computed(() => payments.value.filter(p => p.type === 'novelty'));

function addNovelty() {
  noveltyForm.value = { amount: null, comment: '' };
  isNoveltyModalOpen.value = true;
}

function handleNoveltySave(data: { amount: number, comment: string }) {
  const amount = Number(data.amount) || 0; // Asegurar que amount sea un número válido
  payments.value.push({
    type: 'novelty',
    description: data.comment || 'Novedad',
    amount: Math.abs(amount),
    noveltyComment: data.comment,
  });
  isNoveltyModalOpen.value = false;
}

function deleteNovelty(idx: number) {
  // Elimina la novedad por índice relativo a noveltyPayments
  const allNovelty = payments.value.reduce<{ idx: number, i: number }[]>((acc, p, i) => {
    if (p.type === 'novelty') acc.push({ idx: acc.length, i });
    return acc;
  }, []);
  const toDelete = allNovelty.find(n => n.idx === idx);
  if (toDelete) payments.value.splice(toDelete.i, 1);
}

function printReceipt() {
  const currentDate = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const originalTitle = document.title;
  document.title = `Recibo_${props.member.name.replace(/\s+/g, '_')}_${currentDate.replace(/\//g, '-')}`;
  
  window.print();
  
  // Restaurar el título original después de la impresión
  setTimeout(() => {
    document.title = originalTitle;
  }, 1000);
}
</script>

<style>
@media print {
  /* Ocultar elementos que no deben imprimirse */
  .no-print {
    display: none !important;
  }
  
  /* Optimizar el layout para impresión */
  body * {
    visibility: hidden;
  }
  
  /* Mostrar solo el componente PaymentForm */
  .bg-base-100, .bg-base-100 * {
    visibility: visible;
  }
  
  /* Ajustar el contenedor para impresión */
  .bg-base-100 {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    box-shadow: none !important;
    margin: 0;
    padding: 20px;
  }
  
  /* Mejorar legibilidad en impresión */
  .text-base-content\/80,
  .text-base-content\/70,
  .text-base-content\/60,
  .text-base-content\/50 {
    color: #000 !important;
  }
  
  /* Asegurar que los bordes se vean bien */
  .border-base-300\/70,
  .border-base-300\/50,
  .border-base-300\/80 {
    border-color: #ccc !important;
  }
  
  .border-error\/40 {
    border-color: #f87171 !important;
  }
  
  /* Ajustar tamaños de fuente para impresión */
  .text-2xl {
    font-size: 1.25rem !important;
  }
  
  .text-xl {
    font-size: 1.125rem !important;
  }
}
</style> 