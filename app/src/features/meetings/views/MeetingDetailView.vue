<template>
  <div>
    <div v-if="loading">Cargando detalle de la reunión...</div>
    <div v-else-if="error">{{ error }}</div>
    <div v-else-if="meetingDetail">
      <h1>Detalle de la Reunión</h1>
      <div v-if="meetingDetail.meeting && meetingDetail.meeting.date">
        <strong>Fecha:</strong> {{ formatDate(meetingDetail.meeting.date) }}<br />
        <strong>Estado:</strong> {{ meetingDetail.meeting.status }}<br />
        <strong>Notas:</strong> {{ meetingDetail.meeting.notes || 'Sin notas' }}
      </div>
      <div v-else class="alert alert-warning mb-4">
        No hay datos de cabecera de la reunión disponibles. Solo se muestran los totales y transacciones.
      </div>
      <h2>Totales</h2>
      <ul>
        <li>Total en caja: {{ formatCurrency(meetingDetail.income.contributions) }}</li>
        <li>Total intereses: {{ formatCurrency(meetingDetail.income.interest) }}</li>
        <li>Total dividendos: {{ formatCurrency(meetingDetail.withdrawals.dividendPayouts) }}</li>
      </ul>
      <h2>Transacciones</h2>
      <table>
        <thead>
          <tr>
            <th>Miembro</th>
            <th>Tipo</th>
            <th>Monto</th>
            <th>Detalle</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="tx in meetingDetail.transactions" :key="tx.id">
            <td>
              <router-link :to="{ name: 'member-details', params: { id: tx.memberId } }">
                {{ tx.member }}
              </router-link>
            </td>
            <td>{{ tx.type }}</td>
            <td :class="{ 'text-success': tx.amount > 0, 'text-error': tx.amount < 0 }">
              {{ formatCurrency(tx.amount) }}
            </td>
            <td>{{ tx.details }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import type { MeetingDetail } from '../types';
import { meetingsService } from '../services/meetings';

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
  } catch (e: any) {
    console.error(e);
    error.value = e?.message || 'Error al cargar el detalle de la reunión';
  } finally {
    loading.value = false;
  }
});

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}
function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
}
</script>

<style scoped>
.alert-warning {
  background: #fffbe6;
  color: #b45309;
  border: 1px solid #facc15;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
}
</style>
