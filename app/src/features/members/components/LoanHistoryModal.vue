<script setup lang="ts">
import { computed, ref } from 'vue';
import { Xmark } from 'iconoir-vue/regular';

interface LoanInstallment {
  id: string;
  installmentNumber: number;
  dueDate: Date | string;
  paymentDate?: Date | string;
  principal: number;
  interest: number;
  total: number;
  status: string;
}

interface Props {
  modelValue: boolean;
  loanAmount: number;
  term: string;
  interestRate: string;
  paidInstallments: LoanInstallment[];
  pendingInstallments: LoanInstallment[];
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const activeTab = ref<'history' | 'projection'>('history');

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

const closeModal = () => {
  isOpen.value = false;
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: 'BOB',
    minimumFractionDigits: 2
  }).format(amount);
};

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'Pagada':
      return 'badge-success';
    case 'Pendiente':
      return 'badge-warning';
    case 'Vencida':
      return 'badge-error';
    default:
      return 'badge-neutral';
  }
};
</script>

<template>
  <div v-if="isOpen" class="modal modal-open">
    <div class="modal-box max-w-6xl">
      <!-- Header -->
      <div class="flex justify-between items-start mb-4">
        <div>
          <h3 class="font-bold text-lg">Historial de Préstamo</h3>
          <p class="text-base-content/70 text-sm">Detalle completo del préstamo por {{ formatCurrency(loanAmount) }}</p>
        </div>
        <button @click="closeModal" class="btn btn-sm btn-square btn-ghost">
          <Xmark class="w-5 h-5" />
        </button>
      </div>

      <!-- Loan Summary Section -->
      <div class="bg-base-200 p-4 rounded-lg mb-6">
        <div class="grid grid-cols-3 gap-4">
          <div>
            <p class="text-sm text-base-content/70">Monto Original</p>
            <p class="font-bold text-lg">{{ formatCurrency(loanAmount) }}</p>
          </div>
          <div>
            <p class="text-sm text-base-content/70">Plazo</p>
            <p class="font-bold text-lg">{{ term }}</p>
          </div>
          <div>
            <p class="text-sm text-base-content/70">Tasa de Interés</p>
            <p class="font-bold text-lg">{{ interestRate }}</p>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs tabs-bordered mb-6">
        <button 
          @click="activeTab = 'history'"
          :class="['tab', activeTab === 'history' ? 'tab-active' : '']"
        >
          Historial de Pagos
        </button>
        <button 
          @click="activeTab = 'projection'"
          :class="['tab', activeTab === 'projection' ? 'tab-active' : '']"
        >
          Proyección de Pagos
        </button>
      </div>

      <!-- Payment History Tab -->
      <div v-if="activeTab === 'history'">
        <h4 class="font-bold text-lg mb-4">Cuotas Pagadas ({{ paidInstallments.length }})</h4>
        <div class="overflow-x-auto">
          <table class="table w-full">
            <thead>
              <tr>
                <th>Cuota #</th>
                <th>Fecha Vencimiento</th>
                <th>Fecha Pago</th>
                <th class="text-right">Capital</th>
                <th class="text-right">Interés</th>
                <th class="text-right">Total</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="installment in paidInstallments" :key="installment.id" class="hover">
                <td class="font-semibold">{{ installment.installmentNumber }}</td>
                <td>{{ installment.dueDate }}</td>
                <td>{{ installment.paymentDate || '-' }}</td>
                <td class="text-right font-semibold">{{ formatCurrency(installment.principal) }}</td>
                <td class="text-right font-semibold">{{ formatCurrency(installment.interest) }}</td>
                <td class="text-right font-semibold">{{ formatCurrency(installment.total) }}</td>
                <td>
                  <div :class="['badge', getStatusBadgeClass(installment.status)]">
                    {{ installment.status }}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Payment Projection Tab -->
      <div v-if="activeTab === 'projection'">
        <h4 class="font-bold text-lg mb-4">Cuotas Pendientes ({{ pendingInstallments.length }})</h4>
        <div class="overflow-x-auto">
          <table class="table w-full">
            <thead>
              <tr>
                <th>Cuota #</th>
                <th>Fecha Vencimiento</th>
                <th class="text-right">Capital</th>
                <th class="text-right">Interés</th>
                <th class="text-right">Total</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="installment in pendingInstallments" :key="installment.id" class="hover">
                <td class="font-semibold">{{ installment.installmentNumber }}</td>
                <td>{{ installment.dueDate }}</td>
                <td class="text-right font-semibold">{{ formatCurrency(installment.principal) }}</td>
                <td class="text-right font-semibold">{{ formatCurrency(installment.interest) }}</td>
                <td class="text-right font-semibold">{{ formatCurrency(installment.total) }}</td>
                <td>
                  <div :class="['badge', getStatusBadgeClass(installment.status)]">
                    {{ installment.status }}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Footer -->
      <div class="modal-action">
        <button @click="closeModal" class="btn">Cerrar</button>
      </div>
    </div>
    <div class="modal-backdrop" @click="closeModal"></div>
  </div>
</template>
