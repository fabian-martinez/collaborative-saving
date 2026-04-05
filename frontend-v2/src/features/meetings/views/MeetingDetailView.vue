<template>
  <div class="meeting-detail-view space-y-6">
    <LoadingSpinner :loading="loading || summaryLoading" />
    <ErrorMessage :error="error || summaryError" />

    <div v-if="meeting && !loading">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <MeetingHeader
          :meeting="meeting"
          :meeting-number="summaryComposable.meetingNumber.value || 0"
        />
        <div class="flex gap-2 self-start md:self-center">
          <button @click="handleExport" class="btn btn-outline gap-2">
            <Download class="w-5 h-5" />
            Exportar
          </button>
        </div>
      </div>
      <!-- Tabs de Navegación -->
      <MeetingTabs
        :active-tab="activeTab"
        @tab-change="activeTab = $event"
      />

      <!-- Contenido de las Tabs -->
      <div v-if="activeTab === 'summary' && !summaryLoading">
        <!-- Cards de Resumen -->
        <SummaryCards v-if="summaryComposable.summary.value" :summary="summaryComposable.summary.value" />

        <!-- Dos Columnas: Recaudos y Desembolsos -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <CollectionsPanel
            v-if="summaryComposable.summary.value"
            :summary="summaryComposable.summary.value"
          />
          <DisbursementsPanel
            v-if="summaryComposable.summary.value"
            :summary="summaryComposable.summary.value"
          />
        </div>

        <!-- Grid de Métricas -->
        <div v-if="summaryComposable.summary.value" class="mb-6">
          <MetricsGrid :summary="summaryComposable.summary.value" />
        </div>

        <!-- Observaciones -->
        <ObservationsSection :meeting="meeting" />
      </div>

      <MeetingContributions
        v-if="activeTab === 'contributions'"
        ref="contributionsTabRef"
        :operations="summaryComposable.operations.value"
        :members="membersStore.members"
      />

      <MeetingPayments
        v-if="activeTab === 'payments'"
        ref="paymentsTabRef"
        :operations="summaryComposable.operations.value"
        :members="membersStore.members"
      />

      <MeetingLoans
        v-if="activeTab === 'loans'"
        ref="loansTabRef"
        :operations="summaryComposable.operations.value"
        :members="membersStore.members"
      />

      <MeetingStocks
        v-if="activeTab === 'stocks'"
        ref="stocksTabRef"
        :operations="summaryComposable.operations.value"
        :members="membersStore.members"
      />

      <MeetingEntries
        v-if="activeTab === 'entries'"
        ref="entriesTabRef"
        :operations="summaryComposable.operations.value"
        :members="membersStore.members"
      />

      <MeetingBalanceSummary
        v-if="activeTab === 'balance_summary'"
        ref="balanceSummaryTabRef"
        :operations="summaryComposable.operations.value"
        :members="membersStore.members"
      />
    </div>

    <!-- Modal de Recibo de Socio -->
    <MemberReceiptModal
      :show="showReceiptModal"
      :member-id="selectedMemberId"
      :meeting-id="meeting?.id || ''"
      :member-name="selectedMemberName ?? undefined"
      :meeting-number="summaryComposable.meetingNumber.value || 0"
      @close="closeReceiptModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { Download } from 'iconoir-vue/regular'
import { meetingsApi, type Meeting } from '@/api/meetings.api'
import { useMeetingSummary } from '../composables/useMeetingSummary'
import { useMembersStore } from '@/features/members/stores/members'

import LoadingSpinner from '@/shared/components/LoadingSpinner.vue'
import ErrorMessage from '@/shared/components/ErrorMessage.vue'
import MeetingHeader from '../components/closed-meeting/MeetingHeader.vue'
import MeetingTabs from '../components/closed-meeting/MeetingTabs.vue'
import SummaryCards from '../components/closed-meeting/SummaryCards.vue'
import CollectionsPanel from '../components/closed-meeting/CollectionsPanel.vue'
import DisbursementsPanel from '../components/closed-meeting/DisbursementsPanel.vue'
import MetricsGrid from '../components/closed-meeting/MetricsGrid.vue'
import ObservationsSection from '../components/closed-meeting/ObservationsSection.vue'
import MemberReceiptModal from '../components/MemberReceiptModal.vue'
import MeetingContributions from '../components/closed-meeting/MeetingContributions.vue'
import MeetingPayments from '../components/closed-meeting/MeetingPayments.vue'
import MeetingLoans from '../components/closed-meeting/MeetingLoans.vue'
import MeetingStocks from '../components/closed-meeting/MeetingStocks.vue'
import MeetingEntries from '../components/closed-meeting/MeetingEntries.vue'
import MeetingBalanceSummary from '../components/closed-meeting/MeetingBalanceSummary.vue'
import type { ComponentPublicInstance } from 'vue'

const route = useRoute()
const meeting = ref<Meeting | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const activeTab = ref('summary')

// Composable para el resumen
const summaryComposable = useMeetingSummary()
const membersStore = useMembersStore()

// Estado del modal de recibo
const showReceiptModal = ref(false)
const selectedMemberId = ref<string | null>(null)
const selectedMemberName = ref<string | null>(null)

const summaryLoading = computed(() => summaryComposable.loading.value)
const summaryError = computed(() => summaryComposable.error.value)

const closeReceiptModal = () => {
  showReceiptModal.value = false
  selectedMemberId.value = null
  selectedMemberName.value = null
}

const openReceiptModal = (memberId: string, memberName?: string) => {
  selectedMemberId.value = memberId
  selectedMemberName.value = memberName || null
  showReceiptModal.value = true
}

// Refs para las pestañas
const contributionsTabRef = ref<ComponentPublicInstance & { exportData?: () => void }>()
const paymentsTabRef = ref<ComponentPublicInstance & { exportData?: () => void }>()
const loansTabRef = ref<ComponentPublicInstance & { exportData?: () => void }>()
const stocksTabRef = ref<ComponentPublicInstance & { exportData?: () => void }>()
const entriesTabRef = ref<ComponentPublicInstance & { exportData?: () => void }>()
const balanceSummaryTabRef = ref<ComponentPublicInstance & { exportData?: () => void }>()

async function handleExport() {
  if (activeTab.value === 'summary') {
    const s = summaryComposable.summary.value
    if (!s) return
    
    const exportData = [
      { Concepto: 'Total Recaudado', Valor: s.totalCollected },
      { Concepto: 'Total Desembolsado', Valor: s.totalDisbursed },
      { Concepto: 'Valor Acción', Valor: s.shareValue },
      { Concepto: 'Participantes', Valor: s.participants },
      { Concepto: 'Aportes Mensuales', Valor: s.collections.memberContributions.amount },
      { Concepto: 'Pagos de Préstamos', Valor: s.collections.loanPayments.amount },
      { Concepto: 'Intereses', Valor: s.collections.interestCollected },
      { Concepto: 'Multas', Valor: s.collections.feesCollected },
      { Concepto: 'Nuevos Préstamos', Valor: s.disbursements.newLoans.amount },
      { Concepto: 'Liquidaciones', Valor: s.disbursements.stockLiquidations.amount }
    ]
    
    const { exportToCSV } = await import('@/shared/utils/export')
    const { formatDate } = await import('@/shared/utils/formatters')
    exportToCSV(exportData, `resumen-reunion-${meeting.value?.id.substring(0, 8)}-${formatDate(new Date())}`)
  } else if (activeTab.value === 'contributions' && contributionsTabRef.value?.exportData) {
    contributionsTabRef.value.exportData()
  } else if (activeTab.value === 'payments' && paymentsTabRef.value?.exportData) {
    paymentsTabRef.value.exportData()
  } else if (activeTab.value === 'loans' && loansTabRef.value?.exportData) {
    loansTabRef.value.exportData()
  } else if (activeTab.value === 'stocks' && stocksTabRef.value?.exportData) {
    stocksTabRef.value.exportData()
  } else if (activeTab.value === 'entries' && entriesTabRef.value?.exportData) {
    entriesTabRef.value.exportData()
  } else if (activeTab.value === 'balance_summary' && balanceSummaryTabRef.value?.exportData) {
    balanceSummaryTabRef.value.exportData()
  }
}

onMounted(async () => {
  const meetingId = route.params.id as string
  
  // Cargar datos de la reunión
  loading.value = true
  try {
    const [meetingData] = await Promise.all([
      meetingsApi.getMeetingById(meetingId, {
        include_summary: true,
      }),
      membersStore.fetchMembers()
    ])
    meeting.value = meetingData

    // Cargar resumen detallado desde operaciones
    await summaryComposable.loadSummary(meetingId)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Error al cargar reunión'
    console.error('Error loading meeting:', e)
  } finally {
    loading.value = false
  }
})

// Exponer función para abrir modal desde componentes hijos si es necesario
defineExpose({
  openReceiptModal,
})
</script>

<style scoped>
.meeting-detail-view {
  padding: 2rem;
}
</style>
