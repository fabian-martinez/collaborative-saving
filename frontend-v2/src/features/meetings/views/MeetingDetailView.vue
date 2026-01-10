<template>
  <div class="meeting-detail-view space-y-6">
    <LoadingSpinner :loading="loading || summaryLoading" />
    <ErrorMessage :error="error || summaryError" />

    <div v-if="meeting && !loading">
      <!-- Header -->
      <MeetingHeader
        :meeting="meeting"
        :meeting-number="summaryComposable.meetingNumber.value || 0"
      />

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

      <!-- Placeholders para otras tabs -->
      <div v-else class="card bg-base-100 shadow-lg">
        <div class="card-body">
          <p class="text-base-content/60">
            {{ getTabPlaceholderMessage(activeTab) }}
          </p>
        </div>
      </div>
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
import { meetingsApi, type Meeting } from '@/api/meetings.api'
import { useMeetingSummary } from '../composables/useMeetingSummary'
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

const route = useRoute()
const meeting = ref<Meeting | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const activeTab = ref('summary')

// Composable para el resumen
const summaryComposable = useMeetingSummary()

// Estado del modal de recibo
const showReceiptModal = ref(false)
const selectedMemberId = ref<string | null>(null)
const selectedMemberName = ref<string | null>(null)

const summaryLoading = computed(() => summaryComposable.loading.value)
const summaryError = computed(() => summaryComposable.error.value)

const getTabPlaceholderMessage = (tab: string): string => {
  const messages: Record<string, string> = {
    contributions: 'Contenido de aportes pendiente de implementación',
    payments: 'Contenido de pagos pendiente de implementación',
    loans: 'Contenido de préstamos pendiente de implementación',
    stocks: 'Contenido de acciones pendiente de implementación',
    entries: 'Contenido de asientos contables pendiente de implementación',
  }
  return messages[tab] || 'Contenido pendiente de implementación'
}

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

onMounted(async () => {
  const meetingId = route.params.id as string
  
  // Cargar datos de la reunión
  loading.value = true
  try {
    meeting.value = await meetingsApi.getMeetingById(meetingId, {
      include_summary: true,
    })

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
