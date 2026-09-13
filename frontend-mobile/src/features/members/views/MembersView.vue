<script setup lang="ts">
import { ref, computed } from 'vue';
import Card from '@/shared/components/ui/Card.vue';
import AmountDisplay from '@/shared/components/ui/AmountDisplay.vue';
import Badge from '@/shared/components/ui/Badge.vue';
import BottomSheet from '@/shared/components/overlays/BottomSheet.vue';

interface MemberSummary {
  id: string;
  name: string;
  role: string;
  sharesCount: number;
  capitalAmount: number;
  hasLoan: boolean;
  debtAmount: number;
  status: 'active' | 'suspended';
}

const members = ref<MemberSummary[]>([
  { id: 'm-1', name: 'Carlos Martínez (Tú)', role: 'Socio', sharesCount: 8, capitalAmount: 2450000, hasLoan: true, debtAmount: 800000, status: 'active' },
  { id: 'm-2', name: 'María Rodríguez', role: 'Tesorera', sharesCount: 6, capitalAmount: 1800000, hasLoan: false, debtAmount: 0, status: 'active' },
  { id: 'm-3', name: 'Juan Gómez', role: 'Socio', sharesCount: 5, capitalAmount: 1500000, hasLoan: true, debtAmount: 1200000, status: 'active' },
  { id: 'm-4', name: 'Ana Morales', role: 'Secretaria', sharesCount: 4, capitalAmount: 1200000, hasLoan: false, debtAmount: 0, status: 'active' },
  { id: 'm-5', name: 'Pedro Sánchez', role: 'Socio', sharesCount: 3, capitalAmount: 900000, hasLoan: true, debtAmount: 450000, status: 'active' },
  { id: 'm-6', name: 'Laura Vargas', role: 'Presidente', sharesCount: 5, capitalAmount: 1500000, hasLoan: false, debtAmount: 0, status: 'active' }
]);

const searchQuery = ref('');
const activeFilter = ref<'all' | 'savings' | 'loans'>('all');

const isDetailSheetOpen = ref(false);
const selectedMember = ref<MemberSummary | null>(null);

const filteredMembers = computed(() => {
  return members.value.filter((m) => {
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.value.toLowerCase());
    if (!matchesSearch) return false;

    if (activeFilter.value === 'savings') return m.sharesCount > 0;
    if (activeFilter.value === 'loans') return m.hasLoan;
    return true;
  });
});

function openMemberDetail(member: MemberSummary) {
  selectedMember.value = member;
  isDetailSheetOpen.value = true;
}
</script>

<template>
  <div class="space-y-4">
    <!-- Title & Search bar -->
    <div>
      <h2 class="text-base font-bold text-white tracking-tight">Directorio de Socios</h2>
      <p class="text-xs text-slate-400">Comunidad activa del fondo</p>
    </div>

    <div class="relative">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Buscar socio por nombre..."
        class="w-full py-2.5 pl-10 pr-4 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition-all"
      />
      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </div>

    <!-- Filter chips -->
    <div class="flex gap-2 overflow-x-auto no-scrollbar pb-1">
      <button
        type="button"
        class="px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all active:scale-95"
        :class="activeFilter === 'all' ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-950/40' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'"
        @click="activeFilter = 'all'"
      >
        Todos ({{ members.length }})
      </button>
      <button
        type="button"
        class="px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all active:scale-95"
        :class="activeFilter === 'savings' ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-950/40' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'"
        @click="activeFilter = 'savings'"
      >
        Con Ahorros
      </button>
      <button
        type="button"
        class="px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all active:scale-95"
        :class="activeFilter === 'loans' ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-950/40' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'"
        @click="activeFilter = 'loans'"
      >
        Con Préstamos
      </button>
    </div>

    <!-- Members List -->
    <Card class="space-y-2 !p-3">
      <div
        v-for="member in filteredMembers"
        :key="member.id"
        class="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 hover:border-slate-700 active:scale-[0.99] transition-all cursor-pointer"
        @click="openMemberDetail(member)"
      >
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-slate-800 border border-slate-700/60 flex items-center justify-center font-bold text-sm text-slate-300">
            {{ member.name[0] }}
          </div>
          <div>
            <div class="flex items-center gap-1.5">
              <span class="text-xs font-semibold text-white">{{ member.name }}</span>
            </div>
            <span class="text-[11px] text-slate-400 font-mono">{{ member.role }} • {{ member.sharesCount }} acciones</span>
          </div>
        </div>

        <div class="text-right">
          <AmountDisplay :amount="member.capitalAmount" size="sm" />
          <Badge v-if="member.hasLoan" variant="warning" class="mt-0.5 !text-[10px] !py-0">Crédito activo</Badge>
          <Badge v-else variant="success" class="mt-0.5 !text-[10px] !py-0">Al día</Badge>
        </div>
      </div>
    </Card>

    <!-- Member Detail Sheet -->
    <BottomSheet v-model="isDetailSheetOpen" title="Ficha del Socio">
      <div v-if="selectedMember" class="space-y-4">
        <div class="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
          <div class="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-lg flex items-center justify-center">
            {{ selectedMember.name[0] }}
          </div>
          <div>
            <h4 class="text-sm font-bold text-white">{{ selectedMember.name }}</h4>
            <span class="text-xs text-slate-400">{{ selectedMember.role }} — Estado activo</span>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div class="p-3 rounded-xl bg-slate-950/40 border border-slate-800">
            <span class="text-[11px] text-slate-400 block">Ahorro en Acciones</span>
            <AmountDisplay :amount="selectedMember.capitalAmount" size="md" variant="success" />
            <span class="text-[10px] text-slate-500 block mt-0.5 font-mono">{{ selectedMember.sharesCount }} acciones</span>
          </div>

          <div class="p-3 rounded-xl bg-slate-950/40 border border-slate-800">
            <span class="text-[11px] text-slate-400 block">Cartera Vigente</span>
            <AmountDisplay :amount="selectedMember.debtAmount" size="md" :variant="selectedMember.hasLoan ? 'danger' : 'muted'" />
            <span class="text-[10px] text-slate-500 block mt-0.5">{{ selectedMember.hasLoan ? 'En amortización' : 'Sin créditos' }}</span>
          </div>
        </div>
      </div>
    </BottomSheet>
  </div>
</template>
