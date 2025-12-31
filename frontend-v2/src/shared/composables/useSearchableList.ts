import { ref, computed, type Ref } from 'vue'
import { useDebounce } from './useDebounce'

/**
 * Composable para búsqueda y filtrado de listas
 * 
 * @param items - Lista de items a filtrar (ref reactivo)
 * @param searchFields - Campos o funciones para extraer valores de búsqueda
 * @returns Objeto con searchQuery y filteredItems
 * 
 * @example
 * const { searchQuery, filteredItems } = useSearchableList(
 *   store.members,
 *   ['name', 'email', 'identification_number']
 * )
 */
export function useSearchableList<T>(
  items: Ref<T[]>,
  searchFields: (keyof T | ((item: T) => string))[]
) {
  const searchQuery = ref('')
  const debouncedQuery = useDebounce(searchQuery, 300)

  const filteredItems = computed(() => {
    if (!debouncedQuery.value.trim()) {
      return items.value
    }

    const query = debouncedQuery.value.toLowerCase().trim()

    return items.value.filter((item) => {
      return searchFields.some((field) => {
        let value: string

        if (typeof field === 'function') {
          value = field(item)
        } else {
          const fieldValue = item[field]
          value = fieldValue != null ? String(fieldValue) : ''
        }

        return value.toLowerCase().includes(query)
      })
    })
  })

  return {
    searchQuery,
    filteredItems
  }
}


