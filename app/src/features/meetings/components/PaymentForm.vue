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
              <p v-if="due.monthlyContribution && due.stockQuantity" class="text-sm text-base-content/70">
                {{ formatNumber(Number(due.stockQuantity || 0)) }} uds. x {{ formatNumber(due.monthlyContribution) }} c/u
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
              <div class="flex justify-between"><span>Saldo actual:</span> <span>{{ formatNumber(due.details.outstanding_balance) }}</span></div>
              <div class="flex justify-between"><span>Abono Capital:</span> <span>{{ formatNumber(payments[due.originalIndex].amount - due.details.interest) }}</span></div>
              <div class="flex justify-between"><span>Intereses:</span> <span class="font-semibold text-accent">{{ formatNumber(due.details.interest) }}</span></div>
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
      
      <div class="mt-8 text-right">
        <button type="submit" class="btn btn-primary btn-lg" :disabled="isSubmitting || payments.length === 0">
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
import { useActiveMeetingStore } from '../stores/activeMeeting';
import EditLoanPaymentModal from './EditLoanPaymentModal.vue';
import EditFineModal from './EditFineModal.vue';
import { formatNumber } from '@/shared/formatters'
import NoveltyModal from './NoveltyModal.vue';

const props = defineProps<{
  member: Member;
}>();

const emit = defineEmits(['success']);

const activeMeetingStore = useActiveMeetingStore();

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
    if (editingFineIndex.value !== null) {
        const index = editingFineIndex.value;
        memberDues.value[index].description = data.description;
        memberDues.value[index].amount = data.amount;
        payments.value[index].amount = data.amount;
        payments.value[index].description = data.description;
    } else {
        const fineDue: MemberDue = {
            type: 'fee',
            description: data.description,
            amount: data.amount,
        };
        memberDues.value.push(fineDue);
        const finePayment: Payment = {
            type: 'fee',
            description: data.description,
            amount: data.amount,
        };
        payments.value.push(finePayment);
    }
    isFineModalOpen.value = false;
    editingFineIndex.value = null;
    editingFineData.value = null;
}

async function handleLoanPaymentUpdate(newAmount: number) {
    if(editingLoanIndex.value !== null) {
        payments.value[editingLoanIndex.value].amount = newAmount;
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
    if (Number(payment.amount || 0) === 0) {
      return [];
    }
    const due = memberDues.value[index];
    let description = payment.description;
    let noveltyComment = payment.noveltyComment;
    if (due) {
      if (due.type === 'stock_fee' && due.stockQuantity && due.monthlyContribution) {
        description = `${due.description}, ${Number(due.stockQuantity).toFixed(2)} uds. x ${due.monthlyContribution.toFixed(2)} c/u`;
      } else if (due.type === 'loan_payment' && due.details) {
        const interest = due.details.interest || 0;
        const principal = payment.amount - interest;
        description = `${due.description}, Abono Capital: ${principal.toFixed(2)}, Intereses: ${interest.toFixed(2)}`;
      }
    }
    if (payment.type === 'novelty') {
      return [{ ...payment, description, noveltyComment }];
    }
    return [{ ...payment, description }];
  });
  
  const payload: { memberId: string, payments: Payment[] } = {
    memberId: props.member.id,
    payments: processedPayments,
  };

  try {
    isSubmitting.value = true;
    submissionError.value = null;
    await meetingsService.recordMonthlyPayment(payload as any);
    alert(`Pago de ${totalToPay.value.toFixed(2)} registrado para ${props.member.name}.`);
    emit('success');
  } catch (err: any) {
    submissionError.value = err.response?.data?.message || 'Error al registrar el pago.';
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
      memberDues.value[insuranceDueIndex].amount = insuranceAmount;
      payments.value[insuranceDueIndex].amount = insuranceAmount;
    } else if (insuranceAmount > 0) {
      const insuranceDue: MemberDue = { type: 'insurance', description: 'Seguro de deuda', amount: insuranceAmount };
      memberDues.value.push(insuranceDue);
      payments.value.push({ type: 'insurance', description: 'Seguro de deuda', amount: insuranceAmount });
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
      amount: due.amount,
      referenceId: due.referenceId,
    }));
  } catch (err: any) {
     console.error("Error fetching member dues:", err);
     duesError.value = err.response?.data?.message || 'Error al cargar las deudas del socio.';
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
  payments.value.push({
    type: 'novelty',
    description: data.comment || 'Novedad',
    amount: Math.abs(data.amount),
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
</script> 