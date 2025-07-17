<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { meetingsService } from '@/features/meetings/services/meetings'
import type { Meeting } from '@/features/meetings/types'
import { Calendar, CheckCircle, InfoCircle, Play, Page } from 'iconoir-vue/regular'

const meetings = ref<Meeting[]>([])
const loading = ref(false)

const activeMeeting = computed(() => meetings.value.find((m) => m.status === 'active'))
const pastMeetings = computed(() => meetings.value.filter((m) => m.status === 'closed'))
const hasActiveMeeting = computed(() => !!activeMeeting.value)

async function getMeetings() {
  try {
    loading.value = true
    const data = await meetingsService.findAll()
    meetings.value = data
  } catch (err) {
    console.error('Error fetching meetings:', err)
  } finally {
    loading.value = false
  }
}

async function startNewMeeting() {
  if (hasActiveMeeting.value) {
    alert('There is already an active meeting. Please close it before starting a new one.')
    return
  }

  try {
    loading.value = true
    await meetingsService.create({ date: new Date().toISOString() })
    alert('New meeting started successfully!')
    await getMeetings() // Refresh the list
  } catch (err) {
    console.error('Error starting new meeting:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  getMeetings()
})
</script>

<template>
  <div>
    <div class="container mx-auto pt-10 pb-16">
      <div class="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
        <div>
          <h1 class="text-3xl font-bold">Administración de Reuniones</h1>
          <p class="text-gray-500">Gestiona las reuniones activas y el historial</p>
        </div>
        <button
          class="btn btn-primary flex items-center gap-2"
          @click="startNewMeeting"
          :disabled="loading || hasActiveMeeting"
        >
          <Play class="w-5 h-5" /> Nueva Reunión
        </button>
      </div>

      <!-- Tarjeta de reunión activa -->
      <div v-if="activeMeeting" class="bg-blue-50 border border-blue-200 rounded-xl shadow flex flex-col md:flex-row md:items-center justify-between p-6 mb-8">
        <div class="flex items-center gap-4">
          <Calendar class="w-8 h-8 text-blue-700" />
          <div>
            <div class="text-lg font-semibold text-blue-900 flex items-center gap-2">
              Reunión Activa
              <span class="badge bg-green-100 text-green-700 flex items-center gap-1"><CheckCircle class="w-4 h-4" /> Activa</span>
            </div>
            <div class="text-gray-500 text-sm mt-1">Iniciada el: {{ new Date(activeMeeting.date).toLocaleDateString() }}</div>
          </div>
        </div>
        <div class="flex gap-2 mt-4 md:mt-0">
          <router-link :to="`/meetings/active`" class="btn btn-primary btn-outline flex items-center gap-1">
            <InfoCircle class="w-5 h-5" /> Ir a la Reunión
          </router-link>
          <router-link :to="`/meetings/${activeMeeting.id}`" class="btn btn-secondary btn-outline flex items-center gap-1">
            <Page class="w-5 h-5" /> Ver Detalles
          </router-link>
        </div>
      </div>

      <h2 class="text-2xl font-bold mb-4">Historial de Reuniones</h2>
      <div class="overflow-x-auto bg-white rounded-xl shadow border border-blue-100">
        <table class="table w-full">
          <thead class="bg-blue-50">
            <tr>
              <th>Fecha</th>
              <th>Estado</th>
              <th class="text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="pastMeetings.length === 0">
              <td colspan="3" class="text-center">No hay reuniones pasadas.</td>
            </tr>
            <tr v-for="meeting in pastMeetings" :key="meeting.id">
              <td class="font-semibold">{{ new Date(meeting.date).toLocaleDateString() }}</td>
              <td>
                <span class="badge bg-gray-100 text-gray-700 px-3 py-1">Cerrada</span>
              </td>
              <td class="flex items-center justify-center gap-2">
                <router-link
                  :to="`/meetings/${meeting.id}`"
                  class="btn btn-ghost btn-xs flex items-center gap-1"
                >
                  <Page class="w-5 h-5 text-blue-700" /> Ver Detalles
                </router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template> 