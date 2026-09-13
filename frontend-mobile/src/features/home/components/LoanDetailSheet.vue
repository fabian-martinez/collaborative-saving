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
      <!-- Balance Header -->
      <div class="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-center">
        <span class="text-xs text-slate-400 block mb-1">Saldo pendiente por pagar</span>
        <AmountDisplay :amount="loanId === 'loan-1' ? 500000 : 300000" size="xl" variant="danger" />
        
        <!-- Progress Bar -->
        <div class="mt-3">
          <div class="flex justify-between text-[11px] text-slate-400 mb-1">
            <span>Progreso de pago (60%)</span>
            <span>Monto inicial: $ 1.000.000</span>
          </div>
          <div class="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
            <div class="h-full bg-emerald-500 rounded-full w-[60%]" />
          </div>
        </div>
      </div>

      <!-- Loan Parameters -->
      <div class="grid grid-cols-2 gap-2">
        <div class="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60">
          <span class="text-[11px] text-slate-400 block">Tasa de Interés</span>
          <span class="text-sm font-bold text-white">{{ loanId === 'loan-1' ? '1.5% mensual' : '2.0% mensual' }}</span>
        </div>
        <div class="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60">
          <span class="text-[11px] text-slate-400 block">Modalidad</span>
          <Badge variant="info">{{ loanId === 'loan-1' ? 'Crédito Ordinario' : 'Crédito Ágil' }}</Badge>
        </div>
      </div>

      <!-- Projection Table -->
      <div class="space-y-2">
        <h4 class="text-xs uppercase font-bold text-slate-400 tracking-wider">Proyección de la próxima cuota</h4>
        <div class="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 space-y-2 text-xs">
          <div class="flex justify-between text-slate-300">
            <span>Abono programado a capital:</span>
            <AmountDisplay :amount="60000" size="sm" />
          </div>
          <div class="flex justify-between text-slate-300">
            <span>Interés mensual estimado:</span>
            <AmountDisplay :amount="15000" size="sm" />
          </div>
          <div class="border-t border-slate-700 pt-2 flex justify-between font-bold text-slate-200">
            <span>Cuota total a pagar en reunión:</span>
            <AmountDisplay :amount="75000" size="sm" variant="warning" />
          </div>
        </div>
      </div>
    </div>
  </BottomSheet>
</template>
