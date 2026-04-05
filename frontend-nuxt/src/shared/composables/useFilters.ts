import { ref, type Ref } from 'vue'

export function useFilters<T extends Record<string, unknown>>(initialFilters: T) {
  const filters: Ref<T> = ref({ ...initialFilters } as T)

  function setFilter<K extends keyof T>(key: K, value: T[K]) {
    filters.value[key] = value
  }

  function setFilters(newFilters: Partial<T>) {
    filters.value = { ...filters.value, ...newFilters }
  }

  function resetFilters() {
    filters.value = { ...initialFilters } as T
  }

  function clearFilters() {
    filters.value = {} as T
  }

  return {
    filters,
    setFilter,
    setFilters,
    resetFilters,
    clearFilters
  }
}
