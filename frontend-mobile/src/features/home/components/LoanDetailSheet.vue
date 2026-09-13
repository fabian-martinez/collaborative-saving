<script setup lang="ts">
import BottomSheet from '@/shared/components/overlays/BottomSheet.vue';
import AmountDisplay from '@/shared/components/ui/AmountDisplay.vue';
import Badge from '@/shared/components/ui/Badge.vue';

defineProps<{
  modelValue: boolean;
  loanId: string | null;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();
</script>

<template>
  <BottomSheet
    :model-value="modelValue"
    title="Detalle del Crédito"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="space-y-4">
      <!-- Balance Header in Pure White / Dark Slate -->
      <div class="p-4 rounded-2xl bg-slate-50 dark:bg-[#091129] border border-slate-200 dark:border-[#17254e] text-center">
        <span class="text-xs text-slate-500 dark:text-slate-400 block mb-1">Saldo pendiente por pagar</span>
        <AmountDisplay :amount="loanId === 'loan-1' ? 500000 : 300000" size="xl" variant="default" />
        
        <!-- Progress Bar -->
        <div class="mt-3.5">
          <div class="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
            <span>Progreso de pago (60%)</span>
            <span>Monto inicial: $ 1.000.000</span>
          </div>
          <div class="w-full h-2.5 rounded-full bg-slate-200 dark:bg-[#15234c] overflow-hidden">
            <div class="h-full bg-emerald-500 rounded-full w-[60%]" />
          </div>
        </div>
      </div>

      <!-- Loan Parameters -->
      <div class="grid grid-cols-2 gap-2.5">
        <div class="p-3 rounded-xl bg-slate-50 dark:bg-[#091129] border border-slate-200/80 dark:border-[#17254e]">
          <span class="text-[11px] text-slate-500 dark:text-slate-400 block">Tasa de Interés</span>
          <span class="text-sm font-bold text-slate-900 dark:text-white">{{ loanId === 'loan-1' ? '1.5% mensual' : '2.0% mensual' }}</span>
        </div>
        <div class="p-3 rounded-xl bg-slate-50 dark:bg-[#091129] border border-slate-200/80 dark:border-[#17254e]">
          <span class="text-[11px] text-slate-500 dark:text-slate-400 block">Modalidad</span>
          <Badge variant="info">{{ loanId === 'loan-1' ? 'Crédito Ordinario' : 'Crédito Ágil' }}</Badge>
        </div>
      </div>

      <!-- Projection Table -->
      <div class="space-y-2">
        <h4 class="text-xs uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">Proyección de la próxima cuota</h4>
        <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-[#091129] border border-slate-200/80 dark:border-[#17254e] space-y-2 text-xs">
          <div class="flex justify-between text-slate-600 dark:text-slate-300">
            <span>Abono programado a capital:</span>
            <AmountDisplay :amount="60000" size="sm" variant="default" />
          </div>
          <div class="flex justify-between text-slate-600 dark:text-slate-300">
            <span>Interés mensual estimado:</span>
            <AmountDisplay :amount="15000" size="sm" variant="default" />
          </div>
          <div class="border-t border-slate-200 dark:border-slate-800 pt-2 flex justify-between font-bold text-slate-900 dark:text-white">
            <span>Cuota total a pagar en reunión:</span>
            <AmountDisplay :amount="75000" size="sm" variant="default" />
          </div>
        </div>
      </div>
    </div>
  </BottomSheet>
</template>
