<script setup lang="ts">
import BottomSheet from '@/shared/components/overlays/BottomSheet.vue';
import AmountDisplay from '@/shared/components/ui/AmountDisplay.vue';
import Badge from '@/shared/components/ui/Badge.vue';

defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();
</script>

<template>
  <BottomSheet
    :model-value="modelValue"
    title="Liquidación de Reunión"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="space-y-4">
      <div class="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
        <div>
          <span class="text-xs text-slate-400 block">Fecha de la asamblea</span>
          <span class="text-sm font-bold text-white">Sábado, 15 de Octubre 2026</span>
        </div>
        <Badge variant="warning">Efectivo en mano</Badge>
      </div>

      <!-- Itemized Breakdown -->
      <div class="space-y-2">
        <h4 class="text-xs uppercase font-bold text-slate-400 tracking-wider">Conceptos a pagar</h4>

        <!-- Acciones -->
        <div class="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-800">
          <div>
            <span class="text-sm font-semibold text-white block">Aporte a Acciones</span>
            <span class="text-xs text-slate-400">3 Acciones Grandes + 5 Pequeñas</span>
          </div>
          <AmountDisplay :amount="50000" size="md" />
        </div>

        <!-- Préstamo 1 -->
        <div class="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-800">
          <div>
            <span class="text-sm font-semibold text-white block">Préstamo Corriente</span>
            <span class="text-xs text-slate-400">Abono a capital: $ 60.000 + Interés: $ 15.000</span>
          </div>
          <AmountDisplay :amount="75000" size="md" />
        </div>

        <!-- Préstamo 2 (Ágil) -->
        <div class="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-800">
          <div>
            <span class="text-sm font-semibold text-white block">Préstamo Ágil</span>
            <span class="text-xs text-slate-400">Abono a capital: $ 30.000 + Interés: $ 5.000</span>
          </div>
          <AmountDisplay :amount="35000" size="md" />
        </div>

        <!-- Fondos especiales y solidaridad -->
        <div class="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-800">
          <div>
            <span class="text-sm font-semibold text-white block">Seguro de Cartera & Actividad</span>
            <span class="text-xs text-slate-400">Solidaridad comunitaria ($ 15.000) + Rifa ($ 10.000)</span>
          </div>
          <AmountDisplay :amount="25000" size="md" />
        </div>
      </div>

      <!-- Total Box -->
      <div class="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-500/30 flex items-center justify-between">
        <div>
          <span class="text-xs font-bold uppercase tracking-wider text-emerald-400 block">Total a entregar</span>
          <span class="text-xs text-slate-400">En efectivo al tesorero</span>
        </div>
        <AmountDisplay :amount="185000" size="xl" variant="success" />
      </div>

      <!-- Projection note -->
      <div class="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 text-xs text-slate-400">
        <div class="font-semibold text-slate-300 mb-0.5">ℹ️ Efecto contable tras el pago:</div>
        <div>Tu deuda total pasará de <strong class="text-slate-200">$ 800.000</strong> a <strong class="text-emerald-400">$ 710.000</strong>. Tus acciones continuarán generando rendimientos.</div>
      </div>
    </div>
  </BottomSheet>
</template>
