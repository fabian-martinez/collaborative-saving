<script setup lang="ts">
import { ref } from 'vue';
import Card from '@/shared/components/ui/Card.vue';
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
  { name: 'Pedro Sánchez', sharesCount: 3, total: 900000 }
];

const mockDebtors = [
  { name: 'Carlos Martínez', loanType: 'Corriente + Ágil', totalDebt: 800000, status: 'Al día' },
  { name: 'Juan Gómez', loanType: 'Corriente', totalDebt: 1200000, status: 'Al día' },
  { name: 'Pedro Sánchez', loanType: 'Ágil', totalDebt: 450000, status: 'Al día' }
];
</script>

<template>
  <div class="space-y-4">
    <!-- Header Summary of the Fund -->
    <div class="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800">
      <div class="flex items-center gap-2 mb-1">
        <span class="w-2 h-2 rounded-full bg-emerald-400" />
        <span class="text-xs uppercase font-bold text-slate-400 tracking-wider">Estado Global del Fondo</span>
      </div>
      <div class="flex items-baseline justify-between mt-2">
        <div>
          <span class="text-xs text-slate-400 block">Patrimonio Total en Circulación</span>
          <AmountDisplay :amount="45200000" size="xl" variant="success" />
        </div>
        <Badge variant="success">100% Solvente</Badge>
      </div>
    </div>

    <!-- 2.1 Capital Global del Fondo -->
    <Card class="space-y-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 class="text-xs uppercase font-bold text-slate-400 tracking-wider">Capital Social</h3>
            <span class="text-xs text-slate-400">Total acciones suscritas por el grupo</span>
          </div>
        </div>
        <AmountDisplay :amount="28500000" size="lg" />
      </div>

      <!-- Action items -->
      <div class="space-y-2 pt-2 border-t border-slate-800">
        <div class="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60">
          <div class="flex justify-between items-center mb-1">
            <span class="text-xs font-semibold text-white">Acciones Grandes (Tipo 1)</span>
            <AmountDisplay :amount="18000000" size="sm" />
          </div>
          <div class="flex justify-between text-[11px] text-slate-400">
            <span>36 emitidas (Valor unitario: $ 500.000)</span>
            <button class="text-emerald-400 font-semibold" @click="isOwnersSheetOpen = true">Ver aportantes →</button>
          </div>
        </div>

        <div class="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60">
          <div class="flex justify-between items-center mb-1">
            <span class="text-xs font-semibold text-white">Acciones Pequeñas (Tipo 2)</span>
            <AmountDisplay :amount="10500000" size="sm" />
          </div>
          <div class="flex justify-between text-[11px] text-slate-400">
            <span>55 emitidas (Valor unitario: $ 190.000)</span>
            <button class="text-emerald-400 font-semibold" @click="isOwnersSheetOpen = true">Ver aportantes →</button>
          </div>
        </div>
      </div>
    </Card>

    <!-- 2.2 Deuda y Cartera Global -->
    <Card class="space-y-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="p-2 rounded-xl bg-rose-500/10 text-rose-400">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <div>
            <h3 class="text-xs uppercase font-bold text-slate-400 tracking-wider">Cartera de Préstamos</h3>
            <span class="text-xs text-slate-400">Total colocado entre los socios</span>
          </div>
        </div>
        <AmountDisplay :amount="16700000" size="lg" variant="danger" />
      </div>

      <div class="space-y-2 pt-2 border-t border-slate-800">
        <div class="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60">
          <div class="flex justify-between items-center mb-1">
            <span class="text-xs font-semibold text-white">Préstamos Corrientes</span>
            <AmountDisplay :amount="12200000" size="sm" variant="danger" />
          </div>
          <div class="flex justify-between text-[11px] text-slate-400">
            <span>Tasa: 1.5% mensual (8 créditos activos)</span>
            <button class="text-rose-400 font-semibold" @click="isDebtorsSheetOpen = true">Ver deudores →</button>
          </div>
        </div>

        <div class="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60">
          <div class="flex justify-between items-center mb-1">
            <span class="text-xs font-semibold text-white">Préstamos Ágiles</span>
            <AmountDisplay :amount="4500000" size="sm" variant="danger" />
          </div>
          <div class="flex justify-between text-[11px] text-slate-400">
            <span>Tasa: 2.0% mensual (5 créditos activos)</span>
            <button class="text-rose-400 font-semibold" @click="isDebtorsSheetOpen = true">Ver deudores →</button>
          </div>
        </div>
      </div>
    </Card>

    <!-- 2.3 Fondos & Actividades Globales -->
    <Card class="space-y-2">
      <div class="flex items-center justify-between">
        <h3 class="text-xs uppercase font-bold text-slate-400 tracking-wider">Fondos de Reserva y Solidaridad</h3>
        <AmountDisplay :amount="1250000" size="sm" />
      </div>
      <div class="grid grid-cols-2 gap-2 text-xs">
        <div class="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/60">
          <span class="text-[11px] text-slate-400 block">Fondo de Seguros</span>
          <AmountDisplay :amount="750000" size="sm" />
        </div>
        <div class="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/60">
          <span class="text-[11px] text-slate-400 block">Fondo de Eventos</span>
          <AmountDisplay :amount="500000" size="sm" />
        </div>
      </div>
    </Card>

    <!-- BottomSheets for Owners and Debtors -->
    <BottomSheet v-model="isOwnersSheetOpen" title="Socios Aportantes">
      <div class="space-y-2">
        <div
          v-for="owner in mockDistribution"
          :key="owner.name"
          class="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-800 text-xs"
        >
          <div>
            <span class="font-semibold text-white block">{{ owner.name }}</span>
            <span class="text-slate-400">{{ owner.sharesCount }} acciones</span>
          </div>
          <AmountDisplay :amount="owner.total" size="sm" />
        </div>
      </div>
    </BottomSheet>

    <BottomSheet v-model="isDebtorsSheetOpen" title="Cartera Activa por Socio">
      <div class="space-y-2">
        <div
          v-for="debtor in mockDebtors"
          :key="debtor.name"
          class="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-800 text-xs"
        >
          <div>
            <span class="font-semibold text-white block">{{ debtor.name }}</span>
            <span class="text-slate-400">{{ debtor.loanType }}</span>
          </div>
          <div class="text-right">
            <AmountDisplay :amount="debtor.totalDebt" size="sm" variant="danger" />
            <Badge variant="success" class="mt-0.5 !text-[10px] !py-0">{{ debtor.status }}</Badge>
          </div>
        </div>
      </div>
    </BottomSheet>
  </div>
</template>
