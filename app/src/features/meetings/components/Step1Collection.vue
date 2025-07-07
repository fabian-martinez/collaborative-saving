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
  <div>
    <h2 class="text-xl font-bold mb-4">Paso 1: Recaudo de Fondos</h2>

    <div v-if="isMembersLoading" class="flex justify-center items-center">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div v-if="membersError" class="alert alert-error">
      <span>{{ membersError }}</span>
    </div>

    <div v-if="!isMembersLoading && !membersError" class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Members List -->
      <div class="md:col-span-1">
        <h3 class="text-lg font-semibold mb-2">Socios</h3>
        <ul class="menu bg-base-200 w-full rounded-box">
          <li v-for="member in members" :key="member.id" @click="selectMember(member)" :class="{'disabled': isMemberPaid(member.id)}">
            <a :class="{ 'active': selectedMember && selectedMember.id === member.id }">
              {{ member.name }}
              <span v-if="isMemberPaid(member.id)" class="badge badge-success badge-sm">Pagado</span>
            </a>
          </li>
        </ul>
        <div class="mt-4 p-4 bg-base-200 rounded-box space-y-4">
            <div>
                <div class="text-center">
                    <div class="text-sm font-light text-base-content/70 uppercase">Total Aportes Recaudados</div>
                    <div class="text-3xl font-bold text-primary">{{ totalCollected.toFixed(2) }}</div>
                </div>
            </div>
            
            <div class="border-t border-base-300/50"></div>

            <div>
                <h4 class="font-semibold text-center text-base-content/80 mb-2">Pagos Registrados</h4>
                <div v-if="completedPayments.length > 0" class="space-y-2">
                    <div v-for="(payment, index) in completedPayments" :key="index" class="flex justify-between items-center bg-base-100/50 p-2 rounded-md text-sm">
                        <span class="font-medium">{{ payment.memberName }}</span>
                        <span class="font-mono text-success font-bold">+{{ payment.amount.toFixed(2) }}</span>
                    </div>
                </div>
                <p v-else class="text-base-content/60 italic text-sm text-center">Sin pagos aún.</p>
            </div>
        </div>
      </div>

      <!-- Payment Form -->
      <div class="md:col-span-2">
        <div v-if="isDuesLoading" class="flex items-center justify-center h-full">
            <span class="loading loading-spinner loading-lg"></span>
        </div>
        <div v-else-if="duesError" class="alert alert-error">
          <span>{{ duesError }}</span>
        </div>
        <div v-else-if="!selectedMember" class="flex items-center justify-center h-full text-gray-500">
          <p class="text-center">Seleccione un socio para ver sus deudas o detalles de pago.</p>
        </div>
        
        <!-- Operation Details View -->
        <div v-else-if="viewedOperations" class="bg-base-100 p-6 rounded-2xl shadow-lg font-sans">
           <div class="text-center mb-6">
             <h2 class="text-2xl font-bold">Detalle del Pago</h2>
              <p class="text-lg text-base-content/80">{{ selectedMember.name }}</p>
            </div>
            <div class="space-y-4">
              <OperationDetails 
                v-for="op in viewedOperations" 
                :key="op.id"
                :operation="op"
              />
               <div class="mt-8 pt-4 border-t-2 border-dashed border-base-300/50 text-right">
                <div class="flex items-baseline text-2xl font-bold">
                    <span class="flex-shrink-0">Total Pagado:</span>
                    <div class="flex-grow border-b-2 border-dotted border-base-300/70 mx-4"></div>
                    <span class="flex-shrink-0 text-primary font-mono">{{ viewedTotal.toFixed(2) }}</span>
                </div>
            </div>
            </div>
        </div>
        
        <!-- Payment Form View -->
        <div v-else class="bg-base-100 p-6 rounded-2xl shadow-lg font-sans">
          <div class="text-center mb-6">
             <h2 class="text-2xl font-bold">Recibo de Pago</h2>
              <p class="text-lg text-base-content/80">{{ selectedMember.name }}</p>
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
                        {{ due.stockQuantity }} uds. x {{ due.monthlyContribution?.toFixed(2) }} c/u
                      </p>
                    </div>
                    <div class="flex-grow border-b-2 border-dotted border-base-300/70 mx-4"></div>
                    <div class="flex-shrink-0">
                        <p class="w-48 text-right font-mono text-2xl">{{ payments[due.originalIndex].amount.toFixed(2) }}</p>
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
                        <div class="flex-shrink-0 flex items-center gap-2">
                          <button type="button" @click="editPayment(due.originalIndex)" class="btn btn-ghost btn-xs">Editar</button>
                          <p class="w-36 text-right font-mono text-2xl">{{ payments[due.originalIndex].amount.toFixed(2) }}</p>
                        </div>
                    </div>
                    <div v-if="due.details" class="w-full pl-4 mt-2 space-y-1 text-md text-base-content/80 border-l-2 border-base-300/80">
                      <div class="flex justify-between"><span>Saldo actual:</span> <span>{{ (due.details.outstanding_balance).toFixed(2) }}</span></div>
                      <div class="flex justify-between"><span>Abono Capital:</span> <span>{{ (payments[due.originalIndex].amount - due.details.interest).toFixed(2) }}</span></div>
                      <div class="flex justify-between"><span>Intereses:</span> <span class="font-semibold text-accent">{{ due.details.interest.toFixed(2) }}</span></div>
                    </div>
                  </div>
              </div>

              <!-- Otros Aportes -->
              <div>
                <div class="flex justify-between items-center">
                  <h4 class="text-2xl font-semibold mb-3 pb-2 border-b-2 border-base-300/70">Otros Aportes</h4>
                  <button type="button" @click="addFine" class="btn btn-sm btn-outline btn-accent">+ Multa</button>
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
                      <p class="w-36 text-right font-mono text-2xl">{{ payments[due.originalIndex].amount.toFixed(2) }}</p>
                    </div>
                  </div>
                 </div>
                 <p v-else class="text-sm text-base-content/50 italic mt-2">Sin aportes adicionales.</p>
              </div>
            </div>

            <div v-if="payments.length === 0 && otherDues.length === 0" class="text-center my-8 text-base-content/60">
                <p>Este socio no tiene deudas pendientes para esta reunión.</p>
            </div>

            <!-- Totales -->
            <div class="mt-8 pt-4 border-t-2 border-dashed border-base-300/50 space-y-3">
                <div class="flex items-baseline text-2xl font-bold">
                    <span class="flex-shrink-0">Total a Pagar:</span>
                    <div class="flex-grow border-b-2 border-dotted border-base-300/70 mx-4"></div>
                    <span class="flex-shrink-0 text-primary font-mono">{{ totalToPay.toFixed(2) }}</span>
                </div>
                <div v-if="totalInterest > 0" class="flex items-baseline text-lg text-base-content/80">
                    <span class="flex-shrink-0">Total Intereses:</span>
                    <div class="flex-grow border-b-2 border-dotted border-base-300/70 mx-4"></div>
                    <span class="flex-shrink-0 font-mono">{{ totalInterest.toFixed(2) }}</span>
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
      </div>
    </div>
    
    <div class="mt-8 pt-4 border-t">
        <div class="text-right mt-4">
            <button class="btn btn-success" @click="$emit('completed')">Finalizar Solicitud de Aportes</button>
        </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { membersService } from '@/features/members/services/membersService';
import { meetingsService } from '@/features/meetings/services/meetings';
import type { Member } from '@/features/members/types';
import type { MemberDue, Payment } from '../types';
import type { Operation } from '@/features/operations/types';
import { useActiveMeetingStore } from '../stores/activeMeeting';
import EditLoanPaymentModal from './EditLoanPaymentModal.vue';
import EditFineModal from './EditFineModal.vue';
import OperationDetails from '@/features/operations/components/operationDetails.vue';

const activeMeetingStore = useActiveMeetingStore();
const emit = defineEmits(['completed', 'update:totalCollected', 'update:totalInterest']);

const members = ref<Member[]>([]);
const selectedMember = ref<Member | null>(null);
const memberDues = ref<MemberDue[]>([]);
const payments = ref<Payment[]>([]);
const paidMemberIds = ref<string[]>([]);
const totalCollected = ref(0);
const completedPayments = ref<{ memberName: string, amount: number }[]>([]);
const paidMemberOperations = ref<Map<string, Operation[]>>(new Map());
const viewedOperations = ref<Operation[] | null>(null);

const isMembersLoading = ref(false);
const isDuesLoading = ref(false);
const isSubmitting = ref(false);
const membersError = ref<string | null>(null);
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

const viewedTotal = computed(() => {
    return viewedOperations.value?.reduce((sum, op) => sum + (op.total_debit || 0), 0) || 0;
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

const totalInterest = computed(() => {
  return loanDues.value.reduce((sum, due) => sum + (due.details?.interest || 0), 0);
});

function handleFineUpdate(data: { description: string, amount: number }) {
    if (editingFineIndex.value !== null) {
        // Editing existing fine
        const index = editingFineIndex.value;
        memberDues.value[index].description = data.description;
        memberDues.value[index].amount = data.amount;
        payments.value[index].amount = data.amount;
        payments.value[index].description = data.description;
    } else {
        // Adding new fine
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

function handleLoanPaymentUpdate(newAmount: number) {
    if(editingLoanIndex.value !== null) {
        payments.value[editingLoanIndex.value].amount = newAmount;
    }
    isLoanModalOpen.value = false;
    editingLoanIndex.value = null;
}

function deletePayment(index: number) {
    if (index > -1 && index < memberDues.value.length) {
        memberDues.value.splice(index, 1);
        payments.value.splice(index, 1);
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

onMounted(async () => {
  isMembersLoading.value = true;
  membersError.value = null;
  try {
    members.value = await membersService.getMembers();
    await fetchMeetingPayments(activeMeetingStore.meetingId || '');
  } catch (err: any) {
    membersError.value = err.message || 'Error al cargar los socios.';
  } finally {
    isMembersLoading.value = false;
  }
});

async function fetchMeetingPayments(meetingId: string) {
  try {
    if (!meetingId) {
      console.error('No meeting ID found');
      return;
    }
    const operations = await meetingsService.getMonthlyPayments(meetingId);
    const operationMap = new Map<string, Operation[]>();
    let total = 0;
    let totalInterest = 0;
    const paymentsList: { memberName: string; amount: number }[] = [];

    for (const op of operations) {
      if (!operationMap.has(op.member_id)) {
        operationMap.set(op.member_id, []);
      }
      operationMap.get(op.member_id)!.push(op);

      if (op.ledger_entries) {
        for (const entry of op.ledger_entries) {
          if (entry.account_type === 'INTEREST_INCOME') {
            totalInterest += Number(entry.amount) || 0;
          }
        }
      }
    }
    
    paidMemberOperations.value = operationMap;
    paidMemberIds.value = Array.from(operationMap.keys());
    
    // Recalculate totals and paid list
    for(const [memberId, ops] of operationMap.entries()) {
        const member = members.value.find(m => m.id === memberId);
        if(member) {
            console.log(ops);
            const amount = ops.reduce((sum, op) => sum + ( op.total_debit || 0), 0);
            total += amount;
            paymentsList.push({ memberName: member.name, amount });
        }
    }
    totalCollected.value = total;
    completedPayments.value = paymentsList;
    emit('update:totalCollected', totalCollected.value);
    emit('update:totalInterest', -totalInterest);

  } catch (error) {
    console.error("Error fetching meeting payments", error);
  }
}

const isMemberPaid = (memberId: string) => paidMemberIds.value.includes(memberId);

function addFine() {
    editingFineIndex.value = null;
    editingFineData.value = null; // Use null to signal creation
    isFineModalOpen.value = true;
}

async function selectMember(member: Member) {
  selectedMember.value = member;
  viewedOperations.value = null;
  memberDues.value = [];
  payments.value = [];
  duesError.value = null;
  
  if (isMemberPaid(member.id)) {
    viewedOperations.value = paidMemberOperations.value.get(member.id) || [];
    return;
  }
  
  try {
    isDuesLoading.value = true;
    const dues = await meetingsService.getMemberDues(member.id);
    console.log(dues);
    memberDues.value = dues;
    
    // Initialize payment payload from dues
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

const totalToPay = computed(() => {
    if (!payments.value) return 0;
    return payments.value.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
});

async function handleRecordTransaction() {
  if (!selectedMember.value || !payments.value) {
    alert('No hay un socio seleccionado o datos de pago.');
    return;
  }

  const processedPayments = payments.value.map((payment, index) => {
    const due = memberDues.value[index];
    if (!due) return payment;

    let description = payment.description;

    if (due.type === 'stock_fee' && due.stockQuantity && due.monthlyContribution) {
      description = `${due.stockQuantity} uds. x ${due.monthlyContribution.toFixed(2)} c/u`;
    } else if (due.type === 'loan_payment' && due.details) {
      const interest = due.details.interest || 0;
      const principal = payment.amount - interest;
      description = `Abono Capital: ${principal.toFixed(2)}, Intereses: ${interest.toFixed(2)}`;
    }

    return {
      ...payment,
      description: description,
    };
  });
  
  const payload: { memberId: string, payments: Payment[] } = {
    memberId: selectedMember.value.id,
    payments: processedPayments,
  };

  try {
    isSubmitting.value = true;
    submissionError.value = null;
    console.log(payload);
    await meetingsService.recordMonthlyPayment(payload as any);
    
    // Refresh payments state
    await fetchMeetingPayments(activeMeetingStore.meetingId || '');

    alert(`Pago de ${totalToPay.value.toFixed(2)} registrado para ${selectedMember.value.name}.`);
    
    // Reset for next member
    selectedMember.value = null;
    memberDues.value = [];
    payments.value = [];

  } catch (err: any) {
    submissionError.value = err.response?.data?.message || 'Error al registrar el pago.';
    alert(`Error: ${submissionError.value}`);
  } finally {
    isSubmitting.value = false;
  }
}
</script>