<script setup lang="ts">
import { ref } from 'vue';
import { Coins, CreditCard, ShieldCheck } from 'iconoir-vue/regular';
import SummaryCard from '@/shared/components/ui/SummaryCard.vue';
import AmountDisplay from '@/shared/components/ui/AmountDisplay.vue';
import Badge from '@/shared/components/ui/Badge.vue';
import BottomSheet from '@/shared/components/overlays/BottomSheet.vue';

const isOwnersSheetOpen = ref(false);
const isDebtorsSheetOpen = ref(false);

const mockDistribution = [
  { name: 'Carlos Martínez', sharesCount: 8, total: 2450000 },
  { name: 'María Rodríguez', sharesCount: 6, total: 1800000 },
  { name: 'Juan Gómez', sharesCount: 5, total: 1500000 },
  { name: 'Ana Morales', sharesCount: 4, total: 1200000 },
  { name: 'Pedro Sánchez', sharesCount: 3, total: 900000 },
  { name: 'Laura Vargas', sharesCount: 5, total: 1500000 },
  { name: 'Diego Torres', sharesCount: 4, total: 1200000 },
  { name: 'Camila Ríos', sharesCount: 3, total: 900000 }
];

const mockDebtors = [
  { name: 'Carlos Martínez', loanType: 'Corriente + Ágil', totalDebt: 800000, status: 'Al día' },
  { name: 'Juan Gómez', loanType: 'Corriente', totalDebt: 1200000, status: 'Al día' },
  { name: 'Pedro Sánchez', loanType: 'Ágil', totalDebt: 450000, status: 'Al día' },
  { name: 'Diego Torres', loanType: 'Corriente', totalDebt: 950000, status: 'Al día' },
  { name: 'Camila Ríos', loanType: 'Ágil', totalDebt: 300000, status: 'Al día' },
  { name: 'Ana Morales', loanType: 'Corriente', totalDebt: 600000, status: 'Al día' }
];
</script>

<template>
  <div class="space-y-4">
    <!-- Header Summary of the Fund -->
    <div class="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-100 to-white dark:from-[#0e1838] dark:to-[#080e22] border border-slate-200 dark:border-[#1a2750] shadow-sm dark:shadow-md dark:shadow-[#05091a]/60 space-y-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span class="text-xs uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">Estado Global del Fondo</span>
        </div>
        <Badge variant="success">100% Solvente</Badge>
      </div>
      <div>
        <span class="text-xs text-slate-500 dark:text-slate-400 block mb-0.5 font-medium">Patrimonio Total en Circulación</span>
        <AmountDisplay :amount="45200000" size="hero" variant="default" />
      </div>
    </div>

    <!-- 2.1 Capital Global del Fondo -->
    <SummaryCard
      :icon="Coins"
      icon-color="emerald"
      title="Capital Social"
      subtitle="Total acciones suscritas"
      badge-text="91 acciones"
      badge-variant="success"
      :amount="28500000"
      amount-label="Total ahorrado en el fondo"
    >
      <div class="space-y-2.5">
        <div class="p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-[#091129] border border-slate-200/70 dark:border-[#17254e] space-y-1.5">
          <div class="flex justify-between items-center gap-2">
            <span class="text-xs font-semibold text-slate-900 dark:text-white truncate">Acciones Grandes (Tipo 1)</span>
            <AmountDisplay :amount="18000000" size="sm" variant="default" />
          </div>
          <div class="flex justify-between items-center text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/50 dark:border-[#152042]">
            <span>36 emitidas ($ 500.000 c/u)</span>
            <button class="text-emerald-600 dark:text-emerald-400 font-semibold active:scale-95" @click="isOwnersSheetOpen = true">Ver aportantes →</button>
          </div>
        </div>

        <div class="p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-[#091129] border border-slate-200/70 dark:border-[#17254e] space-y-1.5">
          <div class="flex justify-between items-center gap-2">
            <span class="text-xs font-semibold text-slate-900 dark:text-white truncate">Acciones Pequeñas (Tipo 2)</span>
            <AmountDisplay :amount="10500000" size="sm" variant="default" />
          </div>
          <div class="flex justify-between items-center text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/50 dark:border-[#152042]">
            <span>55 emitidas ($ 190.000 c/u)</span>
            <button class="text-emerald-600 dark:text-emerald-400 font-semibold active:scale-95" @click="isOwnersSheetOpen = true">Ver aportantes →</button>
          </div>
        </div>
      </div>
    </SummaryCard>

    <!-- 2.2 Deuda y Cartera Global -->
    <SummaryCard
      :icon="CreditCard"
      icon-color="rose"
      title="Cartera de Préstamos"
      subtitle="Total colocado entre los socios"
      badge-text="13 préstamos"
      badge-variant="warning"
      :amount="16700000"
      amount-label="Saldo total colocado"
    >
      <div class="space-y-2.5">
        <div class="p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-[#091129] border border-slate-200/70 dark:border-[#17254e] space-y-1.5">
          <div class="flex justify-between items-center gap-2">
            <span class="text-xs font-semibold text-slate-900 dark:text-white truncate">Préstamos Corrientes</span>
            <AmountDisplay :amount="12200000" size="sm" variant="default" />
          </div>
          <div class="flex justify-between items-center text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/50 dark:border-[#152042]">
            <span>1.5% mensual (8 activos)</span>
            <button class="text-rose-600 dark:text-rose-400 font-semibold active:scale-95" @click="isDebtorsSheetOpen = true">Ver deudores →</button>
          </div>
        </div>

        <div class="p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-[#091129] border border-slate-200/70 dark:border-[#17254e] space-y-1.5">
          <div class="flex justify-between items-center gap-2">
            <span class="text-xs font-semibold text-slate-900 dark:text-white truncate">Préstamos Ágiles</span>
            <AmountDisplay :amount="4500000" size="sm" variant="default" />
          </div>
          <div class="flex justify-between items-center text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/50 dark:border-[#152042]">
            <span>2.0% mensual (5 activos)</span>
            <button class="text-rose-600 dark:text-rose-400 font-semibold active:scale-95" @click="isDebtorsSheetOpen = true">Ver deudores →</button>
          </div>
        </div>
      </div>
    </SummaryCard>

    <!-- 2.3 Fondos & Actividades Globales -->
    <SummaryCard
      :icon="ShieldCheck"
      icon-color="indigo"
      title="Fondos de Reserva"
      subtitle="Solidaridad y eventos comunitarios"
      :amount="1250000"
      amount-label="Total fondos comunitarios"
    >
      <div class="grid grid-cols-2 gap-2.5 text-xs">
        <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-[#091129] border border-slate-200/70 dark:border-[#17254e]">
          <span class="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Fondo de Seguros</span>
          <AmountDisplay :amount="750000" size="sm" variant="default" />
        </div>
        <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-[#091129] border border-slate-200/70 dark:border-[#17254e]">
          <span class="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Fondo de Eventos</span>
          <AmountDisplay :amount="500000" size="sm" variant="default" />
        </div>
      </div>
    </SummaryCard>

    <!-- BottomSheets for Owners and Debtors -->
    <BottomSheet v-model="isOwnersSheetOpen" title="Socios Aportantes">
      <div class="space-y-2">
        <div
          v-for="owner in mockDistribution"
          :key="owner.name"
          class="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#091129] border border-slate-200/80 dark:border-[#17254e] text-xs gap-2"
        >
          <div>
            <span class="font-semibold text-slate-900 dark:text-white block">{{ owner.name }}</span>
            <span class="text-slate-500 dark:text-slate-400">{{ owner.sharesCount }} acciones</span>
          </div>
          <AmountDisplay :amount="owner.total" size="sm" variant="default" />
        </div>
      </div>
    </BottomSheet>

    <BottomSheet v-model="isDebtorsSheetOpen" title="Cartera Activa por Socio">
      <div class="space-y-2">
        <div
          v-for="debtor in mockDebtors"
          :key="debtor.name"
          class="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#091129] border border-slate-200/80 dark:border-[#17254e] text-xs gap-2"
        >
          <div>
            <span class="font-semibold text-slate-900 dark:text-white block">{{ debtor.name }}</span>
            <span class="text-slate-500 dark:text-slate-400">{{ debtor.loanType }}</span>
          </div>
          <div class="flex flex-col items-end shrink-0 gap-1">
            <AmountDisplay :amount="debtor.totalDebt" size="sm" variant="default" />
            <Badge variant="success" class="!text-[10px] !py-0.5 !px-2">{{ debtor.status }}</Badge>
          </div>
        </div>
      </div>
    </BottomSheet>
  </div>
</template>
