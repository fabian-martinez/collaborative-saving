<script setup lang="ts">
import { computed } from 'vue';
import { Xmark } from 'iconoir-vue/regular';

interface StockTransaction {
  id: string;
  date: Date | string;
  period: string;
  description: string;
  amount: number;
  status: string;
}

interface Props {
  modelValue: boolean;
  stockName: string;
  nominalValue: number;
  requiredContribution: number;
  transactions: StockTransaction[];
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

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
    case 'Pagado':
      return 'badge-success';
    case 'Pendiente':
      return 'badge-warning';
    case 'Vencido':
      return 'badge-error';
    default:
      return 'badge-neutral';
  }
};
</script>

<template>
  <div v-if="isOpen" class="modal modal-open">
    <div class="modal-box max-w-4xl">
      <!-- Header -->
      <div class="flex justify-between items-start mb-4">
        <div>
          <h3 class="font-bold text-lg">Historial de Transacciones - {{ stockName }}</h3>
          <p class="text-base-content/70 text-sm">Historial completo de aportes para {{ stockName }}</p>
        </div>
        <button @click="closeModal" class="btn btn-sm btn-square btn-ghost">
          <Xmark class="w-5 h-5" />
        </button>
      </div>

      <!-- Summary Section -->
      <div class="bg-base-200 p-4 rounded-lg mb-6">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-sm text-base-content/70">Valor Nominal</p>
            <p class="font-bold text-lg">{{ formatCurrency(nominalValue) }}</p>
          </div>
          <div>
            <p class="text-sm text-base-content/70">Aporte Requerido</p>
            <p class="font-bold text-lg">{{ formatCurrency(requiredContribution) }}</p>
          </div>
        </div>
      </div>

      <!-- Transactions Table -->
      <div class="overflow-x-auto">
        <table class="table w-full">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Período</th>
              <th>Descripción</th>
              <th class="text-right">Monto</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="tx in transactions" :key="tx.id" class="hover">
              <td>{{ tx.date }}</td>
              <td>{{ tx.period }}</td>
              <td>{{ tx.description }}</td>
              <td class="text-right font-semibold">{{ formatCurrency(tx.amount) }}</td>
              <td>
                <div :class="['badge', getStatusBadgeClass(tx.status)]">
                  {{ tx.status }}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Footer -->
      <div class="modal-action">
        <button @click="closeModal" class="btn">Cerrar</button>
      </div>
    </div>
    <div class="modal-backdrop" @click="closeModal"></div>
  </div>
</template>
