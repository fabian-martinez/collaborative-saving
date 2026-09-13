<script setup lang="ts">
import { ref, computed } from 'vue';
import { Search } from 'iconoir-vue/regular';
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
      <h2 class="text-base font-bold text-slate-900 dark:text-white tracking-tight">Directorio de Socios</h2>
      <p class="text-xs text-slate-500 dark:text-slate-400">Comunidad activa del fondo</p>
    </div>

    <div class="relative">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Buscar socio por nombre..."
        class="w-full py-2.5 pl-10 pr-4 rounded-xl bg-white dark:bg-[#091129] border border-slate-200 dark:border-[#17254e] text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-all shadow-sm"
      />
      <Search class="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
    </div>

    <!-- Filter chips -->
    <div class="flex gap-2 overflow-x-auto no-scrollbar pb-1">
      <button
        type="button"
        class="px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all active:scale-95"
        :class="activeFilter === 'all' ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 font-bold shadow-sm' : 'bg-white dark:bg-[#0e1838] border border-slate-200 dark:border-[#1a2750] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'"
        @click="activeFilter = 'all'"
      >
        Todos ({{ members.length }})
      </button>
      <button
        type="button"
        class="px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all active:scale-95"
        :class="activeFilter === 'savings' ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 font-bold shadow-sm' : 'bg-white dark:bg-[#0e1838] border border-slate-200 dark:border-[#1a2750] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'"
        @click="activeFilter = 'savings'"
      >
        Con Ahorros
      </button>
      <button
        type="button"
        class="px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all active:scale-95"
        :class="activeFilter === 'loans' ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 font-bold shadow-sm' : 'bg-white dark:bg-[#0e1838] border border-slate-200 dark:border-[#1a2750] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'"
        @click="activeFilter = 'loans'"
      >
        Con Préstamos
      </button>
    </div>

    <!-- Members List -->
    <Card class="space-y-2.5">
      <div
        v-for="member in filteredMembers"
        :key="member.id"
        class="flex items-center justify-between p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-[#091129] border border-slate-200/70 dark:border-[#17254e] hover:border-slate-300 dark:hover:border-[#22356a] active:scale-[0.99] transition-all cursor-pointer gap-3"
        @click="openMemberDetail(member)"
      >
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-10 h-10 rounded-full bg-slate-200 dark:bg-[#15234c] border border-slate-300 dark:border-[#22356a] flex items-center justify-center font-bold text-sm text-slate-700 dark:text-slate-200 shrink-0">
            {{ member.name[0] }}
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-1.5">
              <span class="text-xs font-semibold text-slate-900 dark:text-white truncate">{{ member.name }}</span>
            </div>
            <span class="text-[11px] text-slate-500 dark:text-slate-400 font-mono block truncate">{{ member.role }} • {{ member.sharesCount }} acciones</span>
          </div>
        </div>

        <div class="flex flex-col items-end shrink-0 gap-1">
          <AmountDisplay :amount="member.capitalAmount" size="sm" variant="default" />
          <Badge v-if="member.hasLoan" variant="warning" class="!text-[10px] !py-0.5 !px-2">Crédito activo</Badge>
          <Badge v-else variant="success" class="!text-[10px] !py-0.5 !px-2">Al día</Badge>
        </div>
      </div>
    </Card>

    <!-- Member Detail Sheet -->
    <BottomSheet v-model="isDetailSheetOpen" title="Ficha del Socio">
      <div v-if="selectedMember" class="space-y-4">
        <div class="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-[#091129] border border-slate-200 dark:border-[#17254e]">
          <div class="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-lg flex items-center justify-center shrink-0">
            {{ selectedMember.name[0] }}
          </div>
          <div class="min-w-0">
            <h4 class="text-sm font-bold text-slate-900 dark:text-white truncate">{{ selectedMember.name }}</h4>
            <span class="text-xs text-slate-500 dark:text-slate-400">{{ selectedMember.role }} — Estado activo</span>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2.5">
          <div class="p-3 rounded-xl bg-slate-50 dark:bg-[#091129] border border-slate-200 dark:border-[#17254e]">
            <span class="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">Ahorro en Acciones</span>
            <AmountDisplay :amount="selectedMember.capitalAmount" size="md" variant="default" />
            <span class="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5 font-mono">{{ selectedMember.sharesCount }} acciones</span>
          </div>

          <div class="p-3 rounded-xl bg-slate-50 dark:bg-[#091129] border border-slate-200 dark:border-[#17254e]">
            <span class="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">Cartera Vigente</span>
            <AmountDisplay :amount="selectedMember.debtAmount" size="md" variant="default" />
            <span class="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">{{ selectedMember.hasLoan ? 'En amortización' : 'Sin créditos' }}</span>
          </div>
        </div>
      </div>
    </BottomSheet>
  </div>
</template>
