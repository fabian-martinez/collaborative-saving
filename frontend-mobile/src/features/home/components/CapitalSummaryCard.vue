<script setup lang="ts">
import { GraphUp } from 'iconoir-vue/regular';
import Card from '@/shared/components/ui/Card.vue';
import AmountDisplay from '@/shared/components/ui/AmountDisplay.vue';

defineProps<{
  totalCapital?: number;
}>();
</script>

<template>
  <Card class="space-y-3.5">
    <div class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-2.5 min-w-0">
        <div class="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
          <GraphUp class="w-5 h-5" />
        </div>
        <div class="min-w-0">
          <h3 class="text-xs uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">Mi Capital</h3>
          <span class="text-xs text-slate-500 dark:text-slate-400 truncate block">Ahorro acumulado en acciones</span>
        </div>
      </div>
      <!-- Primary number in white / dark slate -->
      <AmountDisplay :amount="totalCapital ?? 2450000" size="lg" variant="default" />
    </div>

    <!-- Items List (Acción Grande vs Pequeña) -->
    <div class="space-y-2 pt-2 border-t border-slate-200/80 dark:border-[#17254e]">
      <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#091129] border border-slate-200/70 dark:border-[#17254e] gap-3">
        <div class="min-w-0">
          <span class="text-xs font-semibold text-slate-900 dark:text-slate-200 block truncate">Acción Grande</span>
          <span class="text-[11px] text-slate-500 dark:text-slate-400 font-mono">3 acciones suscritas</span>
        </div>
        <AmountDisplay :amount="1500000" size="sm" variant="default" />
      </div>

      <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#091129] border border-slate-200/70 dark:border-[#17254e] gap-3">
        <div class="min-w-0">
          <span class="text-xs font-semibold text-slate-900 dark:text-slate-200 block truncate">Acción Pequeña</span>
          <span class="text-[11px] text-slate-500 dark:text-slate-400 font-mono">5 acciones suscritas</span>
        </div>
        <AmountDisplay :amount="950000" size="sm" variant="default" />
      </div>
    </div>
  </Card>
</template>
