<script setup lang="ts">
import { ShieldCheck } from 'iconoir-vue/regular';
import Card from '@/shared/components/ui/Card.vue';
import AmountDisplay from '@/shared/components/ui/AmountDisplay.vue';
</script>

<template>
  <Card class="space-y-3">
    <div class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-2.5 min-w-0">
        <div class="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
          <ShieldCheck class="w-5 h-5" />
        </div>
        <div class="min-w-0">
          <h3 class="text-xs uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider truncate">Fondos & Actividades</h3>
          <span class="text-xs text-slate-500 dark:text-slate-400 truncate block">Solidaridad y aportes comunitarios</span>
        </div>
      </div>
      <AmountDisplay :amount="25000" size="sm" variant="default" />
    </div>

    <div class="grid grid-cols-2 gap-2.5 pt-1">
      <div class="p-3 rounded-xl bg-slate-50 dark:bg-[#091129] border border-slate-200/70 dark:border-[#17254e]">
        <span class="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">Seguro de Cartera</span>
        <AmountDisplay :amount="15000" size="sm" variant="default" />
      </div>
      <div class="p-3 rounded-xl bg-slate-50 dark:bg-[#091129] border border-slate-200/70 dark:border-[#17254e]">
        <span class="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">Actividad / Eventos</span>
        <AmountDisplay :amount="10000" size="sm" variant="default" />
      </div>
    </div>
  </Card>
</template>
