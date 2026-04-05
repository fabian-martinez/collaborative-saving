<template>
  <div class="filter-bar">
    <div class="filter-group">
      <slot name="filters">
        <div v-if="filters.type" class="filter-item">
          <label class="filter-label">Tipo</label>
          <select
            v-model="localFilters.type"
            @change="updateFilters"
            class="filter-select"
          >
            <option value="">Todos</option>
            <option v-for="option in filterOptions.type" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>

        <div v-if="filters.meetingId" class="filter-item">
          <label class="filter-label">Reunión</label>
          <select
            v-model="localFilters.meetingId"
            @change="updateFilters"
            class="filter-select"
          >
            <option value="">Todas</option>
            <option v-for="meeting in meetings" :key="meeting.id" :value="meeting.id">
              {{ meeting.name || meeting.id }}
            </option>
          </select>
        </div>

        <div v-if="filters.dateRange" class="filter-item date-range">
          <label class="filter-label">Rango de fechas</label>
          <div class="date-inputs">
            <input
              v-model="localFilters.startDate"
              type="date"
              @change="updateFilters"
              class="filter-input"
              placeholder="Desde"
            />
            <span class="date-separator">-</span>
            <input
              v-model="localFilters.endDate"
              type="date"
              @change="updateFilters"
              class="filter-input"
              placeholder="Hasta"
            />
          </div>
        </div>

        <div v-if="filters.search" class="filter-item search-item">
          <label class="filter-label">Buscar</label>
          <input
            :value="searchQuery"
            type="text"
            @input="onSearchInput"
            class="filter-input search-input"
            placeholder="Buscar..."
          />
        </div>
      </slot>
    </div>

    <div v-if="showActions" class="filter-actions">
      <slot name="actions">
        <button v-if="hasActiveFilters" @click="clearFilters" class="btn btn-sm btn-ghost">
          Limpiar
        </button>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDebounce } from '@/shared/composables/useDebounce'

export interface FilterOption {
  value: string
  label: string
}

export interface FilterConfig {
  type?: boolean
  meetingId?: boolean
  dateRange?: boolean
  search?: boolean
}

export interface Meeting {
  id: string
  name?: string
}

const props = withDefaults(
  defineProps<{
    filters: FilterConfig
    filterOptions?: {
      type?: FilterOption[]
    }
    meetings?: Meeting[]
    showActions?: boolean
    persistToUrl?: boolean
    debounceMs?: number
  }>(),
  {
    showActions: true,
    persistToUrl: true,
    debounceMs: 300,
    filterOptions: () => ({ type: [] }),
    meetings: () => []
  }
)

const emit = defineEmits<{
  'update:filters': [filters: Record<string, unknown>]
}>()

const route = useRoute()
const router = useRouter()

const localFilters = ref<Record<string, unknown>>({
  type: '',
  meetingId: '',
  startDate: '',
  endDate: '',
  search: ''
})

const hasActiveFilters = computed(() => {
  return Object.values(localFilters.value).some(value => value !== '')
})

function updateFilters() {
  const activeFilters: Record<string, unknown> = {}

  Object.entries(localFilters.value).forEach(([key, value]) => {
    if (value && value !== '') {
      activeFilters[key] = value
    }
  })

  emit('update:filters', activeFilters)

  if (props.persistToUrl) {
    updateUrl(activeFilters)
  }
}

function updateUrl(filters: Record<string, unknown>) {
  const query = { ...route.query }

  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      query[key] = String(value)
    } else {
      delete query[key]
    }
  })

  router.replace({ query })
}

function clearFilters() {
  localFilters.value = {
    type: '',
    meetingId: '',
    startDate: '',
    endDate: '',
    search: ''
  }
  updateFilters()
}

const searchQuery = ref('')
const debouncedSearchQuery = useDebounce(searchQuery, props.debounceMs)

watch(debouncedSearchQuery, () => {
  localFilters.value.search = debouncedSearchQuery.value
  updateFilters()
})

function onSearchInput(event: Event) {
  const target = event.target as HTMLInputElement
  searchQuery.value = target.value
}

function loadFiltersFromUrl() {
  if (!props.persistToUrl) return

  const query = route.query
  if (query.type) localFilters.value.type = String(query.type)
  if (query.meetingId) localFilters.value.meetingId = String(query.meetingId)
  if (query.startDate) localFilters.value.startDate = String(query.startDate)
  if (query.endDate) localFilters.value.endDate = String(query.endDate)
  if (query.search) {
    searchQuery.value = String(query.search)
    localFilters.value.search = String(query.search)
  }
}

onMounted(() => {
  loadFiltersFromUrl()
  if (hasActiveFilters.value) {
    updateFilters()
  }
})

watch(() => route.query, () => {
  loadFiltersFromUrl()
}, { deep: true })
</script>

<style scoped>
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: flex-end;
  padding: 1.5rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.filter-group {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  flex: 1;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 150px;
}

.filter-item.date-range {
  min-width: 300px;
}

.filter-item.search-item {
  flex: 1;
  min-width: 200px;
}

.filter-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.filter-select,
.filter-input {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  background: white;
  transition: all 0.2s ease;
}

.filter-select:focus,
.filter-input:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.date-inputs {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.date-separator {
  color: #6b7280;
  font-weight: 500;
}

.search-input {
  width: 100%;
}

.filter-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

@media (max-width: 768px) {
  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-group {
    flex-direction: column;
  }

  .filter-item {
    min-width: 100%;
  }

  .filter-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
