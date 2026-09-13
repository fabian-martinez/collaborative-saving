<script setup lang="ts">
import Card from '@/shared/components/ui/Card.vue';
import AmountDisplay from '@/shared/components/ui/AmountDisplay.vue';
</script>

<template>
  <Card class="space-y-3">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div class="p-2 rounded-xl bg-amber-500/10 text-amber-400">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <div>
          <h3 class="text-xs uppercase font-bold text-slate-400 tracking-wider">Fondos & Actividades</h3>
          <span class="text-xs text-slate-400">Solidaridad y aportes comunitarios</span>
        </div>
      </div>
      <AmountDisplay :amount="25000" size="md" />
    </div>

    <div class="grid grid-cols-2 gap-2 pt-1">
      <div class="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/60">
        <span class="text-[11px] text-slate-400 block">Seguro de Cartera</span>
        <AmountDisplay :amount="15000" size="sm" />
      </div>
      <div class="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/60">
        <span class="text-[11px] text-slate-400 block">Actividad / Eventos</span>
        <AmountDisplay :amount="10000" size="sm" />
      </div>
    </div>
  </Card>
</template>
