# Guía de Composables

Un composable es una función que encapsula lógica reutilizable usando la Composition API de Vue. Prefijo `use`, retorna estado reactivo y/o funciones.

## Estructura Básica

```typescript
import { ref, computed } from 'vue'

export function useFeatureName() {
  const data = ref<Type | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const hasData = computed(() => data.value !== null)

  async function fetchData() { /* ... */ }

  return { data, loading, error, hasData, fetchData }
}
```

## Composables Existentes

### useApi

```typescript
// src/shared/composables/useApi.ts
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

  return { data, loading, error, execute }
}

// Uso
const { data: items, loading, execute } = useApi(() => itemsApi.getItems())
onMounted(() => execute())
```

### useDebounce

```typescript
// src/shared/composables/useDebounce.ts
export function useDebounce<T>(value: Ref<T>, delay = 300) {
  const debouncedValue = ref<T>(value.value) as Ref<T>
  let timeoutId: ReturnType<typeof setTimeout>

  watch(value, (newValue) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => { debouncedValue.value = newValue }, delay)
  })

  return debouncedValue
}

// Uso
const searchQuery = ref('')
const debouncedQuery = useDebounce(searchQuery, 500)
```

### useLocalStorage

```typescript
export function useLocalStorage<T>(key: string, defaultValue: T) {
  const stored = localStorage.getItem(key)
  const value = ref<T>(stored ? JSON.parse(stored) : defaultValue)

  watch(value, (newValue) => {
    localStorage.setItem(key, JSON.stringify(newValue))
  }, { deep: true })

  return value
}

// Uso
const theme = useLocalStorage('theme', 'light')
```

### useToggle

```typescript
export function useToggle(initial = false) {
  const value = ref(initial)
  const toggle = () => { value.value = !value.value }
  return { value, toggle }
}
```

## Composición de Composables

```typescript
export function useSearchableList<T>(items: Ref<T[]>, searchKey: keyof T) {
  const searchQuery = ref('')
  const debouncedQuery = useDebounce(searchQuery, 300)

  const filteredItems = computed(() => {
    if (!debouncedQuery.value) return items.value
    const query = debouncedQuery.value.toLowerCase()
    return items.value.filter(item => String(item[searchKey]).toLowerCase().includes(query))
  })

  return { searchQuery, filteredItems }
}
```

## Cuándo Crear un Composable

| ✅ Crear | ❌ No Crear |
|---|---|
| Lógica usada en 2+ componentes | Lógica simple de un componente |
| Lógica compleja que se puede extraer | Estado global → Usar Store |
| Integración con APIs externas | Lógica muy específica de un dominio |

## Reglas

- Prefijo `use` siempre
- Una responsabilidad por composable
- Retornar siempre un objeto `{ data, loading, ... }`
- Usar TypeScript con generics
- No ejecutar side effects al definir — usar `onMounted` o `execute()` explícito
- No mutar props recibidas — crear copia local

## Referencias

- [Vue Composables](https://vuejs.org/guide/reusability/composables.html)
- [Guía de Stores](./STORES_GUIDE.md)
