<template>
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
        <div v-if="!selectedMember" class="flex items-center justify-center h-full text-gray-500">
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
        <PaymentForm
          v-else
          :member="selectedMember"
          @success="handlePaymentSuccess"
        />
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
import PaymentForm from './PaymentForm.vue';

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
    
    // Fetch and add insurance
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

async function handlePaymentSuccess() {
  await fetchMeetingPayments(activeMeetingStore.meetingId || '');
  selectedMember.value = null;
}
</script>