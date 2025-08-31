<template>
  <div v-if="modelValue" class="modal modal-open">
    <div class="modal-box max-w-6xl max-h-[70vh]">
      <!-- Header -->
      <div class="flex justify-between items-start mb-4">
        <div>
          <h3 class="font-bold text-lg">Detalles de la Operación</h3>
          <p class="text-gray-600 text-sm" v-if="operationDetails">
            {{ operationDetails.type }} - {{ formatDate(operationDetails.date) }}
          </p>
        </div>
        <button @click="closeModal" class="btn btn-sm btn-square btn-ghost">
          <Xmark class="w-5 h-5" />
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-8">
        <div class="loading loading-spinner loading-lg"></div>
        <p class="mt-4 text-gray-600">Cargando detalles de la operación...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center py-8">
        <div class="text-red-500 mb-4">
          <svg class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h4 class="text-lg font-medium text-gray-900 mb-2">Error al cargar la operación</h4>
        <p class="text-gray-600">{{ error }}</p>
      </div>

      <!-- Operation Details -->
      <div v-else-if="operationDetails" class="space-y-6 overflow-y-auto">
        <!-- Operation Info -->
        <div class="bg-gray-100 p-4 rounded-lg">
          <h4 class="font-bold text-lg mb-3">Información de la Operación</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-gray-600">Tipo de Operación</p>
              <p class="font-bold text-lg">{{ operationDetails.type }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-600">Fecha</p>
              <p class="font-bold text-lg">{{ formatDate(operationDetails.date) }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-600">Descripción</p>
              <p class="font-bold text-lg">{{ operationDetails.description || 'Sin descripción' }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-600">Miembro</p>
              <p class="font-bold text-lg">{{ operationDetails.member?.name }}</p>
            </div>
          </div>
        </div>

        <!-- Ledger Entries -->
        <div>
          <h4 class="font-bold text-lg mb-4">Entradas del Libro Contable ({{ operationDetails.ledger_entries?.length || 0 }})</h4>
          <div v-if="operationDetails.ledger_entries && operationDetails.ledger_entries.length > 0" class="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
            <table class="table w-full">
              <thead class="sticky top-0 bg-gray-50">
                <tr>
                  <th>Cuenta</th>
                  <th>Descripción</th>
                  <th class="text-right">Monto</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="entry in operationDetails.ledger_entries" :key="entry.id" class="hover">
                  <td class="font-semibold">{{ entry.account_type }}</td>
                  <td>{{ entry.description || 'Sin descripción' }}</td>
                  <td class="text-right font-semibold" :class="entry.amount > 0 ? 'text-green-600' : 'text-red-600'">
                    {{ formatCurrency(Math.abs(entry.amount)) }}
                  </td>
                  <td>{{ formatDate(entry.created_at) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="text-center py-8 text-gray-500">
            <p>No hay entradas del libro contable asociadas a esta operación.</p>
          </div>
        </div>
      </div>

      <!-- Initial State -->
      <div v-else class="text-center py-8">
        <div class="loading loading-spinner loading-lg"></div>
        <p class="mt-4 text-gray-600">Preparando detalles de la operación...</p>
      </div>

      <!-- Footer -->
      <div class="modal-action">
        <button @click="closeModal" class="btn">Cerrar</button>
      </div>
    </div>
    <div class="modal-backdrop" @click="closeModal"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { Xmark } from 'iconoir-vue/regular';
import { operationsService } from '@/features/operations/services/operationsService';

interface LedgerEntry {
  id: string;
  account_type: string;
  description: string;
  amount: number;
  created_at: string;
}

interface OperationDetails {
  id: string;
  type: string;
  date: string;
  description: string;
  member: {
    name: string;
  };
  ledger_entries: LedgerEntry[];
}

interface Props {
  modelValue: boolean;
  operationId?: string;
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const loading = ref(false);
const error = ref<string | null>(null);
const operationDetails = ref<OperationDetails | null>(null);

const closeModal = () => {
  emit('update:modelValue', false);
  operationDetails.value = null;
  error.value = null;
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (date: string) => {
  return new Intl.DateTimeFormat('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

const loadOperationDetails = async () => {
  if (!props.operationId) return;
  
  loading.value = true;
  error.value = null;
  try { 
    operationDetails.value = await operationsService.findOne(props.operationId);
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Error desconocido';
  } finally {
    loading.value = false;
  }
};

// Watch for operationId changes to load details
watch(() => props.operationId, (newId, oldId) => {
  console.log('OperationDetailsModal: operationId changed:', { oldId, newId });
  if (newId && props.modelValue) {
    console.log('OperationDetailsModal: operationId and modal are both set, loading details...');
    loadOperationDetails();
  } else {
    console.log('OperationDetailsModal: Not loading details because:', { 
      hasId: !!newId, 
      modalOpen: props.modelValue 
    });
  }
});

// Watch for modal open to load details
watch(() => props.modelValue, (isOpen, wasOpen) => {
  console.log('OperationDetailsModal: modal state changed:', { wasOpen, isOpen });
  if (isOpen && props.operationId) {
    console.log('OperationDetailsModal: Modal opened and operationId exists, loading details...');
    loadOperationDetails();
  } else {
    console.log('OperationDetailsModal: Not loading details because:', { 
      modalOpen: isOpen, 
      hasId: !!props.operationId 
    });
  }
});
</script>
