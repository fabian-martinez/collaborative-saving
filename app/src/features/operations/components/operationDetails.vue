<template>
  <div class="p-4 bg-base-200 rounded-lg shadow-sm font-sans">
    <div class="flex justify-between items-start mb-3">
      <div>
        <p class="font-semibold text-base leading-tight">{{ getAccountName(operation.type) }}</p>
        <p class="text-xs text-base-content/60">
          Tipo: <span class="font-mono">{{ operation.description }}</span>
        </p>
      </div>
    </div>
    
    <div v-if="operation.ledger_entries && operation.ledger_entries.length" class="space-y-2 text-sm">
        <div 
            v-for="entry in creditEntries" 
            :key="entry.id" 
            class="flex justify-between items-center bg-base-100/50 p-2 rounded-md"
        >
            <div>
                <span class="text-base-content/80">{{ getAccountName(entry.account_type) }}</span>
                <p class="text-xs text-base-content/60">{{ entry.description }}</p>
            </div>
            <span class="font-mono text-error font-medium">{{ Number(entry.amount).toFixed(2) }}</span>
        </div>
    </div>

    <div class="text-xs text-base-content/70 mt-3 pt-2 border-t border-base-300/50">
      <div class="flex justify-between">
        <span>ID: <span class="font-mono">{{ operation.id.substring(0,8) }}</span></span>
        <span>Fecha: <span class="font-mono">{{ new Date(operation.date).toLocaleDateString() }}</span></span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Operation, LedgerEntry } from '@/features/operations/types';

const props = defineProps<{
  operation: Operation;
}>();

const creditEntries = computed(() => {
    return props.operation.ledger_entries?.filter(e => Number(e.amount) < 0) || [];
});

const accountNames: Record<string, string> = {
  CASH: 'Caja',
  LOANS_RECEIVABLE: 'Préstamos por Cobrar',
  STOCK_CAPITAL: 'Capital Social (Acciones)',
  INTEREST_INCOME: 'Ingresos por Intereses',
  FEE_INCOME: 'Ingresos por Multas',
  MANDATORY_CONTRIBUTION_INCOME: 'Aportes Obligatorios',
  PENDING_CLASSIFICATION: 'Pendiente de Clasificar',
  MONTHLY_PAYMENT: 'Cuota Mensual',
};

const getAccountName = (accountKey: string) => {
  return accountNames[accountKey] || accountKey;
};

</script>
