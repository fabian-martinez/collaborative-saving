# Guía de Composables

## Introducción

Los composables son funciones que encapsulan lógica reutilizable usando la Composition API de Vue. Esta guía explica cómo crear y usar composables efectivamente.

## ¿Qué es un Composable?

Un composable es una función que:
- Empieza con `use`
- Usa la Composition API (`ref`, `computed`, `watch`, etc.)
- Retorna estado reactivo y/o funciones
- Puede ser usado en múltiples componentes

## Estructura de un Composable

### Template Básico

```typescript
import { ref, computed, onMounted } from 'vue'

export function useFeatureName() {
  // State
  const data = ref<Type | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Computed
  const hasData = computed(() => data.value !== null)

  // Methods
  async function fetchData() {
    // ...
  }

  // Lifecycle (opcional)
  onMounted(() => {
    // ...
  })

  // Return
  return {
    // State
    data,
    loading,
    error,
    // Computed
    hasData,
    // Methods
    fetchData
  }
}
```

## Composables Existentes

### useApi

Composable para llamadas API con estados de loading y error.

```typescript
// src/shared/composables/useApi.ts
import { ref } from 'vue'

export function useApi<T>(apiCall: () => Promise<T>) {
  const data = ref<T | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function execute() {
    loading.value = true
    error.value = null
    try {
      data.value = await apiCall()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error desconocido'
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    data,
    loading,
    error,
    execute
  }
}
```

**Uso:**
```vue
<script setup lang="ts">
import { useApi } from '@/shared/composables/useApi'
import { membersApi } from '@/api/members.api'

const { data: members, loading, error, execute } = useApi(() => 
  membersApi.getMembers()
)

onMounted(() => {
  execute()
})
</script>
```

### usePagination

Composable para manejar paginación.

```typescript
// src/shared/composables/usePagination.ts
import { ref, computed } from 'vue'

export function usePagination(total: number, pageSize: number = 20) {
  const page = ref(1)
  
  const totalPages = computed(() => Math.ceil(total / pageSize))
  const startIndex = computed(() => (page.value - 1) * pageSize)
  const endIndex = computed(() => Math.min(startIndex.value + pageSize, total))
  
  function nextPage() {
    if (page.value < totalPages.value) {
      page.value++
    }
  }
  
  function previousPage() {
    if (page.value > 1) {
      page.value--
    }
  }
  
  function goToPage(p: number) {
    if (p >= 1 && p <= totalPages.value) {
      page.value = p
    }
  }
  
  return {
    page,
    totalPages,
    startIndex,
    endIndex,
    nextPage,
    previousPage,
    goToPage
  }
}
```

**Uso:**
```vue
<script setup lang="ts">
import { usePagination } from '@/shared/composables/usePagination'

const { page, totalPages, nextPage, previousPage } = usePagination(100, 20)
</script>
```

### useFilters

Composable para manejar filtros.

```typescript
// src/shared/composables/useFilters.ts
import { ref, computed } from 'vue'

export function useFilters<T>(items: Ref<T[]>, filterFn: (item: T, filters: any) => boolean) {
  const filters = ref<Record<string, any>>({})
  
  const filteredItems = computed(() => {
    return items.value.filter(item => filterFn(item, filters.value))
  })
  
  function setFilter(key: string, value: any) {
    filters.value[key] = value
  }
  
  function clearFilters() {
    filters.value = {}
  }
  
  return {
    filters,
    filteredItems,
    setFilter,
    clearFilters
  }
}
```

## Crear un Nuevo Composable

### Ejemplo: useDebounce

```typescript
// src/shared/composables/useDebounce.ts
import { ref, watch } from 'vue'

export function useDebounce<T>(value: Ref<T>, delay: number = 300) {
  const debouncedValue = ref<T>(value.value) as Ref<T>
  
  let timeoutId: ReturnType<typeof setTimeout>
  
  watch(value, (newValue) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
      debouncedValue.value = newValue
    }, delay)
  })
  
  return debouncedValue
}
```

**Uso:**
```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useDebounce } from '@/shared/composables/useDebounce'

const searchQuery = ref('')
const debouncedQuery = useDebounce(searchQuery, 500)

// debouncedQuery se actualiza 500ms después de que searchQuery cambie
</script>
```

### Ejemplo: useLocalStorage

```typescript
// src/shared/composables/useLocalStorage.ts
import { ref, watch } from 'vue'

export function useLocalStorage<T>(key: string, defaultValue: T) {
  const storedValue = localStorage.getItem(key)
  const value = ref<T>(
    storedValue ? JSON.parse(storedValue) : defaultValue
  )
  
  watch(value, (newValue) => {
    localStorage.setItem(key, JSON.stringify(newValue))
  }, { deep: true })
  
  return value
}
```

**Uso:**
```vue
<script setup lang="ts">
import { useLocalStorage } from '@/shared/composables/useLocalStorage'

const theme = useLocalStorage('theme', 'light')
// theme es reactivo y se guarda automáticamente en localStorage
</script>
```

## Composables con Stores

### Composable que Usa un Store

```typescript
// src/features/members/composables/useMemberList.ts
import { computed, onMounted } from 'vue'
import { useMembersStore } from '../stores/members'

export function useMemberList() {
  const store = useMembersStore()
  
  const activeMembers = computed(() => 
    store.members.filter(m => m.status === 'active')
  )
  
  onMounted(() => {
    if (store.members.length === 0) {
      store.fetchMembers()
    }
  })
  
  return {
    members: computed(() => store.members),
    activeMembers,
    loading: computed(() => store.loading),
    error: computed(() => store.error),
    refresh: () => store.fetchMembers()
  }
}
```

**Uso:**
```vue
<script setup lang="ts">
import { useMemberList } from '../composables/useMemberList'

const { members, activeMembers, loading, refresh } = useMemberList()
</script>
```

## Composables con Parámetros

### Composable Configurable

```typescript
// src/shared/composables/useToggle.ts
import { ref } from 'vue'

export function useToggle(initialValue: boolean = false) {
  const value = ref(initialValue)
  
  function toggle() {
    value.value = !value.value
  }
  
  function setValue(newValue: boolean) {
    value.value = newValue
  }
  
  return {
    value,
    toggle,
    setValue
  }
}
```

**Uso:**
```vue
<script setup lang="ts">
import { useToggle } from '@/shared/composables/useToggle'

const { value: isOpen, toggle, setValue: setIsOpen } = useToggle(false)
</script>
```

## Composición de Composables

### Composable que Usa Otros Composables

```typescript
// src/shared/composables/useSearchableList.ts
import { computed } from 'vue'
import { useDebounce } from './useDebounce'

export function useSearchableList<T>(
  items: Ref<T[]>,
  searchKey: keyof T | ((item: T) => string)
) {
  const searchQuery = ref('')
  const debouncedQuery = useDebounce(searchQuery, 300)
  
  const filteredItems = computed(() => {
    if (!debouncedQuery.value) return items.value
    
    const query = debouncedQuery.value.toLowerCase()
    return items.value.filter(item => {
      const value = typeof searchKey === 'function'
        ? searchKey(item)
        : String(item[searchKey])
      return value.toLowerCase().includes(query)
    })
  })
  
  return {
    searchQuery,
    filteredItems
  }
}
```

## Best Practices

### 1. Naming: Siempre `use` Prefix

```typescript
// ✅ Bueno
export function useApi() { }
export function usePagination() { }
export function useMemberList() { }

// ❌ Evitar
export function api() { }
export function pagination() { }
```

### 2. Un Composable, Una Responsabilidad

```typescript
// ✅ Bueno - Enfocado
export function useApi() { }
export function usePagination() { }

// ❌ Evitar - Demasiadas responsabilidades
export function useApiAndPaginationAndFilters() { }
```

### 3. Retornar Objeto Consistente

```typescript
// ✅ Bueno - Siempre retornar objeto
return {
  data,
  loading,
  error,
  fetch
}

// ❌ Evitar - Retornar valores sueltos
return data, loading, error
```

### 4. Documentar Composable Complejos

```typescript
/**
 * Composable para manejar búsqueda y filtrado de listas
 * 
 * @param items - Lista de items a filtrar
 * @param searchKey - Key o función para extraer valor de búsqueda
 * @returns Objeto con searchQuery y filteredItems
 * 
 * @example
 * const { searchQuery, filteredItems } = useSearchableList(members, 'name')
 */
export function useSearchableList<T>(/* ... */) {
  // ...
}
```

### 5. Usar TypeScript

```typescript
// ✅ Bueno - Tipado completo
export function useApi<T>(apiCall: () => Promise<T>) {
  const data = ref<T | null>(null)
  // ...
}

// ❌ Evitar - Sin tipos
export function useApi(apiCall) {
  const data = ref(null)
  // ...
}
```

## Anti-Patrones

### ❌ Evitar: Lógica de UI en Composables

```typescript
// ❌ Malo - UI state en composable
export function useModal() {
  const isOpen = ref(false) // UI state
  // ...
}

// ✅ Bueno - UI state en componente
const isOpen = ref(false)
```

### ❌ Evitar: Side Effects en Definición

```typescript
// ❌ Malo - Side effect al definir
export function useApi() {
  fetchData() // Se ejecuta al importar
}

// ✅ Bueno - Side effect explícito
export function useApi() {
  const { execute } = useApi()
  onMounted(() => execute()) // En componente
}
```

### ❌ Evitar: Mutar Props

```typescript
// ❌ Malo
export function useFeature(props: { data: Data }) {
  props.data.value = newValue // No mutar props
}

// ✅ Bueno
export function useFeature(initialData: Data) {
  const data = ref(initialData)
  data.value = newValue // OK
}
```

## Cuándo Crear un Composable

### ✅ Crear Composable Para:

- Lógica usada en 2+ componentes
- Lógica compleja que se puede extraer
- Integración con APIs externas
- Lógica de estado reutilizable

### ❌ No Crear Composable Para:

- Lógica simple de un componente
- Lógica muy específica de un dominio
- Estado global → Usar Store

## Referencias

- [Vue Composition API](https://vuejs.org/guide/extras/composition-api-faq.html)
- [Composables Best Practices](https://vuejs.org/guide/reusability/composables.html)
- [Guía de Stores](./STORES_GUIDE.md)

