<template>
  <div class="p-4 md:p-6">
    <div v-if="loading" class="text-sm">Cargando detalle de la reunión...</div>
    <div v-else-if="error" class="alert alert-error">{{ error }}</div>
    <div v-else-if="meetingDetail" class="space-y-6">
      <header class="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <h1 class="text-2xl font-bold">Detalle de la Reunión</h1>
          <p class="text-sm text-gray-500">
            <strong>Fecha:</strong> {{ formatDate(meetingDetail.meeting.date) }} ·
            <strong>Estado:</strong> {{ meetingDetail.meeting.status }} ·
            <strong>Notas:</strong> {{ meetingDetail.meeting.notes || 'Sin notas' }}
          </p>
        </div>
      </header>

      <section>
        <MeetingSummarySection :summary="meetingDetail.summary" />
      </section>

      <section>
        <ContributionsSection :data="meetingDetail.contributions" />
      </section>

      <section>
        <StockChangesSection :data="meetingDetail.stockChanges" />
      </section>

      <section>
        <StockOperationsSection :data="meetingDetail.stockOperations" />
      </section>

      <section>
        <DisbursementsSection :data="meetingDetail.disbursements" />
      </section>

      <section>
        <LedgerEntriesSection :data="meetingDetail.ledgerEntries" />
      </section>
    </div>
  </div>
  
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import type { MeetingDetail } from '../types';
import { meetingsService } from '../services/meetings';
import MeetingSummarySection from '../components/MeetingSummarySection.vue';
import ContributionsSection from '../components/ContributionsSection.vue';
import StockChangesSection from '../components/StockChangesSection.vue';
import StockOperationsSection from '../components/StockOperationsSection.vue';
import DisbursementsSection from '../components/DisbursementsSection.vue';
import LedgerEntriesSection from '../components/LedgerEntriesSection.vue';

const route = useRoute();
const meetingId = route.params.id as string;
const meetingDetail = ref<MeetingDetail | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

onMounted(async () => {
  if (!meetingId || meetingId === 'undefined') {
    error.value = 'ID de reunión no válido';
    loading.value = false;
    return;
  }
  try {
    meetingDetail.value = await meetingsService.getMeetingDetail(meetingId);
    console.log(meetingDetail.value);
  } catch (e: unknown) {
    console.error(e);
    error.value = e instanceof Error ? e.message : 'Error al cargar el detalle de la reunión';
  } finally {
    loading.value = false;
  }
});

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
}
</script>

<style scoped>
</style>
