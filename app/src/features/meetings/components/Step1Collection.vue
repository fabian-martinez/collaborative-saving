<template>
  <div>
    <h2 class="text-xl font-bold mb-4">Paso 1: Recaudo de Fondos</h2>

    <div v-if="activeMeetingStore.isMembersLoading" class="flex justify-center items-center">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div v-if="activeMeetingStore.membersError" class="alert alert-error">
      <span>{{ activeMeetingStore.membersError }}</span>
    </div>

    <div v-if="!activeMeetingStore.isMembersLoading && !activeMeetingStore.membersError" class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Members List -->
      <div class="md:col-span-1">
        <h3 class="text-lg font-semibold mb-2">Socios</h3>
        <ul class="menu bg-base-200 w-full rounded-box">
          <li v-for="member in activeMeetingStore.members" :key="member.id" @click="selectMember(member)" :class="{'disabled': isMemberPaid(member.id)}">
            <a :class="[ 'transition', selectedMember && selectedMember.id === member.id ? 'bg-primary/20 font-bold text-primary' : 'hover:bg-base-300/40' ]">
              {{ member.name }}
              <span v-if="isMemberPaid(member.id)" class="badge badge-success badge-sm">Pagado</span>
            </a>
          </li>
        </ul>
        <div class="mt-4 p-4 bg-base-200 rounded-box space-y-4">
            <div>
                <div class="text-center">
                    <div class="text-sm font-light text-base-content/70 uppercase">Total Aportes Recaudados</div>
                    <div class="text-3xl font-bold text-primary">
                      <CopyOnDblClickNumber :value="totalCollected" />
                    </div>
                </div>
            </div>
            
            <div class="border-t border-base-300/50"></div>

            <div>
                <h4 class="font-semibold text-center text-base-content/80 mb-2">Pagos Registrados</h4>
                <div v-if="completedPayments.length > 0" class="space-y-2">
                    <div v-for="(payment, index) in completedPayments" :key="index" class="flex justify-between items-center bg-base-100/50 p-2 rounded-md text-sm">
                        <span class="font-medium">{{ payment.memberName }}</span>
                        <span class="font-mono text-success font-bold">
                          <CopyOnDblClickNumber :value="payment.amount" />
                        </span>
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
                    <span class="flex-shrink-0 text-primary font-mono">
                      <CopyOnDblClickNumber :value="viewedTotal" />
                    </span>
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
import { ref, computed, onMounted, watch } from 'vue';
import { meetingsService } from '@/features/meetings/services/meetings';
import type { Member } from '@/features/members/types';
import type { MemberDue, Payment, MemberPaymentResponse } from '../types';
import type { Operation } from '@/features/operations/types';
import { useActiveMeetingStore } from '../stores/activeMeeting';
import { useApiVersionStore } from '@/shared/stores/apiVersion';
import OperationDetails from '@/features/operations/components/operationDetails.vue';
import PaymentForm from './PaymentForm.vue';
import CopyOnDblClickNumber from '@/shared/components/CopyOnDblClickNumber.vue'
import { sumCashEntries } from '@/shared/utils'

const activeMeetingStore = useActiveMeetingStore();
const emit = defineEmits(['completed', 'update:totalCollected', 'update:totalInterest']);

const selectedMember = ref<Member | null>(null);
const memberDues = ref<MemberDue[]>([]);
const payments = ref<Payment[]>([]);
const paidMemberIds = ref<string[]>([]);
const totalCollected = ref(0);
const completedPayments = ref<{ memberName: string, amount: number }[]>([]);
const paidMemberOperations = ref<Map<string, Operation[]>>(new Map());
const viewedOperations = ref<Operation[] | null>(null);

const isDuesLoading = ref(false);
const duesError = ref<string | null>(null);

const apiVersionStore = useApiVersionStore();

const viewedTotal = computed(() => sumCashEntries(viewedOperations.value || []));

// Tipo para operaciones que pueden venir en diferentes formatos (V1/V2)
interface OperationWithLegacyFormat {
  id?: string;
  memberId?: string;
  member_id?: string;
  meeting_id?: string;
  meetingId?: string;
  type?: string;
  date?: string;
  description?: string;
  ledgerEntries?: Array<{ accountType?: string; account_type?: string; amount?: number | string }>;
  ledger_entries?: Array<{ accountType?: string; account_type?: string; amount?: number | string }>;
}

/**
 * Mapea la respuesta del endpoint V2 de pagos del miembro al formato Operation
 * La respuesta viene normalizada a camelCase por el servicio api
 * Necesitamos convertir de vuelta a snake_case para el tipo Operation
 */
function mapPaymentToOperation(payment: MemberPaymentResponse, memberId: string): Operation {
  // Asegurar que entries existe y es un array
  const entries = payment.entries || [];
  
  return {
    id: payment.operationId,
    meeting_id: payment.meetingId,
    member_id: memberId,
    type: payment.type,
    date: payment.date,
    description: payment.description || '',
    ledger_entries: entries.map((entry) => ({
      id: entry.id,
      operation_id: payment.operationId,
      account_type: entry.accountType || '', // Asegurar que accountType existe
      amount: Number(entry.amount) || 0, // Asegurar que es número
      created_at: payment.date,
      description: entry.description || '',
    })),
    total_debit: 0,
    total_credit: 0,
  };
}

onMounted(async () => {
  await activeMeetingStore.fetchMembers();
  
  // Asegurar que el meetingId esté disponible
  if (!activeMeetingStore.meetingId) {
    await activeMeetingStore.fetchActiveMeeting();
  }
  
  if (activeMeetingStore.meetingId) {
    await fetchMeetingPayments(activeMeetingStore.meetingId);
  }
});

// Agregar watcher para cuando el meetingId cambie
watch(() => activeMeetingStore.meetingId, async (newMeetingId) => {
  if (newMeetingId && activeMeetingStore.members.length > 0) {
    await fetchMeetingPayments(newMeetingId);
  }
});

async function fetchMeetingPayments(meetingId: string) {
  try {
    if (!meetingId) {
      console.error('No meeting ID found');
      return;
    }

    const operationMap = new Map<string, Operation[]>();
    let total = 0;
    let totalInterest = 0;
    const paymentsList: { memberName: string; amount: number }[] = [];

    // V2: Solo consultar endpoint de reunión para identificar miembros con pagos
    if (apiVersionStore.isV2) {
      // Usar endpoint v2/meetings/:id/payments solo para identificar qué miembros tienen pagos
      const operations = await meetingsService.getMonthlyPayments(meetingId);
      const membersWithPayments: string[] = [];

      for (const op of operations as OperationWithLegacyFormat[]) {
        // Extraer memberId (viene como member_id en snake_case pero se normaliza a memberId)
        const memberId = op.memberId || op.member_id;
        if (!memberId) continue;
        
        // Solo marcar que el miembro tiene pago, sin almacenar detalles completos
        // Los detalles se consultarán al hacer click en el miembro
        if (!operationMap.has(memberId)) {
          operationMap.set(memberId, []);
          membersWithPayments.push(memberId);
        }
        
        // Guardar una operación básica solo para marcar como pagado
        const basicOperation: Operation = {
          id: op.id || '',
          meeting_id: op.meeting_id || op.meetingId || meetingId,
          member_id: memberId,
          type: op.type || '',
          date: op.date || '',
          description: op.description || '',
          ledger_entries: [], // Vacío, se llenará al consultar detalles
          total_debit: 0,
          total_credit: 0,
        };
        operationMap.get(memberId)!.push(basicOperation);
      }
      
      // Consultar detalles de pagos solo para miembros que tienen pagos (para calcular totales)
      if (membersWithPayments.length > 0) {
        const paymentPromises = membersWithPayments.map(async (memberId) => {
          try {
            const payments = await meetingsService.getMemberPayments(memberId, meetingId);
            if (payments && payments.length > 0) {
              // Convertir a Operation para calcular totales
              const operations = payments.map(p => mapPaymentToOperation(p, memberId));
              
              // Actualizar las operaciones en el mapa con los detalles completos
              operationMap.set(memberId, operations);
              
              // Calcular montos para este miembro
              const member = activeMeetingStore.members.find(m => m.id === memberId);
              if (member) {
                const amount = sumCashEntries(operations);
                total += amount;
                
                // Calcular intereses
                for (const payment of payments) {
                  for (const entry of payment.entries) {
                    if (entry.accountType === 'INTEREST_INCOME') {
                      totalInterest += Number(entry.amount) || 0;
                    }
                  }
                }
                
                paymentsList.push({ memberName: member.name, amount });
              }
            }
          } catch (error) {
            // Ignorar errores individuales
            console.debug(`Error fetching payment details for member ${memberId}:`, error);
          }
        });
        
        await Promise.all(paymentPromises);
      }
    } else {
      // V1: Usar endpoint de reunión (incluye ledger entries)
      const operations = await meetingsService.getMonthlyPayments(meetingId);

      for (const op of operations as OperationWithLegacyFormat[]) {
        // Compatibilidad con ambos formatos: memberId (V2) o member_id (V1)
        const memberId = op.memberId || op.member_id;
        if (!memberId) continue;
        
        if (!operationMap.has(memberId)) {
          operationMap.set(memberId, []);
        }
        // Convertir a formato Operation si no está ya en ese formato
        const operation: Operation = {
          id: op.id || '',
          meeting_id: op.meeting_id || op.meetingId || meetingId,
          member_id: memberId,
          type: op.type || '',
          date: op.date || '',
          description: op.description || '',
          ledger_entries: (op.ledgerEntries || op.ledger_entries || []).map(entry => ({
            id: '',
            operation_id: op.id || '',
            account_type: entry.accountType || entry.account_type || '',
            amount: Number(entry.amount) || 0,
            created_at: op.date || '',
            description: '',
          })),
          total_debit: 0,
          total_credit: 0,
        };
        operationMap.get(memberId)!.push(operation);

        // Compatibilidad con ambos formatos: ledgerEntries (V2) o ledger_entries (V1)
        const ledgerEntries = op.ledgerEntries || op.ledger_entries;
        if (ledgerEntries) {
          for (const entry of ledgerEntries) {
            // Compatibilidad: accountType (V2) o account_type (V1)
            const accountType = entry.accountType || entry.account_type;
            if (accountType === 'INTEREST_INCOME') {
              totalInterest += Number(entry.amount) || 0;
            }
          }
        }
      }
      
      // Recalculate totals and paid list para V1
      for(const [memberId, ops] of operationMap.entries()) {
        const member = activeMeetingStore.members.find(m => m.id === memberId);
        if(member) {
          const amount = sumCashEntries(ops);
          total += amount;
          paymentsList.push({ memberName: member.name, amount });
        }
      }
    }
    
    paidMemberOperations.value = operationMap;
    paidMemberIds.value = Array.from(operationMap.keys());
    
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
  
  // V2: Si el miembro tiene pagos, consultar detalles del endpoint de pagos del miembro
  if (apiVersionStore.isV2 && activeMeetingStore.meetingId && isMemberPaid(member.id)) {
    try {
      const payments = await meetingsService.getMemberPayments(
        member.id, 
        activeMeetingStore.meetingId
      );
      
      if (payments && payments.length > 0) {
        // Debug: verificar estructura de datos
        console.debug('Payments received:', payments);
        const operations = payments.map(p => {
          const op = mapPaymentToOperation(p, member.id);
          console.debug('Mapped operation:', op);
          console.debug('Ledger entries:', op.ledger_entries);
          return op;
        });
        viewedOperations.value = operations;
        return; // Mostrar pagos
      }
    } catch (error) {
      // Si falla, mostrar operaciones básicas guardadas
      console.warn('Error fetching member payments details:', error);
      viewedOperations.value = paidMemberOperations.value.get(member.id) || [];
      return;
    }
  }
  
  // V1: Si el miembro tiene pagos, usar los guardados
  if (!apiVersionStore.isV2 && isMemberPaid(member.id)) {
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

  } catch (err: unknown) {
     const error = err as { response?: { data?: { message?: string } } };
     console.error("Error fetching member dues:", err);
     duesError.value = error.response?.data?.message || 'Error al cargar las deudas del socio.';
  } finally {
    isDuesLoading.value = false;
  }
}

async function handlePaymentSuccess() {
  await fetchMeetingPayments(activeMeetingStore.meetingId || '');
  selectedMember.value = null;
}
</script>