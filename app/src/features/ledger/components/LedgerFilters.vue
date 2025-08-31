<template>
  <div class="bg-white rounded-xl shadow border border-blue-100 p-4">
    <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
      
      <div class="form-control">
        <label class="label"><span class="label-text">Member</span></label>
        <select class="select select-bordered" v-model="localFilters.memberId" @change="emitFilters('memberId')">
          <option value="">All</option>
          <option v-for="m in memberOptions" :key="m.id" :value="m.id">{{ m.name }}</option>
        </select>
      </div>
      
      <div class="form-control">
        <label class="label"><span class="label-text">Meeting</span></label>
        <div class="relative">
          <select 
            class="select select-bordered w-full" 
            v-model="localFilters.meetingId" 
            @change="emitFilters('meetingId')"
            :disabled="meetingsLoading"
          >
            <option value="">All</option>
            <option v-for="m in meetingOptions" :key="m.id" :value="m.id">
              {{ formatMeetingDate(m.date) }} {{ m.status === 'active' ? '(Active)' : '' }}
            </option>
          </select>
          <div v-if="meetingsLoading" class="absolute right-3 top-1/2 transform -translate-y-1/2">
            <span class="loading loading-spinner loading-xs"></span>
          </div>
        </div>
      </div>
      
      <div class="form-control" v-if="activeTab !== 'operations'">
        <label class="label"><span class="label-text">Account Type</span></label>
        <select class="select select-bordered" v-model="localFilters.accountType" @change="emitFilters('accountType')">
          <option value="">All</option>
          <option v-for="opt in accountTypeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>
      
      <div class="form-control" v-if="activeTab !== 'entries'">
        <label class="label"><span class="label-text">Transaction Type</span></label>
        <select class="select select-bordered" v-model="localFilters.operationType" @change="emitFilters('operationType')">
          <option value="">All</option>
          <option v-for="opt in transactionTypeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>
    </div>

    <!-- Búsqueda y botones -->
    <div class="mt-4 flex flex-col md:flex-row gap-4 items-center">
      <!-- Indicador de filtros activos -->
      <div v-if="activeFiltersCount > 0" class="flex items-center gap-2">
        <span class="badge badge-info">{{ activeFiltersCount }} active filters</span>
        <button class="btn btn-ghost btn-xs" @click="clearActiveFilters">Clear Active</button>
      </div>
      
      <button class="btn btn-primary" @click="applyFilters">Apply Filters</button>
      <button class="btn btn-outline" @click="resetFilters">Reset All</button>
    </div>

    <!-- Paginación de reuniones -->
    <div v-if="showMeetingsPagination" class="mt-4 flex items-center justify-between">
      <div class="text-sm text-gray-600">
        Showing {{ (meetingsPage - 1) * meetingsLimit + 1 }} to {{ Math.min(meetingsPage * meetingsLimit, meetingsTotal) }} of {{ meetingsTotal }} meetings
      </div>
      <div class="join">
        <button 
          class="btn join-item btn-sm" 
          :disabled="meetingsPage === 1 || meetingsLoading" 
          @click="changeMeetingsPage(meetingsPage - 1)"
        >
          Previous
        </button>
        <button 
          class="btn join-item btn-sm" 
          :disabled="meetingsPage >= meetingsTotalPages || meetingsLoading" 
          @click="changeMeetingsPage(meetingsPage + 1)"
        >
          Next
        </button>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-600">Page size:</span>
        <select 
          class="select select-bordered select-sm" 
          v-model="meetingsLimit" 
          @change="changeMeetingsLimit"
          :disabled="meetingsLoading"
        >
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="50">50</option>
          <option value="100">100</option>
        </select>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch, ref, onMounted, computed } from 'vue'
import type { LedgerFilters, MemberOption, MeetingOption } from '@/features/ledger/types'
import { meetingsService } from '@/features/meetings/services/meetings'

const props = defineProps<{
  modelValue: LedgerFilters
  memberOptions: MemberOption[]
  accountTypeOptions: { value: string; label: string }[]
  transactionTypeOptions: { value: string; label: string }[]
  activeTab: 'operations' | 'entries'
}>()

const emits = defineEmits<{
  (e: 'update:modelValue', value: LedgerFilters): void
}>()

const localFilters = reactive<LedgerFilters>({ ...props.modelValue })

// Estado para reuniones
const meetingOptions = ref<MeetingOption[]>([])
const meetingsLoading = ref(false)
const meetingsError = ref<string | null>(null)
const meetingsPage = ref(1)
const meetingsLimit = ref(20)
const meetingsTotal = ref(0)

// (sin búsqueda)

// Computed properties
const meetingsTotalPages = computed(() => Math.ceil(meetingsTotal.value / meetingsLimit.value))
const showMeetingsPagination = computed(() => meetingsTotal.value > meetingsLimit.value)

// Watch para sincronizar filtros del padre
watch(() => props.modelValue, (nv) => {
  Object.assign(localFilters, nv)
}, { deep: true })

// Función para obtener reuniones con paginación
async function fetchMeetings() {
  try {
    meetingsLoading.value = true
    meetingsError.value = null
    
    const response = await meetingsService.findAll()
    
    // Simular paginación del lado del cliente por ahora
    // En el futuro, esto debería venir del backend con paginación real
    const startIndex = (meetingsPage.value - 1) * meetingsLimit.value
    const endIndex = startIndex + meetingsLimit.value
    
    meetingOptions.value = response.slice(startIndex, endIndex).map(meeting => ({
      id: meeting.id,
      date: meeting.date,
      status: meeting.status
    }))
    
    meetingsTotal.value = response.length
  } catch (error) {
    console.error('Error fetching meetings:', error)
    meetingsError.value = error instanceof Error ? error.message : 'Error loading meetings'
    meetingOptions.value = []
  } finally {
    meetingsLoading.value = false
  }
}

// Función para cambiar página de reuniones
function changeMeetingsPage(page: number) {
  meetingsPage.value = page
  fetchMeetings()
}

// Función para cambiar límite de reuniones por página
function changeMeetingsLimit() {
  meetingsPage.value = 1 // Reset a la primera página
  fetchMeetings()
}

// Función para formatear fecha de reunión
function formatMeetingDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-CO', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  } catch {
    return dateString
  }
}

// (sin búsqueda)

// Función para aplicar filtros
function applyFilters() {
  emitFilters('apply')
}

// Función para emitir cambios de filtros
function emitFilters(source?: string) {
  console.log('[LedgerFilters] changed via', source, localFilters)
  emits('update:modelValue', { ...localFilters })
}

// Función para resetear filtros
function resetFilters() {
  Object.assign(localFilters, { 
    memberId: undefined, 
    accountType: undefined, 
    meetingId: undefined, 
    search: undefined,
    operationType: undefined
  })
  emitFilters('reset')
}

// (sin agrupamiento)

// Computed property to count active filters
const activeFiltersCount = computed(() => {
  let count = 0
  if (localFilters.memberId) count++
  if (localFilters.accountType) count++
  if (localFilters.meetingId) count++
  if (localFilters.operationType) count++
  return count
})

// Function to clear specific active filters
function clearActiveFilters() {
  const filtersToClear = ['memberId', 'accountType', 'meetingId', 'operationType']
  filtersToClear.forEach(filter => {
    if (localFilters[filter as keyof LedgerFilters]) {
      localFilters[filter as keyof LedgerFilters] = undefined
    }
  })
  emitFilters('clearActive')
}

// Cargar reuniones al montar el componente
onMounted(() => {
  fetchMeetings()
})
</script>

<style scoped>
</style>


