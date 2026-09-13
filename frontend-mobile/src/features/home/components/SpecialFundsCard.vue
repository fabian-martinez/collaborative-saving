<script setup lang="ts">
import { ShieldCheck } from 'iconoir-vue/regular';
import SummaryCard from '@/shared/components/ui/SummaryCard.vue';
import AmountDisplay from '@/shared/components/ui/AmountDisplay.vue';
</script>

<template>
  <SummaryCard
    :icon="ShieldCheck"
    icon-color="purple"
    title="Fondos & Actividades"
    subtitle="Solidaridad y aportes comunitarios"
    badge-text="2 fondos"
    badge-variant="info"
    :amount="25000"
    amount-label="Total aportes especiales"
  >
    <div class="grid grid-cols-2 gap-2.5">
      <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-[#091129] border border-slate-200/70 dark:border-[#17254e]">
        <span class="text-[11px] text-slate-500 dark:text-slate-400 block mb-1 font-medium">Seguro de Cartera</span>
        <AmountDisplay :amount="15000" size="sm" variant="default" />
      </div>
      <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-[#091129] border border-slate-200/70 dark:border-[#17254e]">
        <span class="text-[11px] text-slate-500 dark:text-slate-400 block mb-1 font-medium">Actividad / Eventos</span>
        <AmountDisplay :amount="10000" size="sm" variant="default" />
      </div>
    </div>
  </SummaryCard>
</template>
