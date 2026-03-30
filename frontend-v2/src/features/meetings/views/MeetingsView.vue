<template>
  <div class="meetings-view">
    <!-- Header mejorado con búsqueda, filtros y contador -->
    <div class="view-header">
      <div>
        <h1>Reuniones</h1>
        <p class="text-sm text-base-content/60">
          {{ store.meetings.length }} {{ store.meetings.length === 1 ? 'reunión registrada' : 'reuniones registradas' }}
        </p>
      </div>
      <div class="header-actions">
        <!-- Combobox con autocompletado -->
        <div class="dropdown dropdown-end search-dropdown" :class="{ 'dropdown-open': showSearchDropdown }">
          <div class="relative">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Buscar por notas o fecha..."
              class="input input-bordered search-input pl-10"
              @focus="showSearchDropdown = true"
              @input="handleSearchInput"
              @keydown.escape="showSearchDropdown = false"
            />
            <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-base-content/40 pointer-events-none" />
          </div>
          <!-- Dropdown con opciones filtradas -->
          <ul
            v-if="showSearchDropdown && searchQuery.length > 0"
            class="dropdown-content menu bg-base-100 rounded-box z-[1] search-dropdown-content p-2 shadow-lg border border-base-300 max-h-60 overflow-y-auto mt-1"
            @click.stop
          >
            <!-- Opción para búsqueda libre si no hay sugerencias o si el usuario quiere buscar libremente -->
            <li v-if="searchSuggestions.length === 0">
              <a @click="showSearchDropdown = false" class="text-base-content/60 cursor-default">
                <span class="text-sm">Buscando: "{{ searchQuery }}"</span>
              </a>
            </li>
            <!-- Sugerencias de reuniones -->
            <li v-for="meeting in searchSuggestions" :key="meeting.id">
              <a
                @click="selectMeetingFromSearch(meeting)"
                class="flex flex-col items-start gap-1 hover:bg-base-200 rounded"
              >
                <div class="flex items-center justify-between w-full">
                  <span class="font-medium">{{ formatDate(meeting.date) }}</span>
                  <span class="badge badge-xs" :class="getStatusBadgeClass(meeting.status)">
                    {{ meeting.status === 'active' ? 'Activa' : 'Cerrada' }}
                  </span>
                </div>
                <span v-if="meeting.notes" class="text-xs text-base-content/60 truncate w-full">
                  {{ meeting.notes }}
                </span>
              </a>
            </li>
            <!-- Opción para búsqueda libre al final -->
            <li v-if="searchSuggestions.length > 0" class="border-t border-base-300 mt-1 pt-1">
              <a @click="showSearchDropdown = false" class="text-primary text-sm">
                <Search class="w-4 h-4 inline mr-1" />
                Buscar texto libre: "{{ searchQuery }}"
              </a>
            </li>
          </ul>
        </div>
        <button @click="createMeeting" class="btn btn-primary" :disabled="isCreating">
          <span v-if="isCreating" class="loading loading-spinner loading-sm mr-2"></span>
          <CalendarPlus v-else class="w-5 h-5 mr-2" />
          {{ isCreating ? 'Creando...' : 'Nueva Reunión' }}
        </button>
      </div>
    </div>

    <LoadingSpinner :loading="store.loading && !isCreating" />
    <ErrorMessage :error="store.error" />

    <!-- Alerta si hay reunión activa al intentar crear -->
    <div v-if="showActiveMeetingAlert" class="alert alert-warning mb-4">
      <span>Ya existe una reunión activa. Debe cerrar la reunión actual antes de crear una nueva.</span>
      <button aria-label="Cerrar alerta" @click="showActiveMeetingAlert = false" class="btn btn-sm btn-ghost">✕</button>
    </div>

    <!-- Tabla mejorada con más información -->
    <div v-if="(!store.loading || isCreating) && !store.error" class="card bg-base-100 shadow">
      <div class="card-body p-0">
        <!-- Vista Desktop: Tabla completa -->
        <div class="hidden md:block">
          <DataTable
            :data="sortedAndFilteredMeetings as unknown as Record<string, unknown>[]"
            :columns="columns"
            :actions="true"
            :empty-message="getEmptyMessage()"
            row-key="id"
          >
          <!-- Slot para fecha con fecha y hora -->
          <template #cell-date="{ item }">
            <div class="flex flex-col">
              <span class="font-medium">{{ formatDate((item as unknown as Meeting).date) }}</span>
              <span class="text-xs text-base-content/60">
                {{ formatDateTime((item as unknown as Meeting).date) }}
              </span>
            </div>
          </template>

          <!-- Slot para estado con badge -->
          <template #cell-status="{ item }">
            <div class="badge" :class="getStatusBadgeClass((item as unknown as Meeting).status)">
              {{ (item as unknown as Meeting).status === 'active' ? 'Activa' : 'Cerrada' }}
            </div>
          </template>

          <!-- Slot para resumen financiero -->
          <template #cell-summary="{ item }">
            <div v-if="(item as unknown as Meeting).summary" class="flex flex-col gap-1 text-sm">
              <span class="font-medium">
                💰 {{ formatCurrency((item as unknown as Meeting).summary?.total_collected || 0) }}
              </span>
              <span class="text-xs text-base-content/60">
                {{ (item as unknown as Meeting).summary?.participants_count || 0 }} {{ (item as unknown as Meeting).summary?.participants_count === 1 ? 'participante' : 'participantes' }}
              </span>
            </div>
            <span v-else class="text-base-content/40">-</span>
          </template>

          <!-- Slot para notas truncadas -->
          <template #cell-notes="{ item }">
            <div v-if="(item as unknown as Meeting).notes" class="max-w-md">
              <span class="text-sm">{{ truncateText((item as unknown as Meeting).notes || '', 50) }}</span>
            </div>
            <span v-else class="text-base-content/40 italic">Sin notas</span>
          </template>

          <!-- Slot para acciones mejoradas -->
          <template #actions="{ item }">
            <div class="flex gap-2">
              <button
                @click="viewMeeting((item as unknown as Meeting).id)"
                class="btn btn-sm btn-ghost"
                title="Ver detalles"
                aria-label="Ver detalles"
              >
                <Eye class="w-4 h-4" />
              </button>
              <button
                v-if="(item as unknown as Meeting).status === 'active'"
                @click="goToActiveMeeting"
                class="btn btn-sm btn-primary"
                title="Continuar reunión"
              >
                <ArrowRight class="w-4 h-4 mr-1" />
                Continuar
              </button>
            </div>
          </template>
          </DataTable>
        </div>

        <!-- Vista Mobile: Acciones deslizables estilo iOS -->
        <div class="md:hidden">
          <div v-if="sortedAndFilteredMeetings.length === 0" class="text-center py-8 text-base-content/60">
            {{ getEmptyMessage() }}
          </div>
          <div v-else class="divide-y overflow-hidden">
            <div
              v-for="meeting in sortedAndFilteredMeetings"
              :key="meeting.id"
              class="mobile-row-container"
              :class="{ 'expanded': expandedMeetingId === meeting.id }"
            >
              <!-- Contenedor con overflow para el efecto de deslizamiento -->
              <div class="mobile-row-wrapper">
                <!-- Contenido principal (se desliza hacia la izquierda) -->
                <div
                  class="mobile-row-content"
                  @click="toggleMeetingActions(meeting.id)"
                >
                  <div class="flex items-center justify-between p-4">
                    <div class="flex flex-col">
                      <span class="font-medium text-base">{{ formatDate(meeting.date) }}</span>
                      <span class="text-xs text-base-content/60">{{ formatDateTime(meeting.date) }}</span>
                    </div>
                    <div class="badge" :class="getStatusBadgeClass(meeting.status)">
                      {{ meeting.status === 'active' ? 'Activa' : 'Cerrada' }}
                    </div>
                  </div>
                </div>

                <!-- Acciones ocultas (se revelan desde la derecha) -->
                <div class="mobile-row-actions">
                  <button
                    @click.stop="handleViewMeetingMobile(meeting.id)"
                    class="action-btn action-btn-view"
                    title="Ver detalles"
                  >
                    <Eye class="w-5 h-5" />
                    <span class="text-xs mt-1">Ver</span>
                  </button>
                  <button
                    v-if="meeting.status === 'active'"
                    @click.stop="handleContinueMeetingMobile()"
                    class="action-btn action-btn-continue"
                    title="Continuar reunión"
                  >
                    <ArrowRight class="w-5 h-5" />
                    <span class="text-xs mt-1">Continuar</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 1. Vue
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

// 2. Librerías externas
import { Search, CalendarPlus, Eye, ArrowRight } from 'iconoir-vue/regular'

// 3. Stores/Composables
import { useMeetingsStore } from '../stores/meetings'
import { useSearchableList } from '@/shared/composables/useSearchableList'

// 4. Componentes
import DataTable from '@/shared/components/DataTable.vue'
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue'
import ErrorMessage from '@/shared/components/ErrorMessage.vue'

// 5. Tipos
import type { Meeting } from '@/api/meetings.api'

// 6. Utils/Formatters
import { formatCurrency, formatDate, formatDateTime } from '@/shared/utils/formatters'

const router = useRouter()
const store = useMeetingsStore()

// Reactive state
const sortField = ref<'date' | 'status' | null>('date')
const sortDirection = ref<'asc' | 'desc'>('desc')
const showActiveMeetingAlert = ref(false)
const expandedMeetingId = ref<string | null>(null)
const showSearchDropdown = ref(false)
const isCreating = ref(false)

// Búsqueda usando useSearchableList
const meetingsRef = computed(() => store.meetings)
const { searchQuery, filteredItems } = useSearchableList<Meeting>(meetingsRef, [
  'notes',
  (item) => formatDate(item.date)
])

// Sugerencias de búsqueda (primeras 5 coincidencias)
const searchSuggestions = computed(() => {
  if (!searchQuery.value || searchQuery.value.length < 2) {
    return []
  }
  const query = searchQuery.value.toLowerCase().trim()
  const suggestions = store.meetings
    .filter((meeting) => {
      const notesMatch = meeting.notes?.toLowerCase().includes(query) || false
      const dateMatch = formatDate(meeting.date).toLowerCase().includes(query)
      return notesMatch || dateMatch
    })
    .slice(0, 5) // Limitar a 5 sugerencias
  return suggestions
})

// Computed properties
const hasActiveMeeting = computed(() => {
  // Verificar en el store primero
  if (store.activeMeeting) {
    return true
  }
  // También verificar en la lista de reuniones
  return store.meetings.some((meeting) => meeting.status === 'active')
})

const sortedAndFilteredMeetings = computed(() => {
  const meetings = [...filteredItems.value]

  if (!sortField.value) {
    return meetings
  }

  return meetings.sort((a, b) => {
    let comparison = 0

    if (sortField.value === 'date') {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      comparison = dateA - dateB
    } else if (sortField.value === 'status') {
      // Activas primero
      if (a.status === 'active' && b.status === 'closed') {
        comparison = -1
      } else if (a.status === 'closed' && b.status === 'active') {
        comparison = 1
      } else {
        comparison = 0
      }
    }

    return sortDirection.value === 'asc' ? comparison : -comparison
  })
})

const columns = [
  { key: 'date', label: 'Fecha', format: 'date' as const },
  { key: 'status', label: 'Estado' },
  { key: 'summary', label: 'Resumen' },
  { key: 'notes', label: 'Notas' }
]

// Methods
function getStatusBadgeClass(status: string): string {
  return status === 'active' ? 'badge-success' : 'badge-ghost'
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text
  }
  return text.substring(0, maxLength) + '...'
}

function getEmptyMessage(): string {
  if (searchQuery.value) {
    return 'No se encontraron reuniones con los filtros aplicados'
  }
  return 'No hay reuniones registradas'
}

function viewMeeting(id: string): void {
  router.push(`/meetings/${id}`)
}

function goToActiveMeeting(): void {
  router.push('/meetings/active')
}

async function createMeeting(): Promise<void> {
  // Validar que no haya una reunión activa
  if (hasActiveMeeting.value) {
    showActiveMeetingAlert.value = true
    // Ocultar el alert después de 5 segundos
    setTimeout(() => {
      showActiveMeetingAlert.value = false
    }, 5000)
    return
  }

  try {
    isCreating.value = true
    await store.createMeeting({ date: new Date().toISOString() })
    router.push('/meetings/active')
  } catch (e) {
    console.error('Error creating meeting', e)
  } finally {
    isCreating.value = false
  }
}

function toggleMeetingActions(meetingId: string): void {
  // Si ya está expandida, cerrarla. Si no, expandirla
  if (expandedMeetingId.value === meetingId) {
    expandedMeetingId.value = null
  } else {
    expandedMeetingId.value = meetingId
  }
}

function handleViewMeetingMobile(meetingId: string): void {
  viewMeeting(meetingId)
  // Cerrar las acciones después de navegar
  expandedMeetingId.value = null
}

function handleContinueMeetingMobile(): void {
  goToActiveMeeting()
  // Cerrar las acciones después de navegar
  expandedMeetingId.value = null
}

function handleSearchInput(): void {
  // Mantener el dropdown abierto mientras se escribe
  if (searchQuery.value.length > 0) {
    showSearchDropdown.value = true
  }
}

function selectMeetingFromSearch(meeting: Meeting): void {
  // Navegar directamente a la reunión seleccionada
  viewMeeting(meeting.id)
  // Cerrar el dropdown y limpiar la búsqueda
  showSearchDropdown.value = false
  searchQuery.value = ''
}

// Cerrar dropdown al hacer click fuera
function handleClickOutside(event: MouseEvent): void {
  const target = event.target as HTMLElement
  if (!target.closest('.dropdown')) {
    showSearchDropdown.value = false
  }
}

// Lifecycle hooks
onMounted(async () => {
  await store.fetchMeetings()
  // También cargar la reunión activa para tener el estado actualizado
  // fetchActiveMeeting maneja el 404 silenciosamente cuando no hay reunión activa
  await store.fetchActiveMeeting()
  
  // Agregar listener para cerrar dropdown al hacer click fuera
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  // Limpiar listener
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.meetings-view {
  padding: 2rem;
}

.view-header {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

@media (min-width: 1024px) {
  .view-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}

.view-header h1 {
  margin: 0;
}

.header-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.search-input {
  width: 16rem; /* w-64 equivalente */
}

.search-dropdown {
  min-width: 200px;
}

.search-dropdown-content {
  width: 16rem; /* w-64 equivalente */
}

@media (max-width: 640px) {
  .header-actions {
    width: 100%;
    flex-direction: column;
  }

  .search-dropdown {
    width: 100%;
    min-width: 100%;
  }

  .search-input {
    width: 100%;
  }

  .search-dropdown-content {
    width: 100%;
    left: 0 !important;
    right: 0 !important;
  }

  .header-actions button {
    width: 100%;
  }
}

/* Estilos para acciones deslizables móviles estilo iOS */
.mobile-row-container {
  position: relative;
  overflow: hidden;
  background-color: var(--fallback-b1, oklch(var(--b1)));
}

.mobile-row-wrapper {
  display: flex;
  width: 100%;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform;
}

.mobile-row-container.expanded .mobile-row-wrapper {
  transform: translateX(-140px);
}

.mobile-row-content {
  flex: 1;
  min-width: 100%;
  background-color: var(--fallback-b1, oklch(var(--b1)));
  cursor: pointer;
  transition: background-color 0.2s;
}

.mobile-row-content:active {
  background-color: var(--fallback-b2, oklch(var(--b2)));
}

.mobile-row-actions {
  display: flex;
  width: 140px;
  flex-shrink: 0;
  background-color: var(--fallback-b3, oklch(var(--b3)));
  padding: 0.5rem;
  gap: 0.5rem;
  align-items: center;
  justify-content: center;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.75rem;
  border-radius: 0.5rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 60px;
  color: white;
  font-weight: 500;
}

.action-btn-view {
  background-color: #3498db;
}

.action-btn-view:active {
  background-color: #2980b9;
  transform: scale(0.95);
}

.action-btn-continue {
  background-color: #27ae60;
}

.action-btn-continue:active {
  background-color: #229954;
  transform: scale(0.95);
}

/* Asegurar que las acciones no se vean en desktop */
@media (min-width: 768px) {
  .mobile-row-container {
    display: none;
  }
}
</style>
